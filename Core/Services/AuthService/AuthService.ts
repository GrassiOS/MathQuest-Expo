import { AuthError, createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: AuthError | null;
}

class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }

  /**
   * Sign up a new user
   */
  async signUp({ email, password, username }: SignUpData): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        return { user: null, error };
      }

      const authUser: AuthUser = {
        id: data.user?.id || '',
        email: data.user?.email || '',
        username: data.user?.user_metadata?.username,
        avatar_url: data.user?.user_metadata?.avatar_url,
      };

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: error as AuthError 
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      const authUser: AuthUser = {
        id: data.user?.id || '',
        email: data.user?.email || '',
        username: data.user?.user_metadata?.username,
        avatar_url: data.user?.user_metadata?.avatar_url,
      };

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: error as AuthError 
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username,
        avatar_url: user.user_metadata?.avatar_url,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username,
          avatar_url: session.user.user_metadata?.avatar_url,
        };
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get the Supabase client (for advanced operations)
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }
}

export default new AuthService();
