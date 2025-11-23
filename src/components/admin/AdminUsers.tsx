import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Ban, CheckCircle, Edit, UserPlus, DollarSign, Users2, Shield, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllUsers, updateUserBalance, getReferrals, getGameHistory, getTransactions, getGlobalSettings, pointsToBDT } from '@/utils/storageMongo';
import { User } from '@/App';
import { toast } from 'sonner';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newDemoPoints, setNewDemoPoints] = useState('0');
  const [newRealBalance, setNewRealBalance] = useState('0');
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [referralCounts, setReferralCounts] = useState<Record<string, number>>({});
  const [conversionRate, setConversionRate] = useState<number>(5);

  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

  const loadSettings = async () => {
    const settings = await getGlobalSettings();
    if (settings && settings.conversionRate) {
      setConversionRate(settings.conversionRate);
    }
  };

  const loadUsers = async () => {
    const usersData = await getAllUsers();
    setUsers(usersData);
    
    // Load referral counts
    const counts: Record<string, number> = {};
    for (const user of usersData) {
      const referrals = await getReferrals(user.id);
      counts[user.id] = referrals.length;
    }
    setReferralCounts(counts);
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditBalance = (user: User) => {
    setSelectedUser(user);
    setNewDemoPoints(user.demoPoints.toString());
    setNewRealBalance(user.realBalance.toString());
    setEditDialog(true);
  };

  const handleSaveBalance = async () => {
    if (selectedUser) {
      try {
        await updateUserBalance(selectedUser.id, parseInt(newDemoPoints), parseInt(newRealBalance));
        await loadUsers();
        toast.success(`Balance updated for ${selectedUser.name}`);
        setEditDialog(false);
        setSelectedUser(null);
      } catch (error: any) {
        toast.error(error.message || 'Failed to update balance');
      }
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'pending' | 'verified' | 'rejected') => {
    try {
      const { usersAPI } = await import('@/utils/api');
      await usersAPI.update(userId, { kycStatus: newStatus });
      await loadUsers();
      toast.success(`KYC status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { usersAPI } = await import('@/utils/api');
      await usersAPI.update(userId, { isAdmin: !currentStatus });
      await loadUsers();
      toast.success(`Admin status ${!currentStatus ? 'granted' : 'revoked'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update admin status');
    }
  };

  const handleBanUser = (user: User) => {
    // In a real app, this would disable the account
    // For demo purposes, we'll just show a toast
    toast.warning(`User ${user.name} has been banned (Demo Mode)`);
  };


  const handleViewHistory = async (user: User) => {
    setSelectedUser(user);
    const history = await getGameHistory(user.id);
    const transactions = await getTransactions(user.id);
    setUserHistory(history);
    setUserTransactions(transactions);
    setHistoryDialog(true);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <Users2 className="w-8 h-8 text-primary opacity-50" />
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.kycStatus === 'verified').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {users.filter(u => u.kycStatus === 'pending').length}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.isAdmin).length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Demo Points</TableHead>
              <TableHead>Real Balance</TableHead>
              <TableHead>Referrals</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium flex items-center gap-2">
                      {u.name}
                      {u.isAdmin && <Badge variant="destructive" className="text-[10px] px-1 py-0">ADMIN</Badge>}
                    </span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.kycStatus === 'verified' ? 'default' : 'secondary'}>
                    {u.kycStatus === 'verified' ? 'Verified' : 'Not Verified'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">{u.demoPoints.toLocaleString()}</TableCell>
                <TableCell className="font-mono">{u.realBalance.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="outline">{referralCounts[u.id] || 0}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditBalance(u)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Balance
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewHistory(u)}>
                        <History className="mr-2 h-4 w-4" /> View History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(u.id, u.kycStatus === 'verified' ? 'pending' : 'verified')}>
                        <CheckCircle className="mr-2 h-4 w-4" /> 
                        {u.kycStatus === 'verified' ? 'Unverify' : 'Verify'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleAdmin(u.id, u.isAdmin)}>
                        <Shield className="mr-2 h-4 w-4" /> {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBanUser(u)} className="text-red-600">
                        <Ban className="mr-2 h-4 w-4" /> Ban User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Balance Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Balance</DialogTitle>
            <DialogDescription>
              Update the demo points and real balance for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="demo-points">Demo Points</Label>
              <Input
                id="demo-points"
                type="number"
                value={newDemoPoints}
                onChange={(e) => setNewDemoPoints(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="real-balance">Real Balance</Label>
              <Input
                id="real-balance"
                type="number"
                value={newRealBalance}
                onChange={(e) => setNewRealBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBalance}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Activity: {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Complete game history and transaction log
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* User Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Demo Points</p>
                <p className="text-lg font-bold">{selectedUser?.demoPoints.toLocaleString()}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Real Balance</p>
                <p className="text-lg font-bold">{selectedUser?.realBalance.toLocaleString()}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Total BDT</p>
                <p className="text-lg font-bold">৳{selectedUser ? pointsToBDT(selectedUser.demoPoints + selectedUser.realBalance, conversionRate).toFixed(0) : 0}</p>
              </div>
            </div>

            {/* Transactions */}
            <div>
              <h4 className="font-semibold mb-2">Transactions</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userTransactions.length > 0 ? (
                    userTransactions.slice(0, 10).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="capitalize">{t.type}</TableCell>
                        <TableCell>{t.amount} pts</TableCell>
                        <TableCell>
                          <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(t.timestamp).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Game History */}
            <div>
              <h4 className="font-semibold mb-2">Game History</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>Bet</TableHead>
                    <TableHead>Win</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userHistory.length > 0 ? (
                    userHistory.slice(0, 20).map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="capitalize">{h.game}</TableCell>
                        <TableCell>{h.betAmount} pts</TableCell>
                        <TableCell className={h.winAmount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {h.winAmount} pts
                        </TableCell>
                        <TableCell>{h.multiplier.toFixed(2)}x</TableCell>
                        <TableCell>
                          <Badge variant={h.isDemo ? 'secondary' : 'default'}>
                            {h.isDemo ? 'Demo' : 'Real'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(h.timestamp).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No game history yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setHistoryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}