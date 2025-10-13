/**
 * Authentication Service
 * Handles user authentication, login, logout, and session management
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: any;
  level: number;
  score: number;
  gamesPlayed: number;
  winRate: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false,
  };

  async signIn(email: string, password: string): Promise<User> {
    this.authState.loading = true;
    
    try {
      // TODO: Implement actual authentication logic
      // This is a placeholder implementation
      const user: User = {
        id: '1',
        name: 'GRASSYOG',
        email,
        avatar: {},
        level: 5,
        score: 1,
        gamesPlayed: 23,
        winRate: 78,
      };
      
      this.authState.user = user;
      this.authState.isAuthenticated = true;
      
      return user;
    } finally {
      this.authState.loading = false;
    }
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    this.authState.loading = true;
    
    try {
      // TODO: Implement actual registration logic
      const user: User = {
        id: Date.now().toString(),
        name,
        email,
        avatar: {},
        level: 1,
        score: 0,
        gamesPlayed: 0,
        winRate: 0,
      };
      
      this.authState.user = user;
      this.authState.isAuthenticated = true;
      
      return user;
    } finally {
      this.authState.loading = false;
    }
  }

  async signOut(): Promise<void> {
    this.authState.user = null;
    this.authState.isAuthenticated = false;
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  isUserAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }
}

export const authService = new AuthService();
