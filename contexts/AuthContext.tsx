'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/services/auth.service';
import { socketClient } from '@/lib/socket';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // ✅ ADD THIS (for Google / OAuth login)
  setAuthFromOAuth: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 Initializing auth...');
      try {
        const isAuth = authService.isAuthenticated();
        console.log('🔐 Has token:', isAuth);

        // Check if we're returning from an OAuth callback (Gmail, Meta, etc.)
        // In this case, preserve the user session even if getCurrentUser fails
        const isOAuthCallback = typeof window !== 'undefined' && 
          (window.location.search.includes('success=true') || 
           window.location.search.includes('error=') ||
           window.location.search.includes('platform='));

        if (isAuth) {
          const storedUser = authService.getStoredUser();
          console.log('🔐 Stored user:', storedUser ? 'Found' : 'Not found');

          if (storedUser) {
            setUser(storedUser);
            console.log('🔐 User restored from storage');
          }

          try {
            console.log('🔐 Fetching fresh user data...');
            const currentUser = await authService.getCurrentUser();

            if (currentUser && currentUser.id) {
              setUser(currentUser);
              localStorage.setItem('user', JSON.stringify(currentUser));
              console.log('🔐 Fresh user data fetched and stored successfully');
            } else {
              console.warn('⚠️ API returned invalid user data, keeping stored user');
            }
          } catch (error: any) {
            console.error('❌ Failed to fetch current user:', error);

            // If we're returning from OAuth callback, preserve the session
            // The user is still authenticated, just the API call might have failed temporarily
            if (isOAuthCallback && storedUser) {
              console.log('🔐 OAuth callback detected - preserving user session');
              // Keep the stored user, don't log out
            } else if (!storedUser) {
              // Only log out if we don't have a stored user AND it's not an OAuth callback
              if (error.status === 401 || error.message?.includes('401')) {
                console.log('🔐 No stored user and 401 error - logging out');
                authService.logout();
                setUser(null);
              }
            }
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user (email/password)
   */
  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      try {
        setLoading(true);
        const user = await authService.login({ email, password });
        setUser(user);
        return user;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * ✅ ADD THIS FUNCTION
   * Used after Google / OAuth login
   * Updates context immediately (no refresh needed)
   */
  const setAuthFromOAuth = useCallback((user: User) => {
    console.log('🔐 Setting auth from OAuth');
    setUser(user);
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      socketClient.disconnect();
      await authService.logout();
      setUser(null);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  /**
   * Refresh current user data
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,

      // ✅ expose new method
      setAuthFromOAuth,
    }),
    [user, loading, login, logout, refreshUser, setAuthFromOAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
