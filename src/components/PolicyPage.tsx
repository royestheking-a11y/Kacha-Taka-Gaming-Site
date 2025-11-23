import React from 'react';
import { ArrowLeft, FileText, Shield, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { User } from '@/App';

interface PolicyPageProps {
  type: 'terms' | 'privacy' | 'responsible';
  user: User | null;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function PolicyPage({ type, user, onNavigate, onLogout }: PolicyPageProps) {
  const getContent = () => {
    switch (type) {
      case 'terms':
        return {
          icon: <FileText className="w-8 h-8 text-primary" />,
          title: 'Terms & Conditions',
          sections: [
            {
              heading: '1. Acceptance of Terms',
              content: 'By accessing and using Kacha Taka, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our platform.'
            },
            {
              heading: '2. Eligibility',
              content: 'You must be at least 18 years old to use our services. By using Kacha Taka, you represent and warrant that you are of legal age to form a binding contract.'
            },
            {
              heading: '3. Account Registration',
              content: 'You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.'
            },
            {
              heading: '4. Gaming Rules',
              content: 'All games on Kacha Taka use provably fair algorithms. Minimum bet is 10 pts. Results are final and cannot be disputed once confirmed. Users must play responsibly.'
            },
            {
              heading: '5. Deposits and Withdrawals',
              content: 'Minimum deposit is ৳100 (500 pts). Minimum withdrawal is ৳500 (2500 pts). Withdrawals are processed within 24-48 hours. All transactions must comply with local regulations.'
            },
            {
              heading: '6. Bonuses and Promotions',
              content: 'New users receive 100 demo points. Referral bonuses of 50 pts are awarded when your referral signs up. Bonus terms and conditions apply.'
            },
            {
              heading: '7. Fair Play Policy',
              content: 'Any attempt to manipulate games, exploit bugs, or engage in fraudulent activity will result in immediate account suspension and forfeiture of funds.'
            },
            {
              heading: '8. Limitation of Liability',
              content: 'Kacha Taka is provided "as is" without warranties. We are not liable for any losses incurred while using our platform. Users play at their own risk.'
            }
          ]
        };
      
      case 'privacy':
        return {
          icon: <Shield className="w-8 h-8 text-primary" />,
          title: 'Privacy Policy',
          sections: [
            {
              heading: '1. Information We Collect',
              content: 'We collect personal information including name, email, phone number, and transaction history. This data is stored locally in your browser for demo purposes.'
            },
            {
              heading: '2. How We Use Your Information',
              content: 'Your information is used to provide gaming services, process transactions, prevent fraud, and improve user experience. We do not sell your data to third parties.'
            },
            {
              heading: '3. Data Storage',
              content: 'All data in this demo version is stored locally in your browser using localStorage. In production, data would be encrypted and stored securely on our servers.'
            },
            {
              heading: '4. Cookies',
              content: 'We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze platform usage.'
            },
            {
              heading: '5. Data Security',
              content: 'We implement security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.'
            },
            {
              heading: '6. Your Rights',
              content: 'You have the right to access, update, or delete your personal information. Contact our support team for data-related requests.'
            },
            {
              heading: '7. Third-Party Services',
              content: 'We may use third-party payment processors. Their privacy policies apply to transactions processed through their services.'
            },
            {
              heading: '8. Changes to Privacy Policy',
              content: 'We reserve the right to update this privacy policy. Users will be notified of significant changes via email or platform notifications.'
            }
          ]
        };
      
      case 'responsible':
        return {
          icon: <Scale className="w-8 h-8 text-primary" />,
          title: 'Responsible Gaming',
          sections: [
            {
              heading: '1. Our Commitment',
              content: 'Kacha Taka is committed to promoting responsible gaming. We provide tools and resources to help users maintain control over their gaming activities.'
            },
            {
              heading: '2. Age Verification',
              content: 'Gaming is strictly prohibited for individuals under 18 years of age. We implement age verification procedures to prevent underage gambling.'
            },
            {
              heading: '3. Know Your Limits',
              content: 'Set personal limits for time and money spent on gaming. Never chase losses. Gaming should be entertainment, not a way to make money.'
            },
            {
              heading: '4. Warning Signs',
              content: 'Be aware of problem gaming signs: spending more than you can afford, gaming to escape problems, lying about gaming habits, neglecting responsibilities.'
            },
            {
              heading: '5. Self-Exclusion',
              content: 'Users can request temporary or permanent account suspension. Contact support to activate self-exclusion measures.'
            },
            {
              heading: '6. Reality Checks',
              content: 'We recommend taking regular breaks. Set reminders to step away from gaming. Balance gaming with other activities and responsibilities.'
            },
            {
              heading: '7. Support Resources',
              content: 'If you or someone you know has a gaming problem, seek help. Contact local support organizations or professional counseling services.'
            },
            {
              heading: '8. Financial Responsibility',
              content: 'Only deposit money you can afford to lose. Never borrow money to fund gaming. Keep gaming funds separate from essential expenses.'
            }
          ]
        };
      
      default:
        return {
          icon: <FileText className="w-8 h-8" />,
          title: 'Policy',
          sections: []
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar 
        user={user} 
        onNavigate={onNavigate} 
        onLogout={onLogout || (() => {})} 
      />
      
      <div className="flex-1 pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => onNavigate('landing')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card className="border-primary/20 shadow-xl">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3 mb-2">
                {content.icon}
                <CardTitle className="text-3xl">{content.title}</CardTitle>
              </div>
              <p className="text-muted-foreground">
                Last updated: November 22, 2025
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {content.sections.map((section, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-xl font-bold">{section.heading}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
              
              <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This is a demo platform. All features, transactions, and data are for demonstration purposes only. No real money is involved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
