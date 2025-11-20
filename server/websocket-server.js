require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase desde variables de entorno
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const server = http.createServer(app);

// Configurar CORS para permitir conexiones desde la app móvil
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
    allowedHeaders: ["*"]
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 180000, // 3 minutos (más tiempo)
  pingInterval: 60000, // 60 segundos (menos frecuente)
  allowEIO3: true,
  allowUpgrades: true,
  serveClient: true,
  connectTimeout: 60000 // 1 minuto
});

// Almacenar salas y usuarios conectados
const rooms = new Map();
const connectedUsers = new Map();
const waitingQueue = new Map(); // Cola de usuarios esperando emparejamiento
const activeGames = new Map(); // Juegos activos
const userMappings = new Map(); // Mapeo de socket ID a user data (id, username)
let totalConnections = 0; // Contador de conexiones activas

// Función para limpiar juegos huérfanos
function cleanupOrphanedGames() {
  const now = Date.now();
  for (const [roomId, game] of activeGames.entries()) {
    // Si el juego lleva más de 5 minutos sin actividad, eliminarlo
    if (now - game.createdAt > 5 * 60 * 1000) {
      console.log(`🧹 Limpiando juego huérfano: ${roomId}`);
      activeGames.delete(roomId);
    }
  }
}

// Limpiar juegos huérfanos cada 2 minutos
setInterval(cleanupOrphanedGames, 2 * 60 * 1000);

// Categorías del juego
const GAME_CATEGORIES = [
  { id: 'sumas', name: 'Sumas', emoji: '➕', color: '#4CAF50' },
  { id: 'restas', name: 'Restas', emoji: '➖', color: '#F44336' },
  { id: 'multiplicacion', name: 'Multiplicación', emoji: '✖️', color: '#FF9800' },
  { id: 'division', name: 'División', emoji: '➗', color: '#9C27B0' },
  { id: 'fracciones', name: 'Fracciones', emoji: '🔢', color: '#2196F3' },
  { id: 'totalin', name: 'TotalIn', emoji: '🎯', color: '#E91E63' }
];

// Función para seleccionar categoría aleatoria
function getRandomCategory() {
  const randomIndex = Math.floor(Math.random() * GAME_CATEGORIES.length);
  return GAME_CATEGORIES[randomIndex];
}

// Funciones para manejar Supabase
async function createMatch(player1Id, player2Id) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert([
        {
          player1_id: player1Id, // Puede ser null
          player2_id: player2Id, // Puede ser null
          rounds_played: 0,
          player1_points: 0,
          player2_points: 0,
          status: 'in_progress' // Usar el valor por defecto correcto
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating match:', error);
    return null;
  }
}

async function updateMatchPoints(matchId, roundsPlayed, player1Points, player2Points) {
  try {
    console.log(`🔄 Actualizando puntos en Supabase - Match: ${matchId}`);
    console.log(`   📊 Rondas jugadas: ${roundsPlayed}`);
    console.log(`   💰 Player1 puntos: ${player1Points}`);
    console.log(`   💰 Player2 puntos: ${player2Points}`);
    
    const { data, error } = await supabase
      .from('matches')
      .update({
        rounds_played: roundsPlayed,
        player1_points: player1Points,
        player2_points: player2Points,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error en updateMatchPoints:', error);
      throw error;
    }
    
    console.log(`✅ Puntos actualizados exitosamente en Supabase:`, data);
    return data;
  } catch (error) {
    console.error('❌ Error updating match points:', error);
    return null;
  }
}

async function finishMatch(matchId, winnerId) {
  try {
    console.log(`🏁 Finalizando match en Supabase - Match: ${matchId}`);
    console.log(`   🏆 Ganador ID: ${winnerId}`);
    
    const updateData = {
      status: 'finished',
      updated_at: new Date().toISOString()
    };
    
    // Solo agregar winner_id si no es null
    if (winnerId) {
      updateData.winner_id = winnerId;
    }
    
    const { data, error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error en finishMatch:', error);
      throw error;
    }
    
    console.log(`✅ Match finalizado exitosamente en Supabase:`, data);
    return data;
  } catch (error) {
    console.error('❌ Error finishing match:', error);
    return null;
  }
}

async function updateGlobalPoints(userId, pointsChange) {
  try {
    console.log(`💰 Actualizando puntos globales - Usuario: ${userId}, Cambio: ${pointsChange}`);
    
    // Primero obtener los puntos actuales
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error obteniendo perfil actual:', fetchError);
      throw fetchError;
    }

    const currentPoints = currentProfile?.points || 0;
    const newPoints = Math.max(0, currentPoints + pointsChange); // No permitir puntos negativos
    
    console.log(`   📊 Puntos actuales: ${currentPoints}`);
    console.log(`   📈 Cambio: ${pointsChange}`);
    console.log(`   🎯 Nuevos puntos: ${newPoints}`);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando puntos globales:', error);
      throw error;
    }
    
    console.log(`✅ Puntos globales actualizados exitosamente:`, data);
    return data;
  } catch (error) {
    console.error('❌ Error updating global points:', error);
    return null;
  }
}

