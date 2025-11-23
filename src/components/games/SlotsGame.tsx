import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cherry, Grape, Coins, DollarSign, Star, Crown, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/App';
import { addGameHistory, formatCurrency, getGameSettings } from '@/utils/storage';
import { soundManager } from '@/utils/audio';
import { toast } from 'sonner';
import { BalanceSelector } from '@/components/BalanceSelector';

interface SlotsGameProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

const SYMBOLS = [
  { id: 1, icon: <Cherry className="w-full h-full text-red-500" />, value: 2, weight: 40 },
  { id: 2, icon: <Grape className="w-full h-full text-purple-500" />, value: 3, weight: 30 },
  { id: 3, icon: <Coins className="w-full h-full text-yellow-500" />, value: 5, weight: 20 },
  { id: 4, icon: <DollarSign className="w-full h-full text-green-500" />, value: 10, weight: 15 },
  { id: 5, icon: <Star className="w-full h-full text-blue-500" />, value: 20, weight: 10 },
  { id: 6, icon: <Crown className="w-full h-full text-amber-500" />, value: 50, weight: 5 },
  { id: 7, icon: <Zap className="w-full h-full text-white fill-yellow-400 stroke-yellow-600" />, value: 100, weight: 2 }
];

// Helper to pick random symbol based on weights
const getRandomSymbol = () => {
  const totalWeight = SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const symbol of SYMBOLS) {
    random -= symbol.weight;
    if (random <= 0) return symbol;
  }
  return SYMBOLS[0];
};

