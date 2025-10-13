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
      timer: null
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
      this.endRound(match, matchManager);
    }
  }

  /**
   * Handle answer submission
   */
  handleAnswerSubmission(match, playerId, answerData) {
    const roundData = this.activeRounds.get(match.id);
    if (!roundData) return;

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
      this.endRound(match, matchManager);
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
          this.endRound(match, matchManager);
        }, 15000);
      }
    }
  }

  /**
   * End the current round
   */
  endRound(match, matchManager) {
    const roundData = this.activeRounds.get(match.id);
    if (!roundData) return;

    // Clear timer
    if (roundData.timer) {
      clearInterval(roundData.timer);
    }

    // Calculate final scores and determine winner
    const roundResult = this.calculateRoundResult(match, roundData);
    
    // Update player scores and rounds won
    match.players.forEach(player => {
      const playerResult = roundData.results[player.id];
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

    // Send round result to players
    matchManager.broadcastToMatch(match, {
      type: SERVER_EVENTS.ROUND_RESULT,
      data: roundResult,
      timestamp: Date.now()
    });

    // Check if match is over
    const maxRoundsWon = Math.max(...match.players.map(p => p.roundsWon));
    if (maxRoundsWon >= GAME_CONFIG.ROUNDS_TO_WIN) {
      // Match is over
      setTimeout(() => {
        const winner = match.players.find(p => p.roundsWon >= GAME_CONFIG.ROUNDS_TO_WIN);
        matchManager.endMatch(match, winner.id);
      }, GAME_CONFIG.ROUND_RESULT_DISPLAY_TIME);
    } else {
      // Continue to next round
      setTimeout(() => {
        this.startNextRound(match, matchManager);
      }, GAME_CONFIG.ROUND_RESULT_DISPLAY_TIME);
    }

    // Clean up
    this.activeRounds.delete(match.id);
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
      const playerResult = roundData.results[player.id];
      if (playerResult) {
        results[player.id] = {
          score: playerResult.totalScore,
          correctAnswers: playerResult.correctAnswers,
          totalTime: playerResult.totalTime,
          answers: playerResult.answers
        };

        // Find fastest player (by completion time)
        if (playerResult.totalTime < fastestTime) {
          fastestTime = playerResult.totalTime;
          fastestPlayer = player.id;
        }
      } else {
        // Player didn't complete
        results[player.id] = {
          score: 0,
          correctAnswers: 0,
          totalTime: GAME_CONFIG.TIME_PER_QUESTION,
          answers: []
        };
      }
    });

    // Add bonus points to fastest player
    if (fastestPlayer && results[fastestPlayer].correctAnswers > 0) {
      results[fastestPlayer].score += GAME_CONFIG.BONUS_POINTS_FASTEST;
      results[fastestPlayer].fastestBonus = true;
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
    });

    // Generate new round
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
   * Clean up round data
   */
  cleanup(matchId) {
    const roundData = this.activeRounds.get(matchId);
    if (roundData && roundData.timer) {
      clearInterval(roundData.timer);
    }
    this.activeRounds.delete(matchId);
  }
}

module.exports = RoundManager;