// Función para generar ejercicios
function generateExercises(category, count = 6) {
  const exercises = [];
  
  for (let i = 0; i < count; i++) {
    let exercise;
    
    switch (category) {
      case 'sumas':
        exercise = generateSumExercise();
        break;
      case 'restas':
        exercise = generateSubtractionExercise();
        break;
      case 'multiplicacion':
        exercise = generateMultiplicationExercise();
        break;
      case 'division':
        exercise = generateDivisionExercise();
        break;
      case 'fracciones':
        exercise = generateFractionExercise();
        break;
      case 'totalin':
        // Mezclar todas las categorías
        const categories = ['sumas', 'restas', 'multiplicacion', 'division'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        exercise = generateExercises(randomCategory, 1)[0];
        break;
      default:
        exercise = generateSumExercise();
    }
    
    exercise.id = `exercise_${Date.now()}_${i}`;
    exercise.category = category;
    exercises.push(exercise);
  }
  
  return exercises;
}

function generateSumExercise() {
  const a = Math.floor(Math.random() * 50) + 1;
  const b = Math.floor(Math.random() * 50) + 1;
  const answer = a + b;
  
  return {
    id: `sum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    question: `${a} + ${b} = ?`,
    answer,
    options: generateOptions(answer),
    category: 'sumas'
  };
}

function generateSubtractionExercise() {
  const a = Math.floor(Math.random() * 50) + 20;
  const b = Math.floor(Math.random() * 20) + 1;
  const answer = a - b;
  
  return {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    question: `${a} - ${b} = ?`,
    answer,
    options: generateOptions(answer),
    category: 'restas'
  };
}

function generateMultiplicationExercise() {
  const a = Math.floor(Math.random() * 12) + 1;
  const b = Math.floor(Math.random() * 12) + 1;
  const answer = a * b;
  
  return {
    id: `mul_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    question: `${a} × ${b} = ?`,
    answer,
    options: generateOptions(answer),
    category: 'multiplicacion'
  };
}

function generateDivisionExercise() {
  const b = Math.floor(Math.random() * 10) + 2;
  const answer = Math.floor(Math.random() * 12) + 1;
  const a = b * answer;
  
  return {
    id: `div_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    question: `${a} ÷ ${b} = ?`,
    answer,
    options: generateOptions(answer),
    category: 'division'
  };
}

function generateFractionExercise() {
  const numerator = Math.floor(Math.random() * 10) + 1;
  const denominator = Math.floor(Math.random() * 10) + 2;
  const answer = Math.round((numerator / denominator) * 100) / 100;
  
  return {
    id: `frac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    question: `${numerator}/${denominator} = ?`,
    answer,
    options: generateOptions(answer),
    category: 'fracciones'
  };
}

function generateOptions(correctAnswer) {
  const options = [correctAnswer];
  
  // Generar opciones incorrectas
  while (options.length < 4) {
    let wrongAnswer;
    if (correctAnswer < 10) {
      wrongAnswer = correctAnswer + Math.floor(Math.random() * 10) - 5;
    } else {
      wrongAnswer = correctAnswer + Math.floor(Math.random() * 20) - 10;
    }
    
    // Asegurar que sea diferente y positivo
    if (wrongAnswer !== correctAnswer && wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Mezclar las opciones
  return options.sort(() => Math.random() - 0.5);
}

// Sistema de limpieza automática de mensajes expirados
function cleanupExpiredMessages() {
  const now = Date.now();
  
  for (const [roomId, room] of rooms.entries()) {
    const originalLength = room.messages.length;
    room.messages = room.messages.filter(msg => {
      // Mantener mensajes que no han expirado
      return !msg.expiresAt || msg.expiresAt > now;
    });
    
    // Si se eliminaron mensajes, notificar a los usuarios
    if (room.messages.length < originalLength) {
      const expiredCount = originalLength - room.messages.length;
      console.log(`🧹 Limpiados ${expiredCount} mensajes expirados de la sala ${roomId}`);
    }
  }
}

// Ejecutar limpieza cada 10 segundos
setInterval(cleanupExpiredMessages, 10000);

// Función para limpiar usuarios desconectados de la cola
function cleanDisconnectedUsers() {
  const disconnectedUsers = [];
  
  for (const [userId, userData] of waitingQueue.entries()) {
    if (!userData.socket || !userData.socket.connected) {
      console.log(`🧹 Limpiando usuario desconectado: ${userData.username}`);
      disconnectedUsers.push(userId);
    }
  }
  
  // Remover usuarios desconectados
  disconnectedUsers.forEach(userId => {
    waitingQueue.delete(userId);
  });
  
  return disconnectedUsers.length;
}

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint para obtener información del servidor
app.get('/api/status', (req, res) => {
  const usersInRooms = Array.from(connectedUsers.values()).filter(user => user.roomId).length;
  const usersWaiting = waitingQueue.size;
  const usersConnected = totalConnections;
  
  res.json({
    status: 'online',
    connectedUsers: usersConnected,
    usersInRooms: usersInRooms,
    usersWaiting: usersWaiting,
    activeRooms: rooms.size,
    waitingPlayers: waitingQueue.size,
    queueDetails: Array.from(waitingQueue.values()).map(user => ({
      username: user.username,
      waitingSince: user.joinedAt
    })),
    timestamp: new Date().toISOString()
  });
});

// Manejo de conexiones WebSocket
io.on('connection', (socket) => {
  totalConnections++;
  console.log(`🔌 Usuario conectado: ${socket.id}`);
  console.log(`📊 Total conectados: ${totalConnections}`);
  console.log(`👥 En cola: ${waitingQueue.size} | 🏠 En salas: ${Array.from(connectedUsers.values()).filter(user => user.roomId).length}`);
  console.log(`🌐 Origen de conexión: ${socket.handshake.headers.origin || 'desconocido'}`);
  console.log(`🔗 User-Agent: ${socket.handshake.headers['user-agent'] || 'desconocido'}`);
  
  // Enviar confirmación de conexión
  socket.emit('connected', {
    socketId: socket.id,
    message: 'Conectado al servidor WebSocket',
    timestamp: new Date().toISOString()
  });

  // Unirse a una sala
  socket.on('join-room', (data) => {
    const { roomId, userId, username } = data;
    
    if (!roomId || !userId || !username) {
      socket.emit('error', { message: 'Datos de sala incompletos' });
      return;
    }

    // Verificar si el usuario ya está en una sala
    const userConnection = connectedUsers.get(socket.id);
    if (userConnection && userConnection.roomId) {
      const currentRoom = rooms.get(userConnection.roomId);
      if (currentRoom) {
        // Encontrar el nombre del oponente
        const opponent = Array.from(currentRoom.users.values()).find(user => user.id !== userId);
        const opponentName = opponent ? opponent.username : 'Usuario desconocido';
        
        console.log(`⚠️ Usuario ${username} ya está en la sala ${userConnection.roomId} con ${opponentName}, ignorando join-room`);
        
        socket.emit('room-joined', {
          roomId: userConnection.roomId,
          users: Array.from(currentRoom.users.values()),
          messages: currentRoom.messages.slice(-50),
          opponent: opponent ? { userId: opponent.id, username: opponent.username } : null
        });
      }
      return;
    }

    // Verificar si la sala existe y tiene espacio
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        messages: [],
        createdAt: new Date()
      });
    }

    const room = rooms.get(roomId);
    
    // Verificar si el usuario ya está en la sala
    if (room.users.has(userId)) {
      console.log(`⚠️ Usuario ${username} ya está en la sala ${roomId}`);
      socket.emit('room-joined', {
        roomId,
        users: Array.from(room.users.values()),
        messages: room.messages.slice(-50)
      });
      return;
    }
    
    // Verificar si la sala ya tiene 2 usuarios
    if (room.users.size >= 2) {
      console.log(`❌ Sala ${roomId} está llena (${room.users.size}/2 usuarios) - Usuario ya emparejado, ignorando`);
      socket.emit('error', { message: 'Sala llena - ya estás emparejado' });
      return;
    }

    // Agregar usuario a la sala
    room.users.set(userId, {
      id: userId,
      username,
      socketId: socket.id,
      joinedAt: new Date()
    });

    // Almacenar información del usuario
    connectedUsers.set(socket.id, {
      userId,
      username,
      roomId,
      connectedAt: new Date()
    });

    // Unirse a la sala de Socket.IO
    socket.join(roomId);
    
    // Notificar a otros usuarios en la sala
    socket.to(roomId).emit('user-joined', {
      userId,
      username,
      message: `${username} se ha unido al chat`
    });

    // Encontrar el oponente si hay uno
    const opponent = Array.from(room.users.values()).find(user => user.id !== userId);
    
    // Enviar historial de mensajes al nuevo usuario
    socket.emit('room-joined', {
      roomId,
      users: Array.from(room.users.values()),
      messages: room.messages.slice(-50), // Últimos 50 mensajes
      opponent: opponent ? { userId: opponent.id, username: opponent.username } : null
    });

    console.log(`Usuario ${username} (${userId}) se unió a la sala ${roomId}`);
  });

  // Enviar mensaje
  socket.on('send-message', (data) => {
    const { roomId, userId, username, message, messageType = 'text' } = data;
    
    if (!roomId || !userId || !message) {
      socket.emit('error', { message: 'Datos de mensaje incompletos' });
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Sala no encontrada' });
      return;
    }

    // Crear objeto de mensaje
    const messageObj = {
      id: Date.now().toString(),
      userId,
      username,
      message,
      messageType,
      timestamp: new Date().toISOString(),
      roomId,
      expiresAt: Date.now() + 5000 // Expira en 5 segundos
    };

    // Agregar mensaje al historial de la sala
    room.messages.push(messageObj);

    // Mantener solo los últimos 100 mensajes
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    // Enviar mensaje a todos los usuarios en la sala
    io.to(roomId).emit('new-message', messageObj);

    // Programar eliminación del mensaje después de 5 segundos
    setTimeout(() => {
      if (rooms.has(roomId)) {
        const currentRoom = rooms.get(roomId);
        const messageIndex = currentRoom.messages.findIndex(msg => msg.id === messageObj.id);
        if (messageIndex !== -1) {
          currentRoom.messages.splice(messageIndex, 1);
          // Notificar a los usuarios que el mensaje expiró
          io.to(roomId).emit('message-expired', { messageId: messageObj.id });
        }
      }
    }, 5000);

    console.log(`Mensaje enviado en sala ${roomId} por ${username}: ${message}`);
  });

  // Indicador de escritura
  socket.on('typing', (data) => {
    const { roomId, userId, username, isTyping } = data;
    
    if (roomId && userId) {
      socket.to(roomId).emit('user-typing', {
        userId,
        username,
        isTyping
      });
    }
  });

  // Crear sala privada
  socket.on('create-private-room', (data) => {
    const { userId, username } = data;
    
    if (!userId || !username) {
      socket.emit('error', { message: 'Datos de usuario incompletos' });
      return;
    }

    // Generar ID único para la sala
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear la sala
    rooms.set(roomId, {
      id: roomId,
      users: new Map(),
      messages: [],
      createdAt: new Date(),
      isPrivate: true
    });

    const room = rooms.get(roomId);
    
    // Agregar usuario creador a la sala
    room.users.set(userId, {
      id: userId,
      username,
      socketId: socket.id,
      joinedAt: new Date()
    });

    // Almacenar información del usuario
    connectedUsers.set(socket.id, {
      userId,
      username,
      roomId,
      connectedAt: new Date()
    });

    // Unirse a la sala
    socket.join(roomId);
    
    // Enviar confirmación
    socket.emit('private-room-created', {
      roomId,
      message: 'Sala privada creada. Comparte el código para que otros se unan.'
    });

    console.log(`Sala privada ${roomId} creada por ${username}`);
  });

  // Unirse a sala por código
  socket.on('join-by-code', (data) => {
    const { roomCode, userId, username } = data;
    
    if (!roomCode || !userId || !username) {
      socket.emit('error', { message: 'Código de sala o datos de usuario incompletos' });
      return;
    }

    // Verificar si el usuario ya está en una sala
    const userConnection = connectedUsers.get(socket.id);
    if (userConnection && userConnection.roomId) {
      const currentRoom = rooms.get(userConnection.roomId);
      if (currentRoom) {
        // Encontrar el nombre del oponente
        const opponent = Array.from(currentRoom.users.values()).find(user => user.id !== userId);
        const opponentName = opponent ? opponent.username : 'Usuario desconocido';
        
        console.log(`⚠️ Usuario ${username} ya está en la sala ${userConnection.roomId} con ${opponentName}, ignorando join-by-code`);
        
        socket.emit('room-joined', {
          roomId: userConnection.roomId,
          users: Array.from(currentRoom.users.values()),
          messages: currentRoom.messages.slice(-50),
          opponent: opponent ? { userId: opponent.id, username: opponent.username } : null
        });
      }
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Sala no encontrada' });
      return;
    }

    // Verificar si la sala ya tiene 2 usuarios
    if (room.users.size >= 2) {
      console.log(`❌ Sala ${roomCode} está llena (${room.users.size}/2 usuarios) - Usuario ya emparejado, ignorando`);
      socket.emit('error', { message: 'Sala llena - ya estás emparejado' });
      return;
    }

    // Agregar usuario a la sala
    room.users.set(userId, {
      id: userId,
      username,
      socketId: socket.id,
      joinedAt: new Date()
    });

    // Almacenar información del usuario
    connectedUsers.set(socket.id, {
      userId,
      username,
      roomId: roomCode,
      connectedAt: new Date()
    });

    // Unirse a la sala
    socket.join(roomCode);
    
    // Notificar a otros usuarios
    socket.to(roomCode).emit('user-joined', {
      userId,
      username,
      message: `${username} se ha unido al chat`
    });

    // Encontrar el oponente si hay uno
    const opponent = Array.from(room.users.values()).find(user => user.id !== userId);
    
    // Enviar información de la sala al nuevo usuario
    socket.emit('room-joined', {
      roomId: roomCode,
      users: Array.from(room.users.values()),
      messages: room.messages.slice(-50),
      opponent: opponent ? { userId: opponent.id, username: opponent.username } : null
    });

    console.log(`Usuario ${username} se unió a la sala ${roomCode} por código`);
  });

  // Buscar jugador (emparejamiento automático)
  socket.on('find-player', async (data) => {
    const { userId, username } = data;
    
    console.log(`🔍 Usuario ${username} (${userId}) buscando jugador`);
    console.log(`📊 Cola actual: ${waitingQueue.size} jugadores esperando`);
    console.log(`👥 Usuarios en cola:`, Array.from(waitingQueue.keys()));
    
    if (!userId || !username) {
      socket.emit('error', { message: 'Datos de usuario incompletos' });
      return;
    }

    // Verificar si el usuario ya está en la cola de espera
    if (waitingQueue.has(userId)) {
      console.log(`⚠️ Usuario ${username} ya está en la cola de espera`);
      socket.emit('error', { message: 'Ya estás en la cola de espera' });
      return;
    }

    // Limpiar usuarios desconectados de la cola antes de agregar el nuevo
    const cleanedCount = cleanDisconnectedUsers();
    if (cleanedCount > 0) {
      console.log(`🧹 Se limpiaron ${cleanedCount} usuarios desconectados de la cola`);
    }

    // Agregar usuario actual a la cola con el socket
    // Almacenar mapeo de socket ID a datos de usuario
    userMappings.set(socket.id, {
      userId,
      username
    });
    
    waitingQueue.set(userId, {
      userId,
      username,
      socketId: socket.id,
      socket, // Guardar referencia del socket
      joinedAt: new Date()
    });

    console.log(`⏳ Usuario ${username} agregado a la cola de espera (posición: ${waitingQueue.size})`);

    // Verificar si hay suficientes usuarios para hacer match
    if (waitingQueue.size >= 2) {
      // Obtener los primeros dos usuarios de la cola
      const queueEntries = Array.from(waitingQueue.entries());
      const [firstUserId, firstUserData] = queueEntries[0];
      const [secondUserId, secondUserData] = queueEntries[1];
      
      // Verificar que ambos sockets estén conectados
      if (!firstUserData.socket || !firstUserData.socket.connected) {
        console.log(`⚠️ Usuario ${firstUserData.username} ya no está conectado, limpiando cola...`);
        cleanDisconnectedUsers();
        socket.emit('waiting-for-player', {
          message: 'Buscando otro jugador...',
          position: waitingQueue.size
        });
        console.log(`📊 Cola actualizada: ${waitingQueue.size} jugadores esperando`);
        return;
      }

      if (!secondUserData.socket || !secondUserData.socket.connected) {
        console.log(`⚠️ Usuario ${secondUserData.username} ya no está conectado, limpiando cola...`);
        cleanDisconnectedUsers();
        socket.emit('waiting-for-player', {
          message: 'Buscando otro jugador...',
          position: waitingQueue.size
        });
        console.log(`📊 Cola actualizada: ${waitingQueue.size} jugadores esperando`);
        return;
      }
      
      // ✅ AMBOS USUARIOS ESTÁN CONECTADOS - CREAR SALA NUEVA
      console.log(`🎯 Creando NUEVA sala para: ${firstUserData.username} y ${secondUserData.username}`);
      
      // Crear sala NUEVA para los dos usuarios
      const roomId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generar categoría aleatoria para la sala
      const selectedCategory = getRandomCategory();
      console.log(`🎲 Categoría seleccionada para la sala ${roomId}: ${selectedCategory.emoji} ${selectedCategory.name}`);

      // Crear registro en Supabase con UUIDs reales
      console.log(`🎮 Creando match con UUIDs reales: ${firstUserData.userId} vs ${secondUserData.userId}`);
      
      const matchRecord = await createMatch(firstUserData.userId, secondUserData.userId);
      if (!matchRecord) {
        console.error('❌ Error creando registro de partida en Supabase');
        // Continuar sin Supabase por ahora
      } else {
        console.log(`✅ Registro de partida creado en Supabase: ${matchRecord.id}`);
      }

      // Crear la sala completamente nueva
      const newRoom = {
        id: roomId,
        users: new Map(),
        messages: [],
        createdAt: new Date(),
        isMatchmaking: true,
        selectedCategory: selectedCategory,
        matchId: matchRecord?.id || null, // Guardar el ID del match de Supabase
        firstPlayerCompleted: false,
        secondPlayerCompleted: false
      };
      
      rooms.set(roomId, newRoom);
      
      // Agregar ambos usuarios a la sala NUEVA usando socket IDs como keys
      newRoom.users.set(firstUserData.socketId, {
        id: firstUserId,
        username: firstUserData.username,
        socketId: firstUserData.socketId,
        joinedAt: new Date()
      });

      newRoom.users.set(secondUserData.socketId, {
        id: secondUserId,
        username: secondUserData.username,
        socketId: secondUserData.socketId,
        joinedAt: new Date()
      });

      // Actualizar información de usuarios conectados
      connectedUsers.set(firstUserData.socketId, {
        userId: firstUserId,
        username: firstUserData.username,
        roomId,
        connectedAt: new Date()
      });

      connectedUsers.set(secondUserData.socketId, {
        userId: secondUserId,
        username: secondUserData.username,
        roomId,
        connectedAt: new Date()
      });

      // Unir ambos usuarios a la sala NUEVA
      firstUserData.socket.join(roomId);
      secondUserData.socket.join(roomId);
      
      // ✅ REMOVER DE LA COLA DESPUÉS DE CREAR LA SALA
      waitingQueue.delete(firstUserId);
      waitingQueue.delete(secondUserId);
      
      // Notificar a ambos usuarios que se encontró un match
      firstUserData.socket.emit('player-found', {
        roomId,
        message: `¡Jugador encontrado! Te has conectado con ${secondUserData.username}`,
        opponent: {
          userId: secondUserId,
          username: secondUserData.username
        },
        users: Array.from(newRoom.users.values()),
        messages: newRoom.messages.slice(-50), // Últimos 50 mensajes
        selectedCategory: selectedCategory
      });

      secondUserData.socket.emit('player-found', {
        roomId,
        message: `¡Jugador encontrado! Te has conectado con ${firstUserData.username}`,
        opponent: {
          userId: firstUserId,
          username: firstUserData.username
        },
        users: Array.from(newRoom.users.values()),
        messages: newRoom.messages.slice(-50), // Últimos 50 mensajes
        selectedCategory: selectedCategory
      });

      console.log(`🎯 Match completado: ${firstUserData.username} y ${secondUserData.username} en sala NUEVA ${roomId}`);
      console.log(`📊 Usuarios en sala ${roomId}: ${newRoom.users.size}/2`);
      console.log(`👥 Usuarios en sala:`, Array.from(newRoom.users.values()).map(u => u.username));
      console.log(`📊 Cola actualizada: ${waitingQueue.size} jugadores esperando`);
    } else {
      // No hay suficientes usuarios para hacer match, solo notificar posición
      socket.emit('waiting-for-player', {
        message: 'Buscando otro jugador...',
        position: waitingQueue.size
      });

      console.log(`📊 Cola actualizada: ${waitingQueue.size} jugadores esperando`);
    }
  });

  // Cancelar búsqueda de jugador
  socket.on('cancel-search', (data) => {
    const { userId } = data;
    
    if (waitingQueue.has(userId)) {
      waitingQueue.delete(userId);
      socket.emit('search-cancelled', {
        message: 'Búsqueda cancelada exitosamente'
      });
      console.log(`Usuario ${userId} canceló la búsqueda - Conexión mantenida`);
      
      // Enviar confirmación de que la conexión se mantiene
      socket.emit('connection-maintained', {
        message: 'Conexión activa - Puedes continuar usando la aplicación',
        timestamp: new Date().toISOString()
      });
    } else {
      // Usuario no estaba en la cola, pero confirmar que la conexión se mantiene
      socket.emit('search-cancelled', {
        message: 'No había búsqueda activa'
      });
      socket.emit('connection-maintained', {
        message: 'Conexión activa - Puedes continuar usando la aplicación',
        timestamp: new Date().toISOString()
      });
      console.log(`Usuario ${userId} intentó cancelar búsqueda (no estaba en cola) - Conexión mantenida`);
    }
  });

  // Iniciar juego
  socket.on('start-game', (data) => {
    console.log('🎮 Evento start-game recibido:', data);
    const { roomId, userId, username } = data;
    
    if (!roomId || !userId || !username) {
      console.log('❌ Datos incompletos para iniciar juego:', { roomId, userId, username });
      socket.emit('error', { message: 'Datos incompletos para iniciar juego' });
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      console.log('❌ Sala no encontrada:', roomId);
      socket.emit('error', { message: 'Sala no encontrada' });
      return;
    }

    console.log('✅ Sala encontrada:', roomId, 'Usuarios:', Array.from(room.users.keys()));
    
    // Verificar que el usuario esté en la sala
    if (!room.users.has(socket.id)) {
      console.log('❌ Socket no está en la sala:', socket.id, 'Usuarios en sala (socketIds):', Array.from(room.users.keys()));
      socket.emit('error', { message: 'Usuario no está en esta sala' });
      return;
    }

    // Crear juego si no existe
    if (!activeGames.has(roomId)) {
      // Usar socket IDs para identificar jugadores
      const roomUsers = Array.from(room.users.keys());
      const game = {
        id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        player1: roomUsers[0], // Socket ID del primer jugador
        player2: roomUsers[1], // Socket ID del segundo jugador
        rounds: [],
        currentRound: 0,
        totalRounds: 6,
        player1TotalScore: 0,
        player2TotalScore: 0,
        player1RoundsWon: 0,
        player2RoundsWon: 0,
        playersReady: 0, // Contador de jugadores listos
        gameStatus: 'waiting',
        createdAt: Date.now() // Timestamp para limpieza de juegos huérfanos
      };
      
      activeGames.set(roomId, game);
      console.log(`🎮 Juego creado para sala ${roomId}: ${game.player1} vs ${game.player2}`);
    }

    const game = activeGames.get(roomId);
    
    // Contar cuántos jugadores han enviado start-game
    const gameRoom = rooms.get(roomId);
    if (!gameRoom) {
      console.log('❌ Sala no encontrada para iniciar juego');
      return;
    }
    
    // Resetear contador si es necesario
    if (!game.playersReady) {
      game.playersReady = 0;
    }
    
    // Solo incrementar si este jugador no ha enviado start-game antes
    const playerKey = socket.id === game.player1 ? 'player1' : 'player2';
    if (!game[`${playerKey}Ready`]) {
      game[`${playerKey}Ready`] = true;
      game.playersReady++;
    }
    
    console.log(`🎮 Jugador ${userId} listo. Jugadores listos: ${game.playersReady}/${gameRoom.users.size}`);
    
          // Iniciar primera ronda SOLO una vez cuando ambos jugadores estén listos
          if (game.playersReady >= 2) {
            if (game.gameStatus === 'waiting' && game.rounds.length === 0) {
              console.log('🎮 Ambos jugadores listos - iniciando primera ronda INMEDIATAMENTE...');
              game.gameStatus = 'playing';
              startRound(roomId);
            } else {
              console.log('🎮 start-game ignorado: juego ya iniciado o ronda activa');
            }
          } else {
            console.log(`🎮 Esperando más jugadores... (${game.playersReady}/2)`);
          }
  });

  // Responder ejercicio
  socket.on('answer-exercise', (data) => {
    const { roomId, userId, exerciseId, answer, responseTime } = data;
    
    if (!roomId || !userId || !exerciseId || answer === undefined) {
      socket.emit('error', { message: 'Datos incompletos para responder ejercicio' });
      return;
    }

    const game = activeGames.get(roomId);
    if (!game || game.gameStatus !== 'playing') {
      socket.emit('error', { message: 'No hay juego activo' });
      return;
    }

    const currentRound = game.rounds[game.currentRound];
    if (!currentRound) {
      socket.emit('error', { message: 'No hay ronda activa' });
      return;
    }

    const exercise = currentRound.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) {
      socket.emit('error', { message: 'Ejercicio no encontrado' });
      return;
    }

    const isCorrect = answer === exercise.answer;
    const playerKey = socket.id === game.player1 ? 'player1' : 'player2';
    
    // Verificar si el jugador ya completó la ronda
    if (currentRound[`${playerKey}Completed`]) {
      console.log(`🚫 ${userId} intentó responder pero ya completó la ronda`);
      socket.emit('error', { message: 'Ya completaste esta ronda' });
      return;
    }
    
    // Inicializar estadísticas del jugador si no existen
    if (!currentRound[`${playerKey}Stats`]) {
      currentRound[`${playerKey}Stats`] = {
        correctAnswers: 0,
        totalAnswers: 0,
        totalResponseTime: 0,
        completedAt: null
      };
    }
    
    const playerStats = currentRound[`${playerKey}Stats`];
    
    // Verificar si ya respondió 6 ejercicios (límite estricto)
    if (playerStats.totalAnswers >= 6) {
      console.log(`🚫 ${userId} intentó responder ejercicio ${playerStats.totalAnswers + 1} pero ya completó 6`);
      currentRound[`${playerKey}Completed`] = true;
      socket.emit('error', { message: 'Ya completaste los 6 ejercicios de esta ronda' });
      return;
    }
    playerStats.totalAnswers++;
    
    // Actualizar puntuación (100 puntos por pregunta correcta)
    if (isCorrect) {
      currentRound[`${playerKey}Score`] += 100;
      playerStats.correctAnswers++;
      console.log(`✅ ${userId} respondió correctamente: ${exercise.question} = ${answer} (+100 puntos)`);
    } else {
      console.log(`❌ ${userId} respondió incorrectamente: ${exercise.question} = ${answer} (correcto: ${exercise.answer})`);
    }
    
    // Registrar tiempo de respuesta si se proporciona
    if (responseTime) {
      playerStats.totalResponseTime += responseTime;
    }

    // Verificar si completó todas las preguntas (6 ejercicios respondidos)
    if (playerStats.totalAnswers >= 6) {
      console.log(`🏁 ${userId} completó 6 ejercicios - Marcando ronda como terminada`);
      currentRound[`${playerKey}Completed`] = true;
      playerStats.completedAt = Date.now();
      
      // Enviar confirmación inmediata al jugador que terminó
      socket.emit('round-completed-by-player', {
        message: 'Has completado esta ronda',
        exercisesAnswered: playerStats.totalAnswers,
        correctAnswers: playerStats.correctAnswers,
        score: currentRound[`${playerKey}Score`]
      });
      
      // Verificar si es el primer jugador en completar (50 puntos extra)
      if (!currentRound.firstPlayerCompleted && !currentRound.secondPlayerCompleted) {
        currentRound[`${playerKey}Score`] += 50;
        currentRound.firstPlayerCompleted = true;
        console.log(`🏆 ${userId} fue el primero en completar la ronda ${game.currentRound + 1} (+50 puntos extra)`);
        console.log(`💰 Puntos de ${userId} en esta ronda: ${currentRound[`${playerKey}Score`]} (${currentRound[`${playerKey}Score`] - 50} + 50 extra)`);
      } else {
        console.log(`🏁 ${userId} completó la ronda ${game.currentRound + 1}`);
        console.log(`💰 Puntos de ${userId} en esta ronda: ${currentRound[`${playerKey}Score`]}`);
      }
      
      // Notificar a ambos jugadores que este jugador terminó
      io.to(roomId).emit('player-completed', {
        playerId: userId,
        roundNumber: game.currentRound + 1,
        score: currentRound[`${playerKey}Score`],
        totalExercises: currentRound.exercises.length,
        isFirstPlayer: currentRound.firstPlayerCompleted && currentRound[`${playerKey}Score`] > 600
      });

      // Verificar si ambos jugadores completaron
      if (currentRound.player1Completed && currentRound.player2Completed) {
        finishRound(game, roomId);
      } else {
        // Un jugador terminó, iniciar temporizador de 30 segundos
        console.log(`⏰ Iniciando temporizador de 30 segundos para la ronda ${game.currentRound + 1}`);
        
        // Notificar a ambos jugadores que se inició el temporizador
        io.to(roomId).emit('timer-started', {
          roundNumber: game.currentRound + 1,
          timeLeft: 30,
          message: 'Un jugador terminó, 30 segundos restantes'
        });
        
        setTimeout(() => {
          // Verificar si el otro jugador terminó en ese tiempo
          if (!currentRound.player1Completed || !currentRound.player2Completed) {
            console.log(`⏰ Tiempo agotado para la ronda ${game.currentRound + 1}`);
            
            // Forzar finalización de la ronda
            currentRound.player1Completed = true;
            currentRound.player2Completed = true;
            
            // Notificar que el tiempo se agotó
            io.to(roomId).emit('round-timeout', {
              roundNumber: game.currentRound + 1,
              message: 'Tiempo agotado',
              player1Score: currentRound.player1Score,
              player2Score: currentRound.player2Score
            });
            
            finishRound(game, roomId);
          }
        }, 30000); // 30 segundos
      }
    }

    // Enviar respuesta
    socket.emit('answer-result', {
      exerciseId,
      isCorrect,
      correctAnswer: exercise.answer,
      currentScore: currentRound[`${playerKey}Score`],
      totalExercises: currentRound.exercises.length
    });
  });

  // Manejo de errores
  socket.on('error', (error) => {
    console.error(`❌ Error en socket ${socket.id}:`, error);
  });

  // Ping/Pong para mantener conexión
  socket.on('ping', () => {
    socket.emit('pong', { 
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
      message: 'Server is alive'
    });
  });

  // Enviar ping periódico para mantener conexión activa (optimizado)
  const pingInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('server-ping', { 
        timestamp: new Date().toISOString(),
        message: 'Server heartbeat'
      });
    } else {
      clearInterval(pingInterval);
    }
  }, 120000); // Ping cada 2 minutos (menos frecuente)

  // Desconexión
  socket.on('disconnect', (reason) => {
    // Limpiar intervalo de ping
    clearInterval(pingInterval);
    
    const userInfo = connectedUsers.get(socket.id);
    
    if (userInfo) {
      const { userId, username, roomId } = userInfo;
      
      console.log(`🔌 Usuario ${username} (${userId}) desconectado: ${reason}`);
      
      // Limpiar mapeo de usuario
      userMappings.delete(socket.id);
      
      // Remover de la cola de espera si está ahí
      if (waitingQueue.has(userId)) {
        waitingQueue.delete(userId);
        console.log(`⏳ Usuario ${username} removido de la cola de espera`);
        console.log(`📊 Cola actualizada: ${waitingQueue.size} jugadores esperando`);
      }
      
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.users.delete(userId);
        
        // Limpiar juego activo si existe
        if (activeGames.has(roomId)) {
          activeGames.delete(roomId);
          console.log(`🧹 Juego ${roomId} eliminado por desconexión del usuario`);
        }
        
        // Notificar a otros usuarios
        socket.to(roomId).emit('user-left', {
          userId,
          username,
          message: `${username} ha abandonado el chat`,
          timestamp: new Date().toISOString()
        });

        // Si la sala queda vacía, eliminarla después de 5 minutos
        if (room.users.size === 0) {
          setTimeout(() => {
            if (rooms.has(roomId) && rooms.get(roomId).users.size === 0) {
              rooms.delete(roomId);
              console.log(`🗑️ Sala ${roomId} eliminada por estar vacía`);
            }
          }, 5 * 60 * 1000); // 5 minutos
        }
      }
      
      connectedUsers.delete(socket.id);
      totalConnections--;
      console.log(`📊 Total conectados: ${totalConnections}`);
      console.log(`👥 En cola: ${waitingQueue.size} | 🏠 En salas: ${Array.from(connectedUsers.values()).filter(user => user.roomId).length}`);
    } else {
      totalConnections--;
      console.log(`🔌 Socket ${socket.id} desconectado sin información de usuario`);
      console.log(`📊 Total conectados: ${totalConnections}`);
      console.log(`👥 En cola: ${waitingQueue.size} | 🏠 En salas: ${Array.from(connectedUsers.values()).filter(user => user.roomId).length}`);
    }
  });
});

