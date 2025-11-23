import React from 'react';
import { Github, Twitter, Facebook, Instagram } from 'lucide-react';

export function Footer({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <footer className="bg-background border-t py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold">Kacha<span className="text-primary">Taka</span></span>
            </div>
            <p className="text-muted-foreground text-sm">
              The premium gaming platform for provably fair crypto and fiat gaming. 
              Experience the thrill with Crash, Mines, Slots, and Dice.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => onNavigate('landing')} className="hover:text-primary transition-colors">Games</button></li>
              <li><button onClick={() => onNavigate('profile')} className="hover:text-primary transition-colors">VIP Club</button></li>
              <li><button onClick={() => onNavigate('wallet')} className="hover:text-primary transition-colors">Promotions</button></li>
              <li><button onClick={() => onNavigate('profile')} className="hover:text-primary transition-colors">Referral System</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => onNavigate('messages')} className="hover:text-primary transition-colors">Help Center</button></li>
              <li><button onClick={() => onNavigate('terms')} className="hover:text-primary transition-colors">Terms of Service</button></li>
              <li><button onClick={() => onNavigate('privacy')} className="hover:text-primary transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate('responsible')} className="hover:text-primary transition-colors">Responsible Gaming</button></li>
              <li><button onClick={() => onNavigate('fairness')} className="hover:text-primary transition-colors">Fairness</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <div className="flex gap-4">
              <SocialLink icon={<Twitter className="w-5 h-5" />} />
              <SocialLink icon={<Facebook className="w-5 h-5" />} />
              <SocialLink icon={<Instagram className="w-5 h-5" />} />
              <SocialLink icon={<Github className="w-5 h-5" />} />
            </div>
            <div className="mt-6">
              <h3 className="font-semibold mb-2 text-sm">Administration</h3>
              <button 
                onClick={() => onNavigate('admin-login')} 
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                Admin Panel
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kacha Taka. All rights reserved.
          </p>
          <div className="flex gap-2">
             <div className="px-2 py-1 rounded border bg-card text-xs font-medium text-muted-foreground">18+</div>
             <div className="px-2 py-1 rounded border bg-card text-xs font-medium text-muted-foreground">Provably Fair</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ icon }: { icon: React.ReactNode }) {
  return (
    <a 
      href="#" 
      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
    >
      {icon}
    </a>
  );
}