/**
 * Core Services Exports
 * Centralized exports for core services and utilities
 */

// Services
export { authService } from './Services/AuthService';
export { gameService } from './Services/GameService';
export { userService } from './Services/UserService';

// Service Types
export type { AuthState, User } from './Services/AuthService';
export type { GameSession, GameStats, Player } from './Services/GameService';
export type { Achievement, HighScore, UserProfile } from './Services/UserService';

// Contexts (Legacy - to be migrated)
export { AvatarProvider, useAvatar } from './Services/AvatarContext';
export { GameProvider, useGame } from './Services/GameContext';
export { OfflineStorageProvider, useOfflineStorage } from './Services/OfflineStorageContext';