// Funciones del juego
function startRound(roomId) {
  console.log('🎯 startRound llamada para roomId:', roomId);
  
  const room = rooms.get(roomId);
  if (!room || !room.selectedCategory) {
    console.error('❌ No se puede iniciar ronda: sala o categoría no encontrada');
    console.error('❌ Room:', room);
    console.error('❌ selectedCategory:', room?.selectedCategory);
    return;
  }

  const game = activeGames.get(roomId);
  if (!game) {
    console.error('❌ No se puede iniciar ronda: juego no encontrado');
    return;
  }
  
  // Evitar iniciar múltiples veces la misma ronda
  if (game.rounds[game.currentRound]) {
    console.log('⚠️ Ya existe una ronda activa en el índice actual, startRound ignorado');
    return;
  }

  const roundNumber = game.currentRound + 1;
  const category = room.selectedCategory.id;
  
  console.log(`🎯 Iniciando ronda ${roundNumber} de ${game.totalRounds} - Categoría: ${category}`);
  
  // Generar ejercicios para esta ronda (6 preguntas por ronda)
  const exercises = generateExercises(category, 6);
  
  // Agregar timestamp de inicio a cada ejercicio
  const currentTime = Date.now();
  exercises.forEach(exercise => {
    exercise.startTime = currentTime;
  });
  
  const round = {
    id: `round_${Date.now()}_${roundNumber}`,
    roundNumber,
    category,
    exercises,
    player1Score: 0,
    player2Score: 0,
    player1Completed: false,
    player2Completed: false
  };
  
  game.rounds.push(round);
  game.gameStatus = 'playing';
  
  // Enviar ejercicios a ambos jugadores
  const roundData = {
    roundNumber,
    category: room.selectedCategory,
    exercises,
    totalRounds: game.totalRounds
  };
  
  console.log(`📝 Ronda ${roundNumber} iniciada con ${exercises.length} ejercicios de ${category}`);
  console.log(`📝 Ejercicios generados:`, exercises.map(e => ({ question: e.question, answer: e.answer, options: e.options })));
  
  // Obtener información de la sala para verificar jugadores
  const roomInfo = rooms.get(roomId);
  if (roomInfo) {
    console.log(`📝 Enviando round-started a ${roomInfo.users.size} jugadores en sala ${roomId}`);
    console.log(`📝 Jugadores en sala:`, Array.from(roomInfo.users.keys()));
  }
  
  // Enviar a todos los jugadores en la sala
  console.log(`📝 Enviando round-started a sala ${roomId} con ${roomInfo.users.size} jugadores`);
  io.to(roomId).emit('round-started', roundData);
  console.log(`✅ Evento round-started enviado correctamente`);
}

