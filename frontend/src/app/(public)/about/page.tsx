'use client';
import { Bot, ShieldCheck, Zap, Globe, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="fixed top-0 w-full z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CallMind AI" className="h-8 w-auto" />
            <span className="text-xl font-bold tracking-tight">CallMind AI</span>
          </Link>
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

      <section className="pt-32 pb-20 bg-neutral-950 hero-gradient">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-8">Empowering business with <span className="gradient-text">Ethical AI</span></h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Founded in 2024, CallMind AI was built with a single goal in mind: to help businesses scale their communications 
            without losing the human touch. We believe that technology should enhance human interactions, not replace them.
          </p>
        </div>
      </section>

      <section className="py-24 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Security First
              </h3>
              <p className="text-muted-foreground">
                Your data security is our top priority. We use enterprise-grade encryption and follow strict compliance standards.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                Global Scale
              </h3>
              <p className="text-muted-foreground">
                Our infrastructure is built to handle millions of calls across 50+ countries with minimal latency.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Customer Centric
              </h3>
              <p className="text-muted-foreground">
                Every feature we build is driven by the feedback and needs of our growing community of users.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to transform your communication?</h2>
          <div className="flex items-center justify-center gap-4">
             <Button size="lg" className="rounded-xl px-8 h-12" asChild>
                <Link href="/register">Join the Revolution</Link>
             </Button>
             <Button size="lg" variant="outline" className="rounded-xl px-8 h-12">
                Contact Sales
             </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border/50 bg-neutral-950 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-12 animate-fade-in">
            <img src="/logo.png" alt="CallMind AI" className="h-10 w-auto" />
            <span className="text-2xl font-bold tracking-tight text-neutral-100">CallMind AI</span>
          </Link>
          <p className="text-sm text-muted-foreground">© 2024 CallMind AI Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
