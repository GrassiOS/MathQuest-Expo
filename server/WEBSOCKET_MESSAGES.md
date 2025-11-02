# Documentación de Mensajes WebSocket

Esta documentación describe todos los mensajes emitidos por el servidor WebSocket, incluyendo tipos de datos, estructuras y información relevante.

## 📋 Índice

1. [Mensajes de Conexión](#mensajes-de-conexión)
2. [Mensajes de Salas](#mensajes-de-salas)
3. [Mensajes de Chat](#mensajes-de-chat)
4. [Mensajes de Matchmaking](#mensajes-de-matchmaking)
5. [Mensajes de Juego](#mensajes-de-juego)
6. [Mensajes de Mantenimiento](#mensajes-de-mantenimiento)
7. [Mensajes de Error](#mensajes-de-error)

---

## 🔌 Mensajes de Conexión

### `connected`
**Emitido cuando:** Un cliente se conecta al servidor  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Handler de conexión `io.on('connection')`  
**Línea:** 453

```javascript
{
  socketId: string,        // ID único del socket (ej: "abc123")
  message: string,         // "Conectado al servidor WebSocket"
  timestamp: string        // ISO 8601 (ej: "2024-01-15T10:30:00.000Z")
}
```

**Notas:**
- Se envía automáticamente al establecer conexión
- `socketId` es único por cada conexión

---

## 🏠 Mensajes de Salas

### `room-joined`
**Emitido cuando:** Un usuario se une exitosamente a una sala  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Handlers de `join-room`, `join-by-code`  
**Líneas:** 479, 504, 549, 697, 750

```javascript
{
  roomId: string,          // ID de la sala (ej: "room_123456789")
  users: Array<{           // Array de usuarios en la sala
    id: string,            // UUID del usuario
    username: string,      // Nombre del usuario
    socketId: string,      // ID del socket
    joinedAt: Date         // Fecha de ingreso
  }>,
  messages: Array<{        // Últimos 50 mensajes del chat
    id: string,
    userId: string,
    username: string,
    message: string,
    messageType: string,   // "text", "image", etc.
    timestamp: string,
    roomId: string
  }>,
  opponent: {              // Información del oponente (null si no hay)
    userId: string,
    username: string
  } | null
}
```

**Notas:**
- Siempre incluye los últimos 50 mensajes del historial
- `opponent` puede ser `null` si la sala está vacía o solo tiene un usuario

---

### `user-joined`
**Emitido cuando:** Otro usuario se une a la sala donde estás  
**Tipo de emisión:** `socket.to(roomId).emit()` (broadcast a la sala, excepto el emisor)  
**Función:** Handlers de `join-room`, `join-by-code`  
**Líneas:** 539, 740

```javascript
{
  userId: string,          // UUID del usuario que se unió
  username: string,        // Nombre del usuario
  message: string          // Mensaje de bienvenida (ej: "Juan se ha unido al chat")
}
```

**Notas:**
- Solo lo reciben los demás usuarios en la sala, no el que se unió

---

### `private-room-created`
**Emitido cuando:** Se crea exitosamente una sala privada  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Handler de `create-private-room`  
**Línea:** 669

```javascript
{
  roomId: string,          // ID único de la sala privada
  message: string           // "Sala privada creada. Comparte el código para que otros se unan."
}
```

**Notas:**
- El `roomId` generado es único: `room_${Date.now()}_${randomString}`
- La sala privada se marca con `isPrivate: true`

---

### `user-left`
**Emitido cuando:** Un usuario se desconecta de la sala  
**Tipo de emisión:** `socket.to(roomId).emit()` (broadcast)  
**Función:** Handler de `disconnect`  
**Línea:** 1354

```javascript
{
  userId: string,          // UUID del usuario que se fue
  username: string,        // Nombre del usuario
  message: string,         // "Juan ha abandonado el chat"
  timestamp: string        // ISO 8601
}
```

---

## 💬 Mensajes de Chat

### `new-message`
**Emitido cuando:** Se envía un mensaje en el chat  
**Tipo de emisión:** `io.to(roomId).emit()` (broadcast a toda la sala)  
**Función:** Handler de `send-message`  
**Línea:** 595

```javascript
{
  id: string,              // ID único del mensaje (timestamp)
  userId: string,          // UUID del remitente
  username: string,        // Nombre del remitente
  message: string,         // Contenido del mensaje
  messageType: string,     // Tipo: "text", "image", etc. (default: "text")
  timestamp: string,       // ISO 8601
  roomId: string,          // ID de la sala
  expiresAt: number        // Timestamp Unix (expira en 5 segundos)
}
```

**Notas:**
- Los mensajes expiran automáticamente después de 5 segundos
- Se mantienen máximo 100 mensajes por sala en memoria

---

### `message-expired`
**Emitido cuando:** Un mensaje expira (después de 5 segundos)  
**Tipo de emisión:** `io.to(roomId).emit()` (broadcast)  
**Función:** Handler de `send-message` (setTimeout)  
**Línea:** 605

```javascript
{
  messageId: string        // ID del mensaje que expiró
}
```

---

### `user-typing`
**Emitido cuando:** Un usuario está escribiendo  
**Tipo de emisión:** `socket.to(roomId).emit()` (broadcast, excepto el emisor)  
**Función:** Handler de `typing`  
**Línea:** 618

```javascript
{
  userId: string,          // UUID del usuario que está escribiendo
  username: string,        // Nombre del usuario
  isTyping: boolean        // true si está escribiendo, false si dejó de escribir
}
```

---

## 🎮 Mensajes de Matchmaking

### `waiting-for-player`
**Emitido cuando:** Usuario está en cola esperando otro jugador  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Handler de `find-player`  
**Líneas:** 814, 825, 938

```javascript
{
  message: string,         // "Buscando otro jugador..."
  position: number         // Posición en la cola (ej: 1, 2, 3...)
}
```

**Notas:**
- Se envía cuando no hay suficientes jugadores para hacer match
- La posición puede cambiar cuando otros usuarios se conectan/desconectan

---

### `player-found`
**Emitido cuando:** Se encontró un oponente para jugar  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Handler de `find-player`  
**Líneas:** 908, 920

```javascript
{
  roomId: string,          // ID de la sala de match creada
  message: string,         // Mensaje personalizado (ej: "¡Jugador encontrado! Te has conectado con Juan")
  opponent: {              // Información del oponente
    userId: string,        // UUID del oponente
    username: string       // Nombre del oponente
  },
  users: Array<{            // Array de usuarios en la sala (debería tener 2)
    id: string,
    username: string,
    socketId: string,
    joinedAt: Date
  }>,
  messages: Array<{        // Últimos 50 mensajes (inicialmente vacío)
    id: string,
    userId: string,
    username: string,
    message: string,
    messageType: string,
    timestamp: string,
    roomId: string
  }>,
  selectedCategory: {       // Categoría aleatoria seleccionada para el juego
    id: string,            // "sumas", "restas", "multiplicacion", "division", "fracciones", "totalin"
    name: string,          // Nombre legible (ej: "Sumas")
    emoji: string,         // Emoji representativo (ej: "➕")
    color: string         // Color hexadecimal (ej: "#4CAF50")
  }
}
```

**Notas:**
- Se crea automáticamente una nueva sala para el match
- Se selecciona una categoría aleatoria del juego
- Se crea un registro en Supabase con `createMatch()`

---

### `search-cancelled`
**Emitido cuando:** Se cancela la búsqueda de jugador  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Handler de `cancel-search`  
**Líneas:** 953, 965

```javascript
{
  message: string          // "Búsqueda cancelada exitosamente" o "No había búsqueda activa"
}
```

---

### `connection-maintained`
**Emitido cuando:** Se confirma que la conexión sigue activa después de cancelar búsqueda  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Handler de `cancel-search`  
**Líneas:** 959, 968

```javascript
{
  message: string,         // "Conexión activa - Puedes continuar usando la aplicación"
  timestamp: string        // ISO 8601
}
```

---

## 🎯 Mensajes de Juego

### `round-started`
**Emitido cuando:** Se inicia una nueva ronda del juego  
**Tipo de emisión:** `io.to(roomId).emit()` (broadcast a toda la sala)  
**Función:** `startRound(roomId)`  
**Línea:** 1480

```javascript
{
  roundNumber: number,     // Número de ronda (1, 2, 3...)
  category: {              // Categoría de la ronda
    id: string,            // "sumas", "restas", "multiplicacion", "division", "fracciones"
    name: string,          // Nombre legible (ej: "Sumas")
    emoji: string,         // Emoji (ej: "➕")
    color: string         // Color hexadecimal (ej: "#4CAF50")
  },
  exercises: Array<{       // Array de 6 ejercicios
    id: string,            // ID único del ejercicio
    question: string,       // Pregunta (ej: "5 + 3 = ?")
    answer: number,        // Respuesta correcta
    options: Array<number>, // Array de 4 opciones (mezcladas)
    category: string,      // Categoría del ejercicio
    startTime: number     // Timestamp Unix de inicio
  }>,
  totalRounds: number,     // Total de rondas del juego (default: 3)
  player1Username: string, // Nombre del jugador 1
  player2Username: string  // Nombre del jugador 2
}
```

**Notas:**
- Cada ronda contiene exactamente 6 ejercicios
- Las categorías se rotan y no se repiten consecutivamente
- Las opciones están mezcladas aleatoriamente

---

### `answer-result`
**Emitido cuando:** El servidor procesa una respuesta del jugador  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Handler de `answer-exercise`  
**Línea:** 1274

```javascript
{
  exerciseId: string,      // ID del ejercicio respondido
  isCorrect: boolean,      // true si la respuesta es correcta
  correctAnswer: number,   // Respuesta correcta del ejercicio
  currentScore: number,    // Puntuación actual del jugador en esta ronda
  totalExercises: number   // Total de ejercicios en la ronda (6)
}
```

**Notas:**
- Cada respuesta correcta suma 100 puntos
- El jugador que completa primero recibe 50 puntos extra
- Se puede responder máximo 6 ejercicios por ronda

---

### `round-completed-by-player`
**Emitido cuando:** Un jugador completa todos los ejercicios de la ronda  
**Tipo de emisión:** `socket.emit()` (unicast, solo al jugador que completó)  
**Función:** Handler de `answer-exercise`  
**Línea:** 1202

```javascript
{
  message: string,         // "Has completado esta ronda"
  exercisesAnswered: number, // Número de ejercicios respondidos (6)
  correctAnswers: number,  // Número de respuestas correctas
  score: number           // Puntuación total de la ronda
}
```

---

### `player-completed`
**Emitido cuando:** Un jugador termina la ronda (notificación para ambos jugadores)  
**Tipo de emisión:** `io.to(roomId).emit()` (broadcast)  
**Función:** Handler de `answer-exercise`  
**Línea:** 1221

```javascript
{
  playerId: string,        // UUID del jugador que completó
  roundNumber: number,     // Número de ronda (1, 2, 3...)
  score: number,          // Puntuación de la ronda del jugador
  totalExercises: number,  // Total de ejercicios (6)
  isFirstPlayer: boolean   // true si fue el primero en completar
}
```

---

### `timer-started`
**Emitido cuando:** Se inicia el temporizador de 30 segundos porque un jugador terminó  
**Tipo de emisión:** `io.to(roomId).emit()` (broadcast)  
**Función:** Handler de `answer-exercise` (setTimeout)  
**Línea:** 1244

```javascript
{
  roundNumber: number,     // Número de ronda actual
  timeLeft: number,        // Tiempo restante en segundos (30)
  message: string          // "Un jugador terminó, 30 segundos restantes"
}
```

**Notas:**
- El temporizador se activa cuando un jugador completa la ronda
- Si el otro jugador no completa en 30 segundos, la ronda termina automáticamente

---

### `round-timeout`
**Emitido cuando:** Se agota el tiempo de espera para la ronda  
**Tipo de emisión:** `io.to(roomId).emit()` (broadcast)  
**Función:** Handler de `answer-exercise` (setTimeout callback)  
**Línea:** 1261

```javascript
{
  roundNumber: number,     // Número de ronda que expiró
  message: string,        // "Tiempo agotado"
  player1Score: number,    // Puntuación del jugador 1
  player2Score: number     // Puntuación del jugador 2
}
```

---

### `round-finished`
**Emitido cuando:** Una ronda termina (ambos jugadores completaron o timeout)  
**Tipo de emisión:** `io.to(roomId).emit()` (broadcast)  
**Función:** `finishRound(game, roomId)`  
**Línea:** 1595

```javascript
{
  roundNumber: number,           // Número de ronda terminada
  player1Score: number,          // Puntuación del jugador 1 en esta ronda
  player2Score: number,         // Puntuación del jugador 2 en esta ronda
  player1Username: string,       // Nombre del jugador 1
  player2Username: string,       // Nombre del jugador 2
  player1: string,              // Socket ID del jugador 1
  player2: string,              // Socket ID del jugador 2
  winner: string | null,        // Socket ID del ganador (null si empate)
  player1TotalScore: number,    // Puntuación acumulada total del jugador 1
  player2TotalScore: number,    // Puntuación acumulada total del jugador 2
  player1RoundsWon: number,     // Número de rondas ganadas por jugador 1
  player2RoundsWon: number,      // Número de rondas ganadas por jugador 2
  tiebreaker: string | null     // "velocidad" o "precisión" si hubo desempate (null si no)
}
```

**Notas:**
- Si hay empate en puntos, se usa velocidad como desempate
- Si hay empate en velocidad, se usa precisión (con bonus de 25 puntos)
- Los puntos se actualizan en Supabase después de cada ronda

---

### `game-finished`
**Emitido cuando:** El juego completo termina (después de todas las rondas)  
**Tipo de emisión:** `io.to(roomId).emit()` (broadcast)  
**Función:** `finishGame(game, roomId, options)`  
**Línea:** 1741

```javascript
{
  winner: string | null,        // Socket ID del ganador (null si empate)
  loser: string | null,         // Socket ID del perdedor (null si empate)
  player1: string,              // Socket ID del jugador 1
  player2: string,              // Socket ID del jugador 2
  player1Username: string,       // Nombre del jugador 1
  player2Username: string,       // Nombre del jugador 2
  player1TotalScore: number,    // Puntuación total final del jugador 1
  player2TotalScore: number,    // Puntuación total final del jugador 2
  rounds: Array<{               // Array con todas las rondas del juego
    id: string,
    roundNumber: number,
    category: string,
    exercises: Array<{}>,
    player1Score: number,
    player2Score: number,
    player1Completed: boolean,
    player2Completed: boolean,
    winner: string | null
  }>,
  globalPointsUpdate: {          // Actualización de puntos globales
    winner: number,              // +30 puntos para el ganador
    loser: number               // -25 puntos para el perdedor (mínimo 0)
  }
}
```

**Notas:**
- El ganador se determina por rondas ganadas
- Si hay empate en rondas, se usa la puntuación total
- El ganador recibe +30 puntos globales, el perdedor -25 puntos (mínimo 0)
- Se actualiza el registro en Supabase con `finishMatch()`
- El juego se elimina de memoria después de 30 segundos

---

## 🔧 Mensajes de Mantenimiento

### `pong`
**Emitido cuando:** El servidor responde a un ping del cliente  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Handler de `ping`  
**Línea:** 1302

```javascript
{
  timestamp: string,       // ISO 8601
  serverTime: number,      // Timestamp Unix del servidor
  message: string          // "Server is alive"
}
```

---

### `server-ping`
**Emitido cuando:** El servidor envía un ping periódico al cliente  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Intervalo periódico en conexión  
**Línea:** 1312  
**Frecuencia:** Cada 2 minutos (120000 ms)

```javascript
{
  timestamp: string,       // ISO 8601
  message: string          // "Server heartbeat"
}
```

**Notas:**
- Se envía automáticamente cada 2 minutos para mantener la conexión activa
- El intervalo se limpia cuando el socket se desconecta

---

## ❌ Mensajes de Error

### `error`
**Emitido cuando:** Ocurre un error en cualquier operación  
**Tipo de emisión:** `socket.emit()` (unicast)  
**Función:** Múltiples handlers  
**Líneas:** 464, 515, 564, 570, 631, 682, 709, 716, 769, 776, 983, 990, 1024, 1115, 1121, 1127, 1133, 1146, 1156, 1176

```javascript
{
  message: string          // Mensaje descriptivo del error
}
```

**Mensajes comunes:**
- `"Datos de sala incompletos"` - Falta `roomId`, `userId` o `username`
- `"Sala llena - ya estás emparejado"` - La sala ya tiene 2 usuarios
- `"Sala no encontrada"` - El `roomId` no existe
- `"Datos de mensaje incompletos"` - Falta información para enviar mensaje
- `"Datos de usuario incompletos"` - Falta `userId` o `username`
- `"Código de sala o datos de usuario incompletos"` - Datos incompletos en `join-by-code`
- `"Ya estás en la cola de espera"` - El usuario ya está buscando jugador
- `"Datos incompletos para iniciar juego"` - Falta información en `start-game`
- `"Usuario no está en esta sala"` - El usuario no pertenece a la sala
- `"Datos incompletos para responder ejercicio"` - Falta información en respuesta
- `"No hay juego activo"` - No existe un juego para esa sala
- `"No hay ronda activa"` - No hay ronda en curso
- `"Ejercicio no encontrado"` - El `exerciseId` no existe
- `"Usuario no está en la sala"` - El usuario no está en la sala del juego
- `"Ya completaste esta ronda"` - El jugador ya terminó la ronda
- `"Ya completaste los 6 ejercicios de esta ronda"` - Límite de respuestas alcanzado

---

## 📊 Tipos de Emisión

### `socket.emit(event, data)`
**Uso:** Mensaje directo a un solo cliente  
**Cuándo usar:** Confirmaciones, respuestas específicas, errores del cliente actual

### `socket.to(roomId).emit(event, data)`
**Uso:** Broadcast a todos en la sala excepto el emisor  
**Cuándo usar:** Notificaciones de acciones de otros usuarios (ej: `user-joined`, `user-typing`)

### `io.to(roomId).emit(event, data)`
**Uso:** Broadcast a todos en la sala incluyendo el emisor  
**Cuándo usar:** Actualizaciones de estado compartido (ej: `new-message`, `round-started`, `game-finished`)

---

## 🔄 Flujo de Mensajes Típico

### 1. Conexión
```
Cliente conecta → Servidor emite: `connected`
```

### 2. Búsqueda de Jugador
```
Cliente: `find-player` → Servidor: `waiting-for-player`
Segundo jugador conecta → Servidor: `player-found` (ambos jugadores)
```

### 3. Inicio de Juego
```
Ambos jugadores: `start-game` → Servidor: `round-started`
```

### 4. Durante la Ronda
```
Cliente: `answer-exercise` → Servidor: `answer-result`
Jugador completa → Servidor: `round-completed-by-player` (al jugador), `player-completed` (a ambos)
Si timeout → Servidor: `round-timeout`
```

### 5. Fin de Ronda
```
Ambos completan → Servidor: `round-finished`
Si hay más rondas → Servidor: `round-started` (nueva ronda)
```

### 6. Fin de Juego
```
Última ronda termina → Servidor: `game-finished`
```

---

## 📝 Notas Importantes

1. **IDs y Tipos:**
   - `socketId`: String único por conexión (generado por Socket.IO)
   - `userId`: UUID del usuario (de Supabase Auth)
   - `roomId`: String generado (formato: `match_${timestamp}_${random}` o `room_${timestamp}_${random}`)

2. **Tiempos:**
   - Mensajes de chat expiran en 5 segundos
   - Temporizador de ronda: 30 segundos después de que un jugador termina
   - Ping del servidor: cada 2 minutos
   - Limpieza de juegos huérfanos: cada 2 minutos

3. **Puntuación:**
   - Respuesta correcta: +100 puntos
   - Completar primero: +50 puntos extra
   - Ganar por precisión en desempate: +25 puntos extra
   - Ganador del juego: +30 puntos globales
   - Perdedor del juego: -25 puntos globales (mínimo 0)

4. **Límites:**
   - Máximo 2 usuarios por sala
   - 6 ejercicios por ronda
   - 3 rondas por juego (configurable)
   - Máximo 100 mensajes en memoria por sala
   - Últimos 50 mensajes se envían al unirse

5. **Integración con Supabase:**
   - Se crea un `match` al encontrar oponente
   - Se actualizan puntos después de cada ronda
   - Se finaliza el match al terminar el juego
   - Se actualizan puntos globales de los perfiles

---

## 🔍 Búsqueda Rápida por Evento

| Evento | Tipo | Línea | Función |
|--------|------|-------|---------|
| `connected` | unicast | 453 | Conexión |
| `room-joined` | unicast | 479, 504, 549, 697, 750 | Unirse a sala |
| `user-joined` | broadcast | 539, 740 | Usuario se une |
| `new-message` | broadcast | 595 | Mensaje de chat |
| `message-expired` | broadcast | 605 | Mensaje expirado |
| `user-typing` | broadcast | 618 | Usuario escribiendo |
| `private-room-created` | unicast | 669 | Sala privada creada |
| `waiting-for-player` | unicast | 814, 825, 938 | Esperando jugador |
| `player-found` | unicast | 908, 920 | Jugador encontrado |
| `search-cancelled` | unicast | 953, 965 | Búsqueda cancelada |
| `connection-maintained` | unicast | 959, 968 | Conexión mantenida |
| `round-started` | broadcast | 1480 | Ronda iniciada |
| `answer-result` | unicast | 1274 | Resultado de respuesta |
| `round-completed-by-player` | unicast | 1202 | Ronda completada |
| `player-completed` | broadcast | 1221 | Jugador terminó |
| `timer-started` | broadcast | 1244 | Temporizador iniciado |
| `round-timeout` | broadcast | 1261 | Tiempo agotado |
| `round-finished` | broadcast | 1595 | Ronda finalizada |
| `game-finished` | broadcast | 1741 | Juego finalizado |
| `pong` | unicast | 1302 | Respuesta a ping |
| `server-ping` | unicast | 1312 | Ping periódico |
| `user-left` | broadcast | 1354 | Usuario desconectado |
| `error` | unicast | múltiples | Error en operación |

---

**Última actualización:** 2024  
**Archivo:** `server/websocket-server.js`

