/**
 * Game Feature Exports
 * Centralized exports for the Game feature
 */

// Screens
export { default as GameResultsScreen } from './Screens/GameResultsScreen';
export { default as InfiniteGameScreen } from './Screens/InfiniteGameScreen';
export { default as MatchmakingScreen } from './Screens/MatchmakingScreen';
export { default as OnlineGameScreen } from './Screens/OnlineGameScreen';
export { default as PlayScreen } from './Screens/PlayScreen';
export { default as QuizScreen } from './Screens/QuizScreen';
export { default as RouletteScreen } from './Screens/RouletteScreen';

// ViewModels
export { useGameViewModel } from './ViewModels/GameViewModel';
export type { GameViewModelState } from './ViewModels/GameViewModel';

// Models
export type { GameSession, GameStats, Player } from '../../../Core/Services/GameService';

