'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth methods
 */
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
        
        // Check if user is already authenticated
        if (isAuth) {
          // Get stored user and set it immediately
          const storedUser = authService.getStoredUser();
          console.log('🔐 Stored user:', storedUser ? 'Found' : 'Not found');
          
          if (storedUser) {
            setUser(storedUser);
            console.log('🔐 User restored from storage');
          }

          try {
            // Try to fetch fresh user data from API in the background
            console.log('🔐 Fetching fresh user data...');
            const currentUser = await authService.getCurrentUser();
            
            if (currentUser && currentUser.id) {
              setUser(currentUser);
              // Store the fresh user data
              localStorage.setItem('user', JSON.stringify(currentUser));
              console.log('🔐 Fresh user data fetched and stored successfully');
            } else {
              console.warn('⚠️ API returned invalid user data, keeping stored user');
            }

            // Socket connection temporarily disabled
            // Connect socket (optional - don't fail if WebSocket not available)
            // try {
            //   const token = authService.getAccessToken();
            //   if (token) {
            //     socketClient.connect(token);
            //   }
            // } catch (error) {
            //   console.warn('WebSocket connection failed (non-critical):', error);
            // }
          } catch (error: any) {
            console.error('❌ Failed to fetch current user:', error);
            
            // If we have a stored user, keep using it even if API fails
            // This prevents logout on temporary network issues
            if (!storedUser) {
              console.log('❌ No stored user, clearing auth');
              // Only clear if we don't have any stored user data
              if (error.status === 401 || error.message?.includes('401')) {
                authService.logout();
                setUser(null);
              }
            } else {
              console.log('✅ Using stored user despite API error');
            }
          } finally {
            // Always set loading to false after auth check completes
            setLoading(false);
          }
        } else {
          // No token found, user is not authenticated
          console.log('🔐 No token found');
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
   * Login user
   */
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      const user = await authService.login({ email, password });
      setUser(user);

      // Socket connection temporarily disabled
      // Connect socket (optional - don't fail if WebSocket not available)
      // try {
      //   const token = authService.getAccessToken();
      //   if (token) {
      //     socketClient.connect(token);
      //   }
      // } catch (error) {
      //   console.warn('WebSocket connection failed (non-critical):', error);
      // }

      // Return user for redirect logic
      return user;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Disconnect socket
      socketClient.disconnect();

      // Call logout API and clear storage
      await authService.logout();
      
      setUser(null);
      
      // Redirect to login
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
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
    }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

