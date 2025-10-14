/**
 * Round Manager
 * Handles round logic, question timing, scoring, and round results
 */

const { SERVER_EVENTS, GAME_CONFIG } = require('./messageTypes');

// Import questions data (we'll need to adapt this for Node.js)
const questions = [
  // SUMA questions
  {
    id: "suma_1",
    category: { id: "suma", displayName: "Suma", mascotName: "Plusito" },
    texto: "15 + 23",
    respuestaCorrecta: "38",
    opciones: ["38", "35", "41"]
  },
  {
    id: "suma_2",
    category: { id: "suma", displayName: "Suma", mascotName: "Plusito" },
    texto: "47 + 29",
    respuestaCorrecta: "76",
    opciones: ["76", "74", "78"]
  },
  {
    id: "suma_3",
    category: { id: "suma", displayName: "Suma", mascotName: "Plusito" },
    texto: "134 + 267",
    respuestaCorrecta: "401",
    opciones: ["401", "399", "403"]
  },
  {
    id: "suma_4",
    category: { id: "suma", displayName: "Suma", mascotName: "Plusito" },
    texto: "89 + 56",
    respuestaCorrecta: "145",
    opciones: ["145", "143", "147"]
  },
  {
    id: "suma_5",
    category: { id: "suma", displayName: "Suma", mascotName: "Plusito" },
    texto: "78 + 94",
    respuestaCorrecta: "172",
    opciones: ["172", "170", "174"]
  },
  {
    id: "suma_6",
    category: { id: "suma", displayName: "Suma", mascotName: "Plusito" },
    texto: "256 + 189",
    respuestaCorrecta: "445",
    opciones: ["445", "443", "447"]
  },
  // RESTA questions
  {
    id: "resta_1",
    category: { id: "resta", displayName: "Resta", mascotName: "Restin" },
    texto: "234 - 12",
    respuestaCorrecta: "222",
    opciones: ["222", "220", "224"]
  },
  {
    id: "resta_2",
    category: { id: "resta", displayName: "Resta", mascotName: "Restin" },
    texto: "156 - 89",
    respuestaCorrecta: "67",
    opciones: ["67", "65", "69"]
  },
  {
    id: "resta_3",
    category: { id: "resta", displayName: "Resta", mascotName: "Restin" },
    texto: "403 - 178",
    respuestaCorrecta: "225",
    opciones: ["225", "223", "227"]
  },
  {
    id: "resta_4",
    category: { id: "resta", displayName: "Resta", mascotName: "Restin" },
    texto: "87 - 29",
    respuestaCorrecta: "58",
    opciones: ["58", "56", "60"]
  },
  {
    id: "resta_5",
    category: { id: "resta", displayName: "Resta", mascotName: "Restin" },
    texto: "345 - 167",
    respuestaCorrecta: "178",
    opciones: ["178", "176", "180"]
  },
  {
    id: "resta_6",
    category: { id: "resta", displayName: "Resta", mascotName: "Restin" },
    texto: "92 - 45",
    respuestaCorrecta: "47",
    opciones: ["47", "45", "49"]
  },
  // MULTIPLICACIÓN questions
  {
    id: "multiplicacion_1",
    category: { id: "multiplicacion", displayName: "Multiplicación", mascotName: "Porfix" },
    texto: "12 × 8",
    respuestaCorrecta: "96",
    opciones: ["96", "94", "98"]
  },
  {
    id: "multiplicacion_2",
    category: { id: "multiplicacion", displayName: "Multiplicación", mascotName: "Porfix" },
    texto: "15 × 7",
    respuestaCorrecta: "105",
    opciones: ["105", "103", "107"]
  },
  {
    id: "multiplicacion_3",
    category: { id: "multiplicacion", displayName: "Multiplicación", mascotName: "Porfix" },
    texto: "23 × 4",
    respuestaCorrecta: "92",
    opciones: ["92", "90", "94"]
  },
  {
    id: "multiplicacion_4",
    category: { id: "multiplicacion", displayName: "Multiplicación", mascotName: "Porfix" },
    texto: "9 × 13",
    respuestaCorrecta: "117",
    opciones: ["117", "115", "119"]
  },
  {
    id: "multiplicacion_5",
    category: { id: "multiplicacion", displayName: "Multiplicación", mascotName: "Porfix" },
    texto: "16 × 6",
    respuestaCorrecta: "96",
    opciones: ["96", "94", "98"]
  },
  {
    id: "multiplicacion_6",
    category: { id: "multiplicacion", displayName: "Multiplicación", mascotName: "Porfix" },
    texto: "14 × 9",
    respuestaCorrecta: "126",
    opciones: ["126", "124", "128"]
  },
  // DIVISIÓN questions
  {
    id: "division_1",
    category: { id: "division", displayName: "División", mascotName: "Dividin" },
    texto: "144 ÷ 12",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },
  {
    id: "division_2",
    category: { id: "division", displayName: "División", mascotName: "Dividin" },
    texto: "96 ÷ 8",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },
  {
    id: "division_3",
    category: { id: "division", displayName: "División", mascotName: "Dividin" },
    texto: "135 ÷ 15",
    respuestaCorrecta: "9",
    opciones: ["9", "8", "10"]
  },
  {
    id: "division_4",
    category: { id: "division", displayName: "División", mascotName: "Dividin" },
    texto: "84 ÷ 7",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },
  {
    id: "division_5",
    category: { id: "division", displayName: "División", mascotName: "Dividin" },
    texto: "108 ÷ 9",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },
  {
    id: "division_6",
    category: { id: "division", displayName: "División", mascotName: "Dividin" },
    texto: "156 ÷ 13",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  }
];