async function finishRound(game, roomId) {
  const currentRound = game.rounds[game.currentRound];
  const room = rooms.get(roomId);
  
  // Determinar ganador de la ronda
  let roundWinner = null;
  let tiebreaker = null;
  
  console.log(`🏁 Finalizando ronda ${game.currentRound + 1}`);
  console.log(`📊 Puntuación de la ronda: ${game.player1} (${currentRound.player1Score}) vs ${game.player2} (${currentRound.player2Score})`);
  
  if (currentRound.player1Score > currentRound.player2Score) {
    roundWinner = game.player1;
    console.log(`🏆 ${game.player1} gana por puntos`);
  } else if (currentRound.player2Score > currentRound.player1Score) {
    roundWinner = game.player2;
    console.log(`🏆 ${game.player2} gana por puntos`);
  } else {
    // Empate en puntos - usar desempate por velocidad
    console.log(`🤝 Empate en puntos - aplicando desempate`);
    
    const player1Stats = currentRound.player1Stats || { totalResponseTime: 0, correctAnswers: 0, totalAnswers: 0 };
    const player2Stats = currentRound.player2Stats || { totalResponseTime: 0, correctAnswers: 0, totalAnswers: 0 };
    
    const player1AvgTime = player1Stats.totalResponseTime / Math.max(player1Stats.totalAnswers, 1);
    const player2AvgTime = player2Stats.totalResponseTime / Math.max(player2Stats.totalAnswers, 1);
    
    if (player1AvgTime < player2AvgTime) {
      roundWinner = game.player1;
      tiebreaker = 'velocidad';
      console.log(`🏆 ${game.player1} gana por velocidad (${player1AvgTime.toFixed(2)}s vs ${player2AvgTime.toFixed(2)}s)`);
    } else if (player2AvgTime < player1AvgTime) {
      roundWinner = game.player2;
      tiebreaker = 'velocidad';
      console.log(`🏆 ${game.player2} gana por velocidad (${player2AvgTime.toFixed(2)}s vs ${player1AvgTime.toFixed(2)}s)`);
    } else {
      // Empate también en tiempo - usar precisión
      const player1Accuracy = player1Stats.correctAnswers / Math.max(player1Stats.totalAnswers, 1);
      const player2Accuracy = player2Stats.correctAnswers / Math.max(player2Stats.totalAnswers, 1);
      
      if (player1Accuracy > player2Accuracy) {
        roundWinner = game.player1;
        tiebreaker = 'precisión';
        currentRound.player1Score += 25; // Bonus por precisión
        console.log(`🏆 ${game.player1} gana por precisión (${(player1Accuracy*100).toFixed(1)}% vs ${(player2Accuracy*100).toFixed(1)}%) + 25 puntos bonus`);
      } else if (player2Accuracy > player1Accuracy) {
        roundWinner = game.player2;
        tiebreaker = 'precisión';
        currentRound.player2Score += 25; // Bonus por precisión
        console.log(`🏆 ${game.player2} gana por precisión (${(player2Accuracy*100).toFixed(1)}% vs ${(player1Accuracy*100).toFixed(1)}%) + 25 puntos bonus`);
      } else {
        console.log(`🤝 Empate total - no hay ganador de ronda`);
      }
    }
  }
  
  // Mostrar desglose de puntos de la ronda
  console.log(`💰 Desglose de puntos - Ronda ${game.currentRound + 1}:`);
  console.log(`   📊 ${game.player1}: ${currentRound.player1Score} puntos`);
  console.log(`   📊 ${game.player2}: ${currentRound.player2Score} puntos`);
  
  // Actualizar puntuaciones totales
  game.player1TotalScore += currentRound.player1Score;
  game.player2TotalScore += currentRound.player2Score;
  
  console.log(`💰 Puntos totales acumulados:`);
  console.log(`   🏆 ${game.player1}: ${game.player1TotalScore} puntos`);
  console.log(`   🏆 ${game.player2}: ${game.player2TotalScore} puntos`);
  
  // Actualizar rondas ganadas
  if (roundWinner === game.player1) {
    game.player1RoundsWon++;
  } else if (roundWinner === game.player2) {
    game.player2RoundsWon++;
  }
  
  currentRound.winner = roundWinner;
  
  console.log(`🏆 Ronda ${game.currentRound + 1} terminada - Ganador: ${roundWinner || 'Empate'}`);
  console.log(`📊 Puntuación: ${game.player1} (${currentRound.player1Score}) vs ${game.player2} (${currentRound.player2Score})`);
  console.log(`📊 Puntuación Total: ${game.player1} (${game.player1TotalScore}) vs ${game.player2} (${game.player2TotalScore})`);
  
      // Actualizar puntos en Supabase si existe el matchId
      if (room && room.matchId) {
        try {
          await updateMatchPoints(room.matchId, game.currentRound + 1, game.player1TotalScore, game.player2TotalScore);
          console.log(`✅ Puntos actualizados en Supabase para el match ${room.matchId}:`);
          console.log(`   📊 Ronda ${game.currentRound + 1} completada`);
          console.log(`   💰 Puntos totales guardados: ${game.player1} (${game.player1TotalScore}) vs ${game.player2} (${game.player2TotalScore})`);
          console.log(`   🏆 Rondas ganadas: ${game.player1} (${game.player1RoundsWon}) vs ${game.player2} (${game.player2RoundsWon})`);
          console.log(`   📈 Desglose de puntos incluye:`);
          console.log(`      - 100 puntos por respuesta correcta`);
          console.log(`      - 50 puntos extra para el primer jugador en completar cada ronda`);
          console.log(`      - 25 puntos extra por ganar por precisión en desempates`);
        } catch (error) {
          console.error('❌ Error actualizando puntos en Supabase:', error);
        }
      }
  
  // Enviar resultados de la ronda
  io.to(roomId).emit('round-finished', {
    roundNumber: game.currentRound + 1,
    player1Score: currentRound.player1Score,
    player2Score: currentRound.player2Score,
    winner: roundWinner,
    player1TotalScore: game.player1TotalScore,
    player2TotalScore: game.player2TotalScore,
    player1RoundsWon: game.player1RoundsWon || 0,
    player2RoundsWon: game.player2RoundsWon || 0,
    tiebreaker: tiebreaker
  });
  
  // Verificar si es la última ronda
  console.log(`🎯 Verificando fin del juego: Ronda actual ${game.currentRound + 1}/${game.totalRounds}`);
  
  if (game.currentRound + 1 >= game.totalRounds) {
    console.log(`🏁 ¡Juego terminado! Se completaron todas las ${game.totalRounds} rondas`);
    await finishGame(game, roomId);
  } else {
    // Preparar siguiente ronda
    game.currentRound++;
    console.log(`🎮 Preparando ronda ${game.currentRound + 1}/${game.totalRounds}...`);
    setTimeout(() => {
      startRound(roomId);
    }, 3000); // 3 segundos de pausa entre rondas
  }
}

