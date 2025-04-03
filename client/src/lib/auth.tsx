import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const res = await fetch('/api/user', {
          credentials: 'include'
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          
          // Redirect based on role if already logged in
          if (userData.role === 'student') {
            navigate('/student-dashboard');
          } else if (userData.role === 'admin') {
            navigate('/admin-dashboard');
          }
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string, remember: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/login', { username, password });
      const userData = await res.json();
      setUser(userData);

      // Redirect based on role
      if (userData.role === 'student') {
        navigate('/student-dashboard');
      } else if (userData.role === 'admin') {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid username or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/logout', {});
      setUser(null);
      navigate('/');
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: error instanceof Error ? error.message : 'Failed to log out',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
