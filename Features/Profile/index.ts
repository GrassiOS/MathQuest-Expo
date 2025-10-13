/**
 * Profile Feature Exports
 * Centralized exports for the Profile feature
 */

// Screens
export { default as AvatarCustomizationScreen } from './Screens/AvatarCustomizationScreen';
export { default as ProfileScreen } from './Screens/ProfileScreen';

// ViewModels
export { useProfileViewModel } from './ViewModels/ProfileViewModel';
export type { ProfileViewModelState } from './ViewModels/ProfileViewModel';

// Models
export type { Achievement, HighScore, UserProfile } from '../../../Core/Services/UserService';

