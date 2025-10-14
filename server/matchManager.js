/**
 * Match Manager
 * Handles matchmaking, player queue, and match creation
 */

const { v4: uuidv4 } = require('uuid');
const { CLIENT_EVENTS, SERVER_EVENTS, GAME_STATES } = require('./messageTypes');
const RoundManager = require('./roundManager');

class MatchManager {
  constructor() {
    this.playerQueue = [];
    this.activeMatches = new Map();
    this.playerSockets = new Map(); // Maps playerId to socket
    this.roundManager = new RoundManager();
  }

  /**
   * Add player to matchmaking queue
   */
  joinQueue(socket, playerData) {
    const { playerId, username, avatar } = playerData;
    
    // Remove player from queue if already there
    this.removeFromQueue(playerId);
    
    // Add player to queue
    const queueEntry = {
      playerId,
      username,
      avatar,
      socket,
      joinTime: Date.now()
    };
    
    this.playerQueue.push(queueEntry);
    this.playerSockets.set(playerId, socket);
    
    console.log(`Player ${username} (${playerId}) joined queue. Queue size: ${this.playerQueue.length}`);
    
    // Try to match players
    this.tryMatchPlayers();
  }

  /**
   * Remove player from queue
   */
  removeFromQueue(playerId) {
    this.playerQueue = this.playerQueue.filter(p => p.playerId !== playerId);
    this.playerSockets.delete(playerId);
  }

  /**
   * Try to match players when queue has 2+ players
   */
  tryMatchPlayers() {
    if (this.playerQueue.length >= 2) {
      const player1 = this.playerQueue.shift();
      const player2 = this.playerQueue.shift();
      
      this.createMatch(player1, player2);
    }
  }

  /**
   * Create a new match between two players
   */
  createMatch(player1, player2) {
    const matchId = uuidv4();
    
    const match = {
      id: matchId,
      players: [
        {
          id: player1.playerId,
          username: player1.username,
          avatar: player1.avatar,
          socket: player1.socket,
          ready: false,
          score: 0,
          roundsWon: 0,
          isConnected: true,
          lastSeen: Date.now()
        },
        {
          id: player2.playerId,
          username: player2.username,
          avatar: player2.avatar,
          socket: player2.socket,
          ready: false,
          score: 0,
          roundsWon: 0,
          isConnected: true,
          lastSeen: Date.now()
        }
      ],
      currentRound: 1,
      maxRounds: 5, // Best of 5 (first to 3 wins)
      state: GAME_STATES.WAITING,
      createdAt: Date.now(),
      rounds: []
    };

    this.activeMatches.set(matchId, match);
    
    // Update socket mappings
    this.playerSockets.set(player1.playerId, player1.socket);
    this.playerSockets.set(player2.playerId, player2.socket);
    
    // Notify both players
    this.notifyMatchFound(match);
    
    console.log(`Match created: ${matchId} between ${player1.username} and ${player2.username}`);
  }

  /**
   * Notify players that a match has been found
   */
  notifyMatchFound(match) {
    const matchData = {
      matchId: match.id,
      players: match.players.map(p => ({
        id: p.id,
        username: p.username,
        avatar: p.avatar
      })),
      currentRound: match.currentRound,
      maxRounds: match.maxRounds
    };

    match.players.forEach(player => {
      if (player.socket && player.isConnected && player.socket.readyState === 1) { // WebSocket.OPEN
        try {
          player.socket.send(JSON.stringify({
            type: SERVER_EVENTS.MATCH_FOUND,
            data: matchData,
            timestamp: Date.now()
          }));
          console.log(`MATCH_FOUND sent to player ${player.username} (${player.id})`);
        } catch (error) {
          console.error(`Error sending MATCH_FOUND to player ${player.username}:`, error);
          player.isConnected = false;
        }
      } else {
        console.warn(`Player ${player.username} socket not ready for MATCH_FOUND`);
        player.isConnected = false;
      }
    });
  }

  /**
   * Handle player ready status
   */
  handlePlayerReady(socket, data) {
    const { matchId, playerId } = data;
    console.log(`🎮 Player ${playerId} ready for match ${matchId}`);
    
    const match = this.activeMatches.get(matchId);
    
    if (!match) {
      console.error(`❌ Match ${matchId} not found`);
      this.sendError(socket, 'Match not found');
      return;
    }

    const player = match.players.find(p => p.id === playerId);
    if (!player) {
      console.error(`❌ Player ${playerId} not found in match`);
      this.sendError(socket, 'Player not found in match');
      return;
    }

    player.ready = true;
    player.socket = socket; // Update socket reference
    
    console.log(`✅ Player ${player.username} is ready. Ready players: ${match.players.filter(p => p.ready).length}/${match.players.length}`);
    
    // Notify all players about ready status
    this.broadcastToMatch(match, {
      type: SERVER_EVENTS.PLAYER_READY,
      data: {
        playerId: playerId,
        ready: true
      },
      timestamp: Date.now()
    });

    // Check if both players are ready
    if (match.players.every(p => p.ready)) {
      console.log(`🚀 Both players ready! Starting round for match ${matchId}`);
      this.startRound(match);
    }
  }

