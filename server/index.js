/**
 * MathQuest WebSocket Server
 * Main server file for 1v1 online game mode
 */

const WebSocket = require('ws');
const MatchManager = require('./matchManager');
const { CLIENT_EVENTS, SERVER_EVENTS } = require('./messageTypes');

class MathQuestServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.matchManager = new MatchManager();
    this.connectedClients = new Set();
  }

  start() {
    // Create WebSocket server
    this.wss = new WebSocket.Server({ 
      port: this.port,
      perMessageDeflate: false, // Disable compression for better performance
      maxPayload: 1024 * 1024, // 1MB max payload
      clientTracking: true
    });

    console.log(`MathQuest WebSocket Server started on port ${this.port}`);

    this.wss.on('connection', (ws, req) => {
      console.log(`New client connected from ${req.socket.remoteAddress}`);
      this.connectedClients.add(ws);

      // Set up client event handlers
      this.setupClientHandlers(ws);

      // Handle ping/pong for connection keep-alive
      ws.on('ping', () => {
        console.log('Received ping from client');
        ws.pong();
      });

      ws.on('pong', () => {
        console.log('Received pong from client');
      });

      // Handle client disconnect
      ws.on('close', (code, reason) => {
        console.log(`Client disconnected: ${code} - ${reason}`);
        this.connectedClients.delete(ws);
        this.handleClientDisconnect(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connectedClients.delete(ws);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'WELCOME',
        data: { message: 'Connected to MathQuest server' },
        timestamp: Date.now()
      }));
    });

    // Start heartbeat to check connection health
    this.startHeartbeat();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down server...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      console.log('\nShutting down server...');
      this.shutdown();
    });
  }

  setupClientHandlers(ws) {
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('Error parsing message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });
  }

  handleClientMessage(ws, message) {
    const { type, data } = message;
    
    console.log(`📨 Received message: ${type}`, data);

    switch (type) {
      case CLIENT_EVENTS.JOIN_QUEUE:
        this.handleJoinQueue(ws, data);
        break;
      
      case CLIENT_EVENTS.PLAYER_READY:
        console.log('🎮 Server received PLAYER_READY message');
        this.handlePlayerReady(ws, data);
        break;
      
      case CLIENT_EVENTS.SUBMIT_ANSWER:
        this.handleSubmitAnswer(ws, data);
        break;
      
      case CLIENT_EVENTS.FINISHED_QUIZ:
        console.log('🏁 Server received FINISHED_QUIZ message');
        this.handleFinishedQuiz(ws, data);
        break;
      
      case CLIENT_EVENTS.READY_FOR_NEXT_ROUND:
        console.log('🏁 Server received READY_FOR_NEXT_ROUND message');
        this.handleReadyForNextRound(ws, data);
        break;
      
      case CLIENT_EVENTS.READY_TO_VIEW_RESULTS:
        console.log('🏁 Server received READY_TO_VIEW_RESULTS message');
        this.handleReadyToViewResults(ws, data);
        break;
      
      case CLIENT_EVENTS.RECONNECT:
        this.handleReconnect(ws, data);
        break;
      
      default:
        console.warn(`Unknown message type: ${type}`);
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  handleJoinQueue(ws, data) {
    const { playerId, username, avatar } = data;
    
    if (!playerId || !username) {
      this.sendError(ws, 'Missing required fields: playerId, username');
      return;
    }

    // Validate avatar data
    const validatedAvatar = avatar || {
      skin_asset: 'skin01',
      hair_asset: 'none',
      eyes_asset: 'eyes01',
      mouth_asset: 'none',
      clothes_asset: 'clothes01'
    };

    this.matchManager.joinQueue(ws, {
      playerId,
      username,
      avatar: validatedAvatar
    });
  }

  handlePlayerReady(ws, data) {
    const { matchId, playerId } = data;
    
    if (!matchId || !playerId) {
      this.sendError(ws, 'Missing required fields: matchId, playerId');
      return;
    }

    this.matchManager.handlePlayerReady(ws, data);
  }

  handleSubmitAnswer(ws, data) {
    const { matchId, playerId, questionId, answer, timeTaken } = data;
    
    if (!matchId || !playerId || !questionId || !answer) {
      this.sendError(ws, 'Missing required fields: matchId, playerId, questionId, answer');
      return;
    }

    const match = this.matchManager.getMatch(matchId);
    if (!match) {
      this.sendError(ws, 'Match not found');
      return;
    }

    // Verify player is in this match
    const player = match.players.find(p => p.id === playerId);
    if (!player) {
      this.sendError(ws, 'Player not found in match');
      return;
    }

    // Handle answer submission through round manager
    this.matchManager.roundManager.handleAnswerSubmission(match, playerId, {
      questionId,
      answer,
      timeTaken: timeTaken || 0
    }, this.matchManager);
  }

  handleFinishedQuiz(ws, data) {
    const { matchId, playerId, score } = data;
    
    console.log(`🏁 Server received FINISHED_QUIZ:`, data);
    
    if (!matchId || !playerId || score === undefined) {
      console.error(`🏁 Missing required fields: matchId=${matchId}, playerId=${playerId}, score=${score}`);
      this.sendError(ws, 'Missing required fields: matchId, playerId, score');
      return;
    }

    const match = this.matchManager.getMatch(matchId);
    if (!match) {
      console.error(`🏁 Match ${matchId} not found`);
      this.sendError(ws, 'Match not found');
      return;
    }

    // Verify player is in this match
    const player = match.players.find(p => p.id === playerId);
    if (!player) {
      console.error(`🏁 Player ${playerId} not found in match ${matchId}`);
      this.sendError(ws, 'Player not found in match');
      return;
    }

    console.log(`🏁 Calling handlePlayerFinished for player ${playerId} with score ${score}`);
    // Delegate to round manager to handle the finished quiz
    this.matchManager.roundManager.handlePlayerFinished(match, playerId, score, this.matchManager);
  }

  handleReadyForNextRound(ws, data) {
    const { matchId, playerId } = data;
    
    if (!matchId || !playerId) {
      this.sendError(ws, 'Missing required fields: matchId, playerId');
      return;
    }

    const match = this.matchManager.getMatch(matchId);
    if (!match) {
      console.error(`🏁 Match ${matchId} not found`);
      this.sendError(ws, 'Match not found');
      return;
    }

    // Verify player is in this match
    const player = match.players.find(p => p.id === playerId);
    if (!player) {
      console.error(`🏁 Player ${playerId} not found in match ${matchId}`);
      this.sendError(ws, 'Player not found in match');
      return;
    }

    console.log(`🏁 Player ${playerId} is ready for next round in match ${matchId}`);
    // Delegate to round manager to handle ready for next round
    this.matchManager.roundManager.handleReadyForNextRound(match, playerId, this.matchManager);
  }

  handleReadyToViewResults(ws, data) {
    const { matchId, playerId } = data;
    
    if (!matchId || !playerId) {
      this.sendError(ws, 'Missing required fields: matchId, playerId');
      return;
    }

    const match = this.matchManager.getMatch(matchId);
    if (!match) {
      console.error(`🏁 Match ${matchId} not found`);
      this.sendError(ws, 'Match not found');
      return;
    }

    // Verify player is in this match
    const player = match.players.find(p => p.id === playerId);
    if (!player) {
      console.error(`🏁 Player ${playerId} not found in match ${matchId}`);
      this.sendError(ws, 'Player not found in match');
      return;
    }

    console.log(`🏁 Player ${playerId} is ready to view results in match ${matchId}`);
    // Delegate to round manager to handle ready to view results
    this.matchManager.roundManager.handleReadyToViewResults(match, playerId, this.matchManager);
  }

  handleReconnect(ws, data) {
    const { playerId } = data;
    
    if (!playerId) {
      this.sendError(ws, 'Missing required field: playerId');
      return;
    }

    this.matchManager.handlePlayerReconnect(ws, playerId);
  }

  handleClientDisconnect(ws) {
    // Find which player disconnected
    let disconnectedPlayerId = null;
    
    // Check if this socket was associated with any player
    for (const [playerId, socket] of this.matchManager.playerSockets) {
      if (socket === ws) {
        disconnectedPlayerId = playerId;
        break;
      }
    }

    if (disconnectedPlayerId) {
      console.log(`Player ${disconnectedPlayerId} disconnected`);
      this.matchManager.handlePlayerDisconnect(disconnectedPlayerId);
    }
  }

  sendError(ws, message) {
    try {
      ws.send(JSON.stringify({
        type: SERVER_EVENTS.ERROR,
        data: { message },
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error sending error message:', error);
    }
  }

  // Broadcast to all connected clients
  broadcast(message) {
    this.connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error broadcasting message:', error);
        }
      }
    });
  }

  // Get server status
  getStatus() {
    return {
      connectedClients: this.connectedClients.size,
      queueStatus: this.matchManager.getQueueStatus(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  startHeartbeat() {
    // Send ping to all connected clients every 30 seconds
    setInterval(() => {
      this.connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        }
      });
    }, 30000);
  }

  shutdown() {
    if (this.wss) {
      this.wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Start server
const server = new MathQuestServer(8080);
server.start();

// Export for testing
module.exports = MathQuestServer;
