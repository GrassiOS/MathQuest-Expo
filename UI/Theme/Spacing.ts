/**
 * Spacing System
 * Consistent spacing values for layouts and components
 */

export const Spacing = {
  // Base spacing unit (8px)
  base: 8,

  // Micro spacing (1-4px)
  xs: 4,
  sm: 8,
  
  // Small spacing (8-16px)
  md: 12,
  lg: 16,
  xl: 20,
  
  // Medium spacing (24-32px)
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  
  // Large spacing (48px+)
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
  
  // Screen margins
  screen: {
    horizontal: 20,
    vertical: 24,
  },
  
  // Component spacing
  component: {
    padding: 16,
    margin: 12,
    gap: 8,
  },
  
  // Card spacing
  card: {
    padding: 20,
    margin: 16,
    gap: 12,
  },
  
  // Button spacing
  button: {
    padding: {
      horizontal: 24,
      vertical: 16,
    },
    gap: 8,
  },
  
  // Form spacing
  form: {
    fieldGap: 16,
    labelMargin: 8,
    errorMargin: 4,
  },
  
  // Navigation spacing
  navigation: {
    headerHeight: 60,
    tabBarHeight: 80,
    padding: 16,
  },
  
  // Game UI spacing
  game: {
    questionMargin: 20,
    answerGap: 16,
    buttonGap: 12,
  },
} as const;

// Helper function to create consistent spacing
export const spacing = (multiplier: number = 1): number => Spacing.base * multiplier;

// Type definitions
export type SpacingKey = keyof typeof Spacing;
export type SpacingValue = number;
