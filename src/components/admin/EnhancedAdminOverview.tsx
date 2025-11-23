import React, { useState, useEffect } from 'react';
import { Users, Wallet, TrendingUp, TrendingDown, Gamepad2, AlertTriangle, DollarSign, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAllUsers, getPaymentRequests, getTransactions, getGameHistory, getReferrals, getGlobalSettings, pointsToBDT } from '@/utils/storageMongo';

export function EnhancedAdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDemoBalance: 0,
    totalRealBalance: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    completedDeposits: 0,
    completedWithdrawals: 0,
    totalGamesPlayed: 0,
    totalReferralEarnings: 0,
    activeToday: 0,
  });

  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [conversionRate, setConversionRate] = useState<number>(5);

  useEffect(() => {
    loadSettings();
    loadDashboardData();
  }, []);

  const loadSettings = async () => {
    const settings = await getGlobalSettings();
    if (settings && settings.conversionRate) {
      setConversionRate(settings.conversionRate);
    }
  };

  const loadDashboardData = async () => {
    const users = await getAllUsers();
    const paymentRequests = await getPaymentRequests();
    const transactions = await getTransactions();
    const gameHistory = await getGameHistory();

    // Calculate stats
    const totalDemoBalance = users.reduce((sum, u) => sum + u.demoPoints, 0);
    const totalRealBalance = users.reduce((sum, u) => sum + u.realBalance, 0);
    const totalReferralEarnings = users.reduce((sum, u) => sum + (u.referralEarnings || 0), 0);

    const pendingDeposits = paymentRequests.filter(r => r.type === 'deposit' && r.status === 'pending');
    const pendingWithdrawals = paymentRequests.filter(r => r.type === 'withdraw' && r.status === 'pending');
    const completedDeposits = paymentRequests.filter(r => r.type === 'deposit' && r.status === 'approved');
    const completedWithdrawals = paymentRequests.filter(r => r.type === 'withdraw' && r.status === 'approved');

    // Active users today (played any game in last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentGames = gameHistory.filter(g => new Date(g.timestamp).getTime() > oneDayAgo);
    const activeUserIds = new Set(recentGames.map(g => g.userId));

    setStats({
      totalUsers: users.length,
      totalDemoBalance,
      totalRealBalance,
      pendingDeposits: pendingDeposits.length,
      pendingWithdrawals: pendingWithdrawals.length,
      completedDeposits: completedDeposits.length,
      completedWithdrawals: completedWithdrawals.length,
      totalGamesPlayed: gameHistory.length,
      totalReferralEarnings,
      activeToday: activeUserIds.size,
    });

    // Recent deposits
    setRecentDeposits(
      paymentRequests
        .filter(r => r.type === 'deposit')
        .slice(0, 5)
        .map(r => ({
          ...r,
          bdtAmount: pointsToBDT(r.amount, conversionRate)
        }))
    );

    // Recent withdrawals
    setRecentWithdrawals(
      paymentRequests
        .filter(r => r.type === 'withdraw')
        .slice(0, 5)
        .map(r => ({
          ...r,
          bdtAmount: pointsToBDT(r.amount, conversionRate)
        }))
    );

    // Top players by total balance
    const topPlayersData = await Promise.all(
      users
        .filter(u => !u.isAdmin)
        .sort((a, b) => (b.demoPoints + b.realBalance) - (a.demoPoints + a.realBalance))
        .slice(0, 5)
        .map(async (u) => {
          const referrals = await getReferrals(u.id);
          return {
            ...u,
            totalBalance: u.demoPoints + u.realBalance,
            referralCount: referrals.length
          };
        })
    );
    setTopPlayers(topPlayersData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${stats.activeToday} active today`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend="up"
        />
        <StatCard
          title="Demo Balance"
          value={`${stats.totalDemoBalance.toLocaleString()} pts`}
          subtitle="In circulation"
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Real Balance"
          value={`${stats.totalRealBalance.toLocaleString()} pts`}
          subtitle={`৳${pointsToBDT(stats.totalRealBalance, conversionRate).toFixed(0)}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Referral Earnings"
          value={`${stats.totalReferralEarnings.toLocaleString()} pts`}
          subtitle="Total bonuses given"
          icon={<Gift className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Payment Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Deposits"
          value={stats.pendingDeposits}
          subtitle="Awaiting approval"
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          variant="warning"
        />
        <StatCard
          title="Pending Withdrawals"
          value={stats.pendingWithdrawals}
          subtitle="Awaiting approval"
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          variant="warning"
        />
        <StatCard
          title="Completed Deposits"
          value={stats.completedDeposits}
          subtitle="Successfully processed"
          icon={<TrendingUp className="h-4 w-4 text-green-500" />}
          variant="success"
        />
        <StatCard
          title="Completed Withdrawals"
          value={stats.completedWithdrawals}
          subtitle="Successfully processed"
          icon={<TrendingDown className="h-4 w-4 text-green-500" />}
          variant="success"
        />
      </div>

      {/* Games Played */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Games Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">{stats.totalGamesPlayed.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Total games played across all users</p>
        </CardContent>
      </Card>

      {/* Recent Deposits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deposit Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>BDT</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDeposits.length > 0 ? (
                recentDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell>{deposit.userName}</TableCell>
                    <TableCell>{deposit.amount} pts</TableCell>
                    <TableCell>৳{deposit.bdtAmount.toFixed(0)}</TableCell>
                    <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                    <TableCell>{new Date(deposit.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No deposit requests yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>BDT</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentWithdrawals.length > 0 ? (
                recentWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>{withdrawal.userName}</TableCell>
                    <TableCell>{withdrawal.amount} pts</TableCell>
                    <TableCell>৳{withdrawal.bdtAmount.toFixed(0)}</TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell>{new Date(withdrawal.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No withdrawal requests yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Players */}
      <Card>
        <CardHeader>
          <CardTitle>Top Players by Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Demo Balance</TableHead>
                <TableHead>Real Balance</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Referrals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPlayers.length > 0 ? (
                topPlayers.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{index + 1}</span>
                        <span>{player.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{player.demoPoints.toLocaleString()} pts</TableCell>
                    <TableCell>{player.realBalance.toLocaleString()} pts</TableCell>
                    <TableCell className="font-bold">{player.totalBalance.toLocaleString()} pts</TableCell>
                    <TableCell>{player.referralCount}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No players yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  variant = 'default'
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  variant?: 'default' | 'warning' | 'success';
}) {
  const variantClasses = {
    default: '',
    warning: 'border-yellow-500/20 bg-yellow-500/5',
    success: 'border-green-500/20 bg-green-500/5',
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}
