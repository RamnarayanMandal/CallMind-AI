"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  Mic,
  Volume2,
  Sparkles,
  Smile,
  CheckCircle2,
  X,
  ChevronDown,
  Database,
  Cpu,
  Languages,
  Server,
  Lock,
  FileText,
} from "lucide-react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useInView,
  animate,
} from "framer-motion";
import Image from "next/image";
import { DemoWizard, LANGUAGES } from "@/components/demo/DemoWizard";

// ── Motion Variants ────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};



const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 70, damping: 16, delay: 0.2 },
  },
};




// ── Animated Counter ───────────────────────────────────────────────────────────

function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent =
            prefix +
            (value >= 1000
              ? Math.floor(v).toLocaleString()
              : Math.floor(v).toString()) +
            suffix;
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix, prefix]);

  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}


// ── FAQ Data ───────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "What is CallMind AI?",
    a: "CallMind AI is an enterprise-grade, low-latency realtime AI voice calling platform that allows businesses to create and deploy human-like voice agents. Our agents automate incoming customer support, outgoing sales outreach, lead follow-ups, and calendar bookings at a fraction of the cost of traditional support centers.",
  },
  {
    q: "How does AI voice calling work?",
    a: "Our system integrates ultra-fast Automatic Speech Recognition (ASR), highly contextual Large Language Models optimized for sales/support dialog paths, and natural text-to-speech (TTS) voice engines. The entire loop executes in under 500ms, creating the natural flow of human conversation with dynamic interruptions.",
  },
  {
    q: "Can I use my own business data?",
    a: "Absolutely! You can upload PDFs, document links, FAQs, or connect your customer knowledge base directly to your organization profile. CallMind AI compile-caches and injects this data into the active session system prompt, allowing the agent to answer hyper-accurate, custom support queries without hallucinating.",
  },
  {
    q: "Does CallMind AI support Indian regional languages like Hindi?",
    a: "Yes, regional language optimization is our core strength. We fully support Hindi, Hinglish (blend of Hindi and English), Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Odia, and Assamese. Our voice engines capture native accents, local inflections, and cultural nuances beautifully.",
  },
  {
    q: "Can AI voice agents handle complex customer support cases?",
    a: "Yes. Our conversational engine tracks intent and progress across stages (Discovery, Explanation, Closing). If a customer asks something beyond the knowledge base, or requests human intervention, the agent gracefully flags the conversation and triggers a hot-transfer to a human agent, complete with a live transcript summary.",
  },
  {
    q: "Is realtime call analytics available?",
    a: "Yes, every call includes live streaming WebSocket transcripts, sentiment tracking, intent classification, and instant post-call summaries. These metrics sync directly to your dashboard and CRM, so your team has rich context the moment a call terminates.",
  },
  {
    q: "Can I create multiple distinct AI voice agents?",
    a: "Yes. You can build separate agents for separate phone numbers or campaigns—for example, 'Sangeeta' for outbound Hinglish sales leads, 'David' for incoming technical English support, and 'Pooja' for appointment confirmations in Hindi. Each agent has its own custom voice, instruction prompts, and target knowledge base.",
  },
  {
    q: "Does CallMind AI support integration with Twilio or Telnyx?",
    a: "Yes, we integrate natively with leading telecom carriers including Twilio, Telnyx, SignalWire, and Plivo. You can purchase numbers directly through CallMind AI or securely map your existing SIP trunks and phone numbers to our AI routing engines.",
  },
  {
    q: "Is there a free trial or demo?",
    a: "Yes, we offer a 14-day free trial containing 100 free minutes of AI calling, complete with sandbox numbers and API keys. You can also test a live conversational voice call directly inside our homepage browser widget with zero configuration.",
  },
  {
    q: "How secure is CallMind AI?",
    a: "Security is built into our core. All audio streams and transcriptions are encrypted in transit and at rest using AES-256 and SSL/TLS standards. We are fully SOC2 Type II, HIPAA, and GDPR compliant, offering advanced PII redaction capabilities so sensitive credit card numbers or customer passwords are never stored in plain text.",
  },
];

