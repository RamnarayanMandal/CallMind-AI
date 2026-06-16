"use client";
import React, { useState } from 'react'
import {AnimatePresence, motion} from 'framer-motion';
import {  Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

const NavBar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
        className="fixed top-0 w-full z-50 glass border-b border-neutral-800/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="CallMind AI" className="h-10 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            {["How It Works", "Features", "Live Simulator", "Solutions", "FAQ"].map(
              (label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                >
                  <Link
                    href={`#${
                      label === "How It Works"
                        ? "how-it-works"
                        : label === "Live Simulator"
                        ? "demo"
                        : label === "Solutions"
                        ? "use-cases"
                        : label.toLowerCase()
                    }`}
                    className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </motion.div>
              )
            )}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Button variant="ghost" className="text-neutral-300 hover:text-white" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                className="rounded-xl bg-gradient-brand hover:opacity-90 font-semibold px-6 shadow-glow transition-all"
                asChild
              >
                <Link href="/onboarding">Start Free Trial</Link>
              </Button>
            </motion.div>
          </div>

          {/* Mobile menu trigger */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileMenuOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="lg:hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-xl px-6 py-8 space-y-6"
            >
              <div className="flex flex-col gap-4">
                {[
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "Features", href: "#features" },
                  { label: "Live Simulator", href: "#demo" },
                  { label: "Solutions", href: "#use-cases" },
                  { label: "FAQ", href: "#faq" },
                ].map(({ label, href }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 120, damping: 16 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-neutral-300 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-neutral-800 pt-6 flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-neutral-800 text-white"
                  asChild
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button className="w-full rounded-xl bg-gradient-brand hover:opacity-90 font-semibold" asChild>
                  <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)}>Start Free Trial</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
  )
}

export default NavBar
