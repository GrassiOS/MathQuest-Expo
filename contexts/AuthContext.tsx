import AuthService, { AuthUser, SignInData, SignUpData } from '@/Core/Services/AuthService/AuthService';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ user: AuthUser | null; error: any }>;
  signIn: (data: SignInData) => Promise<{ user: AuthUser | null; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshSession: () => Promise<{ user: AuthUser | null; error: any }>;
  clearAuthData: () => Promise<void>;
  getUserStats: (userId: string) => Promise<{ gamesPlayed: number; wins: number; winRate: number }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user with improved session handling
    const getInitialUser = async () => {
      try {
        // Check if there's a valid session first
        const hasSession = await AuthService.hasValidSession();
        
        if (hasSession) {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting initial user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (data: SignUpData) => {
    try {
      setLoading(true);
      const result = await AuthService.signUp(data);
      return result;
    } catch (error) {
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      setLoading(true);
      const result = await AuthService.signIn(data);
      return result;
    } catch (error) {
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const result = await AuthService.signOut();
      return result;
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const result = await AuthService.resetPassword(email);
      return result;
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      setLoading(true);
      const result = await AuthService.refreshSession();
      if (result.user) {
        setUser(result.user);
      }
      return result;
    } catch (error) {
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      setLoading(true);
      await AuthService.clearAuthData();
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = async (userId: string) => {
    try {
      return await AuthService.getUserStats(userId);
    } catch (error) {
      return { gamesPlayed: 0, wins: 0, winRate: 0 };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession,
    clearAuthData,
    getUserStats,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
