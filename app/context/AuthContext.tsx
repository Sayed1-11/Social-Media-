// contexts/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, LoginCredentials, SignupCredentials, User } from '../types/auth';

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  getAuthHeaders: () => Promise<Record<string, string>>;
  searchUsers: (query: string) => Promise<User[]>;
  getSuggestedUsers: () => Promise<User[]>;
  completeInterests: (interests: string[]) => Promise<void>;
  completeProfile: (profileData: {
    bio?: string;
    website?: string;
    location?: string;
    profilePicture?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

// API Base URL - use your actual backend URL
const API_BASE_URL = 'http://localhost:3000'; // or your actual backend URL

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on app start
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const clearStorage = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  const checkExistingAuth = async (): Promise<void> => {
    try {
      console.log('🔍 Checking existing auth...');
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);
      
      console.log('📱 Storage check - Token:', !!token, 'UserData:', !!userData);
      
      if (token && userData) {
        const user = JSON.parse(userData);
        console.log('✅ User found:', user.email);
        
        // Verify token is still valid with backend
        try {
          const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const profileData = await response.json();
            setAuthState({
              user: profileData.user || user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token invalid, clear storage
            console.log('❌ Token validation failed, clearing storage');
            await clearStorage();
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('❌ Token validation failed:', error);
          await clearStorage();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        console.log('❌ No user found in storage');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      throw new Error('Authentication failed - Please login again');
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      if (!query.trim()) {
        return [];
      }

      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.users.map((user: any) => ({
          id: user._id || user.id,
          email: user.email,
          username: user.username || `user_${user._id || user.id}`,
          fullName: user.name || user.fullName || '',
          profilePicture: user.profilePicture,
          bio: user.bio,
          createdAt: user.createdAt,
        }));
      } else {
        throw new Error(data.message || 'Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  };

  const getSuggestedUsers = async (): Promise<User[]> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/users/suggested`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.users.map((user: any) => ({
          id: user._id || user.id,
          email: user.email,
          username: user.username || `user_${user._id || user.id}`,
          fullName: user.name || user.fullName || '',
          profilePicture: user.profilePicture,
          bio: user.bio,
          createdAt: user.createdAt,
        }));
      } else {
        throw new Error(data.message || 'Failed to get suggested users');
      }
    } catch (error) {
      console.error('Error getting suggested users:', error);
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      console.log('📤 Sending signup request...', { 
        ...credentials, 
        password: '[HIDDEN]' 
      });

      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: credentials.fullName,
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Signup failed: ${response.status}`);
      }

      console.log('✅ Signup successful');

      const user: User = {
        id: data.user.id || data.user._id,
        email: data.user.email,
        username: data.user.username || data.user.name.toLowerCase().replace(/\s+/g, '_'),
        fullName: data.user.name || credentials.fullName,
        profilePicture: data.user.profilePicture,
        bio: data.user.bio,
        createdAt: data.user.createdAt,
      };

      // Store in AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user)),
      ]);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

    } catch (error) {
      console.error('❌ Signup error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      console.log('📤 Sending login request...', { 
        ...credentials, 
        password: '[HIDDEN]' 
      });

      const response = await fetch(`${API_BASE_URL}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Login failed: ${response.status}`);
      }

      console.log('✅ Login successful');

      const user: User = {
        id: data.user.id || data.user._id,
        email: data.user.email,
        username: data.user.username || data.user.name.toLowerCase().replace(/\s+/g, '_'),
        fullName: data.user.name || data.user.fullName,
        profilePicture: data.user.profilePicture,
        bio: data.user.bio,
        createdAt: data.user.createdAt,
      };

      // Store in AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user)),
      ]);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Starting logout process...');
      
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      if (token) {
        // Call backend logout endpoint
        try {
          await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.warn('⚠️ Backend logout failed, continuing with client logout:', error);
        }
      }
      
      // Clear storage
      await clearStorage();
      
      // Update state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      if (authState.user) {
        const updatedUser = { ...authState.user, ...userData };
        setAuthState(prev => ({ ...prev, user: updatedUser }));
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // ✅ Correct - in AuthContext.tsx
const completeInterests = async (interests: string[]): Promise<void> => {
  try {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/user/interests`, {
      method: 'POST', // ✅ Matches your backend endpoint
      headers,
      body: JSON.stringify({ interests }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to save interests');
    }

    // ✅ Update user state with new interests
    if (authState.user && data.user) {
      const updatedUser = {
        ...authState.user,
        interests: data.user.interests,
        hasCompletedInterests: data.user.hasCompletedInterests,
      };
      
      setAuthState(prev => ({ 
        ...prev, 
        user: updatedUser,
        isLoading: false 
      }));
      
      // ✅ Update AsyncStorage
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }

  } catch (error) {
    console.error('Error saving interests:', error);
    setAuthState(prev => ({ ...prev, isLoading: false }));
    throw error;
  }
};

  const completeProfile = async (profileData: {
    bio?: string;
    website?: string;
    location?: string;
    profilePicture?: string;
  }): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update user in state and storage
      if (authState.user) {
        const updatedUser = {
          ...authState.user,
          ...profileData,
        };
        
        setAuthState(prev => ({ 
          ...prev, 
          user: updatedUser,
          isLoading: false 
        }));
        
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    updateUser,
    getAuthHeaders,
    searchUsers,
    getSuggestedUsers,
    completeInterests,
    completeProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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