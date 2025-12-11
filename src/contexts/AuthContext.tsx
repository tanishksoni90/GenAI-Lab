import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, User, AuthTokens, LoginCredentials, RegisterData, ApiError, setCurrentAuthRole } from '@/lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationDone, setMigrationDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Store tokens in localStorage (role-specific)
  const saveTokens = (tokens: AuthTokens, role: 'admin' | 'student') => {
    localStorage.setItem(`${role}_accessToken`, tokens.accessToken);
    localStorage.setItem(`${role}_refreshToken`, tokens.refreshToken);
    setCurrentAuthRole(role);
  };

  // Clear tokens from localStorage (role-specific)
  const clearTokens = (role: 'admin' | 'student') => {
    localStorage.removeItem(`${role}_accessToken`);
    localStorage.removeItem(`${role}_refreshToken`);
  };

  // Determine if path is for admin or student
  const isAdminPath = location.pathname.startsWith('/admin');

  // Migrate old token format to new role-specific format (one-time migration)
  // This runs FIRST before auth check
  useEffect(() => {
    const migrateTokens = () => {
      const oldAccessToken = localStorage.getItem('accessToken');
      const oldRefreshToken = localStorage.getItem('refreshToken');
      
      if (oldAccessToken && oldRefreshToken) {
        try {
          // Decode JWT to get the role (JWT payload is base64 encoded)
          const payload = JSON.parse(atob(oldAccessToken.split('.')[1]));
          const tokenRole = payload.role as 'admin' | 'student';
          
          // Only migrate if new format doesn't already exist
          if (!localStorage.getItem(`${tokenRole}_accessToken`)) {
            localStorage.setItem(`${tokenRole}_accessToken`, oldAccessToken);
            localStorage.setItem(`${tokenRole}_refreshToken`, oldRefreshToken);
          }
        } catch (e) {
          // If decoding fails, just clear old tokens
        }
        
        // Remove old format tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      setMigrationDone(true);
    };
    
    migrateTokens();
  }, []);

  // Check if user is authenticated on mount and when path changes between admin/student
  useEffect(() => {
    // Wait for migration to complete
    if (!migrationDone) return;

    const initAuth = async () => {
      setIsLoading(true);
      const role = isAdminPath ? 'admin' : 'student';
      const token = localStorage.getItem(`${role}_accessToken`);
      
      if (token) {
        try {
          // Set the role for API calls
          setCurrentAuthRole(role);
          const response = await authApi.getProfile();
          setUser(response.data.user);
        } catch (err) {
          // Token invalid or expired
          clearTokens(role);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [migrationDone, isAdminPath]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      const userRole = response.data.user.role as 'admin' | 'student';
      const mustChangePassword = response.data.mustChangePassword;
      
      // Save tokens with the user's actual role
      saveTokens(response.data.tokens, userRole);
      
      // Clear ALL cached data from previous user before setting new user
      queryClient.clear();
      
      setUser(response.data.user);
      
      // Check if user must change password (only for students after admin reset)
      if (mustChangePassword && userRole === 'student') {
        navigate('/student/set-new-password');
        return;
      }
      
      // Navigate based on role
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, queryClient]);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(data);
      // Students register, so always use 'student' role
      saveTokens(response.data.tokens, 'student');
      
      // Clear ALL cached data before setting new user
      queryClient.clear();
      
      setUser(response.data.user);
      navigate('/student/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, queryClient]);

  const logout = useCallback(() => {
    // Get user role before clearing
    const wasAdmin = user?.role === 'admin';
    const role = wasAdmin ? 'admin' : 'student';
    
    clearTokens(role);
    setUser(null);
    // Clear ALL cached data on logout
    queryClient.clear();
    
    // Redirect based on role
    if (wasAdmin) {
      navigate('/admin/signin');
    } else {
      navigate('/');
    }
  }, [navigate, queryClient, user?.role]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      setUser(response.data.user);
    } catch (err) {
      // If refresh fails, logout
      logout();
    }
  }, [logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

