/**
 * Game Service
 * Handles game logic, matchmaking, and game state management
 */

import { Question } from '../../Data/Models/question';

export interface GameSession {
  id: string;
  players: Player[];
  questions: Question[];
  currentQuestionIndex: number;
  timeRemaining: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  avatar: any;
  score: number;
  isConnected: boolean;
  totalCorrect: number;
  totalIncorrect: number;
  streak: number;
}

export interface GameStats {
  duration: number;
  totalQuestions: number;
  winner: Player | null;
}

class GameService {
  private currentSession: GameSession | null = null;
  private gameHistory: GameSession[] = [];

  async createGameSession(players: Player[]): Promise<GameSession> {
    const session: GameSession = {
      id: Date.now().toString(),
      players,
      questions: [],
      currentQuestionIndex: 0,
      timeRemaining: 30, // 30 seconds per question
      status: 'waiting',
      createdAt: new Date(),
    };

    this.currentSession = session;
    return session;
  }

  async findOpponent(): Promise<Player> {
    // TODO: Implement actual matchmaking logic
    // This is a placeholder implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'opponent',
          name: 'TESTUSER01341ZQ...',
          avatar: 'T',
          score: 3,
          isConnected: true,
          totalCorrect: 0,
          totalIncorrect: 0,
          streak: 0,
        });
      }, 3000); // Simulate 3-second search
    });
  }

  async startGame(questions: Question[]): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }

    this.currentSession.questions = questions;
    this.currentSession.status = 'playing';
    this.currentSession.currentQuestionIndex = 0;
    this.currentSession.timeRemaining = 30;
  }

  async submitAnswer(playerId: string, answer: string): Promise<boolean> {
    if (!this.currentSession || this.currentSession.status !== 'playing') {
      throw new Error('No active game in progress');
    }

    const currentQuestion = this.currentSession.questions[this.currentSession.currentQuestionIndex];
    const isCorrect = answer === currentQuestion.respuesta.toString();

    // Update player stats
    const player = this.currentSession.players.find(p => p.id === playerId);
    if (player) {
      if (isCorrect) {
        player.score += 1;
        player.totalCorrect += 1;
        player.streak += 1;
      } else {
        player.totalIncorrect += 1;
        player.streak = 0;
      }
    }

    return isCorrect;
  }

  async nextQuestion(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }

    this.currentSession.currentQuestionIndex += 1;
    this.currentSession.timeRemaining = 30;
  }

  async endGame(): Promise<GameStats> {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }

    const duration = Date.now() - this.currentSession.createdAt.getTime();
    const winner = this.currentSession.players.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );

    const stats: GameStats = {
      duration,
      totalQuestions: this.currentSession.questions.length,
      winner,
    };

    this.gameHistory.push(this.currentSession);
    this.currentSession.status = 'finished';

    return stats;
  }

  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  getGameHistory(): GameSession[] {
    return this.gameHistory;
  }

  resetGame(): void {
    this.currentSession = null;
  }
}

export const gameService = new GameService();
