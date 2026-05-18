'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  Phone,
  BarChart3,
  Calendar,
  Zap,
  Target,
  Headphones,
  ArrowRight,
  ShieldCheck,
  Globe
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CallMind AI" className="rounded-lg h-16 w-auto" />

          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#solutions" className="text-sm font-medium hover:text-primary transition-colors">Solutions</Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden hero-gradient">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 animate-fade-in">
            <Zap className="h-3 w-3" />
            V2.0 IS NOW LIVE
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in">
            AI Voice Calling Platform for <br />
            <span className="gradient-text">Smart Marketing</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
            Automate your outreach, qualification, and support with human-like AI voice agents that convert 24/7.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Button size="lg" className="h-12 px-8 rounded-xl text-base" asChild>
              <Link href="/register">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl text-base">
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to scale</h2>
            <p className="text-slate-400">Powerful features designed for enterprise-grade voice automation.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'AI Calling', icon: Phone, desc: 'Human-like conversations with sub-second latency and natural tone.' },
              { title: 'Auto Scheduling', icon: Calendar, desc: 'Sync with your CRM and schedule bulk campaigns with one click.' },
              { title: 'Smart Analytics', icon: BarChart3, desc: 'Get deep insights from every call with AI-powered transcript analysis.' },
            ].map((f, i) => (
              <Card key={i} className="bg-neutral-900/50 border-slate-800 hover:border-primary/50 transition-all hover:-translate-y-1 text-white">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{f.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Product Types Section */}
      <section id="solutions" className="py-24 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Designed for every <br />use case</h2>
              <div className="space-y-6">
                {[
                  { title: 'Sales Calls', icon: Target, desc: 'Qualify leads and book meetings automatically.' },
                  { title: 'Customer Support', icon: Headphones, desc: 'Handle routine queries with intelligent AI agents.' },
                  { title: 'Lead Qualification', icon: Zap, desc: 'Instantly follow up with new leads from your website.' },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 h-10 w-10 shrink-0 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <s.icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{s.title}</h4>
                      <p className="text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-border/50 p-8">
                <div className="w-full h-full rounded-2xl bg-neutral-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center p-8 text-center text-white">
                  <div className="h-20 w-20 rounded-full bg-primary/10 animate-pulse mb-6 flex items-center justify-center">
                    <Phone className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-lg font-medium mb-2 text-white">Incoming Call...</p>
                  <p className="text-sm text-slate-400">AI Sales Agent Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            At CallMind AI, we believe that every business deserves the power of high-end voice technology.
            Our mission is to bridge the gap between human empathy and AI efficiency,
            empowering companies to build better relationships at scale.
          </p>
          <div className="grid grid-cols-3 gap-8 mt-16">
            <div>
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">500ms</div>
              <div className="text-sm text-muted-foreground">Latency</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">10k+</div>
              <div className="text-sm text-muted-foreground">Calls Daily</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-12 animate-fade-in">
              <img src="/logo.png" alt="CallMind AI" className="rounded-lg h-16 w-auto" />
            </Link>
            <p className="text-slate-400 max-w-xs leading-relaxed">
              Leading the revolution in AI-driven voice communications for modern enterprises.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-white">Product</h5>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-white">Company</h5>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-900 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} CallMind AI Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
