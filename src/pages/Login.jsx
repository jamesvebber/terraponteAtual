import React, { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { navigateToLogin } = useAuth();

  useEffect(() => {
    // Only trigger if not already explicitly on this page with a from_url of itself
    const params = new URLSearchParams(window.location.search);
    if (!params.get('from_url')?.includes('/login')) {
      navigateToLogin();
    }
  }, [navigateToLogin]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-bold text-foreground mb-2">Redirecionando...</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Estamos te levando para a página de login com segurança.
      </p>
    </div>
  );
}
