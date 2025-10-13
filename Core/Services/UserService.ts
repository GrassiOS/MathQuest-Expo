/**
 * User Service
 * Handles user profile management, statistics, and preferences
 */

import { Avatar } from '../../Data/Models/avatar';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: Avatar;
  level: number;
  score: number;
  gamesPlayed: number;
  winRate: number;
  achievements: Achievement[];
  preferences: UserPreferences;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

export interface UserPreferences {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface HighScore {
  mode: number; // minutes
  score: number;
  accuracy: number;
  questionsAnswered: number;
  timestamp: Date;
}

class UserService {
  private currentUser: UserProfile | null = null;
  private highScores: HighScore[] = [];

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    this.currentUser = { ...this.currentUser, ...updates };
    
    // TODO: Persist to storage/database
    await this.saveUserProfile();
    
    return this.currentUser;
  }

  async updateAvatar(avatar: Avatar): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    this.currentUser.avatar = avatar;
    await this.saveUserProfile();
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    this.currentUser.preferences = { ...this.currentUser.preferences, ...preferences };
    await this.saveUserProfile();
  }

  async addHighScore(highScore: Omit<HighScore, 'timestamp'>): Promise<void> {
    const newHighScore: HighScore = {
      ...highScore,
      timestamp: new Date(),
    };

    this.highScores.push(newHighScore);
    
    // Keep only top 10 scores per mode
    this.highScores = this.highScores
      .sort((a, b) => b.score - a.score)
      .filter((score, index, array) => 
        array.filter(s => s.mode === score.mode).indexOf(score) < 10
      );

    // TODO: Persist to storage
    await this.saveHighScores();
  }

  async getTopScores(mode: number, limit: number = 10): Promise<HighScore[]> {
    return this.highScores
      .filter(score => score.mode === mode)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async unlockAchievement(achievementId: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    const achievement = this.currentUser.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlockedAt) {
      achievement.unlockedAt = new Date();
      achievement.progress = achievement.maxProgress;
      
      await this.saveUserProfile();
    }
  }

  async updateAchievementProgress(achievementId: string, progress: number): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    const achievement = this.currentUser.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlockedAt) {
      achievement.progress = Math.min(progress, achievement.maxProgress);
      
      if (achievement.progress >= achievement.maxProgress) {
        await this.unlockAchievement(achievementId);
      } else {
        await this.saveUserProfile();
      }
    }
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  getAllHighScores(): HighScore[] {
    return [...this.highScores];
  }

  private async saveUserProfile(): Promise<void> {
    // TODO: Implement storage persistence
    console.log('Saving user profile:', this.currentUser);
  }

  private async saveHighScores(): Promise<void> {
    // TODO: Implement storage persistence
    console.log('Saving high scores:', this.highScores);
  }
}

export const userService = new UserService();
