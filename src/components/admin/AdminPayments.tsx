import React, { useState, useEffect } from 'react';
import { Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPaymentRequests, updatePaymentRequest, updateUserBalance, getUserById, addTransaction } from '@/utils/storageMongo';
import { toast } from 'sonner';

export function AdminPayments() {
  const [requests, setRequests] = useState<any[]>([]);
  
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const data = await getPaymentRequests('pending');
    setRequests(data);
  };

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    try {
      await updatePaymentRequest(id, { status: action });
      
      // Backend handles all balance updates - don't update here to avoid double calculation
      // The backend route will handle balance updates and transaction creation

      await loadRequests();
      toast.success(`Request ${action}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process request');
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
             <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending requests</TableCell>
             </TableRow>
          ) : (
             requests.map((r) => (
               <TableRow key={r.id}>
                 <TableCell>
                   <div className="flex flex-col">
                     <span className="font-medium">{r.userName}</span>
                     <span className="text-xs text-muted-foreground">ID: {r.userId}</span>
                   </div>
                 </TableCell>
                 <TableCell>
                   <Badge variant={r.type === 'deposit' ? 'outline' : 'destructive'} className="capitalize">
                     {r.type}
                   </Badge>
                 </TableCell>
                 <TableCell className="font-bold">{r.amount.toLocaleString()}</TableCell>
                 <TableCell>
                   <div className="text-sm">
                     <span className="font-medium capitalize">{r.method}</span>
                     <div className="text-xs text-muted-foreground">{r.accountDetails}</div>
                     {r.transactionId && <div className="text-xs font-mono bg-muted px-1 rounded w-fit mt-1">{r.transactionId}</div>}
                   </div>
                 </TableCell>
                 <TableCell className="text-right">
                   <div className="flex justify-end gap-2">
                     <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleAction(r.id, 'approved')}>
                       <Check className="h-4 w-4" />
                     </Button>
                     <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction(r.id, 'rejected')}>
                       <X className="h-4 w-4" />
                     </Button>
                   </div>
                 </TableCell>
               </TableRow>
             ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}