class RoundManager {
  constructor() {
    this.activeRounds = new Map(); // Map of matchId to round data
  }

  /**
   * Generate a new round with random category and questions
   */
  generateRound() {
    const categories = ['suma', 'resta', 'multiplicacion', 'division'];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    
    // Get 6 random questions from the selected category
    const categoryQuestions = questions.filter(q => q.category.id === selectedCategory);
    const shuffledQuestions = this.shuffleArray([...categoryQuestions]);
    const selectedQuestions = shuffledQuestions.slice(0, GAME_CONFIG.QUESTIONS_PER_ROUND);
    
    console.log(`🎯 Generated round for category: ${selectedCategory} with ${selectedQuestions.length} questions`);
    console.log(`🎯 Questions:`, selectedQuestions.map(q => q.texto));
    console.log(`🎯 First question details:`, selectedQuestions[0]);
    
    return {
      category: selectedQuestions[0].category,
      questions: selectedQuestions
    };
  }

  /**
   * Start round timer
   */
  startRoundTimer(match, matchManager) {
    const roundData = {
      matchId: match.id,
      startTime: Date.now(),
      timeRemaining: GAME_CONFIG.TIME_PER_QUESTION,
      warningSent: false,
      timer: null,
      results: {} // Initialize results object
    };

    this.activeRounds.set(match.id, roundData);

    // Start countdown timer
    roundData.timer = setInterval(() => {
      this.updateRoundTimer(match, matchManager);
    }, 1000);
  }

  /**
   * Update round timer
   */
  updateRoundTimer(match, matchManager) {
    const roundData = this.activeRounds.get(match.id);
    if (!roundData) return;

    roundData.timeRemaining -= 1000;

    // Send time warning
    if (roundData.timeRemaining <= GAME_CONFIG.TIME_WARNING_THRESHOLD && !roundData.warningSent) {
      roundData.warningSent = true;
      matchManager.broadcastToMatch(match, {
        type: SERVER_EVENTS.TIME_WARNING,
        data: {
          timeRemaining: roundData.timeRemaining,
          message: "Time is running out!"
        },
        timestamp: Date.now()
      });
    }

    // End round when time is up
    if (roundData.timeRemaining <= 0) {
      this.sendShowResults(match, roundData, matchManager);
    }
  }

  /**
   * Handle answer submission
   */
  handleAnswerSubmission(match, playerId, answerData, matchManager) {
    const roundData = this.activeRounds.get(match.id);
    if (!roundData) return;

    // Start timer if this is the first answer submission
    if (!roundData.timer && !roundData.timerStarted) {
      console.log('🎯 First answer submitted - starting round timer');
      roundData.timerStarted = true;
      this.startRoundTimer(match, matchManager);
    }

    const { questionId, answer, timeTaken } = answerData;
    
    // Find the question
    const question = match.currentRoundData.questions.find(q => q.id === questionId);
    if (!question) return;

    // Check if answer is correct
    const isCorrect = answer === question.respuestaCorrecta;
    
    // Find player
    const player = match.players.find(p => p.id === playerId);
    if (!player) return;

    // Initialize round results if not exists
    if (!roundData.results) {
      roundData.results = {};
    }
    if (!roundData.results[playerId]) {
      roundData.results[playerId] = {
        answers: [],
        totalScore: 0,
        totalTime: 0,
        correctAnswers: 0
      };
    }

    // Store answer
    roundData.results[playerId].answers.push({
      questionId,
      answer,
      correct: isCorrect,
      timeTaken,
      timestamp: Date.now()
    });

    // Update score
    if (isCorrect) {
      roundData.results[playerId].totalScore += GAME_CONFIG.POINTS_PER_CORRECT;
      roundData.results[playerId].correctAnswers++;
    }
    
    roundData.results[playerId].totalTime += timeTaken;

    // Check if player completed all questions
    if (roundData.results[playerId].answers.length === GAME_CONFIG.QUESTIONS_PER_ROUND) {
      this.checkRoundCompletion(match, matchManager);
    }
  }

