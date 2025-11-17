import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, UserResponse } from '../services/api';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (userData: UserResponse) => void;
  logout: () => Promise<void>;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const currentUser = authAPI.getCurrentUser();
    const isAuthenticated = authAPI.isAuthenticated();

    if (isAuthenticated && currentUser) {
      setUser(currentUser);
    }

    setLoading(false);
  }, []);

  const login = (userData: UserResponse) => {
    setUser(userData);
  };

  const logout = async () => {
    // Clear all auth data from localStorage and call backend
    await authAPI.logout();

    // Clear user state
    setUser(null);

    // Redirect to auth page will happen via Navigation component
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
