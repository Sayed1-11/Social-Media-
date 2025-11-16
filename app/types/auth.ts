// types/auth.ts
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  isProfileComplete?: boolean; // Changed from false to boolean
  coverPhoto?: string;
  bio?: string;
  website?: string; // Add this
  location?: string; // Add this
  interests?: string[]; // Add this
  createdAt: string;
  postsCount?: number;
  friendsCount?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  bio?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Optional: Add these types for better organization
export interface ProfileUpdateData {
  bio?: string;
  website?: string;
  location?: string;
  profilePicture?: string;
  coverPhoto?: string;
}

export interface CompleteProfileData extends ProfileUpdateData {
  interests?: string[];
}