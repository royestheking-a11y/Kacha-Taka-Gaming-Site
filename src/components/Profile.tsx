import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, Lock, Save, Gift, Users, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from '@/App';
import { getReferrals } from '@/utils/storage';
import { toast } from 'sonner';

interface ProfileProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

export function Profile({ user, updateUser }: ProfileProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const referrals = getReferrals(user.id);

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
       updateUser({ name, email, phone });
       setIsLoading(false);
       toast.success("Profile updated successfully");
    }, 1000);
  };

  const handleCopyReferralCode = () => {
    if (user.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid gap-6">
        <Card className="border-none shadow-xl">
           <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your account information.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                 <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                    <AvatarFallback>U</AvatarFallback>
                 </Avatar>
                 <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <p className="text-muted-foreground">{user.isAdmin ? 'Administrator' : 'User'}</p>
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                       {user.kycStatus === 'verified' ? 'Verified Account' : 'Unverified'}
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-medium flex items-center gap-2">
                          <UserIcon className="w-4 h-4" /> Full Name
                       </label>
                       <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4" /> Email Address
                       </label>
                       <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4" /> Phone Number
                       </label>
                       <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium flex items-center gap-2">
                          <Lock className="w-4 h-4" /> Password
                       </label>
                       <Button variant="outline" className="w-full justify-start text-muted-foreground">
                          Change Password
                       </Button>
                    </div>
                 </div>
                 
                 <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={isLoading} className="min-w-[150px]">
                       {isLoading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                    </Button>
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Referral Section */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Referral Program
            </CardTitle>
            <CardDescription>Invite friends and earn rewards!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Referral Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Referral Code</label>
              <div className="flex gap-2">
                <Input 
                  value={user.referralCode || 'N/A'} 
                  readOnly 
                  className="font-mono font-bold text-lg"
                />
                <Button 
                  onClick={handleCopyReferralCode}
                  variant="outline"
                  className="min-w-[100px]"
                >
                  {copied ? (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Copied</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this code with your friends. They get 100 bonus points, you get 50 points!
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Total Referrals</span>
                </div>
                <p className="text-3xl font-bold">{referrals.length}</p>
              </div>
              <div className="bg-background p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Earnings</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {(user.referralEarnings || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>

            {/* Referred Users List */}
            {referrals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Your Referrals</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {referrals.map((ref) => (
                    <div 
                      key={ref.id} 
                      className="flex items-center justify-between p-3 bg-background rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ref.name}`} />
                          <AvatarFallback>{ref.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{ref.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(ref.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">+50 pts</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}