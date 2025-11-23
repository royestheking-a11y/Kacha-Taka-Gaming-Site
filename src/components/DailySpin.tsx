import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, Variants } from 'motion/react';
import { Gift, Trophy, Coins, Zap, Star, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { User } from '@/App';
import { formatCurrency } from '@/utils/storage';

interface DailySpinProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

interface Segment {
  label: string;
  value: string;
  type: 'demo' | 'real' | 'multiplier';
  amount: number;
  color: string;
  textColor: string;
  icon: React.ReactNode;
  probability: number; // 0-100
}

const SEGMENTS: Segment[] = [
  { label: '+50 Pts', value: '50pts', type: 'demo', amount: 50, color: '#3b82f6', textColor: '#ffffff', icon: <Coins size={16} />, probability: 30 },
  { label: '+2 ৳', value: '2bdt', type: 'real', amount: 2, color: '#10b981', textColor: '#ffffff', icon: <Zap size={16} />, probability: 10 },
  { label: '+100 Pts', value: '100pts', type: 'demo', amount: 100, color: '#6366f1', textColor: '#ffffff', icon: <Coins size={16} />, probability: 20 },
  { label: 'Free Bet', value: 'freebet', type: 'demo', amount: 200, color: '#eab308', textColor: '#ffffff', icon: <Gift size={16} />, probability: 15 },
  { label: '+5 ৳', value: '5bdt', type: 'real', amount: 5, color: '#f43f5e', textColor: '#ffffff', icon: <Star size={16} />, probability: 5 },
  { label: '+200 Pts', value: '200pts', type: 'demo', amount: 200, color: '#8b5cf6', textColor: '#ffffff', icon: <Coins size={16} />, probability: 10 },
  { label: 'JACKPOT', value: 'jackpot', type: 'real', amount: 50, color: '#ffd700', textColor: '#000000', icon: <Trophy size={16} />, probability: 1 },
  { label: '+20 Pts', value: '20pts', type: 'demo', amount: 20, color: '#06b6d4', textColor: '#ffffff', icon: <Coins size={16} />, probability: 9 },
];

export function DailySpin({ user, updateUser }: DailySpinProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [winSegment, setWinSegment] = useState<Segment | null>(null);
  const [canSpin, setCanSpin] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkCanSpin();
    const interval = setInterval(checkCanSpin, 1000);
    return () => clearInterval(interval);
  }, [user.lastDailySpin]);

  const checkCanSpin = () => {
    if (!user.lastDailySpin) {
      setCanSpin(true);
      setTimeRemaining('');
      return;
    }

    const lastSpin = new Date(user.lastDailySpin).getTime();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const diff = now - lastSpin;

    if (diff >= oneDay) {
      setCanSpin(true);
      setTimeRemaining('');
    } else {
      setCanSpin(false);
      const remaining = oneDay - diff;
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }
  };

  const spinWheel = () => {
    if (isSpinning || !canSpin) return;

    setIsSpinning(true);

    // Weighted random selection
    const totalWeight = SEGMENTS.reduce((sum, seg) => sum + seg.probability, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    
    for (let i = 0; i < SEGMENTS.length; i++) {
      random -= SEGMENTS[i].probability;
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const segmentAngle = 360 / SEGMENTS.length;
    // Calculate target rotation
    // We want to land on selectedIndex. 
    // Pointer is at top (0 degrees). 
    // If we rotate clockwise, the segment at 0 moves to right.
    // To land index i at top, we need to rotate such that index i is at 0deg (or 360deg).
    // Assuming segment 0 starts at -angle/2 to +angle/2 centered at top.
    
    // Let's say we add lots of full rotations (e.g. 5 * 360)
    // Then add the specific angle to align the selected segment to top.
    // If segment 0 is at top, rotation is 0.
    // If segment 1 is at top, rotation is -segmentAngle (counter-clockwise brings it to top? No, clockwise spins the wheel).
    // If we spin clockwise, the segments move clockwise. Segment at index 1 (which is at 45 deg initially) moves to 90... 
    // Wait. 
    // Let's map segments:
    // Seg 0: 0 deg (Top)
    // Seg 1: 45 deg
    // Seg 2: 90 deg
    // ...
    // To bring Seg 1 to Top (0 deg), we must rotate the wheel by -45 deg (Counter Clockwise) OR 360 - 45 = 315 deg (Clockwise).
    // So target rotation = FullSpins * 360 + (360 - (selectedIndex * segmentAngle)).
    // Add a random offset within the segment to make it look natural.
    
    const spins = 5 + Math.floor(Math.random() * 5); // 5-10 full spins
    const baseTarget = 360 - (selectedIndex * segmentAngle); 
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8); // Stay safely within segment
    
    const targetRotation = rotation + (spins * 360) + baseTarget + randomOffset;
    
    // Note: We add to current 'rotation' to ensure continuous spinning in one direction
    // But we need to handle the "modulo 360" logic carefully if we want exact alignment.
    // Actually simpler: just set a new huge rotation value.
    
    const realTarget = (spins * 360) + (360 - (selectedIndex * segmentAngle)); 
    // This doesn't account for current rotation. 
    // Best to just add relative amount.
    
    // Current position mod 360
    const currentMod = rotation % 360;
    // Distance to target
    const distance = realTarget - currentMod;
    
    const finalRotation = rotation + distance + (360 * 5); // Ensure at least 5 spins

    setRotation(finalRotation);
    
    // Animation time is 4 seconds
    setTimeout(() => {
      setIsSpinning(false);
      setWinSegment(SEGMENTS[selectedIndex]);
      setShowResult(true);
      handleWin(SEGMENTS[selectedIndex]);
    }, 4000);
  };

  const handleWin = async (segment: Segment) => {
    const now = new Date().toISOString();
    let newDemo = user.demoPoints;
    let newReal = user.realBalance;

    if (segment.type === 'demo') {
      newDemo += segment.amount;
      toast.success(`You won ${segment.amount} Demo Points!`);
    } else if (segment.type === 'real') {
      newReal += segment.amount;
      toast.success(`You won ৳${segment.amount} Real Balance!`);
    }

    await updateUser({
      demoPoints: newDemo,
      realBalance: newReal,
      lastDailySpin: now
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-950 to-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md">Daily Lucky Spin</h2>
        <p className="text-indigo-200">Spin the wheel to win free points and cash!</p>
      </div>

      <div className="relative mb-8">
        {/* Pointer */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 filter drop-shadow-lg">
          <ArrowDown className="w-12 h-12 text-red-500 fill-red-500 stroke-white stroke-[3px]" />
        </div>

        {/* Wheel Container */}
        <div 
          className="relative w-80 h-80 md:w-96 md:h-96 rounded-full border-[8px] border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] bg-slate-800 overflow-hidden"
          style={{
             transition: 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)',
             transform: `rotate(${rotation}deg)`
          }}
        >
          {/* Segments */}
          {SEGMENTS.map((seg, index) => {
            const angle = 360 / SEGMENTS.length;
            const rotate = index * angle;
            const skew = 90 - angle; // standard formula for creating pie slices with skew transform

            return (
              <div
                key={index}
                className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left border-l border-b border-white/10"
                style={{
                  transform: `rotate(${rotate}deg) skewY(-${skew}deg)`,
                  background: `linear-gradient(135deg, ${seg.color}, ${adjustColor(seg.color, -20)})`
                }}
              >
                <div 
                   className="absolute bottom-0 left-0 w-full h-full flex flex-col items-center justify-end pb-8 pl-8"
                   style={{
                     transform: `skewY(${skew}deg) rotate(${angle/2}deg)`, // Unskew and center content
                     textAlign: 'center'
                   }}
                >
                   <div className="transform rotate-[-90deg] flex items-center gap-2 font-bold" style={{ color: seg.textColor }}>
                      {seg.icon}
                      <span>{seg.label}</span>
                   </div>
                </div>
              </div>
            );
          })}
          
          {/* Center Cap */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full shadow-lg z-10 flex items-center justify-center border-4 border-white/20">
             <Star className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
      </div>

      <div className="relative z-10">
         {canSpin ? (
           <Button 
             size="lg" 
             onClick={spinWheel} 
             disabled={isSpinning}
             className="text-xl font-bold px-12 py-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 border-b-4 border-green-800 transform active:translate-y-1 active:border-b-0 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.4)]"
           >
             {isSpinning ? 'Good Luck!...' : 'SPIN NOW'}
           </Button>
         ) : (
           <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-4 text-center min-w-[250px]">
             <p className="text-slate-400 mb-1">Next spin available in</p>
             <p className="text-2xl font-mono font-bold text-white">{timeRemaining}</p>
           </div>
         )}
      </div>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-yellow-400 flex flex-col items-center gap-2">
               <Trophy className="w-12 h-12" />
               Congratulations!
            </DialogTitle>
            <DialogDescription className="text-center text-lg text-slate-300">
               You won
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6 space-y-4">
             <div className="p-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/50 animate-bounce">
                {winSegment?.icon && React.cloneElement(winSegment.icon as React.ReactElement, { size: 48, className: "text-yellow-400" })}
             </div>
             <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                {winSegment?.label}
             </div>
             <p className="text-sm text-slate-400">
                {winSegment?.type === 'demo' ? 'Added to Demo Balance' : 'Added to Real Balance'}
             </p>
          </div>

          <Button onClick={() => setShowResult(false)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
             Claim Prize
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper to darken/lighten color
function adjustColor(color: string, amount: number) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}
