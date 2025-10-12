import { Category } from '@/types/Category';
import { Question } from '@/types/question';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';

// Game Types
export interface Player {
  id: string;
  name: string;
  avatar: any;
  score: number;
  isConnected: boolean;
  currentAnswer?: string;
  hasAnswered: boolean;
  answerTime?: number; // Time taken to answer in milliseconds
  streak: number;
  totalCorrect: number;
  totalIncorrect: number;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'matching' | 'category-selection' | 'playing' | 'finished';
  currentQuestion: number;
  totalQuestions: number;
  category?: Category;
  questions: Question[];
  players: Player[];
  currentPlayerTurn: string; // Player ID whose turn it is
  timeRemaining: number; // Time remaining for current question
  gameStartTime?: number;
  gameEndTime?: number;
  winner?: Player;
}

export interface GameAction {
  type: 'START_GAME' | 'ADD_PLAYER' | 'REMOVE_PLAYER' | 'UPDATE_PLAYER_SCORE' | 
        'SET_CATEGORY' | 'SET_QUESTIONS' | 'NEXT_QUESTION' | 'PLAYER_ANSWER' | 
        'SET_TURN' | 'UPDATE_TIMER' | 'FINISH_GAME' | 'RESET_GAME';
  payload?: any;
}

// Initial State
const initialState: GameState = {
  id: '',
  status: 'waiting',
  currentQuestion: 0,
  totalQuestions: 5,
  questions: [],
  players: [],
  currentPlayerTurn: '',
  timeRemaining: 30,
};

// Game Logic Functions
const generateGameId = (): string => {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
};

const createOpponent = (): Player => {
  const names = ['MathMaster', 'NumberNinja', 'CalcKing', 'ProblemSolver', 'QuickMath', 'BrainyBot'];
  const avatars = ['M', 'N', 'C', 'P', 'Q', 'B'];
  
  const randomIndex = Math.floor(Math.random() * names.length);
  
  return {
    id: `opponent_${Date.now()}`,
    name: names[randomIndex],
    avatar: avatars[randomIndex],
    score: 0,
    isConnected: true,
    hasAnswered: false,
    streak: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
  };
};

const simulateOpponentAnswer = (question: Question, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): { answer: string; time: number } => {
  const isCorrect = Math.random() > (difficulty === 'easy' ? 0.3 : difficulty === 'hard' ? 0.7 : 0.5);
  
  if (isCorrect) {
    // Correct answer
    return {
      answer: question.respuestaCorrecta,
      time: Math.random() * 15000 + 5000, // 5-20 seconds
    };
  } else {
    // Wrong answer - pick a wrong option
    const wrongAnswers = question.opciones.filter(opt => opt !== question.respuestaCorrecta);
    return {
      answer: wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)],
      time: Math.random() * 20000 + 8000, // 8-28 seconds
    };
  }
};

// Game Reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        id: generateGameId(),
        status: 'matching',
        players: [],
        currentQuestion: 0,
        questions: [],
        timeRemaining: 30,
      };

    case 'ADD_PLAYER':
      return {
        ...state,
        players: [...state.players, action.payload],
      };

    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload),
      };

    case 'SET_CATEGORY':
      return {
        ...state,
        category: action.payload,
        status: 'category-selection',
      };

    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload,
        totalQuestions: action.payload.length,
        status: 'playing',
        currentQuestion: 0,
        timeRemaining: 30,
        gameStartTime: Date.now(),
      };

    case 'NEXT_QUESTION':
      const nextQuestion = state.currentQuestion + 1;
      if (nextQuestion >= state.totalQuestions) {
        return {
          ...state,
          status: 'finished',
          gameEndTime: Date.now(),
          winner: state.players.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
          ),
        };
      }
      
      return {
        ...state,
        currentQuestion: nextQuestion,
        timeRemaining: 30,
        players: state.players.map(player => ({
          ...player,
          hasAnswered: false,
          currentAnswer: undefined,
        })),
      };

    case 'PLAYER_ANSWER':
      const { playerId, answer, isCorrect, timeTaken } = action.payload;
      
      return {
        ...state,
        players: state.players.map(player => {
          if (player.id === playerId) {
            const newScore = isCorrect ? player.score + 1 : player.score;
            const newStreak = isCorrect ? player.streak + 1 : 0;
            const newTotalCorrect = isCorrect ? player.totalCorrect + 1 : player.totalCorrect;
            const newTotalIncorrect = !isCorrect ? player.totalIncorrect + 1 : player.totalIncorrect;
            
            return {
              ...player,
              score: newScore,
              hasAnswered: true,
              currentAnswer: answer,
              answerTime: timeTaken,
              streak: newStreak,
              totalCorrect: newTotalCorrect,
              totalIncorrect: newTotalIncorrect,
            };
          }
          return player;
        }),
      };

    case 'SET_TURN':
      return {
        ...state,
        currentPlayerTurn: action.payload,
      };

    case 'UPDATE_TIMER':
      return {
        ...state,
        timeRemaining: Math.max(0, action.payload),
      };

    case 'FINISH_GAME':
      return {
        ...state,
        status: 'finished',
        gameEndTime: Date.now(),
        winner: state.players.reduce((prev, current) => 
          (prev.score > current.score) ? prev : current
        ),
      };

    case 'RESET_GAME':
      return initialState;

    default:
      return state;
  }
};

