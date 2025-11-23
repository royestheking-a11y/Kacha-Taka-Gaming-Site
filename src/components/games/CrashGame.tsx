import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Trophy, History, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { User } from '@/App';
import { generateGameResult } from '@/utils/provablyFair';
import { addGameHistory, formatCurrency, getGameSettings } from '@/utils/storage';
import { soundManager } from '@/utils/audio';
import { toast } from 'sonner';
import { BalanceSelector } from '@/components/BalanceSelector';

interface CrashGameProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
  setActiveTab?: (tab: string) => void;
}

type GameState = 'idle' | 'running' | 'crashed';

export function CrashGame({ user, updateUser, setActiveTab }: CrashGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [cashedOut, setCashedOut] = useState(false);
  const [cashedOutAt, setCashedOutAt] = useState(0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [selectedBalance, setSelectedBalance] = useState<'demo' | 'main'>('demo');
  
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // Settings
  const settings = getGameSettings();
  const config = settings.crash || { enabled: true, minBet: 10, maxBet: 10000, houseFactor: 0.97 };

  // Auto-switch to main if demo is empty
  useEffect(() => {
    if (user.demoPoints <= 0 && user.realBalance > 0) {
      setSelectedBalance('main');
    }
  }, [user.demoPoints, user.realBalance]);

  // Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!canvas || !ctx) return;
      
      // Resize canvas to match parent
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw Grid (Subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (gameState === 'idle') {
        // Draw static line or "Ready" state
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText("Place your bet to start", width / 2, height / 2);
        return;
      }

      // Calculate curve based on time/multiplier
      
      // Let's do a time-based X
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const visualX = Math.min(width - 50, duration * 50);
      const visualY = height - Math.min(height - 50, (multiplier - 1) * 100);

      ctx.beginPath();
      ctx.moveTo(0, height);
      
      // Bezier curve for smoothness
      ctx.quadraticCurveTo(visualX / 2, height, visualX, visualY);
      
      ctx.lineWidth = 4;
      ctx.strokeStyle = gameState === 'crashed' ? '#ef4444' : '#E53935'; // Red
      ctx.stroke();

      // Fill Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, gameState === 'crashed' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(229, 57, 53, 0.5)');
      gradient.addColorStop(1, 'rgba(229, 57, 53, 0)');
      ctx.lineTo(visualX, height);
      ctx.lineTo(0, height);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw Rocket/Dot
      ctx.save();
      ctx.translate(visualX, visualY);
      // Rotate airplane at 27° angle (upward tilt)
      ctx.rotate(-27 * Math.PI / 180); 
      
      if (gameState === 'running') {
         // Draw Bold Minimalist Aviator-style Airplane in solid red
         ctx.fillStyle = '#E53935'; // Solid red
         
         // Rounded nose cone
         ctx.beginPath();
         ctx.arc(18, 0, 6, 0, Math.PI * 2);
         ctx.fill();
         
         // Main fuselage (thick rounded body)
         ctx.beginPath();
         ctx.roundRect(-20, -4, 38, 8, 4);
         ctx.fill();
         
         // Propeller blade (single thick blade)
         ctx.fillStyle = '#C62828'; // Darker red for propeller
         ctx.beginPath();
         ctx.ellipse(22, 0, 8, 2, 0, 0, Math.PI * 2);
         ctx.fill();
         
         // Cockpit window (curved)
         ctx.fillStyle = '#FFFFFF';
         ctx.globalAlpha = 0.4;
         ctx.beginPath();
         ctx.arc(8, -1, 3, 0, Math.PI * 2);
         ctx.fill();
         ctx.globalAlpha = 1.0;
         
         // Large tapered wing (single wing visible from side)
         ctx.fillStyle = '#E53935';
         ctx.beginPath();
         ctx.moveTo(-8, 0);
         ctx.lineTo(-15, -12);
         ctx.lineTo(5, -4);
         ctx.lineTo(5, 0);
         ctx.closePath();
         ctx.fill();
         
         // Tail fin (vertical stabilizer with X marking)
         ctx.beginPath();
         ctx.moveTo(-20, 0);
         ctx.lineTo(-22, -8);
         ctx.lineTo(-16, -8);
         ctx.lineTo(-18, 0);
         ctx.closePath();
         ctx.fill();
         
         // Horizontal stabilizer (small tail wing)
         ctx.beginPath();
         ctx.moveTo(-20, 0);
         ctx.lineTo(-24, 4);
         ctx.lineTo(-18, 3);
         ctx.closePath();
         ctx.fill();
         
         // 'X' marking on tail
         ctx.strokeStyle = '#FFFFFF';
         ctx.lineWidth = 1.5;
         ctx.lineCap = 'round';
         ctx.beginPath();
         ctx.moveTo(-21, -5);
         ctx.lineTo(-17, -2);
         ctx.moveTo(-17, -5);
         ctx.lineTo(-21, -2);
         ctx.stroke();
      } else if (gameState === 'crashed') {
         // Draw explosion text
         ctx.font = 'bold 16px sans-serif';
         ctx.fillStyle = '#ef4444';
         ctx.fillText("CRASHED", 10, 0);
      }
      ctx.restore();
    };

    // Animation Loop
    const animate = () => {
      draw();
      if (gameState === 'running') {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        draw(); // Draw final state
      }
    };

    animate();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, multiplier, crashPoint]);

  // Game Logic
  useEffect(() => {
    if (gameState === 'running') {
      soundManager.startFlySound();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        // Exponential growth: M = e^(k*t)
        const currentM = Math.pow(Math.E, 0.06 * elapsed);
        
        setMultiplier(currentM);
        soundManager.updateFlyPitch(currentM);

        if (currentM >= crashPoint) {
          crash(crashPoint);
        } else if (!cashedOut && autoCashout > 1 && currentM >= autoCashout) {
          // Pass currentM to handleCashout
          handleCashout(currentM);
        }
      }, 16); // ~60fps

      return () => {
        clearInterval(interval);
        soundManager.stopFlySound();
      };
    }
  }, [gameState, crashPoint, cashedOut, autoCashout]);

  const startGame = async () => {
    if (!config.enabled) {
      toast.error("Crash game is currently disabled by admin");
      return;
    }

    const balance = selectedBalance === 'demo' ? user.demoPoints : user.realBalance;
    
    // Redirect to deposit if demo balance is depleted
    if (selectedBalance === 'demo' && balance <= 0) {
      toast.error("Demo balance depleted! Please deposit to continue playing.");
      setTimeout(() => {
        setActiveTab?.('deposit'); // If parent provides this
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

    // Deduct bet
    if (selectedBalance === 'demo') {
      await updateUser({ demoPoints: balance - betAmount });
    } else {
      await updateUser({ realBalance: balance - betAmount });
    }
    
    // Determine crash point (Provably Fair)
    try {
      const crash = await generateGameResult('crash', Date.now().toString());
      // Apply House Factor logic if needed, though generateGameResult should handle basic randomness
      // We can multiply crash by houseFactor to slightly lower odds
      const adjustedCrash = Math.max(1.00, crash * (config.houseFactor || 0.99));
      
      setCrashPoint(Math.min(adjustedCrash, 100)); // Cap at 100x for demo safety
    } catch (error) {
      console.error("RNG Error:", error);
      setCrashPoint(1.00);
    }
    
    setGameState('running');
    setCashedOut(false);
    setMultiplier(1.00);
    startTimeRef.current = Date.now();
  };

  const crash = (finalM: number) => {
    setGameState('crashed');
    soundManager.stopFlySound();
    soundManager.playExplosion();
    setMultiplier(finalM);
    setHistory(prev => [finalM, ...prev].slice(0, 10));
    
    addGameHistory({
      id: Date.now().toString(),
      userId: user.id,
      game: 'crash',
      roundId: Date.now().toString(),
      betAmount,
      isDemo: selectedBalance === 'demo',
      result: finalM,
      winAmount: 0,
      multiplier: 0,
      serverSeed: 'hidden',
      seedHash: 'hash',
      timestamp: new Date().toISOString()
    });
  };

  const handleCashout = async (currentM: number = multiplier) => {
    if (gameState !== 'running' || cashedOut) return;

    setCashedOut(true);
    setCashedOutAt(currentM);
    soundManager.playWin();
    
    const winAmount = betAmount * currentM;
    
    if (selectedBalance === 'demo') {
      await updateUser({ demoPoints: user.demoPoints + winAmount });
    } else {
      await updateUser({ realBalance: user.realBalance + winAmount });
    }
    toast.success(`Cashed out at ${currentM.toFixed(2)}x! Won ${formatCurrency(winAmount)}`);
    
    addGameHistory({
      id: Date.now().toString(),
      userId: user.id,
      game: 'crash',
      roundId: Date.now().toString(),
      betAmount,
      isDemo: selectedBalance === 'demo',
      result: crashPoint,
      winAmount: winAmount,
      multiplier: currentM,
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
        {/* Game Display - Shows first on mobile, second on desktop */}
        <div className="lg:col-span-2 lg:order-2 space-y-4">
           {/* History Bar */}
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-linear-fade">
              {history.map((h, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className={`font-mono px-3 py-1 ${h >= 2 ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}
                >
                  {h.toFixed(2)}x
                </Badge>
              ))}
           </div>

           {/* Canvas Container */}
           <div className="relative w-full aspect-[16/9] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 ring-4 ring-slate-900/20">
              <canvas ref={canvasRef} className="w-full h-full" />
              
              {/* Overlay Info */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                 {gameState === 'idle' && (
                   <div className="text-slate-500 text-sm mt-8">Provably Fair • Live Demo</div>
                 )}
                 {gameState !== 'idle' && (
                   <div className={`text-6xl md:text-8xl font-black tracking-tighter transition-colors duration-200 ${
                      gameState === 'crashed' ? 'text-red-500' : cashedOut ? 'text-green-500' : 'text-white'
                   }`}>
                      {multiplier.toFixed(2)}x
                   </div>
                 )}
                 {gameState === 'crashed' && (
                    <div className="mt-4 px-4 py-2 bg-red-500/20 text-red-500 rounded-full text-sm font-bold border border-red-500/50 animate-bounce">
                       CRASHED @ {multiplier.toFixed(2)}x
                    </div>
                 )}
                 {cashedOut && gameState === 'running' && (
                    <div className="mt-4 px-4 py-2 bg-green-500/20 text-green-500 rounded-full text-sm font-bold border border-green-500/50">
                       YOU WON {formatCurrency(betAmount * cashedOutAt)}
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Controls - Shows second on mobile, first on desktop */}
        <Card className="h-fit shadow-xl border-none bg-card lg:order-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Crash
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
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={gameState === 'running'}
                  className="font-mono text-lg"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                 {[10, 100, 1000, 'Max'].map((v) => {
                    const maxBalance = selectedBalance === 'demo' ? user.demoPoints : user.realBalance;
                    // Cap max button at maxBet setting if lower than balance
                    const limit = Math.min(maxBalance, config.maxBet);
                    
                    return (
                      <Button 
                        key={v} 
                        variant="outline" 
                        size="sm"
                        disabled={gameState === 'running'}
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
               <span className="text-sm text-muted-foreground">Auto Cashout (x)</span>
               <div className="flex items-center gap-2">
                 <Slider 
                    min={1.01} 
                    max={10} 
                    step={0.1} 
                    value={[autoCashout]} 
                    onValueChange={([v]) => setAutoCashout(v)}
                    disabled={gameState === 'running'}
                    className="flex-1"
                 />
                 <Input 
                   type="number" 
                   value={autoCashout} 
                   onChange={(e) => setAutoCashout(Number(e.target.value))}
                   disabled={gameState === 'running'}
                   className="w-20 font-mono"
                 />
               </div>
            </div>

            {gameState === 'running' ? (
              <Button 
                className="w-full h-14 text-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                onClick={() => handleCashout()}
                disabled={cashedOut}
              >
                {cashedOut ? 'Cashed Out' : 'CASHOUT'}
              </Button>
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
                onDeposit={() => {
                  toast.info('Redirecting to wallet...'); 
                  window.location.href = '#wallet'; 
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}