import React, { useState, useEffect } from 'react';
import { Check, X, Plus, Trash2, Edit2, Save, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { getPaymentRequests, updatePaymentRequest, deletePaymentRequest, updateUserBalance, getUserById, addTransaction, getGlobalSettings, pointsToBDT } from '@/utils/storageMongo';
import { toast } from 'sonner';

interface PaymentNumber {
  id: string;
  method: string;
  number: string;
  label: string;
  isActive: boolean;
}

export function EnhancedAdminPayments() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [conversionRate, setConversionRate] = useState<number>(5);
  
  // New payment number form
  const [newMethod, setNewMethod] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    loadSettings();
    loadPaymentNumbers();
    loadRequests();
  }, []);

  const loadSettings = async () => {
    const settings = await getGlobalSettings();
    if (settings && settings.conversionRate) {
      setConversionRate(settings.conversionRate);
    }
  };

  const loadRequests = async () => {
    const pending = await getPaymentRequests('pending');
    const all = await getPaymentRequests();
    setPendingRequests(pending);
    setAllRequests(all);
  };

  const loadPaymentNumbers = () => {
    const saved = localStorage.getItem('kachaTaka_paymentNumbers');
    if (saved) {
      setPaymentNumbers(JSON.parse(saved));
    } else {
      // Default payment numbers
      const defaults: PaymentNumber[] = [
        { id: 'pm1', method: 'bKash', number: '01700000000', label: 'Primary bKash', isActive: true },
        { id: 'pm2', method: 'Nagad', number: '01800000000', label: 'Primary Nagad', isActive: true },
      ];
      setPaymentNumbers(defaults);
      localStorage.setItem('kachaTaka_paymentNumbers', JSON.stringify(defaults));
    }
  };

  const savePaymentNumbers = (numbers: PaymentNumber[]) => {
    localStorage.setItem('kachaTaka_paymentNumbers', JSON.stringify(numbers));
    setPaymentNumbers(numbers);
    toast.success('Payment numbers updated');
  };

  const handleAddPaymentNumber = () => {
    if (!newMethod || !newNumber || !newLabel) {
      toast.error('Please fill all fields');
      return;
    }

    const newPaymentNumber: PaymentNumber = {
      id: `pm-${Date.now()}`,
      method: newMethod,
      number: newNumber,
      label: newLabel,
      isActive: true,
    };

    const updated = [...paymentNumbers, newPaymentNumber];
    savePaymentNumbers(updated);
    
    setNewMethod('');
    setNewNumber('');
    setNewLabel('');
    setShowAddDialog(false);
  };

  const handleDeletePaymentNumber = (id: string) => {
    const updated = paymentNumbers.filter(pm => pm.id !== id);
    savePaymentNumbers(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = paymentNumbers.map(pm =>
      pm.id === id ? { ...pm, isActive: !pm.isActive } : pm
    );
    savePaymentNumbers(updated);
  };

  const handleUpdatePaymentNumber = (id: string, field: string, value: string) => {
    const updated = paymentNumbers.map(pm =>
      pm.id === id ? { ...pm, [field]: value } : pm
    );
    setPaymentNumbers(updated);
  };

  const handleSaveEdit = (id: string) => {
    savePaymentNumbers(paymentNumbers);
    setEditingId(null);
  };

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    const req = pendingRequests.find(r => r.id === id);
    if (!req) return;

    try {
      await updatePaymentRequest(id, { status: action });
      
      // Backend handles all balance updates - don't update here to avoid double calculation
      // Just show success message
      if (action === 'approved') {
        if (req.type === 'deposit') {
          toast.success(`Deposit approved: ${req.amount} pts will be added to ${req.userName}'s real balance`);
        } else {
          const bdtAmount = pointsToBDT(req.amount, conversionRate);
          toast.success(`Withdrawal approved: ${req.amount} pts (৳${bdtAmount.toFixed(0)}) will be deducted from ${req.userName}`);
        }
      } else if (action === 'rejected') {
        if (req.type === 'withdraw') {
          toast.info(`Withdrawal rejected: ${req.userName}'s balance remains unchanged`);
        } else {
          toast.info(`Deposit request rejected`);
        }
      }

      await loadRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process request');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment request? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePaymentRequest(id);
      await loadRequests();
      toast.success('Payment request deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete payment request');
    }
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

  // Calculate statistics for different time periods
  const calculateStats = (period: 'daily' | 'weekly' | 'yearly') => {
    const now = new Date();
    const approvedRequests = allRequests.filter(r => r.status === 'approved');
    
    let filteredRequests = approvedRequests;
    
    if (period === 'daily') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filteredRequests = approvedRequests.filter(r => new Date(r.timestamp) >= startOfDay);
    } else if (period === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      filteredRequests = approvedRequests.filter(r => new Date(r.timestamp) >= startOfWeek);
    } else if (period === 'yearly') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filteredRequests = approvedRequests.filter(r => new Date(r.timestamp) >= startOfYear);
    }
    
    const deposits = filteredRequests.filter(r => r.type === 'deposit');
    const withdrawals = filteredRequests.filter(r => r.type === 'withdraw');
    
    const totalDeposits = deposits.reduce((sum, r) => sum + r.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, r) => sum + r.amount, 0);
    const benefits = totalDeposits - totalWithdrawals;
    
    // Convert to BDT using conversion rate
    return {
      deposits: {
        points: totalDeposits,
        bdt: pointsToBDT(totalDeposits, conversionRate),
        count: deposits.length
      },
      withdrawals: {
        points: totalWithdrawals,
        bdt: pointsToBDT(totalWithdrawals, conversionRate),
        count: withdrawals.length
      },
      benefits: {
        points: benefits,
        bdt: pointsToBDT(benefits, conversionRate),
        percentage: totalDeposits > 0 ? ((benefits / totalDeposits) * 100).toFixed(1) : '0'
      }
    };
  };

  const dailyStats = calculateStats('daily');
  const weeklyStats = calculateStats('weekly');
  const yearlyStats = calculateStats('yearly');

  return (
    <div className="space-y-6">
      {/* Financial Statistics Dashboard */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Payment Statistics</h2>
        
        {/* Daily Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Deposits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  ৳{dailyStats.deposits.bdt.toFixed(2)}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {dailyStats.deposits.points.toLocaleString()} pts • {dailyStats.deposits.count} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Total Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  ৳{dailyStats.withdrawals.bdt.toFixed(2)}
                </div>
                <p className="text-xs text-red-600 mt-1">
                  {dailyStats.withdrawals.points.toLocaleString()} pts • {dailyStats.withdrawals.count} transactions
                </p>
              </CardContent>
            </Card>

            <Card className={`border-2 ${dailyStats.benefits.bdt >= 0 ? 'border-blue-200 bg-blue-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${dailyStats.benefits.bdt >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  <DollarSign className="w-4 h-4" />
                  Net Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${dailyStats.benefits.bdt >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                  ৳{dailyStats.benefits.bdt.toFixed(2)}
                </div>
                <p className={`text-xs mt-1 ${dailyStats.benefits.bdt >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {dailyStats.benefits.points.toLocaleString()} pts • {dailyStats.benefits.percentage}% profit margin
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weekly Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            This Week
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Deposits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  ৳{weeklyStats.deposits.bdt.toFixed(2)}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {weeklyStats.deposits.points.toLocaleString()} pts • {weeklyStats.deposits.count} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Total Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  ৳{weeklyStats.withdrawals.bdt.toFixed(2)}
                </div>
                <p className="text-xs text-red-600 mt-1">
                  {weeklyStats.withdrawals.points.toLocaleString()} pts • {weeklyStats.withdrawals.count} transactions
                </p>
              </CardContent>
            </Card>

            <Card className={`border-2 ${weeklyStats.benefits.bdt >= 0 ? 'border-blue-200 bg-blue-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${weeklyStats.benefits.bdt >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  <DollarSign className="w-4 h-4" />
                  Net Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${weeklyStats.benefits.bdt >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                  ৳{weeklyStats.benefits.bdt.toFixed(2)}
                </div>
                <p className={`text-xs mt-1 ${weeklyStats.benefits.bdt >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {weeklyStats.benefits.points.toLocaleString()} pts • {weeklyStats.benefits.percentage}% profit margin
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Yearly Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            This Year
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Deposits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  ৳{yearlyStats.deposits.bdt.toFixed(2)}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {yearlyStats.deposits.points.toLocaleString()} pts • {yearlyStats.deposits.count} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Total Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  ৳{yearlyStats.withdrawals.bdt.toFixed(2)}
                </div>
                <p className="text-xs text-red-600 mt-1">
                  {yearlyStats.withdrawals.points.toLocaleString()} pts • {yearlyStats.withdrawals.count} transactions
                </p>
              </CardContent>
            </Card>

            <Card className={`border-2 ${yearlyStats.benefits.bdt >= 0 ? 'border-blue-200 bg-blue-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${yearlyStats.benefits.bdt >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  <DollarSign className="w-4 h-4" />
                  Net Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${yearlyStats.benefits.bdt >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                  ৳{yearlyStats.benefits.bdt.toFixed(2)}
                </div>
                <p className={`text-xs mt-1 ${yearlyStats.benefits.bdt >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {yearlyStats.benefits.points.toLocaleString()} pts • {yearlyStats.benefits.percentage}% profit margin
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Payment Numbers</TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>BDT</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No pending requests
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRequests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{r.userName}</span>
                            <span className="text-xs text-muted-foreground">ID: {r.userId.slice(0, 8)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.type === 'deposit' ? 'outline' : 'destructive'} className="capitalize">
                            {r.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{r.amount.toLocaleString()} pts</TableCell>
                        <TableCell className="font-bold">৳{pointsToBDT(r.amount, conversionRate).toFixed(0)}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div><span className="font-medium">Method:</span> {r.method}</div>
                            {r.accountDetails && <div><span className="font-medium">Account:</span> {r.accountDetails}</div>}
                            {r.transactionId && <div className="font-mono text-xs bg-muted px-2 py-1 rounded">{r.transactionId}</div>}
                            <div className="text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50" 
                              onClick={() => handleAction(r.id, 'approved')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                              onClick={() => handleAction(r.id, 'rejected')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>BDT</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No payment history
                      </TableCell>
                    </TableRow>
                  ) : (
                    allRequests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.userName}</TableCell>
                        <TableCell>
                          <Badge variant={r.type === 'deposit' ? 'outline' : 'destructive'} className="capitalize">
                            {r.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.amount.toLocaleString()} pts</TableCell>
                        <TableCell>৳{pointsToBDT(r.amount, conversionRate).toFixed(0)}</TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell>{new Date(r.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeletePayment(r.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Numbers Management */}
        <TabsContent value="settings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Numbers</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage deposit payment numbers shown to users
                </p>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Number
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Payment Number</DialogTitle>
                    <DialogDescription>
                      Add a new payment number that users can use to deposit points.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Input
                        placeholder="e.g., bKash, Nagad, Rocket"
                        value={newMethod}
                        onChange={(e) => setNewMethod(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="e.g., 01700000000"
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        placeholder="e.g., Primary Account"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleAddPaymentNumber}>
                      Add Payment Number
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentNumbers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No payment numbers configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentNumbers.map((pm) => (
                      <TableRow key={pm.id}>
                        <TableCell>
                          {editingId === pm.id ? (
                            <Input
                              value={pm.method}
                              onChange={(e) => handleUpdatePaymentNumber(pm.id, 'method', e.target.value)}
                            />
                          ) : (
                            <span className="font-medium">{pm.method}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === pm.id ? (
                            <Input
                              value={pm.number}
                              onChange={(e) => handleUpdatePaymentNumber(pm.id, 'number', e.target.value)}
                            />
                          ) : (
                            <span className="font-mono">{pm.number}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === pm.id ? (
                            <Input
                              value={pm.label}
                              onChange={(e) => handleUpdatePaymentNumber(pm.id, 'label', e.target.value)}
                            />
                          ) : (
                            pm.label
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(pm.id)}
                            className={pm.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-500'}
                          >
                            {pm.isActive ? 'Active' : 'Inactive'}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {editingId === pm.id ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveEdit(pm.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(pm.id)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeletePaymentNumber(pm.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}