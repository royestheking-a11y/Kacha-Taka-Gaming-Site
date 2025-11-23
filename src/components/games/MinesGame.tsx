import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Diamond, Bomb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/App';
import { generateGameResult } from '@/utils/provablyFair';
import { addGameHistory, formatCurrency, getGameSettings } from '@/utils/storage';
import { soundManager } from '@/utils/audio';
import { toast } from 'sonner';
import { BalanceSelector } from '@/components/BalanceSelector';

interface MinesGameProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

type TileState = 'hidden' | 'gem' | 'bomb' | 'revealed_safe';

export function MinesGame({ user, updateUser }: MinesGameProps) {
  const [betAmount, setBetAmount] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [grid, setGrid] = useState<TileState[]>(Array(25).fill('hidden'));
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  const [selectedBalance, setSelectedBalance] = useState<'demo' | 'main'>('demo');

  // Settings
  const settings = getGameSettings();
  const config = settings.mines || { enabled: true, minBet: 10, maxBet: 10000, minMines: 1, maxMines: 24 };

  // Auto-switch to main if demo is empty
  useEffect(() => {
    if (user.demoPoints <= 0 && user.realBalance > 0) {
      setSelectedBalance('main');
    }
  }, [user.demoPoints, user.realBalance]);

  // Calculate Next Multiplier
  const getMultiplier = (mines: number, revealed: number) => {
    let m = 1;
    for (let i = 0; i < revealed; i++) {
       m *= (25 - i) / (25 - mines - i);
    }
    return m;
  };

  const startGame = async () => {
    if (!config.enabled) {
      toast.error("Mines game is disabled");
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
    if (minesCount < config.minMines || minesCount > config.maxMines) {
       toast.error(`Mines count must be between ${config.minMines} and ${config.maxMines}`);
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
    
    // Generate Mines (Provably Fair)
    try {
      const mineSet = await generateGameResult('mines', Date.now().toString(), { minesCount });
      setMineLocations(Array.from(mineSet) as number[]);
    } catch (error) {
      console.error("RNG Error:", error);
      const newMines: number[] = [];
      while (newMines.length < minesCount) {
        const r = Math.floor(Math.random() * 25);
        if (!newMines.includes(r)) newMines.push(r);
      }
      setMineLocations(newMines);
    }
    
    setGrid(Array(25).fill('hidden'));
    setRevealedCount(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setMultiplier(1.0);
  };

  const handleTileClick = (index: number) => {
    if (!isPlaying || isGameOver || grid[index] !== 'hidden') return;

    if (mineLocations.includes(index)) {
      // HIT MINE
      soundManager.playExplosion();
      endGame(false, index);
    } else {
      // HIT GEM
      soundManager.playClick();
      const newGrid = [...grid];
      newGrid[index] = 'gem';
      setGrid(newGrid);
      
      const newRevealed = revealedCount + 1;
      setRevealedCount(newRevealed);
      
      const nextM = getMultiplier(minesCount, newRevealed);
      setMultiplier(nextM);

      // Check auto win (all gems found)
      if (newRevealed === 25 - minesCount) {
        cashout(nextM);
      }
    }
  };

  const endGame = (win: boolean, bombIndex?: number) => {
    setIsGameOver(true);
    setIsPlaying(false);
    
    const finalGrid = grid.map((state, i) => {
      if (state !== 'hidden') return state;
      if (mineLocations.includes(i)) return 'bomb';
      return 'revealed_safe';
    });
    setGrid(finalGrid);

    if (!win) {
      addGameHistory({
        id: Date.now().toString(),
        userId: user.id,
        game: 'mines',
        roundId: Date.now().toString(),
        betAmount,
        isDemo: selectedBalance === 'demo',
        result: 'loss',
        winAmount: 0,
        multiplier: 0,
        serverSeed: 'hidden',
        seedHash: 'hash',
        timestamp: new Date().toISOString()
      });
    }
  };

  const cashout = async (finalMultiplier: number = multiplier) => {
    const winAmount = betAmount * finalMultiplier;
    
    soundManager.playWin();

    if (selectedBalance === 'demo') {
      await updateUser({ demoPoints: user.demoPoints + winAmount });
    } else {
      await updateUser({ realBalance: user.realBalance + winAmount });
    }

    setIsGameOver(true);
    setIsPlaying(false);
    
    const finalGrid = grid.map((state, i) => {
      if (state !== 'hidden') return state;
      if (mineLocations.includes(i)) return 'revealed_safe';
      return 'gem';
    });
    setGrid(finalGrid);

    toast.success(`Won ${formatCurrency(winAmount)}!`);
    
    addGameHistory({
      id: Date.now().toString(),
      userId: user.id,
      game: 'mines',
      roundId: Date.now().toString(),
      betAmount,
      isDemo: selectedBalance === 'demo',
      result: 'win',
      winAmount: winAmount,
      multiplier: finalMultiplier,
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game Grid - Shows first on mobile, second on desktop */}
        <div className="lg:col-span-2 lg:order-2 flex items-center justify-center bg-slate-900 rounded-3xl p-4 sm:p-8 shadow-2xl border-4 border-slate-800">
           <div className="grid grid-cols-5 gap-2 sm:gap-4 w-full max-w-lg">
              {grid.map((state, i) => (
                <motion.button
                  key={i}
                  whileHover={!isPlaying || state !== 'hidden' ? {} : { scale: 1.05, backgroundColor: '#334155' }}
                  whileTap={!isPlaying || state !== 'hidden' ? {} : { scale: 0.95 }}
                  className={`
                    aspect-square rounded-xl flex items-center justify-center text-3xl
                    transition-colors duration-300 relative overflow-hidden
                    ${state === 'hidden' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-800'}
                    ${state === 'bomb' ? 'bg-red-900/50 border-2 border-red-500' : ''}
                    ${state === 'gem' ? 'bg-green-900/50 border-2 border-green-500' : ''}
                  `}
                  onClick={() => handleTileClick(i)}
                  disabled={!isPlaying && !isGameOver}
                >
                   <AnimatePresence mode="wait">
                     {state === 'gem' && (
                       <motion.div 
                         initial={{ scale: 0 }} 
                         animate={{ scale: 1 }} 
                         transition={{ type: 'spring' }}
                       >
                         <Diamond className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 fill-emerald-400 drop-shadow-lg" />
                       </motion.div>
                     )}
                     {state === 'bomb' && (
                       <motion.div 
                         initial={{ scale: 0 }} 
                         animate={{ scale: 1 }}
                         transition={{ type: 'spring' }}
                       >
                         <Bomb className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 fill-red-500 drop-shadow-lg" />
                       </motion.div>
                     )}
                     {state === 'revealed_safe' && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}>
                         <div className="w-3 h-3 rounded-full bg-slate-500" />
                       </motion.div>
                     )}
                   </AnimatePresence>
                </motion.button>
              ))}
           </div>
        </div>

        {/* Controls - Shows second on mobile, first on desktop */}
        <Card className="h-fit shadow-xl border-none bg-card lg:order-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bomb className="w-5 h-5 text-primary" />
              Mines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
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
                disabled={isPlaying}
                className="font-mono text-lg"
              />
              <div className="grid grid-cols-4 gap-2">
                 {[10, 100, 1000, 'Max'].map((v) => {
                   const maxBalance = selectedBalance === 'demo' ? user.demoPoints : user.realBalance;
                   const limit = Math.min(maxBalance, config.maxBet);
                   return (
                     <Button 
                       key={v} 
                       variant="outline" 
                       size="sm"
                       disabled={isPlaying}
                       onClick={() => setBetAmount(v === 'Max' ? limit : Number(v))}
                     >
                       {v}
                     </Button>
                   );
                 })}
              </div>
              <p className="text-xs text-muted-foreground">Min: {config.minBet} | Max: {config.maxBet}</p>
            </div>

            <div className="space-y-2">
               <span className="text-sm text-muted-foreground">Mines Count</span>
               <Select 
                 value={minesCount.toString()} 
                 onValueChange={(v) => setMinesCount(Number(v))}
                 disabled={isPlaying}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select mines" />
                 </SelectTrigger>
                 <SelectContent>
                   {[1, 3, 5, 10, 15, 20, 24].map((m) => (
                     <SelectItem 
                        key={m} 
                        value={m.toString()}
                        disabled={m < (config.minMines || 1) || m > (config.maxMines || 24)}
                     >
                       {m} Mines
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <p className="text-xs text-muted-foreground">Allowed: {config.minMines} - {config.maxMines} Mines</p>
            </div>

            {isPlaying ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-secondary rounded-lg">
                   <div className="text-sm text-muted-foreground">Current Win</div>
                   <div className="text-2xl font-bold text-green-600">{formatCurrency(betAmount * multiplier)}</div>
                   <div className="text-xs text-muted-foreground">{multiplier.toFixed(2)}x Multiplier</div>
                </div>
                <Button 
                  className="w-full h-14 text-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  onClick={() => cashout()}
                >
                  CASHOUT
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full h-14 text-xl font-bold shadow-lg shadow-primary/20"
                onClick={startGame}
              >
                BET
              </Button>
            )}

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