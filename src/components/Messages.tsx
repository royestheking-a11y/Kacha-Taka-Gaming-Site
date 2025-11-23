import React from 'react';
import { MessageSquare, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/App';

interface MessagesProps {
  user: User;
}

export function Messages({ user }: MessagesProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-none shadow-xl max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Support Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
           <div className="space-y-6">
             <div>
               <p className="text-muted-foreground">No new messages.</p>
             </div>
             <div className="space-y-3 border-t pt-6">
               <div className="flex items-center justify-center gap-2 text-sm">
                 <Mail className="w-4 h-4 text-primary" />
                 <span className="font-medium">Contact Support:</span>
               </div>
               <div className="space-y-2">
                 <p className="text-sm">
                   General: <a href="mailto:support@kachataka.com" className="text-primary hover:underline">support@kachataka.com</a>
                 </p>
                 <p className="text-sm">
                   Emergency: <a href="mailto:kachataka.org@gmail.com" className="text-primary hover:underline font-medium">kachataka.org@gmail.com</a>
                 </p>
               </div>
             </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}