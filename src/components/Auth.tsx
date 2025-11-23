import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { initializeStorage } from '@/utils/storageMongo';
import { authAPI } from '@/utils/api';
import { User } from '@/App';
import { OTPVerification } from './OTPVerification';
import { sendOTPEmail } from '@/utils/emailService';
import { toast } from 'sonner';

interface AuthProps {
  onLogin: (user: User) => void;
  onNavigate: (page: string) => void;
  defaultTab?: 'login' | 'register';
}

type AuthStep = 'login' | 'register' | 'otp-verification' | 'forgot-password' | 'reset-password';

export function Auth({ onLogin, onNavigate, defaultTab = 'login' }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>(defaultTab);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [regOTP, setRegOTP] = useState(['', '', '', '', '', '']);
  
  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [passwordResetOTPVerified, setPasswordResetOTPVerified] = useState(false);
  
  // Initialize on mount
  React.useEffect(() => {
    initializeStorage();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(loginEmail, loginPassword);
      if (response.user && response.token) {
        onLogin(response.user, response.token);
        toast.success('Login successful!');
      } else {
        setError('Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // If OTP input is already shown, don't submit the form again
    if (showOTPInput) {
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send OTP via API (backend stores in MongoDB)
      const result = await authAPI.sendOTP(regEmail, 'registration');
      
      // Get the OTP from response and send email
      const otpCode = result.otp || '';
      if (otpCode) {
        try {
          await sendOTPEmail(regEmail, otpCode, 'registration');
        } catch (emailError) {
          console.error('Email sending error:', emailError);
        }
      }
      
      if (result.success) {
        toast.success('OTP sent to your email');
        setShowOTPInput(true);
        setError('');
        setSuccess('OTP sent to your email. Please check and enter the code below.');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      toast.error('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    setRegOTP(['', '', '', '', '', '']);
    
    try {
      const otp = generateOTP();
      storeOTP(regEmail, otp, 'registration');
      
      const result = await sendOTPEmail(regEmail, otp, 'registration');
      
      if (result.success) {
        toast.success('New OTP sent to your email');
        setSuccess('New OTP sent to your email. Please check and enter the code.');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err) {
      setError('Failed to resend OTP');
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Register user via API
      const response = await authAPI.register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        referralCode: referralCode.trim() || undefined
      });
      
      if (response.user && response.token) {
        if (response.user.referredBy) {
          toast.success('Account created! Referral bonus awarded to your referrer.');
        } else {
          toast.success('Account created successfully!');
        }
        
        // Clear form and go to login
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
        setReferralCode('');
        setRegOTP(['', '', '', '', '', '']);
        setShowOTPInput(false);
        setCurrentStep('login');
        setSuccess('Account created successfully! Please log in.');
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = regOTP.join('').trim();
    
    if (otpCode.length !== 6) {
      setError('Please enter a complete 6-digit OTP code');
      return;
    }

    // Validate that all characters are digits
    if (!/^\d{6}$/.test(otpCode)) {
      setError('OTP must contain only numbers');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authAPI.verifyOTP(regEmail, otpCode, 'registration');

      if (result.valid) {
        toast.success('Email verified successfully!');
        await handleOTPVerified();
      } else {
        setError(result.message || 'Invalid OTP');
        toast.error(result.message || 'Invalid OTP');
        setRegOTP(['', '', '', '', '', '']);
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
      toast.error(err.message || 'OTP verification failed');
      setRegOTP(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPInputChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...regOTP];
    newOtp[index] = value;
    setRegOTP(newOtp);
    setError('');

    // Auto-submit when all 6 digits are entered
    if (newOtp.every((digit) => digit !== '') && newOtp.length === 6) {
      handleVerifyOTP();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Send OTP via API (backend checks if user exists)
      const result = await authAPI.sendOTP(forgotEmail, 'password-reset');
      
      if (result.success) {
        const otpCode = result.otp || '';
        if (otpCode) {
          try {
            await sendOTPEmail(forgotEmail, otpCode, 'password-reset');
          } catch (emailError) {
            console.error('Email sending error:', emailError);
          }
        }
        toast.success('OTP sent to your email');
        setPasswordResetOTPVerified(false);
        setCurrentStep('reset-password');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPasswordOTP = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await authAPI.sendOTP(forgotEmail, 'password-reset');
      
      if (result.success) {
        const otpCode = result.otp || '';
        if (otpCode) {
          try {
            await sendOTPEmail(forgotEmail, otpCode, 'password-reset');
          } catch (emailError) {
            console.error('Email sending error:', emailError);
          }
        }
        toast.success('New OTP sent to your email');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetOTPVerified = () => {
    setPasswordResetOTPVerified(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (resetPassword !== resetConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (resetPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Reset password via API
      await authAPI.resetPassword(forgotEmail, resetPassword);
      
      toast.success('Password reset successfully!');
      setSuccess('Password reset successfully! Please log in.');
      
      // Clear form and go to login
      setForgotEmail('');
      setResetPassword('');
      setResetConfirmPassword('');
      setPasswordResetOTPVerified(false);
      setCurrentStep('login');
      
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Show OTP verification screen
  if (currentStep === 'otp-verification') {
    return (
      <OTPVerification
        email={regEmail}
        purpose="registration"
        onVerify={handleOTPVerified}
        onResend={handleResendOTP}
        onBack={() => setCurrentStep('register')}
        title="Verify Your Email"
        description="We've sent a 6-digit code to your email address"
      />
    );
  }

  // Show password reset OTP verification
  if (currentStep === 'reset-password' && forgotEmail && !passwordResetOTPVerified) {
    return (
      <OTPVerification
        email={forgotEmail}
        purpose="password-reset"
        onVerify={(email) => {
          handlePasswordResetOTPVerified();
        }}
        onResend={handleResendPasswordOTP}
        onBack={() => {
          setCurrentStep('forgot-password');
          setPasswordResetOTPVerified(false);
        }}
        title="Verify Your Email"
        description="Enter the code sent to your email to reset password"
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Button 
          variant="ghost" 
          className="mb-8" 
          onClick={() => onNavigate('landing')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {currentStep === 'forgot-password' ? 'Reset Password' : 
             currentStep === 'reset-password' ? 'Set New Password' :
             'Welcome Back'}
          </h1>
          <p className="text-muted-foreground">
            {currentStep === 'forgot-password' ? 'Enter your email to receive reset code' :
             currentStep === 'reset-password' ? 'Enter your new password' :
             'Enter your details to access your account'}
          </p>
        </div>

        {/* Forgot Password Form */}
        {currentStep === 'forgot-password' && (
          <Card className="border-none shadow-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input 
                    id="forgot-email" 
                    type="email" 
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required 
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button className="w-full h-12 text-lg mt-6" type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
                
                <Button 
                  type="button"
                  variant="link" 
                  className="w-full text-sm text-muted-foreground"
                  onClick={() => setCurrentStep('login')}
                >
                  Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Reset Password Form */}
        {currentStep === 'reset-password' && (
          <Card className="border-none shadow-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-pass">New Password</Label>
                  <Input 
                    id="reset-pass" 
                    type="password" 
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm">Confirm Password</Label>
                  <Input 
                    id="reset-confirm" 
                    type="password" 
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <Button className="w-full h-12 text-lg mt-6" type="submit" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Login/Register Tabs */}
        {(currentStep === 'login' || currentStep === 'register') && (
          <Tabs 
            value={currentStep} 
            onValueChange={(v) => setCurrentStep(v as AuthStep)}
            className="w-full"
          >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="border-none shadow-xl">
              <CardContent className="pt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button className="w-full h-12 text-lg mt-6" type="submit" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <Button 
                  type="button"
                  variant="link" 
                  className="text-sm text-muted-foreground"
                  onClick={() => setCurrentStep('forgot-password')}
                >
                  Forgot password?
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card className="border-none shadow-xl">
              <CardContent className="pt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input 
                      id="reg-name" 
                      placeholder="John Doe" 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input 
                      id="reg-email" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Phone (Optional)</Label>
                    <Input 
                      id="reg-phone" 
                      placeholder="+880..." 
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-pass">Password</Label>
                      <Input 
                        id="reg-pass" 
                        type="password" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm">Confirm</Label>
                      <Input 
                        id="reg-confirm" 
                        type="password" 
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                    <Input 
                      id="referral-code" 
                      placeholder="Enter referral code" 
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </div>

                  {/* OTP Input Section - Shows after form submission */}
                  {showOTPInput && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label className="text-center block">Enter OTP Code</Label>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                          We've sent a 6-digit code to <strong>{regEmail}</strong>
                        </p>
                        <div className="flex justify-center gap-2">
                          {regOTP.map((digit, index) => (
                            <Input
                              key={index}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOTPInputChange(index, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !digit && index > 0) {
                                  const prevInput = document.getElementById(`reg-otp-${index - 1}`) as HTMLInputElement;
                                  prevInput?.focus();
                                }
                              }}
                              id={`reg-otp-${index}`}
                              className="h-12 w-12 text-center text-xl font-bold"
                              disabled={isLoading}
                            />
                          ))}
                        </div>
                        <div className="flex justify-center gap-2 mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleResendOTP}
                            disabled={isLoading}
                            className="text-sm"
                          >
                            Resend OTP
                          </Button>
                          <Button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={isLoading || regOTP.some((d) => !d)}
                            className="text-sm"
                          >
                            {isLoading ? 'Verifying...' : 'Verify OTP'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}
                  
                  {!showOTPInput && (
                    <Button className="w-full h-12 text-lg mt-6" type="submit" disabled={isLoading}>
                      {isLoading ? 'Sending OTP...' : 'Create Account'}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </motion.div>
    </div>
  );
}