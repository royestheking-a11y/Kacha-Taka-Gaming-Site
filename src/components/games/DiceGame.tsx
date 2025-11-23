import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Dices, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { User } from '@/App';
import { generateGameResult } from '@/utils/provablyFair';
import { addGameHistory, formatCurrency, getGameSettings } from '@/utils/storage';
import { soundManager } from '@/utils/audio';
import { toast } from 'sonner';
import { BalanceSelector } from '@/components/BalanceSelector';

interface DiceGameProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

export function DiceGame({ user, updateUser }: DiceGameProps) {
  const [betAmount, setBetAmount] = useState(10);
  const [prediction, setPrediction] = useState(50);
  const [rollType, setRollType] = useState<'over' | 'under'>('over');
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(50.00);
  const [winChance, setWinChance] = useState(50);
  const [multiplier, setMultiplier] = useState(1.96);
  const [selectedBalance, setSelectedBalance] = useState<'demo' | 'main'>('demo');

  // Settings
  const settings = getGameSettings();
  const config = settings.dice || { enabled: true, minBet: 10, maxBet: 10000, houseEdge: 0.02 };

  // Auto-switch to main if demo is empty
  useEffect(() => {
    if (user.demoPoints <= 0 && user.realBalance > 0) {
      setSelectedBalance('main');
    }
  }, [user.demoPoints, user.realBalance]);

  // Calculate Stats
  const updateStats = (val: number, type: 'over' | 'under') => {
    let chance = type === 'over' ? 100 - val : val;
    // House Edge calculation
    const edge = config.houseEdge || 0.02;
    let mult = (1 - edge) * 100 / chance;
    
    setWinChance(chance);
    setMultiplier(mult);
    setPrediction(val);
    setRollType(type);
  };

  // Initial calculation
  useEffect(() => {
     updateStats(prediction, rollType);
  }, [config.houseEdge]);

  const roll = async () => {
    if (!config.enabled) {
      toast.error("Dice game is disabled");
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
    
    setIsRolling(true);
    soundManager.playSpin();

    // Animate Roll
    let tempRoll = 0;
    const interval = setInterval(() => {
       tempRoll = Math.random() * 100;
       setLastRoll(tempRoll);
    }, 50);

    setTimeout(async () => {
      clearInterval(interval);
      // Generate real result
      try {
        const result = await generateGameResult('dice', Date.now().toString());
        setLastRoll(result);
        setIsRolling(false);

        const win = rollType === 'over' ? result > prediction : result < prediction;
      
        if (win) {
          soundManager.playWin();
          const winAmount = betAmount * multiplier;
          if (selectedBalance === 'demo') {
            await updateUser({ demoPoints: user.demoPoints + winAmount });
          } else {
            await updateUser({ realBalance: user.realBalance + winAmount });
          }
          toast.success(`You Won ${formatCurrency(winAmount)}!`);
          
          addGameHistory({
              id: Date.now().toString(),
              userId: user.id,
              game: 'dice',
              roundId: Date.now().toString(),
              betAmount,
              isDemo: selectedBalance === 'demo',
              result: result,
              winAmount,
              multiplier,
              serverSeed: 'hidden',
              seedHash: 'hash',
              timestamp: new Date().toISOString()
          });
        } else {
           addGameHistory({
              id: Date.now().toString(),
              userId: user.id,
              game: 'dice',
              roundId: Date.now().toString(),
              betAmount,
              isDemo: selectedBalance === 'demo',
              result: result,
              winAmount: 0,
              multiplier: 0,
              serverSeed: 'hidden',
              seedHash: 'hash',
              timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("RNG Error:", error);
        setIsRolling(false);
      }
    }, 1000);
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
       <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-none shadow-xl overflow-hidden">
             <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                   <CardTitle className="flex items-center gap-2">
                      <Dices className="w-5 h-5 text-primary" />
                      Dice
                   </CardTitle>
                </div>
             </CardHeader>
             
             <CardContent className="p-8 space-y-12">
                {/* Visual Slider Area */}
                <div className="relative h-24 bg-slate-900 rounded-2xl flex items-center px-4 shadow-inner border border-slate-800">
                   {/* Range Bar */}
                   <div 
                     className={`absolute top-0 bottom-0 rounded-2xl opacity-20 transition-all duration-300 ${rollType === 'over' ? 'bg-green-500 right-0' : 'bg-green-500 left-0'}`}
                     style={{ width: `${winChance}%` }}
                   />

                   {/* Slider Component Overlay */}
                   <Slider 
                      min={2} 
                      max={98} 
                      step={1} 
                      value={[prediction]} 
                      onValueChange={([v]) => updateStats(v, rollType)}
                      className="z-10 cursor-pointer"
                   />

                   {/* Dice Indicator */}
                   <motion.div 
                      className="absolute top-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold text-black z-20 border-4 border-slate-200"
                      style={{ left: `calc(${lastRoll}% - 32px)` }}
                      animate={isRolling ? { x: [-5, 5, -5] } : {}}
                      transition={{ repeat: Infinity, duration: 0.1 }}
                   >
                      {lastRoll.toFixed(0)}
                   </motion.div>
                </div>

                {/* Stats & Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {/* Bet Input */}
                   <div className="space-y-2 bg-secondary/30 p-4 rounded-xl">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Bet Amount</span>
                        <span>
                          {selectedBalance === 'demo' 
                            ? formatCurrency(user.demoPoints)
                            : formatCurrency(user.realBalance)
                          }
                        </span>
                      </div>
                      <div className="flex gap-2">
                         <Input 
                            type="number" 
                            value={betAmount} 
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            disabled={isRolling}
                         />
                         <Button variant="outline" onClick={() => setBetAmount(betAmount * 2)}>2x</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Min: {config.minBet} | Max: {config.maxBet}</p>
                   </div>

                   {/* Win Chance Display */}
                   <div className="flex flex-col items-center justify-center space-y-1 bg-secondary/30 p-4 rounded-xl">
                      <div className="text-sm text-muted-foreground">Win Chance</div>
                      <div className="text-2xl font-bold text-green-600">{winChance.toFixed(2)}%</div>
                   </div>

                   {/* Multiplier Display */}
                   <div className="flex flex-col items-center justify-center space-y-1 bg-secondary/30 p-4 rounded-xl">
                      <div className="text-sm text-muted-foreground">Multiplier</div>
                      <div className="text-2xl font-bold text-primary">{multiplier.toFixed(4)}x</div>
                   </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                   <Button 
                     size="lg" 
                     variant={rollType === 'under' ? 'default' : 'outline'}
                     onClick={() => updateStats(prediction, 'under')}
                     className="h-16 text-lg font-bold"
                   >
                      Roll Under {prediction}
                   </Button>
                   <Button 
                     size="lg" 
                     variant={rollType === 'over' ? 'default' : 'outline'}
                     onClick={() => updateStats(prediction, 'over')}
                     className="h-16 text-lg font-bold"
                   >
                      Roll Over {prediction}
                   </Button>
                </div>

                <Button 
                   className="w-full h-16 text-2xl font-bold shadow-lg shadow-primary/20" 
                   onClick={roll}
                   disabled={isRolling}
                >
                   {isRolling ? 'Rolling...' : 'BET'}
                </Button>

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
       </div>
    </div>
  );
}