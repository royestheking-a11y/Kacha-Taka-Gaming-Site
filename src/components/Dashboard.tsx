import React from 'react';
import { motion } from 'motion/react';
import { Play, TrendingUp, Trophy, Target, ArrowRight, Rocket, Zap, Dna, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User } from '@/App';
import { getGameHistory, formatCurrency } from '@/utils/storage';
import { DailySpin } from './DailySpin';

interface DashboardProps {
  user: User;
  onNavigate: (page: string) => void;
  updateUser?: (updates: Partial<User>) => void;
}

export function Dashboard({ user, onNavigate, updateUser }: DashboardProps) {
  const history = getGameHistory(user.id);
  const totalWagered = history.reduce((acc, curr) => acc + curr.betAmount, 0);
  const totalWon = history.reduce((acc, curr) => acc + curr.winAmount, 0);
  const profit = totalWon - totalWagered;

  // Safe updateUser function
  const handleUpdateUser = (updates: Partial<User>) => {
    if (updateUser) {
      updateUser(updates);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-red-600 text-white p-8 md:p-12 shadow-2xl">
         <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Welcome back, {user.name}!</h1>
            <p className="text-primary-foreground/90 text-lg mb-8">
               Ready to multiply your balance? Check out the latest games and promotions.
            </p>
            <div className="flex gap-4">
               <Button variant="secondary" size="lg" onClick={() => onNavigate('landing')}>
                  Play Now <Play className="ml-2 w-4 h-4" />
               </Button>
               <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" onClick={() => onNavigate('wallet')}>
                  Deposit Funds
               </Button>
            </div>
         </div>
         
         {/* Decorative Circles */}
         <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
         <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard 
            title="Total Wagered" 
            value={formatCurrency(totalWagered)} 
            icon={<Target className="w-5 h-5 text-blue-500" />} 
            trend="+12% this week"
         />
         <StatCard 
            title="Total Won" 
            value={formatCurrency(totalWon)} 
            icon={<Trophy className="w-5 h-5 text-yellow-500" />} 
            trend="High Roller"
         />
         <StatCard 
            title="Net Profit" 
            value={formatCurrency(profit)} 
            icon={<TrendingUp className="w-5 h-5 text-green-500" />} 
            positive={profit >= 0}
         />
      </div>

      {/* Free Spin and Points Converter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {updateUser && <DailySpin user={user} updateUser={handleUpdateUser} />}
      </div>

      {/* Quick Games Access */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Quick Play</h2>
          <p className="text-muted-foreground text-sm">Click to start playing</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GameQuickCard 
            title="Crash"
            icon={<Rocket className="w-8 h-8" />}
            color="from-red-500 to-orange-500"
            onClick={() => onNavigate('crash')}
          />
          <GameQuickCard 
            title="Mines"
            icon={<Gamepad2 className="w-8 h-8" />}
            color="from-emerald-500 to-teal-500"
            onClick={() => onNavigate('mines')}
          />
          <GameQuickCard 
            title="Slots"
            icon={<Zap className="w-8 h-8" />}
            color="from-yellow-500 to-amber-500"
            onClick={() => onNavigate('slots')}
          />
          <GameQuickCard 
            title="Dice"
            icon={<Dna className="w-8 h-8" />}
            color="from-blue-500 to-indigo-500"
            onClick={() => onNavigate('dice')}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border-none shadow-lg">
         <CardHeader className="flex flex-row items-center justify-between">
            <div>
               <CardTitle>Recent Activity</CardTitle>
               <CardDescription>Your latest gaming sessions</CardDescription>
            </div>
            <Button variant="ghost" size="sm">View All <ArrowRight className="ml-2 w-4 h-4" /></Button>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               {history.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                     No games played yet. Start playing to see your history!
                  </div>
               ) : (
                  history.slice(0, 5).map((game) => (
                     <div key={game.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl hover:bg-secondary/40 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white capitalize ${
                              game.game === 'crash' ? 'bg-red-500' :
                              game.game === 'mines' ? 'bg-emerald-500' :
                              game.game === 'slots' ? 'bg-yellow-500' : 'bg-blue-500'
                           }`}>
                              {game.game[0]}
                           </div>
                           <div>
                              <div className="font-semibold capitalize">{game.game}</div>
                              <div className="text-xs text-muted-foreground">{new Date(game.timestamp).toLocaleString()}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={`font-bold ${game.winAmount > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                              {game.winAmount > 0 ? `+${formatCurrency(game.winAmount)}` : `-${formatCurrency(game.betAmount)}`}
                           </div>
                           <div className="text-xs text-muted-foreground">{game.multiplier.toFixed(2)}x</div>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, trend, positive }: { title: string, value: string, icon: React.ReactNode, trend?: string, positive?: boolean }) {
   return (
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
         <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-secondary rounded-lg">{icon}</div>
               {trend && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${positive === false ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                     {trend}
                  </span>
               )}
            </div>
            <div className="space-y-1">
               <p className="text-sm text-muted-foreground font-medium">{title}</p>
               <h3 className={`text-2xl font-bold ${positive === false ? 'text-red-600' : ''}`}>{value}</h3>
            </div>
         </CardContent>
      </Card>
   );
}

function GameQuickCard({ title, icon, color, onClick }: { title: string, icon: React.ReactNode, color: string, onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="border-none shadow-lg hover:shadow-2xl transition-all overflow-hidden">
        <div className={`h-32 bg-gradient-to-br ${color} flex flex-col items-center justify-center text-white relative`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            {icon}
          </div>
          <h3 className="relative z-10 mt-2 font-bold text-lg">{title}</h3>
        </div>
      </Card>
    </motion.div>
  );
}