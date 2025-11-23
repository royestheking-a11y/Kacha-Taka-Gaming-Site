import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getAllUsers, getReferrals } from '@/utils/storage';
import { User } from '@/App';
import { Users, TrendingUp, DollarSign, Award } from 'lucide-react';

export function AdminReferrals() {
  const [search, setSearch] = useState('');
  const users = getAllUsers();
  
  // Calculate referral stats
  const usersWithReferrals = users.map(user => ({
    ...user,
    referralCount: getReferrals(user.id).length
  })).filter(u => u.referralCount > 0 || (u.referralEarnings && u.referralEarnings > 0));

  const filtered = usersWithReferrals.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.referralCode?.toLowerCase().includes(search.toLowerCase())
  );

  const totalReferrals = usersWithReferrals.reduce((sum, u) => sum + u.referralCount, 0);
  const totalEarnings = usersWithReferrals.reduce((sum, u) => sum + (u.referralEarnings || 0), 0);
  const topReferrer = usersWithReferrals.reduce((max, u) => 
    u.referralCount > (max?.referralCount || 0) ? u : max
  , usersWithReferrals[0]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{totalReferrals}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Referrers</p>
                <p className="text-2xl font-bold">{usersWithReferrals.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{totalEarnings.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Top Referrer</p>
                <p className="text-sm font-bold truncate">{topReferrer?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">{topReferrer?.referralCount || 0} refs</p>
              </div>
              <Award className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between">
        <Input 
          placeholder="Search by name, email, or referral code..." 
          className="max-w-md" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Activity</CardTitle>
          <CardDescription>Track users who have successfully referred others</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead className="text-right">Total Referrals</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const referrals = getReferrals(user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {user.referralCode || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-lg">{user.referralCount}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-green-600">
                        {(user.referralEarnings || 0).toLocaleString()} pts
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.referralCount >= 10 ? 'default' : user.referralCount >= 5 ? 'secondary' : 'outline'}>
                        {user.referralCount >= 10 ? 'Gold' : user.referralCount >= 5 ? 'Silver' : 'Bronze'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No referral activity found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Referrers</CardTitle>
          <CardDescription>Users with the most referrals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usersWithReferrals
              .sort((a, b) => b.referralCount - a.referralCount)
              .slice(0, 5)
              .map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{user.referralCount} refs</p>
                    <p className="text-xs text-green-600">{(user.referralEarnings || 0).toLocaleString()} pts</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
