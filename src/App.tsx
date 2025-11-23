import { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { CrashGame } from './components/games/CrashGame';
import { MinesGame } from './components/games/MinesGame';
import { SlotsGame } from './components/games/SlotsGame';
import { DiceGame } from './components/games/DiceGame';
import { Profile } from './components/Profile';
import { Wallet } from './components/Wallet';
import { Messages } from './components/Messages';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { PolicyPage } from './components/PolicyPage';
import { Footer } from './components/Footer';
import { Fairness } from './components/Fairness';
import { initializeStorage } from './utils/storageMongo';
import { authAPI } from './utils/api';
import { Toaster } from './components/ui/sonner';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  demoPoints: number;
  realBalance: number;
  isAdmin: boolean;
  createdAt: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  lastDailySpin?: string;
};

export type Page = 'landing' | 'auth' | 'login' | 'register' | 'dashboard' | 'crash' | 'mines' | 'slots' | 'dice' | 'profile' | 'wallet' | 'messages' | 'admin' | 'admin-login' | 'fairness' | 'terms' | 'privacy' | 'responsible';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize storage on app load
    initializeStorage();
    
    // Check for existing session via API
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('kachaTaka_token');
        if (token) {
          const response = await authAPI.getCurrentUser();
          if (response.user) {
            setCurrentUser(response.user);
            // Route to appropriate page based on user type
            if (response.user.isAdmin) {
              setCurrentPage('admin');
            } else {
              setCurrentPage('dashboard');
            }
          }
        }
      } catch (error) {
        // Token invalid or expired, clear it
        localStorage.removeItem('kachaTaka_token');
        localStorage.removeItem('kachaTaka_currentUser');
      }
    };
    
    checkSession();
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleLogin = (user: User, token?: string) => {
    setCurrentUser(user);
    if (token) {
      localStorage.setItem('kachaTaka_token', token);
    }
    localStorage.setItem('kachaTaka_currentUser', JSON.stringify(user));
    // Route to appropriate page based on user type
    if (user.isAdmin) {
      setCurrentPage('admin');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    const wasAdmin = currentUser?.isAdmin || false;
    
    // Clear user state and token
    setCurrentUser(null);
    localStorage.removeItem('kachaTaka_currentUser');
    localStorage.removeItem('kachaTaka_token');
    authAPI.logout();
    
    // Navigate to landing page
    setCurrentPage('landing');
    
    // For admin users, we need to ensure clean state transition
    // Force reload only if switching from admin to ensure clean slate
    if (wasAdmin) {
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('kachaTaka_currentUser', JSON.stringify(updatedUser));
      
      // Update in MongoDB via API
      try {
        const { usersAPI } = await import('./utils/api');
        await usersAPI.update(currentUser.id, updates);
      } catch (error) {
        console.error('Failed to update user in MongoDB:', error);
        // Continue with local update even if API fails
      }
    }
  };

  const renderPage = () => {
    if (currentPage === 'landing') {
      return <Landing onNavigate={setCurrentPage} user={currentUser} onLogin={handleLogin} />;
    }

    // Admin Login Page (separate from regular auth)
    if (currentPage === 'admin-login') {
      return <AdminLogin onLogin={handleLogin} onBack={() => setCurrentPage('landing')} />;
    }

    // Policy Pages
    if (currentPage === 'terms' || currentPage === 'privacy' || currentPage === 'responsible') {
      return (
        <PolicyPage 
          type={currentPage} 
          user={currentUser}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        />
      );
    }

    if (currentPage === 'fairness') {
       return (
         <>
            <Navbar user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />
            <div className="pt-16">
              <Fairness onNavigate={setCurrentPage} />
            </div>
            <Footer onNavigate={setCurrentPage} />
         </>
       );
    }

    if (currentPage === 'auth') {
      return <Auth onLogin={handleLogin} onNavigate={setCurrentPage} />;
    }

    if (currentPage === 'login') {
      return <Auth onLogin={handleLogin} onNavigate={setCurrentPage} defaultTab="login" />;
    }

    if (currentPage === 'register') {
      return <Auth onLogin={handleLogin} onNavigate={setCurrentPage} defaultTab="register" />;
    }

    if (!currentUser) {
      return <Landing onNavigate={setCurrentPage} user={currentUser} />;
    }

    return (
      <>
        <Navbar 
          user={currentUser} 
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
          onLogin={handleLogin}
        />
        <div className="pt-16 min-h-[calc(100vh-300px)]">
          {currentPage === 'dashboard' && <Dashboard user={currentUser} onNavigate={setCurrentPage} updateUser={updateUser} />}
          {currentPage === 'crash' && <CrashGame user={currentUser} updateUser={updateUser} />}
          {currentPage === 'mines' && <MinesGame user={currentUser} updateUser={updateUser} />}
          {currentPage === 'slots' && <SlotsGame user={currentUser} updateUser={updateUser} />}
          {currentPage === 'dice' && <DiceGame user={currentUser} updateUser={updateUser} />}
          {currentPage === 'profile' && <Profile user={currentUser} updateUser={updateUser} />}
          {currentPage === 'wallet' && <Wallet user={currentUser} updateUser={updateUser} />}
          {currentPage === 'messages' && <Messages user={currentUser} />}
          {currentPage === 'admin' && currentUser.isAdmin && <AdminPanel onNavigate={setCurrentPage} />}
        </div>
        <Footer onNavigate={setCurrentPage} />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {renderPage()}
      <Toaster />
    </div>
  );
}