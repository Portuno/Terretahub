import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { AppView, AuthUser } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check for session persistence on mount
  useEffect(() => {
    const session = localStorage.getItem('terreta_session');
    if (session) {
       const storedUsers = JSON.parse(localStorage.getItem('terreta_users') || '[]');
       const foundUser = storedUsers.find((u: any) => u.id === session);
       if (foundUser) {
          const { password: _, ...safeUser } = foundUser;
          setUser(safeUser);
       }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    localStorage.setItem('terreta_session', loggedInUser.id);
    setIsAuthModalOpen(false);
    setCurrentView('app'); // Redirect to app if logging in from landing
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('terreta_session');
    setCurrentView('landing');
  };

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage onEnterApp={() => setCurrentView('app')} />
      ) : (
        <Dashboard 
          user={user} 
          onOpenAuth={() => setIsAuthModalOpen(true)} 
          onLogout={handleLogout}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
