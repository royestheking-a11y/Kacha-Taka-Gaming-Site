import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Check, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getGlobalSettings, updateGlobalSettings } from '@/utils/storageMongo';

type PaymentNumber = {
  id: string;
  method: 'bkash' | 'nagad' | 'rocket';
  number: string;
  label: string;
  active: boolean;
};

export function AdminSettings() {
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [newNumber, setNewNumber] = useState('');
  const [newMethod, setNewMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Global Settings
  const [settings, setSettings] = useState({
    siteName: 'Kacha Taka',
    minimumDepositBDT: 100,
    minimumDepositPoints: 500,
    minimumWithdrawalPoints: 2500,
    minimumWithdrawalBDT: 500,
    referralBonusPoints: 50,
    conversionRate: 5,
    initialDemoPoints: 100
  });

  useEffect(() => {
    // Load payment numbers from localStorage
    const stored = localStorage.getItem('kachaTaka_paymentNumbers');
    if (stored) {
      setPaymentNumbers(JSON.parse(stored));
    } else {
      // Initialize with default
      const defaultNumbers: PaymentNumber[] = [
        { id: '1', method: 'bkash', number: '01700000000', label: 'Main Deposit', active: true }
      ];
      setPaymentNumbers(defaultNumbers);
      localStorage.setItem('kachaTaka_paymentNumbers', JSON.stringify(defaultNumbers));
    }

    // Load global settings
    loadGlobalSettings();
  }, []);

  const loadGlobalSettings = async () => {
    const globalSettings = await getGlobalSettings();
    setSettings(globalSettings);
  };

  const savePaymentNumbers = (numbers: PaymentNumber[]) => {
    localStorage.setItem('kachaTaka_paymentNumbers', JSON.stringify(numbers));
    setPaymentNumbers(numbers);
  };

  const addPaymentNumber = () => {
    if (!newNumber || !newLabel) {
      toast.error('Please fill all fields');
      return;
    }

    const newPaymentNumber: PaymentNumber = {
      id: Date.now().toString(),
      method: newMethod,
      number: newNumber,
      label: newLabel,
      active: true
    };

    const updated = [...paymentNumbers, newPaymentNumber];
    savePaymentNumbers(updated);
    toast.success('Payment number added');
    
    // Reset form
    setNewNumber('');
    setNewLabel('');
  };

  const removePaymentNumber = (id: string) => {
    const updated = paymentNumbers.filter(p => p.id !== id);
    savePaymentNumbers(updated);
    toast.success('Payment number removed');
  };

  const toggleActive = (id: string) => {
    const updated = paymentNumbers.map(p => 
      p.id === id ? { ...p, active: !p.active } : p
    );
    savePaymentNumbers(updated);
    toast.success('Status updated');
  };

  const handleSaveGlobalSettings = async () => {
    try {
      await updateGlobalSettings(settings);
      toast.success('Global settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const handleSettingChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleNumericChange = (field: string, value: string) => {
    const numValue = parseInt(value);
    setSettings({ ...settings, [field]: isNaN(numValue) ? 0 : numValue });
  };

  return (
    <div className="space-y-6">
      {/* Payment Numbers Management */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Numbers</CardTitle>
          <CardDescription>
            Manage deposit payment numbers. Users will see these when making deposits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Payment Numbers */}
          <div className="space-y-3">
            <Label>Current Payment Numbers</Label>
            {paymentNumbers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                No payment numbers configured
              </div>
            ) : (
              <div className="space-y-2">
                {paymentNumbers.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant={payment.active ? 'default' : 'secondary'}>
                        {payment.method.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="font-medium">{payment.number}</div>
                        <div className="text-sm text-muted-foreground">{payment.label}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={payment.active ? 'outline' : 'default'}
                        onClick={() => toggleActive(payment.id)}
                      >
                        {payment.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePaymentNumber(payment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Payment Number */}
          <div className="space-y-4 pt-4 border-t">
            <Label>Add New Payment Number</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Method</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value as any)}
                >
                  <option value="bkash">Bkash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  placeholder="01700000000" 
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Label/Description</Label>
                <Input 
                  placeholder="Main Deposit" 
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={addPaymentNumber}>
              <Plus className="w-4 h-4 mr-2" /> Add Payment Number
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure platform-wide settings. Changes will affect all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input 
                value={settings.siteName} 
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Initial Demo Points</Label>
              <Input 
                type="number"
                value={settings.initialDemoPoints} 
                onChange={(e) => handleNumericChange('initialDemoPoints', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Points given to new users</p>
            </div>

            <div className="space-y-2">
              <Label>Minimum Deposit (BDT)</Label>
              <Input 
                type="number"
                value={settings.minimumDepositBDT} 
                onChange={(e) => handleNumericChange('minimumDepositBDT', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Deposit (Points)</Label>
              <Input 
                type="number"
                value={settings.minimumDepositPoints} 
                onChange={(e) => handleNumericChange('minimumDepositPoints', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Withdrawal (Points)</Label>
              <Input 
                type="number"
                value={settings.minimumWithdrawalPoints} 
                onChange={(e) => handleNumericChange('minimumWithdrawalPoints', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Withdrawal (BDT)</Label>
              <Input 
                type="number"
                value={settings.minimumWithdrawalBDT} 
                onChange={(e) => handleNumericChange('minimumWithdrawalBDT', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Conversion Rate (1 BDT = ? Points)</Label>
              <Input 
                type="number"
                value={settings.conversionRate} 
                onChange={(e) => handleNumericChange('conversionRate', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Current: 1 BDT = {settings.conversionRate} points</p>
            </div>

            <div className="space-y-2">
              <Label>Referral Bonus (Points)</Label>
              <Input 
                type="number"
                value={settings.referralBonusPoints} 
                onChange={(e) => handleNumericChange('referralBonusPoints', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Points awarded per referral</p>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button size="lg" onClick={handleSaveGlobalSettings}>
              <Save className="w-4 h-4 mr-2" /> Save All Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}