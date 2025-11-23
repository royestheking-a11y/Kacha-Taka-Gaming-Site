import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authAPI } from '@/utils/api';
import { toast } from 'sonner';

interface OTPVerificationProps {
  email: string;
  purpose: 'registration' | 'password-reset' | 'login';
  onVerify: (email: string) => void;
  onResend: () => Promise<void>;
  onBack?: () => void;
  title?: string;
  description?: string;
  compact?: boolean; // For use in dialogs
}

export function OTPVerification({
  email,
  purpose,
  onVerify,
  onResend,
  onBack,
  title = 'Verify Your Email',
  description = 'Enter the 6-digit code sent to your email',
  compact = false,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for OTP expiry (10 minutes)
  useEffect(() => {
    const startTime = Date.now();
    const expiryTime = 10 * 60 * 1000; // 10 minutes
    
    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.floor((expiryTime - elapsed) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [email, purpose]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every((digit) => digit !== '') && newOtp.length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      setError('');
      inputRefs.current[5]?.focus();
      // Auto-verify after paste
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter a complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authAPI.verifyOTP(email, code, purpose);

      if (result.valid) {
        toast.success('Email verified successfully!');
        onVerify(email);
      } else {
        setError(result.message || 'Invalid OTP');
        toast.error(result.message || 'Invalid OTP');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
      toast.error(err.message || 'OTP verification failed');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    
    // Clear current OTP
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    
    try {
      await onResend();
      toast.success('New OTP sent to your email');
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP');
      toast.error('Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const content = (
    <>
      {!compact && onBack && (
        <Button
          variant="ghost"
          className="mb-8"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}

      <Card className={compact ? "border-none shadow-none" : "border-none shadow-xl"}>
          {!compact && (
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              {title && <CardTitle className="text-2xl">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
              <CardDescription className="mt-2 font-medium text-foreground">
                {email}
              </CardDescription>
            </CardHeader>
          )}
          {compact && (
            <CardHeader className="text-center pb-4">
              <CardDescription className="text-sm text-muted-foreground">
                Code sent to: <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
          )}
          <CardContent className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-4">
              <Label className="text-center block">Enter 6-digit code</Label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-14 w-14 text-center text-2xl font-bold"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Timer */}
            {timeLeft > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Code expires in: <span className="font-semibold text-foreground">{formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Verify Button */}
            <Button
              className="w-full h-12 text-lg"
              onClick={() => handleVerify()}
              disabled={isLoading || otp.some((d) => !d)}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              {timeLeft === 0 ? (
                <Button
                  variant="link"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-sm"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend OTP
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Didn't receive code?{' '}
                  <Button
                    variant="link"
                    onClick={handleResend}
                    disabled={isResending || timeLeft > 0}
                    className="h-auto p-0 text-sm"
                  >
                    {isResending ? 'Sending...' : 'Resend'}
                  </Button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
    </>
  );

  if (compact) {
    return <>{content}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {content}
      </motion.div>
    </div>
  );
}

