'use client';

import React from 'react';
import Link from 'next/link';
import { Bot } from 'lucide-react';
import { DemoWizard } from '@/components/demo/DemoWizard';

export default function DemoboardingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary-500/6 blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary-500/6 blur-[140px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-extrabold text-white tracking-tight">CallMind AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 hidden sm:block">Already have an account?</span>
          <Link
            href="/login"
            className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors border border-primary-500/30 rounded-full px-4 py-1.5"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-12 px-4">
        <DemoWizard />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-neutral-900 text-center bg-neutral-950/40">
        <p className="text-[11px] text-neutral-600">
          By continuing, you agree to our{' '}
          <Link href="#" className="text-neutral-450 hover:text-white underline underline-offset-2 transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" className="text-neutral-450 hover:text-white underline underline-offset-2 transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
