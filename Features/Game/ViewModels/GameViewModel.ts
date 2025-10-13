/**
 * Game ViewModel
 * Manages game state and business logic for game screens
 */

import { useEffect, useRef, useState } from 'react';
import { authService } from '../../../Core/Services/AuthService';
import { gameService, GameSession, GameStats, Player } from '../../../Core/Services/GameService';
import { Question } from '../../../Data/Models/question';

export interface GameViewModelState {
  // Game session
  session: GameSession | null;
  currentQuestion: Question | null;
  timeRemaining: number;
  isGameActive: boolean;
  isGameFinished: boolean;
  
  // Player state
  user: Player | null;
  opponent: Player | null;
  
  // Game stats
  stats: GameStats | null;
  
  // Loading states
  isLoading: boolean;
  isSearchingOpponent: boolean;
  
  // Error handling
  error: string | null;
}

export const useGameViewModel = () => {
  const [state, setState] = useState<GameViewModelState>({
    session: null,
    currentQuestion: null,
    timeRemaining: 30,
    isGameActive: false,
    isGameFinished: false,
    user: null,
    opponent: null,
    stats: null,
    isLoading: false,
    isSearchingOpponent: false,
    error: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startNewGame = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const user: Player = {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        score: 0,
        isConnected: true,
        totalCorrect: 0,
        totalIncorrect: 0,
        streak: 0,
      };

      const session = await gameService.createGameSession([user]);
      setState(prev => ({ 
        ...prev, 
        session, 
        user, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      }));
    }
  };

  const findOpponent = async () => {
    setState(prev => ({ ...prev, isSearchingOpponent: true, error: null }));
    
    try {
      const opponent = await gameService.findOpponent();
      setState(prev => ({ 
        ...prev, 
        opponent, 
        isSearchingOpponent: false 
      }));
      
      return opponent;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to find opponent',
        isSearchingOpponent: false 
      }));
      throw error;
    }
  };

  const startGame = async (questions: Question[]) => {
    if (!state.session) {
      throw new Error('No active session');
    }

    await gameService.startGame(questions);
    
    const session = gameService.getCurrentSession();
    if (session) {
      setState(prev => ({ 
        ...prev, 
        session, 
        currentQuestion: questions[0],
        isGameActive: true,
        timeRemaining: 30 
      }));
      
      startTimer();
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.timeRemaining <= 1) {
          // Time's up - auto advance or end game
          if (prev.session && prev.session.currentQuestionIndex < prev.session.questions.length - 1) {
            nextQuestion();
          } else {
            endGame();
          }
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  };

  const submitAnswer = async (answer: string): Promise<boolean> => {
    if (!state.session || !state.user) {
      throw new Error('No active game session');
    }

    try {
      const isCorrect = await gameService.submitAnswer(state.user.id, answer);
      
      // Update local state
      const session = gameService.getCurrentSession();
      if (session) {
        setState(prev => ({ 
          ...prev, 
          session,
          user: session.players.find(p => p.id === prev.user?.id) || prev.user,
          opponent: session.players.find(p => p.id !== prev.user?.id) || prev.opponent
        }));
      }
      
      return isCorrect;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to submit answer'
      }));
      throw error;
    }
  };

  const nextQuestion = async () => {
    if (!state.session) return;

    try {
      await gameService.nextQuestion();
      
      const session = gameService.getCurrentSession();
      if (session) {
        const currentQuestion = session.questions[session.currentQuestionIndex];
        setState(prev => ({ 
          ...prev, 
          session,
          currentQuestion,
          timeRemaining: 30,
          user: session.players.find(p => p.id === prev.user?.id) || prev.user,
          opponent: session.players.find(p => p.id !== prev.user?.id) || prev.opponent
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to advance question'
      }));
    }
  };

  const endGame = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      const stats = await gameService.endGame();
      setState(prev => ({ 
        ...prev, 
        stats, 
        isGameActive: false,
        isGameFinished: true 
      }));
      
      return stats;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to end game'
      }));
      throw error;
    }
  };

  const resetGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    gameService.resetGame();
    setState({
      session: null,
      currentQuestion: null,
      timeRemaining: 30,
      isGameActive: false,
      isGameFinished: false,
      user: null,
      opponent: null,
      stats: null,
      isLoading: false,
      isSearchingOpponent: false,
      error: null,
    });
  };

  return {
    state,
    actions: {
      startNewGame,
      findOpponent,
      startGame,
      submitAnswer,
      nextQuestion,
      endGame,
      resetGame,
    },
  };
};