// Context
interface GameContextType {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  
  // Game Actions
  startNewGame: () => void;
  addPlayer: (player: Omit<Player, 'score' | 'hasAnswered' | 'streak' | 'totalCorrect' | 'totalIncorrect'>) => void;
  findOpponent: () => Promise<void>;
  setCategory: (category: Category) => void;
  setQuestions: (questions: Question[]) => void;
  submitAnswer: (playerId: string, answer: string) => boolean;
  nextQuestion: () => void;
  resetGame: () => void;
  
  // Getters
  getCurrentQuestion: () => Question | null;
  getPlayerById: (id: string) => Player | null;
  getOpponent: () => Player | null;
  isGameFinished: () => boolean;
  getGameStats: () => any;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider Component
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);

  // Game Actions
  const startNewGame = () => {
    dispatch({ type: 'START_GAME' });
  };

  const addPlayer = (player: Omit<Player, 'score' | 'hasAnswered' | 'streak' | 'totalCorrect' | 'totalIncorrect'>) => {
    const newPlayer: Player = {
      ...player,
      score: 0,
      hasAnswered: false,
      streak: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
    };
    dispatch({ type: 'ADD_PLAYER', payload: newPlayer });
  };

  const findOpponent = async (): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    const opponent = createOpponent();
    dispatch({ type: 'ADD_PLAYER', payload: opponent });
  };

  const setCategory = (category: Category) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  };

  const setQuestions = (questions: Question[]) => {
    dispatch({ type: 'SET_QUESTIONS', payload: questions });
  };

  const submitAnswer = (playerId: string, answer: string): boolean => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;

    const isCorrect = answer === currentQuestion.respuestaCorrecta;
    const timeTaken = Date.now() - (gameState.gameStartTime || Date.now());
    
    dispatch({
      type: 'PLAYER_ANSWER',
      payload: {
        playerId,
        answer,
        isCorrect,
        timeTaken,
      },
    });

    return isCorrect;
  };

  const nextQuestion = () => {
    dispatch({ type: 'NEXT_QUESTION' });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  // Getters
  const getCurrentQuestion = (): Question | null => {
    if (gameState.questions.length === 0 || gameState.currentQuestion >= gameState.questions.length) {
      return null;
    }
    return gameState.questions[gameState.currentQuestion];
  };

  const getPlayerById = (id: string): Player | null => {
    return gameState.players.find(p => p.id === id) || null;
  };

  const getOpponent = (): Player | null => {
    // Return the first player that's not the current user (assuming user is first)
    return gameState.players.length > 1 ? gameState.players[1] : null;
  };

  const isGameFinished = (): boolean => {
    return gameState.status === 'finished';
  };

  const getGameStats = () => {
    const gameDuration = gameState.gameEndTime && gameState.gameStartTime 
      ? gameState.gameEndTime - gameState.gameStartTime 
      : 0;
    
    return {
      duration: gameDuration,
      totalQuestions: gameState.totalQuestions,
      winner: gameState.winner,
      players: gameState.players,
    };
  };

  // Auto-advance timer
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.timeRemaining > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'UPDATE_TIMER', payload: gameState.timeRemaining - 1 });
      }, 1000);

      return () => clearTimeout(timer);
    } else if (gameState.status === 'playing' && gameState.timeRemaining === 0) {
      // Time's up - auto advance
      setTimeout(() => {
        nextQuestion();
      }, 2000);
    }
  }, [gameState.timeRemaining, gameState.status]);

  // Simulate opponent answers
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.currentPlayerTurn && gameState.players.length > 1) {
      const currentQuestion = getCurrentQuestion();
      if (currentQuestion) {
        const opponent = getOpponent();
        if (opponent && !opponent.hasAnswered) {
          // Simulate opponent thinking time
          const { answer, time } = simulateOpponentAnswer(currentQuestion);
          
          setTimeout(() => {
            submitAnswer(opponent.id, answer);
          }, time);
        }
      }
    }
  }, [gameState.currentQuestion, gameState.status, gameState.currentPlayerTurn]);

  const contextValue: GameContextType = {
    gameState,
    dispatch,
    startNewGame,
    addPlayer,
    findOpponent,
    setCategory,
    setQuestions,
    submitAnswer,
    nextQuestion,
    resetGame,
    getCurrentQuestion,
    getPlayerById,
    getOpponent,
    isGameFinished,
    getGameStats,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Hook
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
