'use client';

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Globe,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Smile,
  MessageSquare,
  Check,
  CheckCircle2,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Database,
  Cpu,
  History,
  Languages,
  Activity,
  Server,
  Lock,
  MessageCircle,
  PhoneCall,
  PhoneOff,
  UserCheck,
  TrendingUp,
  Compass,
  FileText
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { DemoWizard } from "@/components/demo/DemoWizard";


// Language Data
const LANGUAGES = [
  { name: "English", native: "English", badge: "Global" },
  { name: "Hindi", native: "हिन्दी", badge: "Primary" },
  { name: "Hinglish", native: "Hinglish", badge: "Popular" },
  { name: "Bengali", native: "বাংলা", badge: "Regional" },
  { name: "Tamil", native: "தமிழ்", badge: "Regional" },
  { name: "Telugu", native: "తెలుగు", badge: "Regional" },
  { name: "Marathi", native: "मराठी", badge: "Regional" },
  { name: "Gujarati", native: "ગુજરાતી", badge: "Regional" },
  { name: "Kannada", native: "ಕನ್ನಡ", badge: "Regional" },
  { name: "Malayalam", native: "മലയാളം", badge: "Regional" },
  { name: "Punjabi", native: "ਪੰਜਾਬੀ", badge: "Regional" },
  { name: "Urdu", native: "اردو", badge: "Regional" },
  { name: "Odia", native: "ଓଡ଼ିଆ", badge: "Regional" },
  { name: "Assamese", native: "অসমীয়া", badge: "Regional" }
];

