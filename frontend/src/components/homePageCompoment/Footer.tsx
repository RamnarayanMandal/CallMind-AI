
import React from 'react'
import Link from 'next/link';
import { Bot } from 'lucide-react';

const Footer = () => {
  return (
     <footer className="border-t border-neutral-900 bg-neutral-950 py-16 text-neutral-500 relative z-10 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 text-left">
          <div className="col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3">
               <img src="/logo.png" alt="CallMind AI" className="h-10 w-auto" />
            </Link>
            <p className="text-neutral-400 max-w-xs leading-relaxed">
              Powering responsive, low-latency regional AI voice communications for modern
              high-growth enterprises globally.
            </p>
            <div className="text-[10px] text-neutral-600">
              SOC2 Type II • HIPAA Compliant • ISO-27001 Secure
            </div>
          </div>

          <div>
            <h5 className="font-bold text-neutral-200 uppercase tracking-wider mb-4 text-[10px]">Product</h5>
            <ul className="space-y-3 text-neutral-400 font-semibold">
              <li><Link href="#features" className="hover:text-white transition-colors">AI Core Engines</Link></li>
              <li><Link href="#demo" className="hover:text-white transition-colors">Call Simulator</Link></li>
              <li><Link href="#use-cases" className="hover:text-white transition-colors">Enterprise Solutions</Link></li>
              <li><Link href="/onboarding" className="hover:text-white transition-colors">Free Sandbox Access</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-neutral-200 uppercase tracking-wider mb-4 text-[10px]">Company</h5>
            <ul className="space-y-3 text-neutral-400 font-semibold">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-use" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact-us" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-neutral-900/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CallMind AI Platform. All rights reserved.</p>
          <div className="flex gap-6 text-[10px] font-semibold text-neutral-400">
            <span>Designed in Apple Style</span>
            <span>Powered by Next.js & Sarvam</span>
          </div>
        </div>
      </footer>
  )
}

export default Footer
