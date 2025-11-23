import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/storage';
import { Badge } from '@/components/ui/badge';

interface BalanceSelectorProps {
  demoBalance: number;
  mainBalance: number;
  selectedBalance: 'demo' | 'main';
  onSelect: (type: 'demo' | 'main') => void;
  onDeposit: () => void;
}

export function BalanceSelector({ 
  demoBalance, 
  mainBalance, 
  selectedBalance, 
  onSelect,
  onDeposit 
}: BalanceSelectorProps) {
  const isDemoEmpty = demoBalance <= 0;
  const isMainEmpty = mainBalance <= 0;

  return (
    <Card className="border-primary/20 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Select Balance</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Demo Balance */}
          <button
            onClick={() => !isDemoEmpty && onSelect('demo')}
            disabled={isDemoEmpty}
            className={`
              relative p-4 rounded-lg border-2 transition-all text-left
              ${selectedBalance === 'demo' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'}
              ${isDemoEmpty ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Demo Balance</span>
                <Badge variant="secondary" className="text-[10px]">FREE</Badge>
              </div>
              <span className="font-bold text-lg">{formatCurrency(demoBalance)}</span>
              {isDemoEmpty && (
                <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Empty
                </span>
              )}
            </div>
          </button>

          {/* Main Balance */}
          <button
            onClick={() => onSelect('main')}
            className={`
              relative p-4 rounded-lg border-2 transition-all text-left cursor-pointer
              ${selectedBalance === 'main' 
                ? 'border-green-500 bg-green-500/5' 
                : 'border-border hover:border-green-500/50'}
            `}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Main Balance</span>
                <Badge className="text-[10px] bg-green-600">REAL</Badge>
              </div>
              <span className="font-bold text-lg">{formatCurrency(mainBalance)}</span>
              {isMainEmpty && (
                <span className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Deposit to play
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Deposit Prompt */}
        {isDemoEmpty && isMainEmpty && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">No balance available</p>
                <p className="text-xs text-amber-700 mt-1">
                  Deposit funds to continue playing
                </p>
              </div>
            </div>
            <Button 
              className="w-full mt-3 bg-green-600 hover:bg-green-700"
              onClick={onDeposit}
            >
              Deposit Now
            </Button>
          </div>
        )}

        {isDemoEmpty && !isMainEmpty && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Demo balance finished!</strong> Switch to Main Balance or deposit more funds.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
