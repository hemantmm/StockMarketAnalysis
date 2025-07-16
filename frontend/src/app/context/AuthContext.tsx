'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: { username: string }) => void;
  logout: () => void;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      const username = localStorage.getItem('username');
      const userId = localStorage.getItem('userId');

      if (token && email) {
        // Token exists, set user as authenticated
        setUser({
          id: userId || username || 'user1', // Use stored userId, username, or default
          username: username || email.split('@')[0],
          email
        });
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: { username: string }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('userId', userData.username); // Use username as userId for simplicity

    setUser({
      id: userData.username,
      username: userData.username,
      email: localStorage.getItem('email') || ''
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setUser(null);
    router.push('/');
  };

  // Helper function to check auth and redirect if needed
  const requireAuth = () => {
    if (!isLoading && !user) {
      router.push('/Login');
      return false;
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        requireAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