async function finishGame(game, roomId) {
  const room = rooms.get(roomId);
  
  // Determinar ganador del juego por rondas ganadas
  let gameWinner = null;
  const player1RoundsWon = game.player1RoundsWon || 0;
  const player2RoundsWon = game.player2RoundsWon || 0;
  
  if (player1RoundsWon > player2RoundsWon) {
    gameWinner = game.player1;
    console.log(`🏆 ${game.player1} gana el juego por rondas (${player1RoundsWon} vs ${player2RoundsWon})`);
  } else if (player2RoundsWon > player1RoundsWon) {
    gameWinner = game.player2;
    console.log(`🏆 ${game.player2} gana el juego por rondas (${player2RoundsWon} vs ${player1RoundsWon})`);
  } else {
    // Empate en rondas - usar puntos totales como desempate
    if (game.player1TotalScore > game.player2TotalScore) {
      gameWinner = game.player1;
      console.log(`🏆 ${game.player1} gana por puntos totales en empate de rondas`);
    } else if (game.player2TotalScore > game.player1TotalScore) {
      gameWinner = game.player2;
      console.log(`🏆 ${game.player2} gana por puntos totales en empate de rondas`);
    } else {
      console.log(`🤝 Empate total - no hay ganador del juego`);
    }
  }
  
  game.winner = gameWinner;
  game.gameStatus = 'finished';
  
  console.log(`🎮 Juego terminado después de ${game.totalRounds} rondas`);
  console.log(`🏆 Ganador: ${gameWinner || 'Empate'}`);
  console.log(`📊 Puntuación final: ${game.player1} (${game.player1TotalScore}) vs ${game.player2} (${game.player2TotalScore})`);
  console.log(`🏆 Rondas ganadas: ${game.player1} (${game.player1RoundsWon}) vs ${game.player2} (${game.player2RoundsWon})`);
  
  console.log(`💰 RESUMEN COMPLETO DE PUNTOS GUARDADOS:`);
  console.log(`   🎯 Puntos por respuesta correcta: 100 cada una`);
  console.log(`   🏆 Puntos extra por completar primero: 50 cada ronda`);
  console.log(`   🎯 Puntos extra por precisión en desempates: 25`);
  console.log(`   💰 Puntos totales finales guardados en Supabase`);
  
  // Actualizar match en Supabase si existe el matchId
  if (room && room.matchId) {
    try {
      // Obtener UUIDs reales de los jugadores
      const player1UserData = userMappings.get(game.player1);
      const player2UserData = userMappings.get(game.player2);
      
      let winnerUserId = null;
      let loserUserId = null;
      
      if (gameWinner && player1UserData && player2UserData) {
        if (gameWinner === game.player1) {
          winnerUserId = player1UserData.userId;
          loserUserId = player2UserData.userId;
          console.log(`🏆 Ganador real: ${player1UserData.username} (${winnerUserId})`);
        } else if (gameWinner === game.player2) {
          winnerUserId = player2UserData.userId;
          loserUserId = player1UserData.userId;
          console.log(`🏆 Ganador real: ${player2UserData.username} (${winnerUserId})`);
        }
      }
      
      // Finalizar el match en Supabase con UUID real del ganador
      await finishMatch(room.matchId, winnerUserId);
      console.log(`✅ Match finalizado en Supabase: ${room.matchId} - Ganador UUID: ${winnerUserId}`);
      
      // Actualizar puntos globales de los usuarios
      if (winnerUserId && loserUserId) {
        console.log(`💰 Actualizando puntos globales...`);
        
        // Ganador: +30 puntos
        const winnerUpdate = await updateGlobalPoints(winnerUserId, 30);
        if (winnerUpdate) {
          console.log(`✅ Ganador ${winnerUserId}: +30 puntos (total: ${winnerUpdate.points})`);
        }
        
        // Perdedor: -25 puntos (mínimo 0)
        const loserUpdate = await updateGlobalPoints(loserUserId, -25);
        if (loserUpdate) {
          console.log(`✅ Perdedor ${loserUserId}: -25 puntos (total: ${loserUpdate.points})`);
        }
      } else {
        console.log(`⚠️ No se pudieron actualizar puntos globales - UUIDs no encontrados`);
      }
      
      console.log(`🎮 Match completado con estadísticas guardadas`);
      console.log(`📊 Puntos del juego: ${game.player1} (${game.player1TotalScore}) vs ${game.player2} (${game.player2TotalScore})`);
    } catch (error) {
      console.error('❌ Error actualizando match en Supabase:', error);
    }
  }
  
  // Enviar resultados finales
  io.to(roomId).emit('game-finished', {
    winner: gameWinner,
    player1TotalScore: game.player1TotalScore,
    player2TotalScore: game.player2TotalScore,
    rounds: game.rounds,
    globalPointsUpdate: {
      winner: gameWinner ? 30 : 0,
      loser: gameWinner ? -25 : 0
    }
  });
  
  // Limpiar juego después de un tiempo
  setTimeout(() => {
    activeGames.delete(roomId);
    console.log(`🗑️ Juego ${game.id} eliminado`);
  }, 30000); // 30 segundos
}

// Importar función para obtener IP automáticamente
const { getLocalIP } = require('../scripts/get-ip');

// // Iniciar servidor
// const PORT = process.env.PORT || 3001;
// const LOCAL_IP = getLocalIP();

// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`🚀 Servidor WebSocket ejecutándose en puerto ${PORT}`);
//   console.log(`📱 Conecta tu app móvil a: http://${LOCAL_IP}:${PORT}`);
//   console.log(`🌐 Estado del servidor: http://${LOCAL_IP}:${PORT}/api/status`);
//   console.log(`🌐 También disponible en: http://localhost:${PORT}/api/status`);
//   console.log(`🔧 IP detectada automáticamente: ${LOCAL_IP}`);
//   console.log(`📋 Para actualizar la app móvil, usa esta IP: ${LOCAL_IP}`);
// });

// Iniciar servidor (versión para Render)
const PORT = process.env.PORT || 3001;

// Para Render, es importante escuchar en 0.0.0.0 para aceptar conexiones externas
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor WebSocket ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Disponible públicamente en Render (usa wss://server-x7b4.onrender.com)`);
  console.log(`✅ Servidor listo para recibir conexiones`);
});


// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
});