/**
 * Custom hook for authentication
 * Provides auth state and utilities for protected components
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUserData, logout, AuthUser } from '@/app/middleware/auth';

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuth: boolean;
  logout: () => void;
}

export function useAuth(redirectIfNotAuth: boolean = false): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);

      if (authenticated) {
        const userData = getUserData();
        setUser(userData);
      } else if (redirectIfNotAuth) {
        router.push('/auth/login');
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [redirectIfNotAuth, router]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsAuth(false);
    router.push('/auth/login');
  };

  return {
    user,
    isLoading,
    isAuth,
    logout: handleLogout,
  };
}