// FAQ Data
const FAQS = [
  {
    q: "What is CallMind AI?",
    a: "CallMind AI is an enterprise-grade, low-latency realtime AI voice calling platform that allows businesses to create and deploy human-like voice agents. Our agents automate incoming customer support, outgoing sales outreach, lead follow-ups, and calendar bookings at a fraction of the cost of traditional support centers."
  },
  {
    q: "How does AI voice calling work?",
    a: "Our system integrates ultra-fast Automatic Speech Recognition (ASR), highly contextual Large Language Models optimized for sales/support dialog paths, and natural text-to-speech (TTS) voice engines. The entire loop executes in under 500ms, creating the natural flow of human conversation with dynamic interruptions."
  },
  {
    q: "Can I use my own business data?",
    a: "Absolutely! You can upload PDFs, document links, FAQs, or connect your customer knowledge base directly to your organization profile. CallMind AI compile-caches and injects this data into the active session system prompt, allowing the agent to answer hyper-accurate, custom support queries without hallucinating."
  },
  {
    q: "Does CallMind AI support Indian regional languages like Hindi?",
    a: "Yes, regional language optimization is our core strength. We fully support Hindi, Hinglish (blend of Hindi and English), Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Odia, and Assamese. Our voice engines capture native accents, local inflections, and cultural nuances beautifully."
  },
  {
    q: "Can AI voice agents handle complex customer support cases?",
    a: "Yes. Our conversational engine tracks intent and progress across stages (Discovery, Explanation, Closing). If a customer asks something beyond the knowledge base, or requests human intervention, the agent gracefully flags the conversation and triggers a hot-transfer to a human agent, complete with a live transcript summary."
  },
  {
    q: "Is realtime call analytics available?",
    a: "Yes, every call includes live streaming WebSocket transcripts, sentiment tracking, intent classification, and instant post-call summaries. These metrics sync directly to your dashboard and CRM, so your team has rich context the moment a call terminates."
  },
  {
    q: "Can I create multiple distinct AI voice agents?",
    a: "Yes. You can build separate agents for separate phone numbers or campaigns—for example, 'Sangeeta' for outbound Hinglish sales leads, 'David' for incoming technical English support, and 'Pooja' for appointment confirmations in Hindi. Each agent has its own custom voice, instruction prompts, and target knowledge base."
  },
  {
    q: "Does CallMind AI support integration with Twilio or Telnyx?",
    a: "Yes, we integrate natively with leading telecom carriers including Twilio, Telnyx, SignalWire, and Plivo. You can purchase numbers directly through CallMind AI or securely map your existing SIP trunks and phone numbers to our AI routing engines."
  },
  {
    q: "Is there a free trial or demo?",
    a: "Yes, we offer a 14-day free trial containing 100 free minutes of AI calling, complete with sandbox numbers and API keys. You can also test a live conversational voice call directly inside our homepage browser widget with zero configuration."
  },
  {
    q: "How secure is CallMind AI?",
    a: "Security is built into our core. All audio streams and transcriptions are encrypted in transit and at rest using AES-256 and SSL/TLS standards. We are fully SOC2 Type II, HIPAA, and GDPR compliant, offering advanced PII redaction capabilities so sensitive credit card numbers or customer passwords are never stored in plain text."
  }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Live Demo Simulator State
  const [demoState, setDemoState] = useState<"idle" | "dialing" | "connected" | "ended">("idle");
  const [demoDuration, setDemoDuration] = useState(0);
  const [speakerState, setSpeakerState] = useState<"listening" | "speaking" | "thinking">("speaking");
  const [transcript, setTranscript] = useState<{ sender: "agent" | "user"; text: string; time: string }[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated Conversation Timeline
  const demoConversation = [
    {
      sender: "agent" as const,
      text: "Namaste! Main Sangeeta bol rahi hoon, CallMind AI se. Hum businesses ko customer calls automate karne mein help karte hain. Kya main aapka naam jaan sakti hoon?",
      delayBefore: 1500,
      duration: 5000
    },
    {
      sender: "user" as const,
      text: "Haan, main Rohan bol raha hoon. Mujhe support aur lead management dono ke liye automation chahiye.",
      delayBefore: 2000,
      duration: 4000
    },
    {
      sender: "agent" as const,
      text: "Boht badhiya, Rohan ji! CallMind AI multilingual agents support ke liye incoming calls and lead qualification ke liye outgoing calls dono handle kar sakte hain. Kya aap regular business calls ke volumes share karna chahenge?",
      delayBefore: 1500,
      duration: 6000
    },
    {
      sender: "user" as const,
      text: "Hum monthly approx 5,000 to 10,000 calls check karte hain, special sales inquiry aur feedback calls ke liye.",
      delayBefore: 2000,
      duration: 4500
    },
    {
      sender: "agent" as const,
      text: "Sunder! 10k monthly calls hamare dynamic system handle kar sakte hain easily, aur sub-second response time ke sath latency bilkul feel nahi hoti. Kya main aapko live dashboard explore karne ke liye ek free callback arrange karu?",
      delayBefore: 1500,
      duration: 6000
    },
    {
      sender: "user" as const,
      text: "Ji bilkul, calendar book kar dijiye. Twilio hookup bhi explain kar dijiyega.",
      delayBefore: 2000,
      duration: 3500
    },
    {
      sender: "agent" as const,
      text: "Ho gaya Rohan ji! Twilio aur Telnyx connect karne mein sirf 2 minutes lagte hain. Main callback schedule kar rahi hoon. CallMind AI se baat karne ke liye dhanyawaad. Have a great day!",
      delayBefore: 1500,
      duration: 5500
    }
  ];

  // Run simulated call conversation sequence
  useEffect(() => {
    if (demoState !== "connected") {
      if (timerRef.current) clearInterval(timerRef.current);
      setDemoDuration(0);
      return;
    }

    timerRef.current = setInterval(() => {
      setDemoDuration((prev) => prev + 1);
    }, 1000);

    let currentStep = 0;

    const playStep = async () => {
      if (currentStep >= demoConversation.length) {
        setTimeout(() => {
          setDemoState("ended");
        }, 2000);
        return;
      }

      const step = demoConversation[currentStep];

      // Step thinking state before agent speaks
      if (step.sender === "agent") {
        setSpeakerState("thinking");
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSpeakerState("speaking");
      } else {
        setSpeakerState("listening");
      }

      // Add to transcript
      setTranscript((prev) => [
        ...prev,
        {
          sender: step.sender,
          text: step.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);

      await new Promise((resolve) => setTimeout(resolve, step.duration));
      
      // Delay before next turn
      currentStep++;
      if (currentStep < demoConversation.length) {
        setSpeakerState("thinking");
        await new Promise((resolve) => setTimeout(resolve, step.delayBefore));
        playStep();
      } else {
        setTimeout(() => {
          setDemoState("ended");
        }, 1500);
      }
    };

    // Trigger first step
    playStep();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [demoState]);

  // Scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  const startDemoCall = () => {
    setTranscript([]);
    setDemoState("dialing");
    setTimeout(() => {
      setDemoState("connected");
    }, 2000);
  };

  const endDemoCall = () => {
    setDemoState("ended");
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 selection:bg-primary/20 selection:text-white font-sans overflow-x-hidden antialiased">
      
      {/* ── BACKGROUND GLOWS ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-600/10 blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-600/10 blur-[150px]" />
      </div>

      {/* ── HEADER NAVBAR ── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-card shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              CallMind <span className="text-primary-500">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            <Link href="#how-it-works" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">How It Works</Link>
            <Link href="#features" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Features</Link>
            <Link href="#demo" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Live Simulator</Link>
            <Link href="#use-cases" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Solutions</Link>
            <Link href="#faq" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Button variant="ghost" className="text-neutral-300 hover:text-white" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button className="rounded-xl bg-gradient-brand hover:opacity-90 font-semibold px-6 shadow-glow transition-all" asChild>
              <Link href="/onboarding">Start Free Trial</Link>
            </Button>
          </div>

          {/* Mobile menu trigger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-xl px-6 py-8 space-y-6"
            >
              <div className="flex flex-col gap-4">
                <Link 
                  href="#how-it-works" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  How It Works
                </Link>
                <Link 
                  href="#features" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Features
                </Link>
                <Link 
                  href="#demo" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Live Simulator
                </Link>
                <Link 
                  href="#use-cases" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Solutions
                </Link>
                <Link 
                  href="#faq" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </div>
              <div className="border-t border-neutral-800 pt-6 flex flex-col gap-4">
                <Button variant="outline" className="w-full rounded-xl border-neutral-800 text-white" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button className="w-full rounded-xl bg-gradient-brand hover:opacity-90 font-semibold" asChild>
                  <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)}>Start Free Trial</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── 1️⃣ HERO SECTION ── */}
      <section className="relative pt-36 lg:pt-48 pb-24 overflow-hidden hero-gradient z-10">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          <div className="lg:col-span-7 space-y-8 text-left max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs font-bold"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary-400" />
              NEXT-GEN ENTERPRISE VOICE V2.0
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white"
            >
              Build Human-Like <br />
              <span className="gradient-text">AI Voice Agents</span> <br />
              For Your Business
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-neutral-400 leading-relaxed font-light"
            >
              Automate customer support, sales calling, lead follow-ups, and appointment reminders using realtime AI voice agents with sub-500ms latency.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              <Button size="lg" className="h-14 px-8 rounded-xl bg-gradient-brand hover:opacity-95 text-base font-bold shadow-glow flex items-center justify-center gap-2 group" asChild>
                <Link href="/onboarding">
                  Start Free Trial 
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-white font-semibold text-base transition-colors" asChild>
                <Link href="#demo">Book a Demo</Link>
              </Button>
            </motion.div>
          </div>

          {/* Realtime voice mockup dashboard */}
          <div className="lg:col-span-5 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative rounded-3xl border border-neutral-800 bg-neutral-900/40 p-1.5 shadow-2xl backdrop-blur-md overflow-hidden"
            >
              <div className="rounded-[22px] border border-neutral-800 bg-neutral-950 p-6 space-y-6">
                
                {/* Simulated Header Panel */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200">Sangeeta (AI Sales Exec)</h4>
                      <p className="text-[10px] text-neutral-500">Active Outbound Campaign</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary-500/20 bg-primary-500/5 text-primary-400 font-bold px-2 py-0.5 rounded-md">
                    SARVAM-AI HINDI/HINGLISH
                  </Badge>
                </div>

                {/* Simulated Waveform & Call Dial */}
                <div className="flex flex-col items-center justify-center py-8 rounded-2xl bg-neutral-900/20 border border-neutral-800/30 relative">
                  <div className="absolute top-4 right-4 text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                    Latency: 480ms
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-md animate-pulse-slow" />
                    <div className="relative h-16 w-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                      <Mic className="h-6 w-6 text-primary-500 animate-bounce" />
                    </div>
                  </div>

                  {/* Pulsing audio wave mock */}
                  <div className="flex items-end justify-center gap-1.5 h-10 w-full px-12">
                    {[16, 24, 40, 18, 32, 48, 20, 36, 12, 28, 44, 22, 16, 32, 40, 18, 24].map((h, i) => (
                      <span 
                        key={i} 
                        style={{ height: `${h}px` }} 
                        className="w-1 rounded-full bg-gradient-to-t from-primary-500 to-secondary-500 animate-pulse"
                      />
                    ))}
                  </div>
                </div>

                {/* Floating metrics grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-3">
                    <span className="text-[10px] text-neutral-500 block font-semibold">SENTIMENT</span>
                    <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5 mt-1">
                      <Smile className="h-3.5 w-3.5 text-emerald-400" /> Positive (0.92)
                    </span>
                  </div>
                  <div className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-3">
                    <span className="text-[10px] text-neutral-500 block font-semibold">STAGE DETECTED</span>
                    <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5 mt-1">
                      <Zap className="h-3.5 w-3.5 text-yellow-400" /> Qualification
                    </span>
                  </div>
                </div>

                {/* Small preview conversation chat bubble */}
                <div className="rounded-xl bg-neutral-900/50 p-3 border border-neutral-800/40 text-left">
                  <div className="flex items-center justify-between text-[9px] text-neutral-500 mb-1 font-semibold">
                    <span>LIVE TRANSLATION STREAM</span>
                    <span>11:58 PM</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    <span className="text-primary-400 font-bold">AI:</span> "Haan, bilkul correct! Hum simple webhooks se callback triggers set kar sakte hain..."
                  </p>
                </div>

              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ── 2️⃣ TRUST / SOCIAL PROOF ── */}
      <section className="border-y border-neutral-900 bg-neutral-950/60 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold tracking-wider text-neutral-500 uppercase mb-8">
            TRUSTED BY FORWARD-THINKING ENTERPRISES & STARTUPS GLOBALLY
          </p>

          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-300">
            <span className="text-xl font-bold tracking-wider text-white">VECTARA</span>
            <span className="text-xl font-bold tracking-wider text-white">VOIPFLOW</span>
            <span className="text-xl font-bold tracking-wider text-white">SARVAM</span>
            <span className="text-xl font-bold tracking-wider text-white">RETELL</span>
            <span className="text-xl font-bold tracking-wider text-white">VAPI</span>
          </div>

          <div className="grid grid-cols-3 gap-6 md:gap-12 mt-16 max-w-4xl mx-auto text-center border-t border-neutral-900 pt-12">
            <div>
              <div className="text-3xl md:text-5xl font-extrabold text-white bg-gradient-brand bg-clip-text text-transparent">10M+</div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2 font-medium">Realtime AI Calls</div>
            </div>
            <div>
              <div className="text-3xl md:text-5xl font-extrabold text-white bg-gradient-brand bg-clip-text text-transparent">5,000+</div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2 font-medium">Businesses Scale</div>
            </div>
            <div>
              <div className="text-3xl md:text-5xl font-extrabold text-white bg-gradient-brand bg-clip-text text-transparent">99.9%</div>
              <div className="text-xs md:text-sm text-neutral-400 mt-2 font-medium">Guaranteed Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3️⃣ HOW IT WORKS SECTION (TIMELINE WITH VISUAL MOCKUPS) ── */}
      <section id="how-it-works" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <Badge variant="outline" className="border-secondary-500/20 bg-secondary-500/5 text-secondary-400 font-bold px-3 py-1 rounded-full text-xs">
              EASY DEPLOYMENT SYSTEM
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">
              Launch Dynamic Voice Agents In 3 Steps
            </h2>
            <p className="text-neutral-400 text-lg">
              No technical VoIP experience needed. Complete our onboarding, customize your AI prompt, and go live instantly.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Step 1 Card */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/30 transition-all duration-300 shadow-card flex flex-col group overflow-hidden">
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center font-bold mb-6 text-sm">
                    01
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary-400 transition-colors">Create Organization</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                    Setup your enterprise profile, feed your business knowledge base docs, and select call routing channels.
                  </p>
                </div>

                {/* Org Setup Mockup UI */}
                <div className="border border-neutral-800 bg-neutral-950 rounded-2xl p-4 mt-4 space-y-4 shadow-inner">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 block font-semibold">ORGANIZATION NAME</label>
                    <input 
                      type="text" 
                      readOnly 
                      value="ABC Technology Pvt Ltd" 
                      className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 block font-semibold">KNOWLEDGE BASE FILE</label>
                    <div className="flex items-center justify-between rounded-lg border border-primary-500/20 bg-primary-500/5 p-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary-500" />
                        <span className="text-[11px] text-neutral-300 font-semibold">FAQ_Guide_2026.pdf</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] hover:bg-emerald-500/10 font-bold px-1.5 py-0.5 rounded">
                        Vectorized
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 Card */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-secondary-500/30 transition-all duration-300 shadow-card flex flex-col group overflow-hidden">
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 flex items-center justify-center font-bold mb-6 text-sm">
                    02
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-secondary-400 transition-colors">Create AI Agent</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                    Customize voice accents, conversational goals, dynamic prompts, and language selection.
                  </p>
                </div>

                {/* AI Customizer Mockup UI */}
                <div className="border border-neutral-800 bg-neutral-950 rounded-2xl p-4 mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-neutral-500 font-semibold uppercase">Voice Selection</label>
                    <span className="text-[11px] font-bold text-neutral-300">Sangeeta (Female)</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-neutral-500 font-bold">
                      <span>TONE STYLE</span>
                      <span className="text-secondary-400">Professional</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-850 rounded-full relative">
                      <div className="absolute left-0 top-0 bottom-0 w-[75%] rounded-full bg-secondary-500" />
                      <div className="absolute left-[75%] top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-secondary-400 bg-neutral-950 shadow-md" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 font-semibold block uppercase">Active Languages</label>
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge className="bg-neutral-800 text-neutral-300 text-[9px] hover:bg-neutral-800">English</Badge>
                      <Badge className="bg-primary-500/20 text-primary-400 border border-primary-500/30 text-[9px] hover:bg-primary-500/20">Hindi</Badge>
                      <Badge className="bg-secondary-500/20 text-secondary-400 border border-secondary-500/30 text-[9px] hover:bg-secondary-500/20">Hinglish</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 Card */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/30 transition-all duration-300 shadow-card flex flex-col group overflow-hidden">
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center font-bold mb-6 text-sm">
                    03
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary-400 transition-colors">Start AI Calls</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                    Connect call trunks, run campaigns, and track transcript streams alongside live intelligence reports.
                  </p>
                </div>

                {/* Dashboard Metrics Mockup UI */}
                <div className="border border-neutral-800 bg-neutral-950 rounded-2xl p-4 mt-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">LIVE TELEMETRY</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] hover:bg-emerald-500/10 flex items-center gap-1 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Campaign
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-900">
                      <span className="text-[8px] text-neutral-500 block">CALL LATENCY</span>
                      <span className="text-xs font-bold text-white">490 ms</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-900">
                      <span className="text-[8px] text-neutral-500 block">RAG ACCURACY</span>
                      <span className="text-xs font-bold text-white">99.8%</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-neutral-900/60 p-2 text-left border border-neutral-900">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-bold text-neutral-500">STAGE PROGRESSION</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-850 rounded-full overflow-hidden">
                      <div className="h-full w-[80%] bg-gradient-brand" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* ── 4️⃣ FEATURES GRID ── */}
      <section id="features" className="py-32 bg-neutral-950 text-white relative z-10 border-y border-neutral-900">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <Badge variant="outline" className="border-primary-500/20 bg-primary-500/5 text-primary-400 font-bold px-3 py-1 rounded-full text-xs">
              STATE-OF-THE-ART AUDIO ENGINE
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Enterprise Infrastructure Built <br />For High-Performance Voice
            </h2>
            <p className="text-neutral-400 text-lg">
              Equip your business with the fastest, most scalable, and secure conversation engines available today.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <Cpu className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Realtime Voice AI</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Fast automatic speech recognition and high-end natural language execution delivers answers in milliseconds, making interruptions perfectly natural.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <Volume2 className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Human-Like Conversations</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Synthesizes emotions, breathing rhythms, natural pauses, and conversational confirmations like "Mhm" or "Haanji", completely replacing mechanical voices.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 (Languages explicitly documented) */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300 md:col-span-2 lg:col-span-1">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <Languages className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">14+ Indian Languages</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                  Advanced regional voice capabilities covering accents, local dialects, and native slang for:
                </p>
                <div className="flex flex-wrap gap-1">
                  {LANGUAGES.slice(0, 8).map((l, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-neutral-800/80 px-2 py-0.5 rounded text-neutral-300">
                      {l.name}
                    </span>
                  ))}
                  <span className="text-[10px] font-semibold bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded">
                    +6 more languages
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Live Call Analytics</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Realtime sentiment graphing, post-call intent extraction, exact summaries, and action item detection are delivered within 2 seconds of call hang-up.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">AI Sales Automation</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Qualifies inbound marketing leads, handles aggressive objections calmly, processes payments, and books dynamic calendar meetings automatically.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <Server className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">WebSocket Streaming</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Continuous low-latency streaming of audio packets ensures zero latency lag and provides instant transcription hooks for live monitoring tools.
                </p>
              </CardContent>
            </Card>

            {/* Feature 7 */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <Database className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">AI Memory & Context RAG</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Maintains detailed context across active customer sessions, remembering previous answers and cross-referencing company guides on the fly.
                </p>
              </CardContent>
            </Card>

            {/* Feature 8 */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <Lock className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">SOC2 & PII Data Redaction</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Safeguards customer identity with built-in PII validation filters that automatically mask passwords, SSNs, credit card tokens, and phone records.
                </p>
              </CardContent>
            </Card>

            {/* Feature 9 */}
            <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Twilio & SIP Connectors</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Bring your own numbers or connect SIP trunk networks directly. We support direct elastic phone connections with Telnyx and Twilio natively.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* ── 5️⃣ LIVE DEMO INTERACTIVE SIMULATOR SECTION ── */}
      <section id="demo" className="py-32 relative z-10 bg-neutral-950/20 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <div className="max-w-3xl mx-auto space-y-4">
            <Badge variant="outline" className="border-secondary-500/20 bg-secondary-500/5 text-secondary-400 font-bold px-3 py-1 rounded-full text-xs">
              INTERACTIVE DEMO WIZARD
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Build & Test Your Agent Instantly
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl mx-auto">
              Create a sandbox organization, customize your AI voice agent voice and personality, and trigger a live simulated voice call in under 2 minutes.
            </p>
          </div>
          
          <DemoWizard />
        </div>
      </section>

      {/* ── 6️⃣ USE CASES SECTION ── */}
      <section id="use-cases" className="py-32 border-t border-neutral-900 bg-neutral-950/40 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <Badge variant="outline" className="border-primary-500/20 bg-primary-500/5 text-primary-400 font-bold px-3 py-1 rounded-full text-xs">
              GLOBAL SECTOR SOLUTIONS
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">
              Built For Every Industry Scale
            </h2>
            <p className="text-neutral-400 text-lg">
              CallMind AI voice agents are fully pre-trained to perform industry-specific conversations out of the box.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="group relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/30 p-1.5 hover:border-primary-500/35 transition-all duration-300 flex flex-col justify-between min-h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10" />
              {/* Fallback pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] group-hover:scale-105 transition-transform duration-500" />
               <Image
                src="/usecase-ecommerce.jpeg"
                alt="Ecommerce"
                fill
                className="object-cover rounded-3xl absolute inset-0 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-6 relative z-20 space-y-2 mt-auto">
                <span className="text-[10px] font-bold text-primary-400 tracking-wider uppercase">Ecommerce & Retail</span>
                <h4 className="text-xl font-bold text-white">Automated Order Confirmations</h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Provide automatic tracking updates, query payment discrepancies, collect regional returns feedback in Hinglish/Hindi, and upsell products naturally.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/30 p-1.5 hover:border-secondary-500/35 transition-all duration-300 flex flex-col justify-between min-h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10" />
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] group-hover:scale-105 transition-transform duration-500" />
               <Image
                src="/healthcare.webp"
                alt="Healthcare Systems"
                fill
                className="object-cover rounded-3xl absolute inset-0 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-6 relative z-20 space-y-2 mt-auto">
                <span className="text-[10px] font-bold text-secondary-400 tracking-wider uppercase">Healthcare Systems</span>
                <h4 className="text-xl font-bold text-white">Intelligent Clinic Scheduling</h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Secure HIPAA-compliant appointment booking, post-care checkups, billing confirmations, and multi-agent customer support queues.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/30 p-1.5 hover:border-primary-500/35 transition-all duration-300 flex flex-col justify-between min-h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10" />
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] group-hover:scale-105 transition-transform duration-500" />
               <Image
                src="/nstant-Lead-Qualification.jpg"
                alt="Real Estate"
                fill
                className="object-cover rounded-3xl absolute inset-0 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-6 relative z-20 space-y-2 mt-auto">
                <span className="text-[10px] font-bold text-primary-400 tracking-wider uppercase">Real Estate Networks</span>
                <h4 className="text-xl font-bold text-white">Instant Lead Qualification</h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Call new property leads within 10 seconds of website signup. Qualify budgets, locations, and map callback appointments automatically.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="group relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/30 p-1.5 hover:border-secondary-500/35 transition-all duration-300 flex flex-col justify-between min-h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10" />
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] group-hover:scale-105 transition-transform duration-500" />
              <Image
                src="/Education&EdTech.jpg"
                alt="Education & EdTech"
                fill
                className="object-cover rounded-3xl absolute inset-0 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-6 relative z-20 space-y-2 mt-auto">
                <span className="text-[10px] font-bold text-secondary-400 tracking-wider uppercase">Education & EdTech</span>
                <h4 className="text-xl font-bold text-white">Scale Admissions Campaigns</h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Follow up with prospective regional students, explain course structures in multiple languages, resolve fee doubts, and log notes to Hubspot.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="group relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/30 p-1.5 hover:border-primary-500/35 transition-all duration-300 flex flex-col justify-between min-h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10" />
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] group-hover:scale-105 transition-transform duration-500" />
              <Image
                src="/Fintech&Finance.webp"
                alt="Fintech & Finance"
                fill
                className="object-cover rounded-3xl absolute inset-0 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-6 relative z-20 space-y-2 mt-auto">
                <span className="text-[10px] font-bold text-primary-400 tracking-wider uppercase">Fintech & Finance</span>
                <h4 className="text-xl font-bold text-white">Secure Debt & Feedback Queries</h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Automate payment reminders, collect regional loan application parameters securely, and confirm transactions with advanced PII redactions.
                </p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="group relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/30 p-1.5 hover:border-secondary-500/35 transition-all duration-300 flex flex-col justify-between min-h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10" />
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] group-hover:scale-105 transition-transform duration-500" />
              <Image
                src="/CustomerSupport.png"
                alt="Customer Support"
                fill
                className="object-cover rounded-3xl absolute inset-0 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-6 relative z-20 space-y-2 mt-auto">
                <span className="text-[10px] font-bold text-secondary-400 tracking-wider uppercase">Customer Support</span>
                <h4 className="text-xl font-bold text-white">24/7 Voice Help Desk</h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Offload 80% of routine incoming service queries. Elevate difficult parameters to human reps dynamically using live agent transfer systems.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7️⃣ FAQ ACCORDION SECTION ── */}
      <section id="faq" className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <Badge variant="outline" className="border-secondary-500/20 bg-secondary-500/5 text-secondary-400 font-bold px-3 py-1 rounded-full text-xs">
              HAVE QUESTIONS?
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-neutral-400 text-base">
              Clear, structured answers about CallMind AI capabilities, security compliance, pricing, and carriers.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <div 
                key={index} 
                className="rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-neutral-800/20 transition-colors"
                >
                  <span className="text-sm font-bold text-neutral-100">{faq.q}</span>
                  {faqOpen === index ? (
                    <ChevronUp className="h-4 w-4 text-neutral-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {faqOpen === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-1 text-xs text-neutral-400 leading-relaxed border-t border-neutral-900">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 8️⃣ CTA SECTION ── */}
      <section className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="relative rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8 md:p-16 text-center shadow-2xl backdrop-blur-md overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 bg-gradient-brand opacity-[0.08]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary-500/10 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <Badge variant="outline" className="border-primary-500/20 bg-primary-500/5 text-primary-400 font-bold px-3 py-1 rounded-full text-xs">
                GET STARTED IN MINUTES
              </Badge>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                Start Building AI Voice Agents Today
              </h2>
              <p className="text-neutral-400 text-base font-light leading-relaxed">
                Connect your business knowledge, customize voice styles, and handle thousands of regional customer calls securely with under 500ms latency.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" className="h-14 px-8 rounded-xl bg-gradient-brand hover:opacity-95 text-base font-bold shadow-glow w-full sm:w-auto" asChild>
                  <Link href="/onboarding">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-base w-full sm:w-auto" asChild>
                  <Link href="#demo">Schedule Enterprise Demo</Link>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 9️⃣ FOOTER ── */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-16 text-neutral-500 relative z-10 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 text-left">
          
          <div className="col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">CallMind AI</span>
            </Link>
            <p className="text-neutral-400 max-w-xs leading-relaxed">
              Powering responsive, low-latency regional AI voice communications for modern high-growth enterprises globally.
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
              <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact Support</Link></li>
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

    </div>
  );
}
