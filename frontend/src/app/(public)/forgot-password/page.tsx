'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      toast.success(response.message || 'OTP code sent to your email.');
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 hero-gradient">
      <Card className="max-w-md w-full border-border/50 bg-card/50 shadow-2xl animate-fade-in backdrop-blur-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Enter your registered email address and we will send you a 6-digit OTP code to reset your password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full h-11 rounded-xl font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Send Reset OTP'}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign in
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