// ── Waveform Bars ──────────────────────────────────────────────────────────────

const waveHeights = [16, 24, 40, 18, 32, 48, 20, 36, 12, 28, 44, 22, 16, 32, 40, 18, 24];

function AnimatedWaveform() {
  return (
    <div className="flex items-end justify-center gap-1.5 h-10 w-full px-12">
      {waveHeights.map((h, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-primary-500 to-secondary-500"
          style={{ height: `${h}px` }}
          animate={{
            scaleY: [1, 1.5 + Math.random() * 0.8, 0.6, 1.3, 1],
            opacity: [0.7, 1, 0.8, 1, 0.7],
          }}
          transition={{
            duration: 1.2 + Math.random() * 0.6,
            repeat: Infinity,
            delay: i * 0.06,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  
  const [faqOpen, setFaqOpen] = useState<number | null>(null);



  // Refs for scroll-triggered sections
  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const useCasesRef = useRef(null);
  const ctaRef = useRef(null);
  const statsRef = useRef(null);

  const howItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const useCasesInView = useInView(useCasesRef, { once: true, margin: "-100px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 selection:bg-primary/20 selection:text-white font-sans overflow-x-hidden antialiased">
      {/* ── BACKGROUND GLOWS ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-600/10 blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-600/10 blur-[150px]" />
      </div>

      {/* ── HEADER NAVBAR ── */}
      <NavBar />

      {/* ── 1️⃣ HERO SECTION ── */}
      <section className="relative pt-36 lg:pt-48 pb-24 overflow-hidden hero-gradient z-10">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 space-y-8 text-left max-w-2xl">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs font-bold"
            >
              <motion.span
                animate={{ rotate: [0, 12, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary-400" />
              </motion.span>
              NEXT-GEN ENTERPRISE VOICE V2.0
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white"
            >
              Build Human-Like <br />
              <span className="gradient-text">AI Voice Agents</span> <br />
              For Your Business
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-lg sm:text-xl text-neutral-400 leading-relaxed font-light"
            >
              Automate customer support, sales calling, lead follow-ups, and
              appointment reminders using realtime AI voice agents with
              sub-500ms latency.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-xl bg-gradient-brand hover:opacity-95 text-base font-bold shadow-glow flex items-center justify-center gap-2 group"
                  asChild
                >
                  <Link href="/onboarding">
                    Start Free Trial
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 rounded-xl border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-white font-semibold text-base transition-colors"
                  asChild
                >
                  <Link href="#demo">Book a Demo</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Realtime voice mockup dashboard */}
          <div className="lg:col-span-5 relative">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="relative rounded-3xl border border-neutral-800 bg-neutral-900/40 p-1.5 shadow-2xl backdrop-blur-md overflow-hidden"
            >
              {/* Floating loop */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="rounded-[22px] border border-neutral-800 bg-neutral-950 p-6 space-y-6">
                  {/* Header Panel */}
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
                    <div className="flex items-center gap-3">
                      <motion.span
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-3 w-3 rounded-full bg-emerald-500"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-neutral-200">
                          Sangeeta (AI Sales Exec)
                        </h4>
                        <p className="text-[10px] text-neutral-500">Active Outbound Campaign</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-primary-500/20 bg-primary-500/5 text-primary-400 font-bold px-2 py-0.5 rounded-md"
                    >
                      SARVAM-AI HINDI/HINGLISH
                    </Badge>
                  </div>

                  {/* Waveform & Call */}
                  <div className="flex flex-col items-center justify-center py-8 rounded-2xl bg-neutral-900/20 border border-neutral-800/30 relative">
                    <div className="absolute top-4 right-4 text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                      Latency: 480ms
                    </div>

                    <div className="relative mb-6">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-primary-500/20 blur-md"
                      />
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-2 rounded-full border border-primary-500/10"
                      />
                      <div className="relative h-16 w-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Mic className="h-6 w-6 text-primary-500" />
                        </motion.div>
                      </div>
                    </div>

                    <AnimatedWaveform />
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-3"
                    >
                      <span className="text-[10px] text-neutral-500 block font-semibold">SENTIMENT</span>
                      <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5 mt-1">
                        <Smile className="h-3.5 w-3.5 text-emerald-400" /> Positive (0.92)
                      </span>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-3"
                    >
                      <span className="text-[10px] text-neutral-500 block font-semibold">STAGE DETECTED</span>
                      <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5 mt-1">
                        <motion.span
                          animate={{ rotate: [0, 20, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                        >
                          <Zap className="h-3.5 w-3.5 text-yellow-400" />
                        </motion.span>
                        Qualification
                      </span>
                    </motion.div>
                  </div>

                  {/* Chat bubble */}
                  <motion.div
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="rounded-xl bg-neutral-900/50 p-3 border border-neutral-800/40 text-left"
                  >
                    <div className="flex items-center justify-between text-[9px] text-neutral-500 mb-1 font-semibold">
                      <span>LIVE TRANSLATION STREAM</span>
                      <span>11:58 PM</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      <span className="text-primary-400 font-bold">AI:</span>{" "}
                      "Haan, bilkul correct! Hum simple webhooks se callback triggers set kar sakte hain..."
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2️⃣ TRUST / SOCIAL PROOF ── */}
      <section className="border-y border-neutral-900 bg-neutral-950/60 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-xs font-bold tracking-wider text-neutral-500 uppercase mb-8"
          >
            TRUSTED BY FORWARD-THINKING ENTERPRISES & STARTUPS GLOBALLY
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 0.5, y: 0 }}
            whileHover={{ opacity: 0.8, filter: "grayscale(0)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-12 md:gap-20 grayscale transition-all duration-300"
          >
            {["VECTARA", "VOIPFLOW", "SARVAM", "RETELL", "VAPI"].map((brand, i) => (
              <motion.span
                key={brand}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="text-xl font-bold tracking-wider text-white"
              >
                {brand}
              </motion.span>
            ))}
          </motion.div>

          {/* Animated Stats */}
          <div
            ref={statsRef}
            className="grid grid-cols-3 gap-6 md:gap-12 mt-16 max-w-4xl mx-auto text-center border-t border-neutral-900 pt-12"
          >
            {[
              { value: 10, suffix: "M+", label: "Realtime AI Calls", prefix: "" },
              { value: 5000, suffix: "+", label: "Businesses Scale", prefix: "" },
              { value: 99.9, suffix: "%", label: "Guaranteed Uptime", prefix: "" },
            ].map(({ value, suffix, label, prefix }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 24 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 80, damping: 16 }}
              >
                <div className="text-3xl md:text-5xl font-extrabold text-white bg-gradient-brand bg-clip-text text-transparent">
                  {statsInView ? (
                    <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
                  ) : (
                    <span>0{suffix}</span>
                  )}
                </div>
                <div className="text-xs md:text-sm text-neutral-400 mt-2 font-medium">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3️⃣ HOW IT WORKS SECTION ── */}
      <section id="how-it-works" className="py-32 relative z-10" ref={howItWorksRef}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          >
            <Badge
              variant="outline"
              className="border-secondary-500/20 bg-secondary-500/5 text-secondary-400 font-bold px-3 py-1 rounded-full text-xs"
            >
              EASY DEPLOYMENT SYSTEM
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">
              Launch Dynamic Voice Agents In 3 Steps
            </h2>
            <p className="text-neutral-400 text-lg">
              No technical VoIP experience needed. Complete our onboarding, customize your AI
              prompt, and go live instantly.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Organization",
                desc: "Setup your enterprise profile, feed your business knowledge base docs, and select call routing channels.",
                color: "primary",
                content: (
                  <div className="border border-neutral-800 bg-neutral-950 rounded-2xl p-4 mt-4 space-y-4 shadow-inner">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-500 block font-semibold">ORGANIZATION NAME</label>
                      <Input type="text" readOnly value="ABC Technology Pvt Ltd"
                        className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-300" />
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
                ),
              },
              {
                step: "02",
                title: "Create AI Agent",
                desc: "Customize voice accents, conversational goals, dynamic prompts, and language selection.",
                color: "secondary",
                content: (
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
                ),
              },
              {
                step: "03",
                title: "Start AI Calls",
                desc: "Connect call trunks, run campaigns, and track transcript streams alongside live intelligence reports.",
                color: "primary",
                content: (
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
                        <motion.div
                          className="h-full bg-gradient-brand"
                          initial={{ width: "0%" }}
                          animate={howItWorksInView ? { width: "80%" } : {}}
                          transition={{ duration: 1.4, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map(({ step, title, desc, color, content }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 40 }}
                animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 70, damping: 16 }}
                whileHover={{ y: -6, scale: 1.015 }}
              >
                <Card
                  className={`bg-neutral-900/30 border-neutral-800 hover:border-${color}-500/30 transition-all duration-300 shadow-card flex flex-col group overflow-hidden h-full`}
                >
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className={`h-10 w-10 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 flex items-center justify-center font-bold mb-6 text-sm`}>
                        {step}
                      </div>
                      <h3 className={`text-xl font-bold mb-2 text-white group-hover:text-${color}-400 transition-colors`}>
                        {title}
                      </h3>
                      <p className="text-neutral-400 text-sm leading-relaxed mb-6">{desc}</p>
                    </div>
                    {content}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4️⃣ FEATURES GRID ── */}
      <section
        id="features"
        className="py-32 bg-neutral-950 text-white relative z-10 border-y border-neutral-900"
        ref={featuresRef}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          >
            <Badge
              variant="outline"
              className="border-primary-500/20 bg-primary-500/5 text-primary-400 font-bold px-3 py-1 rounded-full text-xs"
            >
              STATE-OF-THE-ART AUDIO ENGINE
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Enterprise Infrastructure Built <br />
              For High-Performance Voice
            </h2>
            <p className="text-neutral-400 text-lg">
              Equip your business with the fastest, most scalable, and secure conversation
              engines available today.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Cpu, title: "Realtime Voice AI", desc: "Fast automatic speech recognition and high-end natural language execution delivers answers in milliseconds, making interruptions perfectly natural." },
              { icon: Volume2, title: "Human-Like Conversations", desc: 'Synthesizes emotions, breathing rhythms, natural pauses, and conversational confirmations like "Mhm" or "Haanji", completely replacing mechanical voices.' },
              { icon: Languages, title: "14+ Indian Languages", desc: "Advanced regional voice capabilities covering accents, local dialects, and native slang.", extra: true },
              { icon: BarChart3, title: "Live Call Analytics", desc: "Realtime sentiment graphing, post-call intent extraction, exact summaries, and action item detection are delivered within 2 seconds of call hang-up." },
              { icon: Target, title: "AI Sales Automation", desc: "Qualifies inbound marketing leads, handles aggressive objections calmly, processes payments, and books dynamic calendar meetings automatically." },
              { icon: Server, title: "WebSocket Streaming", desc: "Continuous low-latency streaming of audio packets ensures zero latency lag and provides instant transcription hooks for live monitoring tools." },
              { icon: Database, title: "AI Memory & Context RAG", desc: "Maintains detailed context across active customer sessions, remembering previous answers and cross-referencing company guides on the fly." },
              { icon: Lock, title: "SOC2 & PII Data Redaction", desc: "Safeguards customer identity with built-in PII validation filters that automatically mask passwords, SSNs, credit card tokens, and phone records." },
              { icon: ShieldCheck, title: "Twilio & SIP Connectors", desc: "Bring your own numbers or connect SIP trunk networks directly. We support direct elastic phone connections with Telnyx and Twilio natively." },
            ].map(({ icon: Icon, title, desc, extra }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 32 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 75, damping: 16 }}
                whileHover={{ y: -5, scale: 1.012 }}
                className={extra ? "md:col-span-2 lg:col-span-1" : ""}
              >
                <Card className="bg-neutral-900/30 border-neutral-800 hover:border-primary-500/20 transition-all duration-300 h-full">
                  <CardContent className="pt-6">
                    <motion.div
                      whileHover={{ scale: 1.12, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6"
                    >
                      <Icon className="h-6 w-6 text-primary-500" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
                    {extra && (
                      <div className="flex flex-wrap gap-1 mt-4">
                        {LANGUAGES.slice(0, 8).map((l, j) => (
                          <span key={j} className="text-[10px] font-semibold bg-neutral-800/80 px-2 py-0.5 rounded text-neutral-300">
                            {l.name}
                          </span>
                        ))}
                        <span className="text-[10px] font-semibold bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded">+6 more languages</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5️⃣ LIVE DEMO INTERACTIVE SIMULATOR SECTION ── */}
      <section
        id="demo"
        className="py-32 relative z-10 bg-neutral-950/20 border-t border-neutral-900"
      >
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto space-y-4"
          >
            <Badge
              variant="outline"
              className="border-secondary-500/20 bg-secondary-500/5 text-secondary-400 font-bold px-3 py-1 rounded-full text-xs"
            >
              INTERACTIVE DEMO WIZARD
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Build & Test Your Agent Instantly
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl mx-auto">
              Create a sandbox organization, customize your AI voice agent voice and personality,
              and trigger a live simulated voice call in under 2 minutes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.1 }}
          >
            <DemoWizard />
          </motion.div>
        </div>
      </section>

      {/* ── 6️⃣ USE CASES SECTION ── */}
      <section
        id="use-cases"
        className="py-32 border-t border-neutral-900 bg-neutral-950/40 relative z-10"
        ref={useCasesRef}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={useCasesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          >
            <Badge
              variant="outline"
              className="border-primary-500/20 bg-primary-500/5 text-primary-400 font-bold px-3 py-1 rounded-full text-xs"
            >
              GLOBAL SECTOR SOLUTIONS
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">
              Built For Every Industry Scale
            </h2>
            <p className="text-neutral-400 text-lg">
              CallMind AI voice agents are fully pre-trained to perform industry-specific
              conversations out of the box.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { src: "/usecase-ecommerce.jpeg", alt: "Ecommerce", labelColor: "text-primary-400", category: "Ecommerce & Retail", title: "Automated Order Confirmations", desc: "Provide automatic tracking updates, query payment discrepancies, collect regional returns feedback in Hinglish/Hindi, and upsell products naturally.", border: "hover:border-primary-500/35" },
              { src: "/healthcare.webp", alt: "Healthcare Systems", labelColor: "text-secondary-400", category: "Healthcare Systems", title: "Intelligent Clinic Scheduling", desc: "Secure HIPAA-compliant appointment booking, post-care checkups, billing confirmations, and multi-agent customer support queues.", border: "hover:border-secondary-500/35" },
              { src: "/nstant-Lead-Qualification.jpg", alt: "Real Estate", labelColor: "text-primary-400", category: "Real Estate Networks", title: "Instant Lead Qualification", desc: "Call new property leads within 10 seconds of website signup. Qualify budgets, locations, and map callback appointments automatically.", border: "hover:border-primary-500/35" },
              { src: "/Education&EdTech.jpg", alt: "Education", labelColor: "text-secondary-400", category: "Education & EdTech", title: "Scale Admissions Campaigns", desc: "Follow up with prospective regional students, explain course structures in multiple languages, resolve fee doubts, and log notes to Hubspot.", border: "hover:border-secondary-500/35" },
              { src: "/Fintech&Finance.webp", alt: "Fintech", labelColor: "text-primary-400", category: "Fintech & Finance", title: "Secure Debt & Feedback Queries", desc: "Automate payment reminders, collect regional loan application parameters securely, and confirm transactions with advanced PII redactions.", border: "hover:border-primary-500/35" },
              { src: "/CustomerSupport.png", alt: "Customer Support", labelColor: "text-secondary-400", category: "Customer Support", title: "24/7 Voice Help Desk", desc: "Offload 80% of routine incoming service queries. Elevate difficult parameters to human reps dynamically using live agent transfer systems.", border: "hover:border-secondary-500/35" },
            ].map(({ src, alt, labelColor, category, title, desc, border }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 36 }}
                animate={useCasesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 70, damping: 16 }}
                whileHover="hover"
                className={`group relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/30 p-1.5 ${border} transition-all duration-300 flex flex-col justify-between min-h-[300px]`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px]" />
                <motion.div
                  variants={{ hover: { scale: 1.07 } }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  className="absolute inset-0"
                >
                  <Image src={src} alt={alt} fill className="object-cover rounded-3xl" />
                </motion.div>
                <motion.div
                  variants={{ hover: { opacity: 0.85 } }}
                  initial={{ opacity: 0.6 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-neutral-950/20 z-10"
                />
                <div className="p-6 relative z-20 space-y-2 mt-auto">
                  <span className={`text-[10px] font-bold ${labelColor} tracking-wider uppercase`}>{category}</span>
                  <h4 className="text-xl font-bold text-white">{title}</h4>
                  <p className="text-neutral-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <PricingSection />

      {/* ── 7️⃣ FAQ ACCORDION SECTION ── */}
      <section id="faq" className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          >
            <Badge
              variant="outline"
              className="border-secondary-500/20 bg-secondary-500/5 text-secondary-400 font-bold px-3 py-1 rounded-full text-xs"
            >
              HAVE QUESTIONS?
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-neutral-400 text-base">
              Clear, structured answers about CallMind AI capabilities, security compliance,
              pricing, and carriers.
            </p>
          </motion.div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.04, type: "spring", stiffness: 80, damping: 18 }}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-neutral-800/20 transition-colors"
                >
                  <span className="text-sm font-bold text-neutral-100">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: faqOpen === index ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {faqOpen === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 26, opacity: { duration: 0.2 } }}
                    >
                      <div className="px-6 pb-6 pt-1 text-xs text-neutral-400 leading-relaxed border-t border-neutral-900">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8️⃣ CTA SECTION ── */}
      <section className="py-24 relative z-10 overflow-hidden" ref={ctaRef}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 32 }}
            animate={ctaInView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 65, damping: 16 }}
            className="relative rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8 md:p-16 text-center shadow-2xl backdrop-blur-md overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 bg-gradient-brand opacity-[0.08]" />
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.08, 0.14, 0.08] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary-500/10 blur-[120px]"
              />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <Badge
                variant="outline"
                className="border-primary-500/20 bg-primary-500/5 text-primary-400 font-bold px-3 py-1 rounded-full text-xs"
              >
                GET STARTED IN MINUTES
              </Badge>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                Start Building AI Voice Agents Today
              </h2>
              <p className="text-neutral-400 text-base font-light leading-relaxed">
                Connect your business knowledge, customize voice styles, and handle thousands of
                regional customer calls securely with under 500ms latency.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-xl bg-gradient-brand hover:opacity-95 text-base font-bold shadow-glow w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/onboarding">Start Free Trial</Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 rounded-xl border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-base w-full sm:w-auto"
                    asChild
                  >
                    <Link href="#demo">Schedule Enterprise Demo</Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 9️⃣ FOOTER ── */}
      <Footer />
    </div>
  );
}

// ── PricingSection ────────────────────────────────────────────────────────────
import { subscriptionService } from "@/services/subscription.service";
import type { Plan } from "@/types";
import Footer from "@/components/homePageCompoment/Footer";
import { Navbar } from "@/components/common/Navbar";
import NavBar from "@/components/homePageCompoment/NavBar";
import { Input } from "@/components/ui/input";

function PricingSection() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  React.useEffect(() => {
    subscriptionService
      .getPlans()
      .then((data) => setPlans(data.filter((p) => p.isActive !== false)))
      .catch(() => {
        setPlans([
          {
            _id: "starter",
            name: "Starter",
            price: 1999,
            yearlyPrice: 19990,
            description: "Perfect for small businesses starting with voice AI.",
            features: ["500 AI Minutes / month", "1 AI Agent", "Standard Support", "Basic Analytics"],
            minutesLimit: 500,
            agentLimit: 1,
            isActive: true,
            trialDays: 7,
          },
          {
            _id: "growth",
            name: "Growth",
            price: 4999,
            yearlyPrice: 49990,
            description: "Scale your outbound operations efficiently.",
            features: ["2000 AI Minutes / month", "5 AI Agents", "Priority Support", "Advanced Analytics", "Custom Voices"],
            minutesLimit: 2000,
            agentLimit: 5,
            isActive: true,
            isPopular: true,
          },
          {
            _id: "business",
            name: "Business",
            price: 14999,
            yearlyPrice: 149990,
            description: "Enterprise-grade infrastructure for high volume.",
            features: ["Unlimited AI Minutes", "Unlimited Agents", "24/7 Dedicated Support", "API Access", "Custom Integrations"],
            minutesLimit: 999999,
            agentLimit: 999,
            isActive: true,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="pricing"
      className="py-32 relative z-10 border-t border-neutral-900 bg-neutral-950/40"
      ref={ref}
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-4"
        >
          <Badge
            variant="outline"
            className="border-blue-500/20 bg-blue-500/5 text-blue-400 font-bold px-3 py-1 rounded-full text-xs"
          >
            PRICING
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Pricing Built for AI-Powered Growth
          </h2>
          <p className="text-neutral-400 text-lg">
            Launch, automate, and scale customer conversations with plans designed for every
            stage of business.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7 animate-pulse space-y-4">
                <div className="h-6 bg-neutral-800 rounded w-24" />
                <div className="h-10 bg-neutral-800 rounded w-32" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 bg-neutral-800 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 36 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 70, damping: 16 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative flex flex-col rounded-2xl p-7 border transition-all ${
                  plan.isPopular
                    ? "bg-blue-950/30 border-blue-500 shadow-2xl shadow-blue-900/30"
                    : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {plan.isPopular && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.4, type: "spring", stiffness: 120, damping: 14 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg"
                  >
                    MOST POPULAR
                  </motion.div>
                )}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-neutral-400 text-sm mt-1">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">₹{plan.price.toLocaleString()}</span>
                  <span className="text-neutral-400 text-sm">/mo</span>
                  {plan.yearlyPrice && (
                    <p className="text-green-400 text-sm mt-1">
                      ₹{plan.yearlyPrice.toLocaleString()}/yr · Save{" "}
                      {Math.round(((plan.price * 12 - plan.yearlyPrice) / (plan.price * 12)) * 100)}%
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {(plan.features || []).map((f, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: i * 0.12 + j * 0.05 + 0.2 }}
                      className="flex items-start gap-2 text-sm text-neutral-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> {f}
                    </motion.li>
                  ))}
                </ul>
                {plan.trialDays && plan.trialDays > 0 ? (
                  <p className="text-center text-xs text-blue-400 mb-3">{plan.trialDays}-day free trial</p>
                ) : null}
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/register"
                    className={`w-full py-3 rounded-xl font-semibold text-center block transition-all ${
                      plan.isPopular
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white"
                    }`}
                  >
                    Get Started
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-center text-neutral-500 text-sm mt-10">
          All prices inclusive of GST · Cancel anytime · Secure payments via Razorpay
        </p>
      </div>
    </section>
  );
}