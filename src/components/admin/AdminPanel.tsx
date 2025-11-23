import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Gamepad2, 
  Wallet, 
  MessageSquare, 
  Settings, 
  LogOut,
  Gift 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminGames } from './AdminGames';
import { EnhancedAdminPayments } from './EnhancedAdminPayments';
import { AdminSettings } from './AdminSettings';
import { AdminReferrals } from './AdminReferrals';
import { EnhancedAdminOverview } from './EnhancedAdminOverview';

interface AdminPanelProps {
  onNavigate: (page: string) => void;
}

type AdminView = 'overview' | 'users' | 'games' | 'payments' | 'settings' | 'referrals';

export function AdminPanel({ onNavigate }: AdminPanelProps) {
  const [currentView, setCurrentView] = useState<AdminView>('overview');

  const views = {
    overview: <EnhancedAdminOverview />,
    users: <AdminUsers />,
    games: <AdminGames />,
    payments: <EnhancedAdminPayments />,
    settings: <AdminSettings />,
    referrals: <AdminReferrals />
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'games', label: 'Game Control', icon: <Gamepad2 className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <Wallet className="w-5 h-5" /> },
    { id: 'referrals', label: 'Referrals', icon: <Gift className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex-shrink-0 hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)]">
         <div className="p-6">
            <h2 className="text-lg font-bold px-2">Admin Portal</h2>
            <p className="text-xs text-muted-foreground px-2">Manage Kacha Taka</p>
         </div>
         <nav className="flex-1 px-4 space-y-1">
            {menuItems.map((item) => (
               <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as AdminView)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                     currentView === item.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
               >
                  {item.icon}
                  {item.label}
               </button>
            ))}
         </nav>
         <div className="p-4 mt-auto border-t">
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onNavigate('landing')}>
               <LogOut className="w-4 h-4 mr-2" /> Exit Admin
            </Button>
         </div>
      </div>

      {/* Mobile Nav (Simple) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40 flex justify-between p-2 overflow-x-auto">
         {menuItems.map((item) => (
            <button
               key={item.id}
               onClick={() => setCurrentView(item.id as AdminView)}
               className={`flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-lg text-[10px] ${
                  currentView === item.id ? 'text-primary' : 'text-muted-foreground'
               }`}
            >
               {item.icon}
               {item.label}
            </button>
         ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto h-full pb-20 md:pb-8">
         <div className="max-w-6xl mx-auto">
            <div className="mb-8">
               <h1 className="text-3xl font-bold tracking-tight capitalize">{currentView}</h1>
               <p className="text-muted-foreground">Manage your application settings and data.</p>
            </div>
            
            <motion.div
               key={currentView}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2 }}
            >
               {views[currentView]}
            </motion.div>
         </div>
      </div>
    </div>
  );
}