  /**
   * Check if round is completed by both players
   */
  checkRoundCompletion(match, matchManager) {
    const roundData = this.activeRounds.get(match.id);
    if (!roundData || !roundData.results) return;

    const allPlayersCompleted = match.players.every(player => 
      roundData.results[player.id] && 
      roundData.results[player.id].answers.length === GAME_CONFIG.QUESTIONS_PER_ROUND
    );

    if (allPlayersCompleted) {
      // Both players finished, end the round
      this.sendShowResults(match, roundData, matchManager);
    } else {
      // One player finished, give the other player 15 seconds
      const remainingPlayer = match.players.find(player => 
        !roundData.results[player.id] || 
        roundData.results[player.id].answers.length < GAME_CONFIG.QUESTIONS_PER_ROUND
      );

      if (remainingPlayer) {
        matchManager.broadcastToMatch(match, {
          type: SERVER_EVENTS.ROUND_END,
          data: {
            message: `Player ${remainingPlayer.username} has 15 seconds to finish!`,
            timeRemaining: 15000
          },
          timestamp: Date.now()
        });

        // Set final timeout
        setTimeout(() => {
          this.sendShowResults(match, roundData, matchManager);
        }, 15000);
      }
    }
  }


  /**
   * Calculate round result
   */
  calculateRoundResult(match, roundData) {
    const results = {};
    let fastestPlayer = null;
    let fastestTime = Infinity;

    // Calculate basic scores and find fastest player
    match.players.forEach(player => {
      const playerResult = roundData.results && roundData.results[player.id];
      if (playerResult) {
        // New scoring: 100 points per correct answer
        const baseScore = playerResult.correctAnswers * 100;
        
        results[player.id] = {
          score: baseScore, // Will add bonus later
          baseScore: baseScore,
          correctAnswers: playerResult.correctAnswers,
          totalTime: playerResult.totalTime,
          answers: playerResult.answers,
          firstFinishBonus: 0,
          finishedAt: playerResult.finishedAt
        };

        // Find fastest player (by finish timestamp)
        if (playerResult.finishedAt && playerResult.finishedAt < fastestTime) {
          fastestTime = playerResult.finishedAt;
          fastestPlayer = player.id;
        }
      } else {
        // Player didn't complete
        results[player.id] = {
          score: 0,
          baseScore: 0,
          correctAnswers: 0,
          totalTime: GAME_CONFIG.TIME_PER_QUESTION,
          answers: [],
          firstFinishBonus: 0,
          finishedAt: null
        };
      }
    });

    // Add 50 bonus points to fastest player (if they got at least one correct answer)
    if (fastestPlayer && results[fastestPlayer].correctAnswers > 0) {
      results[fastestPlayer].firstFinishBonus = 50;
      results[fastestPlayer].score += 50;
      console.log(`🏁 Player ${fastestPlayer} gets 50 point first finish bonus`);
    }

    // Determine round winner
    let winnerId = null;
    let highestScore = -1;

    Object.entries(results).forEach(([playerId, result]) => {
      if (result.score > highestScore) {
        highestScore = result.score;
        winnerId = playerId;
      }
    });

    // Get mascot asset for the category
    const mascotAsset = match.currentRoundData.category.mascotName;

    return {
      winnerId,
      scores: results,
      category: match.currentRoundData.category,
      mascotAsset,
      fastestPlayer
    };
  }

  /**
   * Start next round
   */
  startNextRound(match, matchManager) {
    match.currentRound++;
    match.players.forEach(player => {
      player.ready = false;
      player.readyForNextRound = false; // Reset ready for next round flag
      player.readyToViewResults = false; // Reset ready to view results flag
    });

    // Generate new round data for the next round
    console.log(`🏁 Generating new round data for round ${match.currentRound}`);
    const roundData = this.generateRound();
    match.currentRoundData = roundData;
    match.roundStartTime = Date.now();

    // Notify players to start new round
    matchManager.broadcastToMatch(match, {
      type: SERVER_EVENTS.ROUND_START,
      data: {
        round: match.currentRound,
        maxRounds: match.maxRounds
      },
      timestamp: Date.now()
    });

    // Send category and questions after delay
    setTimeout(() => {
      matchManager.broadcastToMatch(match, {
        type: SERVER_EVENTS.ROUND_CATEGORY,
        data: roundData,
        timestamp: Date.now()
      });
      
      // Start round timer
      this.startRoundTimer(match, matchManager);
    }, 2000);
  }

