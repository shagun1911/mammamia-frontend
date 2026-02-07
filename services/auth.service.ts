import { apiClient } from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  isAdmin?: boolean;
  organizationId: string;
  status: string;
  createdAt: string;
  // Onboarding fields
  phone?: string;
  companyName?: string;
  companyWebsite?: string;
  vat?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  onboardingCompleted?: boolean;
  // Subscription fields (activated ONLY via WooCommerce webhook)
  subscription?: {
    plan: string;
    limits: {
      conversations: number;
      minutes: number;
      automations: number;
    };
    usage: {
      conversations: number;
      minutes: number;
      automations: number;
    };
    activatedAt?: string | null;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;  // Backend returns 'token' not 'accessToken'
    refreshToken: string;
  };
}

/**
 * Authentication Service
 * Handles login, logout, token management, and user authentication
 */
class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response: AuthResponse = await apiClient.post('/auth/login', credentials);
      
      const { user, token, refreshToken } = response.data;

      // Store tokens and user in localStorage
      this.storeTokens(token, refreshToken);
      this.storeUser(user);

      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Signup new user
   */
  async signup(data: SignupData): Promise<User> {
    try {
      const response: AuthResponse = await apiClient.post('/auth/signup', data);
      
      const { user, token, refreshToken } = response.data;

      // Store tokens and user in localStorage
      this.storeTokens(token, refreshToken);
      this.storeUser(user);

      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage regardless of API response
      this.clearStorage();
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/auth/me');
      console.log('📦 /auth/me response:', response);
      
      // Handle different response formats from backend
      const user = response.data?.user || response.data;
      
      if (!user || !user.id) {
        console.error('❌ Invalid user data received:', response.data);
        throw new Error('Invalid user data received from server');
      }
      
      console.log('✅ User data parsed successfully:', user);
      return user;
    } catch (error: any) {
      console.error('❌ getCurrentUser error:', error);
      throw new Error(error.message || 'Failed to get user');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/refresh', { refreshToken });
      
      const { token, refreshToken: newRefreshToken } = response.data.data;

      // Store new tokens
      this.storeTokens(token, newRefreshToken);

      return { accessToken: token, refreshToken: newRefreshToken };
    } catch (error: any) {
      // Clear storage and redirect to login
      this.clearStorage();
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change password');
    }
  }

  /**
   * Delete user account and all related data
   */
  async deleteAccount(): Promise<void> {
    try {
      await apiClient.delete('/auth/account');
      // Clear storage after successful deletion
      this.clearStorage();
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Store user in localStorage
   */
  private storeUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Clear all stored data
   */
  private clearStorage(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

// Export singleton instance
export const authService = new AuthService();

