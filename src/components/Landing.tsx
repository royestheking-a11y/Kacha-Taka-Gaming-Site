import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Zap, Trophy, TrendingUp, Rocket, Dna, Gamepad2, Gift, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AuthDialog } from './AuthDialog';
import { TrustSection } from './TrustSection';
import { User } from '@/App';

interface LandingProps {
  onNavigate: (page: string) => void;
  user?: User | null;
  onLogin?: (user: User) => void;
}

export function Landing({ onNavigate, user = null, onLogin }: LandingProps) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    setAuthDialogOpen(true);
  };

  const handleLogin = (loggedInUser: User) => {
    setAuthDialogOpen(false);
    if (onLogin) {
      onLogin(loggedInUser);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Navbar user={user} onLogout={() => {
        localStorage.removeItem('kachaTaka_currentUser');
        window.location.reload(); 
      }} onNavigate={onNavigate} onLogin={onLogin} />
      
      {/* Auth Dialog */}
      <AuthDialog 
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onLogin={handleLogin}
        defaultTab={authTab}
      />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-500/5 blur-[120px]" />
        </div>

        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next Gen Gaming Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
              Play Smart. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-red-600">
                Win Big.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Experience the thrill of provably fair gaming with Kacha Taka. 
              Crash, Mines, Slots, and Dice awaits you.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Button size="lg" onClick={() => onNavigate('dashboard')} className="text-lg h-14 px-8 shadow-xl shadow-primary/25">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => handleOpenAuth('register')} className="text-lg h-14 px-8 shadow-xl shadow-primary/25">
                    Start Playing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleOpenAuth('login')} className="text-lg h-14 px-8">
                    Login
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-6 pt-4">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map((i) => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i*123}`} alt="User" />
                   </div>
                 ))}
               </div>
               <div className="text-sm">
                 <div className="flex items-center gap-2">
                   <span className="text-2xl font-black text-foreground">20k+</span>
                   <ShieldCheck className="w-5 h-5 text-green-500 fill-green-500" />
                 </div>
                 <span className="text-muted-foreground">Players Playing</span>
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative hidden md:block perspective-1000"
          >
            {/* 3D Floating Elements Mockup */}
            <div className="relative w-full aspect-square max-w-lg mx-auto">
               {/* Central Element - Rocket/Crash */}
               <motion.div 
                 animate={{ y: [0, -20, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-background to-muted rounded-3xl shadow-2xl border border-white/20 flex items-center justify-center z-20"
               >
                  <Rocket className="w-32 h-32 text-primary drop-shadow-lg" />
                  <div className="absolute bottom-4 left-0 right-0 text-center font-bold text-2xl">CRASH</div>
               </motion.div>

               {/* Background Elements */}
               <motion.div 
                 animate={{ y: [0, 30, 0] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                 className="absolute top-0 right-10 w-48 h-48 bg-white/5 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 flex items-center justify-center z-10"
               >
                  <Gamepad2 className="w-20 h-20 text-indigo-500" />
               </motion.div>

               <motion.div 
                 animate={{ y: [0, 25, 0] }}
                 transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                 className="absolute bottom-10 left-0 w-40 h-40 bg-white/5 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 flex items-center justify-center z-10"
               >
                  <Dna className="w-16 h-16 text-emerald-500" />
               </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Games Showcase */}
      <section className="py-20">
         <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Our Games</h2>
                <p className="text-muted-foreground">Select your favorite game and start winning.</p>
              </div>
              {user && (
                <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="hidden md:flex group">
                  View All Games <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <GameCard 
                 title="Crash" 
                 image="https://images.unsplash.com/photo-1718037324508-c2a0a889d6db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2NrZXQlMjBzcGFjZSUyMGZsaWdodHxlbnwxfHx8fDE3NjM4ODM3NjF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                 icon={<Rocket className="w-12 h-12 text-red-500" />}
                 onClick={() => user ? onNavigate('crash') : handleOpenAuth('register')}
                 description="Ride the rocket to the moon!"
               />
               <GameCard 
                 title="Mines" 
                 image="https://images.unsplash.com/photo-1666556277774-ff9b3876bd72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5lJTIwZ2VtcyUyMGRpYW1vbmRzfGVufDF8fHx8MTc2Mzg4Mzc2Mnww&ixlib=rb-4.1.0&q=80&w=1080"
                 icon={<TrendingUp className="w-12 h-12 text-emerald-500" />}
                 onClick={() => user ? onNavigate('mines') : handleOpenAuth('register')}
                 description="Find gems, avoid bombs."
               />
               <GameCard 
                 title="Slots" 
                 image="https://images.unsplash.com/photo-1706129867447-b4f156c46641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbG90JTIwbWFjaGluZSUyMGNhc2lub3xlbnwxfHx8fDE3NjM3NjIwNDl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                 icon={<Zap className="w-12 h-12 text-yellow-500" />}
                 onClick={() => user ? onNavigate('slots') : handleOpenAuth('register')}
                 description="Spin to win the jackpot!"
               />
               <GameCard 
                 title="Dice" 
                 image="https://images.unsplash.com/photo-1703319952169-4a3ed572ba0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWNlJTIwZ2FtZXxlbnwxfHx8fDE3NjM4MDkxOTl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                 icon={<Dna className="w-12 h-12 text-blue-500" />}
                 onClick={() => user ? onNavigate('dice') : handleOpenAuth('register')}
                 description="Predict the roll outcome."
               />
            </div>
         </div>
      </section>

      {/* Daily Spin Promotion - For non-users */}
      {!user && (
        <section className="py-20 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-red-500/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl mx-auto"
            >
              <Card className="border-none shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12">
                  {/* Left Side - Content */}
                  <div className="flex flex-col justify-center space-y-6 text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-sm font-medium w-fit border border-yellow-400/30">
                      <Star className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                      FREE DAILY BONUS
                    </div>
                    
                    <div>
                      <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                        Spin the Wheel<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
                          Win Every Day!
                        </span>
                      </h2>
                      <p className="text-lg text-indigo-200">
                        Join now and get a <span className="font-bold text-yellow-400">FREE daily spin</span> to win real cash and demo points! 
                        No deposit required to start playing.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                          <Gift className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-indigo-100">Win up to <strong className="text-yellow-400">৳50</strong> in real cash</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                          <Trophy className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-indigo-100">Get <strong className="text-yellow-400">200+</strong> demo points instantly</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                          <ShieldCheck className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-indigo-100"><strong className="text-yellow-400">100% free</strong> - no strings attached</span>
                      </div>
                    </div>

                    <Button 
                      size="lg" 
                      onClick={() => handleOpenAuth('register')}
                      className="text-lg h-14 px-8 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-white font-black shadow-2xl shadow-yellow-500/25 border-2 border-yellow-400/50 transform hover:scale-105 transition-all"
                    >
                      <Gift className="mr-2 w-5 h-5" />
                      Sign Up & Spin Now!
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>

                    <p className="text-xs text-indigo-300/60">
                      ✨ Spin resets every 24 hours • Join <strong>20k+</strong> players already winning
                    </p>
                  </div>

                  {/* Right Side - Animated Wheel Preview */}
                  <div className="flex items-center justify-center relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="relative w-72 h-72 md:w-80 md:h-80"
                    >
                      {/* Simplified Wheel Visual */}
                      <div className="absolute inset-0 rounded-full border-8 border-yellow-400/50 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 shadow-2xl shadow-purple-500/50" />
                      
                      {/* Wheel Segments Visual Effect */}
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-1/2 left-1/2 w-1/2 h-1 origin-left"
                          style={{
                            transform: `rotate(${i * 45}deg)`,
                            background: `linear-gradient(to right, rgba(234, 179, 8, 0.8), transparent)`
                          }}
                        />
                      ))}
                      
                      {/* Center Glow */}
                      <div className="absolute inset-0 rounded-full flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 shadow-lg shadow-yellow-500/50 flex items-center justify-center"
                        >
                          <Star className="w-12 h-12 text-white" />
                        </motion.div>
                      </div>
                    </motion.div>
                    
                    {/* Floating Prizes */}
                    <motion.div
                      animate={{ y: [0, -20, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-0 right-0 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
                    >
                      +৳5
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="absolute bottom-10 left-0 bg-blue-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
                    >
                      +200 pts
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold tracking-tight mb-4">Why Choose Kacha Taka?</h2>
             <p className="text-muted-foreground max-w-2xl mx-auto">
               We provide the most transparent and secure gaming experience in the market.
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-10 h-10 text-emerald-500" />}
              title="Provably Fair"
              description="Every game result can be verified by you. No manipulation, pure chance."
            />
            <FeatureCard 
              icon={<Zap className="w-10 h-10 text-yellow-500" />}
              title="Instant Transactions"
              description="Deposits and withdrawals are processed instantly using local wallet systems."
            />
            <FeatureCard 
              icon={<Trophy className="w-10 h-10 text-primary" />}
              title="Daily Rewards"
              description="Earn points daily and climb the leaderboard to win exclusive prizes."
            />
          </div>
        </div>
      </section>

      {/* Trust Section - Shows user activity and stats */}
      <TrustSection />

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-lg bg-card hover:shadow-xl transition-all duration-300">
      <CardContent className="pt-6">
        <div className="mb-4 bg-background w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function GameCard({ title, image, icon, onClick, description }: { title: string, image: string, icon: React.ReactNode, onClick: () => void, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group cursor-pointer relative h-[300px] rounded-3xl overflow-hidden shadow-xl"
      onClick={onClick}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: `url(${image})` }} 
      />
      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white/20 transform group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
          {description}
        </p>
        <Button className="mt-6 opacity-0 group-hover:opacity-100 transition-all duration-300" variant="secondary">
          Play Now
        </Button>
      </div>
    </motion.div>
  );
}