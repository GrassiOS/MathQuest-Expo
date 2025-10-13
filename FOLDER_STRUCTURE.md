# MathQuest - Folder Structure Documentation

This document outlines the new iOS-style folder structure for the MathQuest React Native/Expo app, following modern development best practices.

## 📁 Root Structure

```
MathQuest-Expo/
├── Features/                 # Feature-based organization
├── Core/                     # Core services and utilities
├── UI/                       # Shared UI components and theming
├── Resources/               # Assets, fonts, and static resources
├── Data/                    # Data models and repositories
├── app/                     # Expo Router screens (legacy)
├── components/              # Legacy components (to be migrated)
├── contexts/                # Legacy contexts (to be migrated)
├── types/                   # Legacy types (to be migrated)
├── utils/                   # Legacy utilities (to be migrated)
├── constants/               # Legacy constants (to be migrated)
├── data/                    # Legacy data (to be migrated)
└── assets/                  # Legacy assets (to be migrated)
```

## 🎯 Features/ - Feature-Based Organization

Each feature is self-contained with its own screens, ViewModels, and models.

```
Features/
├── Authentication/
│   ├── Screens/
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   ├── ViewModels/
│   │   └── AuthViewModel.ts
│   └── Models/
│       └── User.ts
├── Game/
│   ├── Screens/
│   │   ├── PlayScreen.tsx
│   │   ├── OnlineGameScreen.tsx
│   │   ├── InfiniteGameScreen.tsx
│   │   ├── MatchmakingScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   ├── RouletteScreen.tsx
│   │   └── GameResultsScreen.tsx
│   ├── ViewModels/
│   │   └── GameViewModel.ts
│   └── Models/
│       ├── GameSession.ts
│       ├── Player.ts
│       └── Question.ts
├── Profile/
│   ├── Screens/
│   │   ├── ProfileScreen.tsx
│   │   └── AvatarCustomizationScreen.tsx
│   ├── ViewModels/
│   │   └── ProfileViewModel.ts
│   └── Models/
│       ├── UserProfile.ts
│       ├── Achievement.ts
│       └── HighScore.ts
└── Settings/
    ├── Screens/
    │   ├── SettingsScreen.tsx
    │   └── PreferencesScreen.tsx
    ├── ViewModels/
    │   └── SettingsViewModel.ts
    └── Models/
        └── UserPreferences.ts
```

## 🔧 Core/ - Core Services and Utilities

Centralized business logic and infrastructure.

```
Core/
├── Services/
│   ├── AuthService.ts           # Authentication logic
│   ├── GameService.ts           # Game management
│   ├── UserService.ts           # User profile management
│   ├── AvatarContext.tsx        # Avatar state management
│   ├── GameContext.tsx          # Game state management
│   └── OfflineStorageContext.tsx # Local storage
├── Networking/
│   ├── API/
│   │   ├── client.ts            # HTTP client configuration
│   │   ├── endpoints.ts         # API endpoints
│   │   └── types.ts             # API response types
│   └── WebSocket/
│       ├── client.ts            # WebSocket client
│       └── handlers.ts          # Message handlers
├── Utils/
│   ├── generateQuestions.ts     # Question generation
│   ├── getRandomQuestions.ts    # Random question utilities
│   ├── storage.ts               # Storage utilities
│   ├── validation.ts            # Input validation
│   └── helpers.ts               # General utilities
├── Storage/
│   ├── AsyncStorage.ts          # AsyncStorage wrapper
│   ├── SecureStorage.ts         # Secure storage for sensitive data
│   └── CacheManager.ts          # Caching utilities
└── Analytics/
    ├── events.ts                # Analytics event definitions
    ├── tracker.ts               # Analytics tracking
    └── providers.ts             # Analytics providers
```

## 🎨 UI/ - Shared UI Components and Theming

Reusable components and design system.

```
UI/
├── Components/
│   ├── Buttons/
│   │   ├── PrimaryButton.tsx
│   │   ├── SecondaryButton.tsx
│   │   ├── IconButton.tsx
│   │   └── FloatingActionButton.tsx
│   ├── Forms/
│   │   ├── InputField.tsx
│   │   ├── SelectField.tsx
│   │   ├── ToggleField.tsx
│   │   └── FormContainer.tsx
│   ├── Navigation/
│   │   ├── TabBar.tsx
│   │   ├── Header.tsx
│   │   └── Drawer.tsx
│   ├── Game/
│   │   ├── GameModeButton.tsx
│   │   ├── InfiniteGameModeButton.tsx
│   │   ├── QuestionCard.tsx
│   │   └── ScoreDisplay.tsx
│   ├── LayeredAvatar.tsx
│   ├── AnimatedMathBackground.tsx
│   ├── collapsible.tsx
│   ├── icon-symbol.ios.tsx
│   ├── icon-symbol.tsx
│   ├── haptic-tab.tsx
│   ├── hello-wave.tsx
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   └── themed-view.tsx
├── Modifiers/
│   ├── animations.ts            # Animation modifiers
│   ├── shadows.ts               # Shadow modifiers
│   └── gradients.ts             # Gradient modifiers
├── Theme/
│   ├── Colors.ts                # Color system
│   ├── Fonts.ts                 # Typography system
│   ├── Spacing.ts               # Spacing system
│   ├── avatarAssets.ts          # Avatar configuration
│   └── theme.ts                 # Main theme configuration
└── Animations/
    ├── transitions.ts            # Screen transitions
    ├── gestures.ts               # Gesture animations
    └── lottie.ts                 # Lottie animation helpers
```

