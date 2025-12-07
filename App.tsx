import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { PublicLinkBio } from './components/PublicLinkBio';
import { PublicProject } from './components/PublicProject';
import { NotFound404 } from './components/NotFound404';
import { AuthUser } from './types';
import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const navigate = useNavigate();

  // Función helper para cargar el perfil del usuario
  const loadUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[App] Error al cargar perfil:', profileError);
        return null;
      }

      if (profile) {
        return {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          role: (profile.role as 'normal' | 'admin') || 'normal',
        };
      }
      return null;
    } catch (err) {
      console.error('[App] Error en loadUserProfile:', err);
      return null;
    }
  };

  // Check for session persistence on mount
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        console.log('[App] Checking session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[App] Error al obtener sesión:', sessionError);
          if (isMounted) {
            setIsLoadingSession(false);
            setUser(null);
          }
          return;
        }
        
        if (session?.user) {
          console.log('[App] Session found, loading profile...', { userId: session.user.id });
          const loadedUser = await loadUserProfile(session.user.id);
          if (isMounted) {
            setUser(loadedUser);
            setIsLoadingSession(false);
            console.log('[App] Session restored', { hasUser: !!loadedUser });
          }
        } else {
          console.log('[App] No session found');
          if (isMounted) {
            setUser(null);
            setIsLoadingSession(false);
          }
        }
      } catch (err) {
        console.error('[App] Error en checkSession:', err);
        if (isMounted) {
          setIsLoadingSession(false);
          setUser(null);
        }
      }
    };

    checkSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[App] Auth state changed', { event, hasSession: !!session });
      
      try {
        if (event === 'SIGNED_OUT' || !session) {
          console.log('[App] User signed out');
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            console.log('[App] User signed in or token refreshed, loading profile...', { userId: session.user.id });
            const loadedUser = await loadUserProfile(session.user.id);
            setUser(loadedUser);
            console.log('[App] User profile loaded', { hasUser: !!loadedUser });
          }
        }
      } catch (err) {
        console.error('[App] Error en onAuthStateChange:', err);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setIsAuthModalOpen(false);
    navigate('/app');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleEnterApp = () => {
    // Permitir acceso a /app sin necesidad de estar logueado
    navigate('/app');
  };

  // Mostrar loading mientras se verifica la sesión
  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97706] mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage onEnterApp={handleEnterApp} />} 
        />
        <Route 
          path="/app" 
          element={
            <Dashboard 
              user={user} 
              onOpenAuth={() => setIsAuthModalOpen(true)} 
              onLogout={handleLogout}
            />
          } 
        />
        <Route 
          path="/p/:extension" 
          element={<PublicLinkBio />} 
        />
        <Route 
          path="/proyecto/:slug" 
          element={<PublicProject />} 
        />
        <Route 
          path="*" 
          element={<NotFound404 variant="generic" />} 
        />
      </Routes>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      
      <Analytics />
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
