'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/session';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();

  const [isChecking, setIsChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
    const checkAuth = () => {
      if (!isLoggedIn()) {
        router.replace('/auth/login'); 
        return;
      }

    setAuthorized(true);
    setIsChecking(false);
    };

    checkAuth();
  }, [router]);

   if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
