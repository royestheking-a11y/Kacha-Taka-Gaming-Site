import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, Wallet, Award, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getAllUsers, getTransactions, getGameHistory, getPlatformStats, getGlobalSettings, pointsToBDT } from '@/utils/storageMongo';

export function TrustSection() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    dailyWithdrawals: 0,
    totalWithdrawn: 0,
    activeGames: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [conversionRate, setConversionRate] = useState(0.2); // Default conversion rate

  useEffect(() => {
    loadStats();
    loadRecentActivities();
  }, []);

  const loadStats = async () => {
    try {
      const users = await getAllUsers();
      const transactions = await getTransactions();
      const gameHistory = await getGameHistory();
      const platformStats = await getPlatformStats();
      const globalSettings = await getGlobalSettings();
      
      // Get conversion rate from global settings
      const rate = globalSettings?.conversionRate || 0.2;
      setConversionRate(rate);
      
      // Filter withdrawals from last 24 hours
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentWithdrawals = transactions.filter(
        t => t.type === 'withdraw' && 
        t.status === 'completed' && 
        new Date(t.timestamp).getTime() > oneDayAgo
      );
      
      const actualWithdrawn = transactions
        .filter(t => t.type === 'withdraw' && t.status === 'completed')
        .reduce((sum, t) => sum + pointsToBDT(t.amount, rate), 0);

      setStats({
        totalUsers: platformStats.baseActiveUsers + users.length,
        dailyWithdrawals: platformStats.baseDailyWithdrawals + (recentWithdrawals.length > 0 ? recentWithdrawals.reduce((sum, t) => sum + pointsToBDT(t.amount, rate), 0) : 0),
        totalWithdrawn: platformStats.baseTotalWithdrawn + actualWithdrawn,
        activeGames: platformStats.baseGamesPlayed + gameHistory.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const allTransactions = await getTransactions();
      const users = await getAllUsers();
      const globalSettings = await getGlobalSettings();
      
      // Get conversion rate from global settings
      const rate = globalSettings?.conversionRate || 0.2;
      setConversionRate(rate);
      
      // Get recent withdrawals that are completed
      const recentWithdrawals = allTransactions
        .filter(t => t.type === 'withdraw' && t.status === 'completed')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(t => {
          const user = users.find(u => u.id === t.userId);
          return {
            type: 'withdrawal',
            amount: pointsToBDT(t.amount, rate), // Convert points to BDT using dynamic rate
            userName: user ? maskName(user.name) : 'User',
            time: t.timestamp,
          };
        });

      setRecentActivities(recentWithdrawals);
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };

  const maskName = (name: string) => {
    if (name.length <= 2) return '***';
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  };

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Trusted by Thousands</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our growing community of winners. Real players, real wins, real withdrawals.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard 
            icon={<Users className="w-8 h-8 text-blue-500" />}
            value={stats.totalUsers.toLocaleString()}
            label="Active Users"
            gradient="from-blue-500/10 to-blue-500/5"
          />
          <StatCard 
            icon={<TrendingUp className="w-8 h-8 text-green-500" />}
            value={`৳${Math.floor(stats.dailyWithdrawals).toLocaleString()}`}
            label="Daily Withdrawals"
            gradient="from-green-500/10 to-green-500/5"
          />
          <StatCard 
            icon={<Wallet className="w-8 h-8 text-primary" />}
            value={`৳${Math.floor(stats.totalWithdrawn).toLocaleString()}`}
            label="Total Withdrawn"
            gradient="from-primary/10 to-primary/5"
          />
          <StatCard 
            icon={<Award className="w-8 h-8 text-yellow-500" />}
            value={stats.activeGames.toLocaleString()}
            label="Games Played"
            gradient="from-yellow-500/10 to-yellow-500/5"
          />
        </div>

        {/* Recent Activity Feed */}
        <Card className="border-primary/20 shadow-lg max-w-4xl mx-auto">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Recent Successful Withdrawals
            </h3>
            
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+৳{activity.amount.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Withdrawn</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent withdrawals
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatCard({ 
  icon, 
  value, 
  label, 
  gradient 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string; 
  gradient: string;
}) {
  return (
    <Card className={`border-none shadow-lg bg-gradient-to-br ${gradient}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-background rounded-full p-3 shadow-sm">
            {icon}
          </div>
        </div>
        <h3 className="text-3xl font-bold mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}