  /**
   * Utility function to shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Handle when a player finishes the quiz
   */
  handlePlayerFinished(match, playerId, score, matchManager) {
    console.log(`🏁 Player ${playerId} finished quiz with score ${score} in match ${match.id}`);
    console.log(`🏁 Match players:`, match.players.map(p => ({ id: p.id, username: p.username })));
    
    let roundData = this.activeRounds.get(match.id);
    if (!roundData) {
      console.warn(`No active round found for match ${match.id} - creating new round data`);
      // Create round data if it doesn't exist
      roundData = {
        matchId: match.id,
        startTime: match.roundStartTime || Date.now(),
        timeRemaining: 15000,
        warningSent: false,
        timer: null,
        results: {},
        finishedPlayers: new Set(),
        opponentFinishedTimer: null
      };
      this.activeRounds.set(match.id, roundData);
    }

    // Mark player as finished
    if (!roundData.finishedPlayers) {
      roundData.finishedPlayers = new Set();
    }
    roundData.finishedPlayers.add(playerId);

    // Store the player's score
    if (!roundData.results) {
      roundData.results = {};
    }
    roundData.results[playerId] = {
      totalScore: score * 100, // 100 points per correct answer
      correctAnswers: score,
      totalTime: Date.now() - (match.roundStartTime || roundData.startTime),
      finished: true,
      finishedAt: Date.now(), // Track exact finish time for first finish bonus
      answers: []
    };

    // Check if both players are finished
    console.log(`🏁 Checking finished players: ${roundData.finishedPlayers.size}/${match.players.length}`);
    if (roundData.finishedPlayers.size >= match.players.length) {
      console.log(`🏁 All players finished - sending SHOW_RESULTS`);
      this.sendShowResults(match, roundData, matchManager);
    } else {
      console.log(`🏁 Only one player finished - notifying opponent`);
      // Notify the opponent that someone finished
      this.notifyOpponentFinished(match, playerId, roundData, matchManager);
    }
  }

  /**
   * Notify opponent that someone finished and start 15-second timer
   */
  notifyOpponentFinished(match, finishedPlayerId, roundData, matchManager) {
    // Clear any existing timer
    if (roundData.opponentFinishedTimer) {
      clearTimeout(roundData.opponentFinishedTimer);
    }

    // Find the opponent
    const opponent = match.players.find(player => player.id !== finishedPlayerId);
    if (opponent && opponent.socket && opponent.socket.readyState === 1) {
      opponent.socket.send(JSON.stringify({
        type: SERVER_EVENTS.OPPONENT_FINISHED,
        data: {
          playerId: finishedPlayerId,
          timeRemaining: 15000 // 15 seconds
        },
        timestamp: Date.now()
      }));
    }

    // Set a 15-second timeout to end the round if the opponent doesn't finish
    roundData.opponentFinishedTimer = setTimeout(() => {
      const currentRoundData = this.activeRounds.get(match.id);
      if (currentRoundData && currentRoundData.finishedPlayers && currentRoundData.finishedPlayers.size < match.players.length) {
        console.log(`🏁 15-second timeout reached for match ${match.id} - sending SHOW_RESULTS`);
        this.sendShowResults(match, currentRoundData, matchManager);
      } else {
        console.log(`🏁 15-second timeout reached for match ${match.id} - but round already completed or cleaned up`);
      }
    }, 15000);
  }

