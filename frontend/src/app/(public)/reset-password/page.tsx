'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (!email) {
      toast.error('No email address provided for password reset.');
      router.push('/forgot-password');
    }
  }, [email, router]);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);

      // Focus previous input
      if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');

    if (pasteData.length === 6) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      newOtp.forEach((char, index) => {
        if (inputRefs.current[index]) {
          inputRefs.current[index].value = char;
        }
      });
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length < 6) {
      toast.error('Please enter all 6 digits of the OTP.');
      return;
    }
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        otp: otpCode,
        newPassword,
      });
      toast.success(response.message || 'Password reset successfully!');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please verify the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 hero-gradient">
      <Card className="max-w-md w-full border-border/50 bg-card/50 shadow-2xl animate-fade-in backdrop-blur-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Enter the 6-digit OTP code sent to <span className="text-white font-semibold">{email}</span> and your new password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* OTP Code Blocks */}
            <div className="space-y-2">
              <Label className="text-slate-300">6-Digit Verification Code</Label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    ref={(el) => {
                      if (el) inputRefs.current[index] = el;
                    }}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-slate-800 bg-slate-900/50 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 rounded-xl bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-primary pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-primary"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full h-11 rounded-xl font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Reset Password'}
            </Button>

            <p className="text-sm text-center text-slate-400 mt-2">
              Back to{' '}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyOtpContentWrapper />
    </Suspense>
  );
}

function VerifyOtpContentWrapper() {
  return <ResetPasswordContent />;
}