## 📦 Resources/ - Assets and Static Resources

All static resources organized by type.

```
Resources/
├── Assets/
│   ├── Icons/
│   │   ├── app-icon.png
│   │   └── favicon.png
│   ├── Lotties/
│   │   ├── extras/
│   │   │   ├── Confetti_quick.json
│   │   │   ├── lupa.json
│   │   │   └── success confetti.json
│   │   └── mascots/
│   │       ├── Dividin/
│   │       ├── Plusito/
│   │       ├── Porfix/
│   │       ├── Restin/
│   │       └── Totalin/
│   └── Sounds/
│       ├── correct.mp3
│       ├── incorrect.mp3
│       └── background.mp3
├── Strings/
│   ├── en.json                  # English translations
│   ├── es.json                  # Spanish translations
│   └── index.ts                 # String utilities
├── Fonts/
│   ├── Digitalt.otf
│   └── Gilroy-Black.ttf
└── Images/
    ├── Avatars/
    │   └── default-avatar.png
    ├── GameUI/
    │   └── competitive/
    │       └── 1v1_roulette.png
    └── Backgrounds/
        ├── gradient-bg.png
        └── pattern-bg.png
```

## 💾 Data/ - Data Models and Repositories

Data layer with models and repositories.

```
Data/
├── Models/
│   ├── User/
│   │   ├── User.ts
│   │   ├── UserProfile.ts
│   │   └── Achievement.ts
│   ├── Game/
│   │   ├── GameSession.ts
│   │   ├── Player.ts
│   │   └── Question.ts
│   ├── Category.ts
│   ├── question.ts
│   └── avatar.ts
├── Repositories/
│   ├── UserRepository.ts        # User data operations
│   ├── GameRepository.ts        # Game data operations
│   └── QuestionRepository.ts    # Question data operations
└── Static/
    ├── categories.ts            # Static category data
    ├── lotties.ts               # Lottie animation configs
    └── questions.ts             # Static question data
```

## 🚀 Migration Guide

### Phase 1: Update Imports
1. Update all import statements to use new paths
2. Update TypeScript path mappings in `tsconfig.json`

### Phase 2: Move Legacy Files
1. Move remaining files from legacy folders to new structure
2. Update component exports and imports

### Phase 3: Clean Up
1. Remove empty legacy folders
2. Update documentation
3. Update build scripts if needed

## 📋 Best Practices

### File Naming
- **Screens**: `ScreenNameScreen.tsx` (e.g., `PlayScreen.tsx`)
- **ViewModels**: `FeatureNameViewModel.ts` (e.g., `GameViewModel.ts`)
- **Components**: `ComponentName.tsx` (e.g., `PrimaryButton.tsx`)
- **Services**: `ServiceNameService.ts` (e.g., `AuthService.ts`)
- **Models**: `ModelName.ts` (e.g., `User.ts`)

### Import Organization
```typescript
// 1. React and React Native imports
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party imports
import { LinearGradient } from 'expo-linear-gradient';

// 3. Internal imports (Features first, then Core, then UI)
import { useGameViewModel } from '../../Features/Game/ViewModels/GameViewModel';
import { gameService } from '../../../Core/Services/GameService';
import { PrimaryButton } from '../../../UI/Components/Buttons/PrimaryButton';
```

### Component Structure
```typescript
// 1. Imports
// 2. Types and interfaces
// 3. Component definition
// 4. Styles
// 5. Export
```

## 🔄 Future Enhancements

1. **Swift Packages**: Consider modularizing features into separate packages
2. **Testing**: Add comprehensive test coverage for each layer
3. **Documentation**: Generate API documentation with tools like TypeDoc
4. **Code Generation**: Implement code generation for repetitive patterns
5. **Performance**: Add performance monitoring and optimization tools

---

This structure follows iOS development best practices while adapting them for React Native/Expo development. It promotes maintainability, scalability, and team collaboration.