export function SlotsGame({ user, updateUser }: SlotsGameProps) {
  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<'demo' | 'main'>('demo');
  const [reels, setReels] = useState<any[][]>([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[1], SYMBOLS[2], SYMBOLS[0]],
    [SYMBOLS[2], SYMBOLS[0], SYMBOLS[1]]
  ]);
  
  // Settings
  const settings = getGameSettings();
  const config = settings.slots || { enabled: true, minBet: 10, maxBet: 10000, rtp: 0.95 };

  // Auto-switch to main if demo is empty
  useEffect(() => {
    if (user.demoPoints <= 0 && user.realBalance > 0) {
      setSelectedBalance('main');
    }
  }, [user.demoPoints, user.realBalance]);

  const spin = async () => {
    if (!config.enabled) {
      toast.error("Slots game is disabled");
      return;
    }

    const balance = selectedBalance === 'demo' ? user.demoPoints : user.realBalance;
    
    // Redirect to deposit if demo balance is depleted
    if (selectedBalance === 'demo' && balance <= 0) {
      toast.error("Demo balance depleted! Please deposit to continue playing.");
      setTimeout(() => {
        window.location.hash = 'wallet';
      }, 500);
      return;
    }
    
    if (betAmount < config.minBet) {
      toast.error(`Minimum bet is ${config.minBet}`);
      return;
    }
    if (betAmount > config.maxBet) {
      toast.error(`Maximum bet is ${config.maxBet}`);
      return;
    }

    if (balance < betAmount) {
      toast.error("Insufficient balance!");
      return;
    }

    if (selectedBalance === 'demo') {
      await updateUser({ demoPoints: user.demoPoints - betAmount });
    } else {
      await updateUser({ realBalance: user.realBalance - betAmount });
    }

    setSpinning(true);
    soundManager.playSpin();

    // Simulate spin delay for each reel
    const newReels = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    ];
    
    setTimeout(async () => {
       setReels(newReels);
       setSpinning(false);
       await checkWin(newReels);
    }, 2000); // 2 second spin
  };

  const checkWin = async (finalReels: any[][]) => {
    let totalWin = 0;
    
    // Check rows (3 horizontal lines)
    for (let row = 0; row < 3; row++) {
       const s1 = finalReels[0][row];
       const s2 = finalReels[1][row];
       const s3 = finalReels[2][row];
       
       if (s1.id === s2.id && s2.id === s3.id) {
          totalWin += betAmount * s1.value;
       }
    }

    // Check diagonals
    // Top-Left to Bottom-Right
    if (finalReels[0][0].id === finalReels[1][1].id && finalReels[1][1].id === finalReels[2][2].id) {
      totalWin += betAmount * finalReels[0][0].value;
    }
    // Bottom-Left to Top-Right
    if (finalReels[0][2].id === finalReels[1][1].id && finalReels[1][1].id === finalReels[2][0].id) {
      totalWin += betAmount * finalReels[0][2].value;
    }

    if (totalWin > 0) {
       soundManager.playWin();
       if (selectedBalance === 'demo') {
         await updateUser({ demoPoints: user.demoPoints + totalWin });
       } else {
         await updateUser({ realBalance: user.realBalance + totalWin });
       }
       toast.success(`BIG WIN! ${formatCurrency(totalWin)}`);
    }

    addGameHistory({
      id: Date.now().toString(),
      userId: user.id,
      game: 'slots',
      roundId: Date.now().toString(),
      betAmount,
      isDemo: selectedBalance === 'demo',
      result: totalWin > 0 ? 'win' : 'loss',
      winAmount: totalWin,
      multiplier: totalWin / betAmount,
      serverSeed: 'hidden',
      seedHash: 'hash',
      timestamp: new Date().toISOString()
    });
  };

  if (!config.enabled) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md text-center p-8">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Game Disabled</h2>
          <p className="text-muted-foreground">This game is currently disabled by the administrator.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl border-4 border-yellow-600/30 relative overflow-hidden">
             {/* Decoration */}
             <div className="absolute top-0 left-0 w-full h-4 bg-yellow-500/20" />
             <div className="absolute bottom-0 left-0 w-full h-4 bg-yellow-500/20" />
             
             {/* Reels Container */}
             <div className="grid grid-cols-3 gap-4 bg-black/50 p-6 rounded-xl border border-white/10 relative">
                {/* Paylines Indicator (Simplified) */}
                <div className="absolute inset-0 pointer-events-none">
                   <div className="w-full h-[1px] bg-red-500/20 top-1/2 absolute" />
                </div>

                {reels.map((reel, i) => (
                   <div key={i} className="flex flex-col gap-4 overflow-hidden bg-slate-100 rounded-lg h-[300px] relative mask-linear-fade-y">
                      <motion.div 
                        className="flex flex-col gap-4 py-4"
                        animate={spinning ? { y: [0, -1000] } : { y: 0 }}
                        transition={spinning ? { repeat: Infinity, duration: 0.2 + (i * 0.1), ease: "linear" } : { type: "spring" }}
                      >
                         {/* Show previous, current, next (simulated by just repeating for blur) */}
                         {spinning ? Array(10).fill(null).map((_, idx) => (
                            <div key={idx} className="h-[80px] flex items-center justify-center opacity-50 blur-sm">
                               {SYMBOLS[idx % SYMBOLS.length].icon}
                            </div>
                         )) : (
                           reel.map((symbol, j) => (
                             <div key={j} className="h-[80px] flex items-center justify-center p-2 transform scale-125">
                                {symbol.icon}
                             </div>
                           ))
                         )}
                      </motion.div>
                   </div>
                ))}
             </div>
          </div>

          {/* Controls */}
          <Card className="border-none shadow-xl">
             <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                   <div className="flex-1 w-full space-y-2">
                      <div className="flex justify-between text-sm">
                         <span>Bet Amount</span>
                         <span>
                           {selectedBalance === 'demo' 
                             ? formatCurrency(user.demoPoints)
                             : formatCurrency(user.realBalance)
                           }
                         </span>
                      </div>
                      <Input 
                         type="number" 
                         value={betAmount} 
                         onChange={(e) => setBetAmount(Number(e.target.value))}
                         className="h-12 text-lg"
                      />
                      <p className="text-xs text-muted-foreground">Min: {config.minBet} | Max: {config.maxBet}</p>
                   </div>
                   <Button 
                      size="lg" 
                      className={`h-12 w-full md:w-48 text-xl font-bold shadow-lg ${spinning ? 'opacity-50 cursor-not-allowed' : 'shadow-primary/20'}`}
                      onClick={spin}
                      disabled={spinning}
                   >
                      {spinning ? 'SPINNING...' : 'SPIN'}
                   </Button>
                </div>

                {/* Balance Selector - Moved to bottom */}
                <div className="pt-4 border-t">
                   <BalanceSelector
                      demoBalance={user.demoPoints}
                      mainBalance={user.realBalance}
                      selectedBalance={selectedBalance}
                      onSelect={setSelectedBalance}
                      onDeposit={() => window.location.href = '#wallet'}
                    />
                </div>
             </CardContent>
          </Card>

          {/* Paytable */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-xs text-center">
             {SYMBOLS.map((s) => (
                <div key={s.id} className="bg-card p-2 rounded border flex flex-col items-center gap-1">
                   <div className="w-6 h-6">{s.icon}</div>
                   <div className="font-bold">x{s.value}</div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}