  /**
   * Send SHOW_RESULTS to both players
   */
  sendShowResults(match, roundData, matchManager) {
    console.log(`🏁 Sending SHOW_RESULTS for match ${match.id}`);
    
    // Calculate round results
    const roundResult = this.calculateRoundResult(match, roundData);
    
    // Update player scores and rounds won
    match.players.forEach(player => {
      const playerResult = roundData.results && roundData.results[player.id];
      if (playerResult) {
        player.score += playerResult.totalScore;
        if (roundResult.winnerId === player.id) {
          player.roundsWon++;
        }
      }
    });

    // Store round result
    match.rounds.push({
      round: match.currentRound,
      category: match.currentRoundData.category,
      results: roundResult,
      duration: Date.now() - roundData.startTime
    });

    // Send SHOW_RESULTS to both players
    let connectedPlayers = 0;
    match.players.forEach(player => {
      if (player.socket && player.socket.readyState === 1) {
        console.log(`🏁 Sending SHOW_RESULTS to player ${player.id}`);
        try {
          player.socket.send(JSON.stringify({
            type: SERVER_EVENTS.SHOW_RESULTS,
            data: {
              matchId: match.id,
              roundResult: roundResult,
              matchData: {
                id: match.id,
                players: match.players.map(p => ({
                  id: p.id,
                  username: p.username,
                  avatar: p.avatar,
                  score: p.score,
                  roundsWon: p.roundsWon
                })),
                currentRound: match.currentRound,
                maxRounds: match.maxRounds
              }
            },
            timestamp: Date.now()
          }));
          connectedPlayers++;
        } catch (error) {
          console.error(`🏁 Error sending SHOW_RESULTS to player ${player.id}:`, error);
        }
      } else {
        console.log(`🏁 Cannot send SHOW_RESULTS to player ${player.id} - socket not ready (state: ${player.socket?.readyState})`);
      }
    });
    
    // If no players are connected, clean up the match
    if (connectedPlayers === 0) {
      console.log(`🏁 No players connected for match ${match.id} - cleaning up`);
      matchManager.activeMatches.delete(match.id);
      this.cleanup(match.id);
      return;
    }

    // Check if match is over
    const maxRoundsWon = Math.max(...match.players.map(p => p.roundsWon));
    if (maxRoundsWon >= GAME_CONFIG.ROUNDS_TO_WIN) {
      // Match is over - send MATCH_END after delay
      setTimeout(() => {
        const winner = match.players.find(p => p.roundsWon >= GAME_CONFIG.ROUNDS_TO_WIN);
        matchManager.endMatch(match, winner.id);
      }, GAME_CONFIG.ROUND_RESULT_DISPLAY_TIME);
    } else {
      // Wait for players to be ready for next round instead of auto-starting
      console.log(`🏁 Round ${match.currentRound} completed. Waiting for players to be ready for next round.`);
      // Don't auto-start next round - wait for READY_FOR_NEXT_ROUND message
    }

    // Clean up timers and round data
    if (roundData.opponentFinishedTimer) {
      clearTimeout(roundData.opponentFinishedTimer);
    }
    if (roundData.timer) {
      clearInterval(roundData.timer);
    }
    this.activeRounds.delete(match.id);
  }

  /**
   * Handle when a player is ready to view results
   */
  handleReadyToViewResults(match, playerId, matchManager) {
    console.log(`🏁 Player ${playerId} is ready to view results in match ${match.id}`);
    
    // Mark player as ready to view results
    const player = match.players.find(p => p.id === playerId);
    if (!player) return;
    
    player.readyToViewResults = true;
    
    // Check if both players are ready to view results
    const allPlayersReady = match.players.every(p => p.readyToViewResults);
    if (allPlayersReady) {
      console.log(`🏁 Both players ready to view results - sending BOTH_PLAYERS_READY_FOR_RESULTS`);
      // Send message to both players to show results with delay
      matchManager.broadcastToMatch(match, {
        type: 'BOTH_PLAYERS_READY_FOR_RESULTS',
        data: {
          delay: 2500 // 2.5 second delay before showing results
        },
        timestamp: Date.now()
      });
    } else {
      console.log(`🏁 Waiting for other players to be ready to view results`);
    }
  }

  /**
   * Handle when a player is ready for the next round
   */
  handleReadyForNextRound(match, playerId, matchManager) {
    console.log(`🏁 Player ${playerId} is ready for next round in match ${match.id}`);
    
    // Mark player as ready for next round
    const player = match.players.find(p => p.id === playerId);
    if (!player) return;
    
    player.readyForNextRound = true;
    
    // Check if both players are ready for next round
    const allPlayersReady = match.players.every(p => p.readyForNextRound);
    if (allPlayersReady) {
      console.log(`🏁 Both players ready for next round - starting round ${match.currentRound + 1}`);
      this.startNextRound(match, matchManager);
    } else {
      console.log(`🏁 Waiting for other players to be ready for next round`);
    }
  }

  /**
   * Clean up round data
   */
  cleanup(matchId) {
    const roundData = this.activeRounds.get(matchId);
    if (roundData) {
      if (roundData.timer) {
        clearInterval(roundData.timer);
      }
      if (roundData.opponentFinishedTimer) {
        clearTimeout(roundData.opponentFinishedTimer);
      }
    }
    this.activeRounds.delete(matchId);
  }
}

module.exports = RoundManager;