  /**
   * Start a new round
   */
  startRound(match) {
    console.log(`🎯 Starting round ${match.currentRound} for match ${match.id}`);
    match.state = GAME_STATES.PLAYING;
    
    // Generate round data (category and questions)
    const roundData = this.roundManager.generateRound();
    console.log(`🎯 Generated round data:`, roundData.category.displayName, `with ${roundData.questions.length} questions`);
    
    // Store round data in match
    match.currentRoundData = roundData;
    match.roundStartTime = Date.now();
    
    // Notify players to start the round
    console.log(`🎯 Sending ROUND_START to players`);
    this.broadcastToMatch(match, {
      type: SERVER_EVENTS.ROUND_START,
      data: {
        round: match.currentRound,
        maxRounds: match.maxRounds
      },
      timestamp: Date.now()
    });

    // Send category and questions after a short delay (for animation)
    console.log(`🎯 Setting up ROUND_CATEGORY in 2 seconds`);
    setTimeout(() => {
      console.log(`🎯 Sending ROUND_CATEGORY to players`);
      console.log(`🎯 Round data being sent:`, JSON.stringify(roundData, null, 2));
      this.broadcastToMatch(match, {
        type: SERVER_EVENTS.ROUND_CATEGORY,
        data: roundData,
        timestamp: Date.now()
      });
      
      // Don't start timer yet - let players start the quiz first
      // Timer will be started when first answer is submitted
    }, 2000); // 2 second delay for wheel animation
  }

  /**
   * Handle player disconnection
   */
  handlePlayerDisconnect(playerId) {
    const match = this.findMatchByPlayerId(playerId);
    if (!match) return;

    const player = match.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
      player.lastSeen = Date.now();
      
      // Notify other player
      this.broadcastToMatch(match, {
        type: SERVER_EVENTS.PLAYER_DISCONNECTED,
        data: { playerId },
        timestamp: Date.now()
      });

      // Start reconnection timer
      setTimeout(() => {
        this.handleReconnectionTimeout(match, playerId);
      }, 30000); // 30 seconds to reconnect
    }
  }

  /**
   * Handle player reconnection
   */
  handlePlayerReconnect(socket, playerId) {
    const match = this.findMatchByPlayerId(playerId);
    if (!match) {
      this.sendError(socket, 'No active match found');
      return;
    }

    const player = match.players.find(p => p.id === playerId);
    if (player) {
      player.socket = socket;
      player.isConnected = true;
      this.playerSockets.set(playerId, socket);
      
      // Notify other player
      this.broadcastToMatch(match, {
        type: SERVER_EVENTS.PLAYER_RECONNECTED,
        data: { playerId },
        timestamp: Date.now()
      });

      console.log(`Player ${playerId} reconnected to match ${match.id}`);
    }
  }

  /**
   * Handle reconnection timeout
   */
  handleReconnectionTimeout(match, playerId) {
    const player = match.players.find(p => p.id === playerId);
    if (!player || !player.isConnected) {
      // Player didn't reconnect, end the match
      this.endMatch(match, playerId === match.players[0].id ? match.players[1].id : match.players[0].id);
    }
  }

  /**
   * Find match by player ID
   */
  findMatchByPlayerId(playerId) {
    for (const [matchId, match] of this.activeMatches) {
      if (match.players.some(p => p.id === playerId)) {
        return match;
      }
    }
    return null;
  }

  /**
   * Broadcast message to all players in a match
   */
  broadcastToMatch(match, message) {
    match.players.forEach(player => {
      if (player.socket && player.isConnected) {
        try {
          player.socket.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error sending message to player ${player.id}:`, error);
        }
      }
    });
  }

  /**
   * Send error message to a specific socket
   */
  sendError(socket, message) {
    socket.send(JSON.stringify({
      type: SERVER_EVENTS.ERROR,
      data: { message },
      timestamp: Date.now()
    }));
  }

  /**
   * End a match
   */
  endMatch(match, winnerId) {
    const winner = match.players.find(p => p.id === winnerId);
    const loser = match.players.find(p => p.id !== winnerId);
    
    const matchSummary = {
      winner: {
        id: winner.id,
        username: winner.username,
        avatar: winner.avatar,
        roundsWon: winner.roundsWon,
        totalScore: winner.score
      },
      loser: {
        id: loser.id,
        username: loser.username,
        avatar: loser.avatar,
        roundsWon: loser.roundsWon,
        totalScore: loser.score
      },
      rounds: match.rounds,
      duration: Date.now() - match.createdAt
    };

    this.broadcastToMatch(match, {
      type: SERVER_EVENTS.MATCH_END,
      data: matchSummary,
      timestamp: Date.now()
    });

    // Clean up
    match.players.forEach(player => {
      this.playerSockets.delete(player.id);
    });
    this.activeMatches.delete(match.id);
    
    console.log(`Match ${match.id} ended. Winner: ${winner.username}`);
  }

  /**
   * Get match by ID
   */
  getMatch(matchId) {
    return this.activeMatches.get(matchId);
  }

  /**
   * Get player socket by ID
   */
  getPlayerSocket(playerId) {
    return this.playerSockets.get(playerId);
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.playerQueue.length,
      activeMatches: this.activeMatches.size
    };
  }
}

module.exports = MatchManager;
