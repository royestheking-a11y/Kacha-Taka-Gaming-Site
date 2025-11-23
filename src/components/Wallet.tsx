import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet as WalletIcon, CreditCard, ArrowDownLeft, ArrowUpRight, History, Banknote, Coins, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User } from '@/App';
import { formatCurrency, addPaymentRequest, getTransactions, getGlobalSettings, getPaymentRequests, pointsToBDT } from '@/utils/storageMongo';
import { toast } from 'sonner';

interface WalletProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

export function Wallet({ user, updateUser }: WalletProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [activeDepositNumber, setActiveDepositNumber] = useState('01700000000');
  const [activeTab, setActiveTab] = useState('deposit');
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  // Load active payment number and refresh transactions
  useEffect(() => {
    const loadData = async () => {
      const settings = await getGlobalSettings();
      setGlobalSettings(settings);
      
      const stored = localStorage.getItem('kachaTaka_paymentNumbers');
      if (stored) {
        const paymentNumbers = JSON.parse(stored);
        const activeNumbers = paymentNumbers.filter((p: any) => p.isActive || p.active);
        if (activeNumbers.length > 0) {
          setActiveDepositNumber(activeNumbers[0].number);
        }
      }
      
      const txs = await getTransactions(user.id);
      const reqs = await getPaymentRequests();
      const userReqs = reqs.filter(r => r.userId === user.id);
      
      // Convert requests to transaction-like objects for display
      const pendingTxs = userReqs.map(r => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        status: r.status,
        timestamp: r.timestamp,
        isRequest: true
      }));
      
      // Filter out completed requests that might have a corresponding transaction to avoid duplicates
      const allActivity = [...txs, ...pendingTxs.filter(r => r.status === 'pending' || r.status === 'rejected')];
      allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setTransactions(allActivity);
    };
    
    loadData();
    
    // Poll for changes every 2 seconds
    const interval = setInterval(() => {
      loadData();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [user.id]);

  const handleDeposit = async () => {
    if (!globalSettings) {
      toast.error("Settings not loaded yet");
      return;
    }
    
    const depositBDT = Number(amount);
    
    if (!amount || !paymentNumber || !trxId) {
      toast.error("Please fill all fields");
      return;
    }

    if (depositBDT < globalSettings.minimumDepositBDT) {
      toast.error(`Minimum deposit is ৳${globalSettings.minimumDepositBDT} (${globalSettings.minimumDepositPoints} points)`);
      return;
    }

    const points = depositBDT * globalSettings.conversionRate;

    try {
      await addPaymentRequest({
        userId: user.id,
        userName: user.name,
        type: 'deposit',
        amount: points,
        method,
        accountDetails: paymentNumber,
        transactionId: trxId,
        status: 'pending'
      });

      toast.success("Deposit request submitted! Admin will approve soon.");
      setAmount('');
      setPaymentNumber('');
      setTrxId('');
    } catch (error: any) {
      toast.error(error.message || "Failed to submit deposit request");
    }
  };

  const handleWithdraw = async () => {
    if (!globalSettings) {
      toast.error("Settings not loaded yet");
      return;
    }
    
    const val = Number(amount);
    
    // Minimum withdrawal
    if (val < globalSettings.minimumWithdrawalPoints) {
      toast.error(`Minimum withdrawal is ${globalSettings.minimumWithdrawalPoints} points (৳${globalSettings.minimumWithdrawalBDT})`);
      return;
    }
    
    // Withdrawals only from Real Balance
    if (val > user.realBalance) {
      toast.error("Insufficient Real Balance for withdrawal");
      return;
    }

    if (!paymentNumber) {
      toast.error("Please enter your payment number");
      return;
    }

    try {
      await addPaymentRequest({
        userId: user.id,
        userName: user.name,
        type: 'withdraw',
        amount: val,
        method,
        accountDetails: paymentNumber,
        status: 'pending'
      });

      // Don't deduct immediately - wait for admin approval
      // Balance will be deducted by backend when admin approves
      
      toast.success("Withdrawal request submitted! Balance will be deducted after admin approval.");
      setAmount('');
      setPaymentNumber('');
    } catch (error: any) {
      toast.error(error.message || "Failed to submit withdrawal request");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Balance Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-500/30 shadow-xl">
                <CardHeader className="pb-2">
                   <CardTitle className="text-indigo-300 flex items-center gap-2">
                      <Coins className="w-5 h-5" /> Demo Balance
                   </CardTitle>
                   <CardDescription className="text-indigo-200/60">For practice and fun</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="text-4xl font-bold tracking-tight">{formatCurrency(user.demoPoints)}</div>
                   <p className="text-sm text-indigo-400 mt-4">Play games to practice and have fun</p>
                </CardContent>
             </Card>

             <Card className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white border-emerald-500/30 shadow-xl">
                <CardHeader className="pb-2">
                   <CardTitle className="text-emerald-300 flex items-center gap-2">
                      <WalletIcon className="w-5 h-5" /> Main Balance
                   </CardTitle>
                   <CardDescription className="text-emerald-200/60">Real money for withdrawal</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="text-4xl font-bold tracking-tight">{formatCurrency(user.realBalance)}</div>
                   <div className="text-sm text-emerald-400 mt-1">
                      ≈ ৳{globalSettings ? pointsToBDT(user.realBalance, globalSettings.conversionRate).toFixed(2) : (user.realBalance * 0.2).toFixed(2)} BDT
                   </div>
                   <div className="flex gap-3 mt-4">
                      <Button 
                         className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-900/20"
                         onClick={() => setActiveTab('deposit')}
                      >
                         Deposit
                      </Button>
                      <Button 
                         variant="outline" 
                         className="border-emerald-400 text-emerald-300 hover:bg-emerald-900/50 hover:text-white"
                         onClick={() => setActiveTab('withdraw')}
                      >
                         Withdraw
                      </Button>
                   </div>
                </CardContent>
             </Card>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             {/* Transaction Section */}
             <Card className="border-none shadow-lg">
                <CardHeader>
                   <CardTitle>Transaction Management</CardTitle>
                   <CardDescription>Deposit funds or request a withdrawal.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                         <TabsTrigger value="deposit">Deposit</TabsTrigger>
                         <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="deposit" className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <PaymentMethodCard name="Bkash" active={method === 'bkash'} onClick={() => setMethod('bkash')} />
                            <PaymentMethodCard name="Nagad" active={method === 'nagad'} onClick={() => setMethod('nagad')} />
                         </div>
                         
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Amount (BDT)</label>
                            <Input 
                               type="number" 
                               placeholder={globalSettings ? `Min ৳${globalSettings.minimumDepositBDT}` : 'Min ৳100'} 
                               value={amount} 
                               onChange={(e) => setAmount(e.target.value)} 
                            />
                            <p className="text-xs text-muted-foreground">
                               {globalSettings ? `৳${globalSettings.minimumDepositBDT} = ${globalSettings.minimumDepositPoints} points (1 BDT = ${globalSettings.conversionRate} Points)` : 'Loading settings...'}
                            </p>
                         </div>
                         
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Sender Number</label>
                            <Input placeholder="017..." value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} />
                         </div>

                         <div className="space-y-2">
                            <label className="text-sm font-medium">Transaction ID</label>
                            <Input placeholder="8N..." value={trxId} onChange={(e) => setTrxId(e.target.value)} />
                         </div>

                         <div className="pt-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm text-yellow-800">
                               Please send money to <strong>{activeDepositNumber}</strong> (Personal) and enter TrxID.
                               <br />
                               <strong>Minimum: {globalSettings ? `৳${globalSettings.minimumDepositBDT} = ${globalSettings.minimumDepositPoints} Points` : 'Loading...'}</strong>
                            </div>
                            <Button className="w-full h-12 font-bold text-lg" onClick={handleDeposit}>Submit Deposit Request</Button>
                         </div>
                      </TabsContent>

                      <TabsContent value="withdraw" className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Withdraw Amount (Points)</label>
                            <Input 
                               type="number" 
                               placeholder={globalSettings ? `Min ${globalSettings.minimumWithdrawalPoints} pts (৳${globalSettings.minimumWithdrawalBDT})` : 'Min 2500 pts'} 
                               value={amount} 
                               onChange={(e) => setAmount(e.target.value)} 
                            />
                            <p className="text-xs text-muted-foreground">
                               Minimum withdrawal: {globalSettings ? `${globalSettings.minimumWithdrawalPoints} points = ৳${globalSettings.minimumWithdrawalBDT} BDT` : 'Loading...'}
                            </p>
                         </div>
                         
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Method</label>
                            <Select value={method} onValueChange={setMethod}>
                               <SelectTrigger><SelectValue /></SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="bkash">Bkash</SelectItem>
                                  <SelectItem value="nagad">Nagad</SelectItem>
                                  <SelectItem value="rocket">Rocket</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Receive Number</label>
                            <Input placeholder="017..." value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} />
                         </div>

                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                            <p className="font-medium">⚡ Fast Processing</p>
                            <p className="mt-1">Your withdrawal will be received under 30 minutes.</p>
                         </div>

                         <Button className="w-full h-12 font-bold text-lg mt-4" onClick={handleWithdraw}>Request Withdrawal</Button>
                      </TabsContent>
                   </Tabs>
                </CardContent>
             </Card>
          </div>

          <div>
             <Card className="border-none shadow-lg h-full sticky top-24">
                <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" /> Recent Transactions
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      {transactions.length === 0 ? (
                         <div className="text-center text-muted-foreground py-8">No transactions yet</div>
                      ) : (
                         transactions.slice(0, 10).map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                               <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${
                                      t.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                      t.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                      (t.type === 'deposit' || t.type === 'win' || t.type === 'bonus') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                  }`}>
                                     {t.status === 'pending' ? <RefreshCcw className="w-4 h-4 animate-spin-slow" /> :
                                      (t.type === 'deposit' || t.type === 'win' || t.type === 'bonus') ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                  </div>
                                  <div>
                                     <div className="font-medium capitalize flex items-center gap-2">
                                         {t.type}
                                         {t.status === 'pending' && <Badge variant="outline" className="text-[10px] h-4 border-yellow-500 text-yellow-600">Pending</Badge>}
                                         {t.status === 'rejected' && <Badge variant="outline" className="text-[10px] h-4 border-red-500 text-red-600">Rejected</Badge>}
                                     </div>
                                     <div className="text-xs text-muted-foreground">{new Date(t.timestamp).toLocaleDateString()} • {new Date(t.timestamp).toLocaleTimeString()}</div>
                                  </div>
                               </div>
                               <div className={`font-bold ${
                                   t.status === 'pending' ? 'text-yellow-600' :
                                   (t.type === 'deposit' || t.type === 'win' || t.type === 'bonus') ? 'text-green-600' : 'text-red-600'
                               }`}>
                                  {t.type === 'deposit' || t.type === 'win' || t.type === 'bonus' ? '+' : '-'}{formatCurrency(t.amount)}
                               </div>
                            </div>
                         ))
                      )}
                   </div>
                </CardContent>
             </Card>
          </div>
       </div>
    </div>
  );
}

function PaymentMethodCard({ name, active, onClick }: { name: string, active: boolean, onClick: () => void }) {
   return (
      <div 
        onClick={onClick}
        className={`cursor-pointer border-2 rounded-xl p-4 flex items-center justify-center font-bold text-lg transition-all ${active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}
      >
         {name}
      </div>
   )
}