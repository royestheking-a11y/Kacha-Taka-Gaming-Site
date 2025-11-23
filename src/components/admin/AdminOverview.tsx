import React, { useState, useEffect } from 'react';
import { Users, Wallet, Gamepad2, AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllUsers, getPaymentRequests, formatCurrency } from '@/utils/storageMongo';
import { User } from '@/App';

export function AdminOverview() {
  const [users, setUsers] = useState<User[]>([]);
  const [allPaymentRequests, setAllPaymentRequests] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const usersData = await getAllUsers();
    const paymentsData = await getPaymentRequests();
    setUsers(usersData);
    setAllPaymentRequests(paymentsData);
  };
  
  // Separate pending and completed requests
  const pendingDeposits = allPaymentRequests.filter(r => r.type === 'deposit' && r.status === 'pending');
  const pendingWithdrawals = allPaymentRequests.filter(r => r.type === 'withdraw' && r.status === 'pending');
  const completedDeposits = allPaymentRequests.filter(r => r.type === 'deposit' && r.status === 'approved');
  const completedWithdrawals = allPaymentRequests.filter(r => r.type === 'withdraw' && r.status === 'approved');
  
  // Calculate totals
  const pendingDepositAmount = pendingDeposits.reduce((sum, r) => sum + r.amount, 0);
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, r) => sum + r.amount, 0);
  const completedDepositAmount = completedDeposits.reduce((sum, r) => sum + r.amount, 0);
  const completedWithdrawalAmount = completedWithdrawals.reduce((sum, r) => sum + r.amount, 0);
  
  const totalUsers = users.length;
  const totalDemoBalance = users.reduce((acc, u) => acc + u.demoPoints, 0);
  const totalRealBalance = users.reduce((acc, u) => acc + u.realBalance, 0);
  
  return (
    <div className="space-y-6">
      {/* User Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">+2 since last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demo Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDemoBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total demo points</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real Balance</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalRealBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total real points</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Games</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Running normally</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Deposits */}
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingDeposits.length}</div>
              <p className="text-xs text-yellow-600 font-medium mt-1">
                {formatCurrency(pendingDepositAmount)}
              </p>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          {/* Pending Withdrawals */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingWithdrawals.length}</div>
              <p className="text-xs text-orange-600 font-medium mt-1">
                {formatCurrency(pendingWithdrawalAmount)}
              </p>
              <p className="text-xs text-muted-foreground">Waiting approval</p>
            </CardContent>
          </Card>

          {/* Completed Deposits */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Deposits</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedDeposits.length}</div>
              <p className="text-xs text-green-600 font-medium mt-1">
                {formatCurrency(completedDepositAmount)}
              </p>
              <p className="text-xs text-muted-foreground">Successfully processed</p>
            </CardContent>
          </Card>

          {/* Completed Withdrawals */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Withdrawals</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{completedWithdrawals.length}</div>
              <p className="text-xs text-blue-600 font-medium mt-1">
                {formatCurrency(completedWithdrawalAmount)}
              </p>
              <p className="text-xs text-muted-foreground">Successfully processed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}