'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Mic, Phone, PhoneOff, CheckCircle2, Loader2,
  Volume2, Zap, Globe, Activity, PhoneCall, ArrowRight,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', native: 'English' },
  { code: 'hi', native: 'हिन्दी' },
  { code: 'hinglish', native: 'Hinglish' },
  { code: 'bn', native: 'বাংলা' },
  { code: 'ta', native: 'தமிழ்' },
  { code: 'te', native: 'తెలుగు' },
  { code: 'mr', native: 'मराठी' },
  { code: 'gu', native: 'ગુજરાતી' },
  { code: 'kn', native: 'ಕನ್ನಡ' },
  { code: 'ml', native: 'മലയാളം' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', native: 'اردو' },
  { code: 'or', native: 'ଓଡ଼ିଆ' },
  { code: 'as', native: 'অসমীয়া' },
];

const DEMO_TRANSCRIPT = [
  { speaker: 'agent', text: 'Namaste! Main Sangeeta bol rahi hoon, ABC Technology se. Aap se baat karke bahut khushi hui!', delay: 800 },
  { speaker: 'user',  text: 'Hello, mujhe apni company ke liye AI calling solution chahiye.', delay: 3200 },
  { speaker: 'agent', text: 'Bilkul! Aapki company ki requirements ke baare mein thoda aur bataiye. Kya aap customer support ya sales calls automate karna chahte hain?', delay: 5800 },
  { speaker: 'user',  text: 'Haan, mainly customer support calls. Humara call volume bohot zyada hai.', delay: 9000 },
  { speaker: 'agent', text: 'Samajh gaye! CallMind AI aapke liye perfect solution hai. Hum 10 million+ calls handle kar chuke hain 99.9% uptime ke saath. Kya main aapko ek demo schedule kar sakti hoon?', delay: 11500 },
];

// ─── Waveform ─────────────────────────────────────────────────────────────────

function AudioWaveform({ active, color = '#a855f7' }: { active: boolean; color?: string }) {
  const bars = Array.from({ length: 28 });
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full w-[3px]"
          style={{ backgroundColor: color }}
          animate={
            active
              ? { height: [6, Math.random() * 36 + 8, 6], opacity: [0.4, 1, 0.4] }
              : { height: 4, opacity: 0.2 }
          }
          transition={
            active
              ? { duration: 0.6 + Math.random() * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.03 }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ─── Call Simulator ───────────────────────────────────────────────────────────

function CallSimulator({ agentName = 'Sangeeta', language = 'hinglish' }: { agentName?: string; language?: string }) {
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'Thinking' | 'Speaking' | 'Listening'>('Thinking');
  const [callDuration, setCallDuration] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const langLabel = LANGUAGES.find((l) => l.code === language)?.native || 'Hinglish';

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const statusColors: Record<string, string> = {
    Thinking: '#f59e0b',
    Speaking: '#a855f7',
    Listening: '#22c55e',
  };

  const startCall = useCallback(() => {
    setCallState('connecting');
    setTranscript([]);
    setCallDuration(0);
    setTimeout(() => {
      setCallState('active');
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      DEMO_TRANSCRIPT.forEach(({ speaker, text, delay }) => {
        setTimeout(() => {
          setCurrentStatus(speaker === 'agent' ? 'Speaking' : 'Listening');
          setTranscript((prev) => [...prev, { speaker, text }]);
        }, delay);
      });
      setTimeout(() => {
        setCurrentStatus('Thinking');
        setCallState('ended');
        if (timerRef.current) clearInterval(timerRef.current);
      }, 15000);
    }, 1800);
  }, []);

  const endCall = useCallback(() => {
    setCallState('ended');
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resetCall = useCallback(() => {
    setCallState('idle');
    setTranscript([]);
    setCallDuration(0);
    setCurrentStatus('Thinking');
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm overflow-hidden shadow-2xl">
      {/* Agent Header */}
      <div className="p-5 border-b border-neutral-800 flex items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
            {agentName[0]}
          </div>
          {callState === 'active' && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-neutral-900" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">{agentName}</div>
          <div className="text-[11px] text-neutral-500">AI Agent · {langLabel} · CallMind AI</div>
        </div>
        {callState === 'active' && (
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            {formatDuration(callDuration)}
          </div>
        )}
      </div>

      {/* Waveform / Status */}
      <div className="px-6 py-5 border-b border-neutral-800 bg-neutral-950/40">
        {callState === 'idle' && (
          <div className="text-center py-4">
            <Mic className="h-10 w-10 text-neutral-700 mx-auto mb-2" />
            <p className="text-neutral-500 text-sm">Click &quot;Start Demo Call&quot; to begin</p>
          </div>
        )}
        {callState === 'connecting' && (
          <div className="text-center py-4 space-y-3">
            <Loader2 className="h-8 w-8 text-primary-400 mx-auto animate-spin" />
            <p className="text-neutral-400 text-sm">Connecting to {agentName}...</p>
            <AudioWaveform active={false} />
          </div>
        )}
        {callState === 'active' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: statusColors[currentStatus] }} />
                <span className="text-xs font-bold" style={{ color: statusColors[currentStatus] }}>{currentStatus}</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-neutral-700 text-neutral-400">Sub-500ms latency</Badge>
            </div>
            <AudioWaveform active={currentStatus === 'Speaking'} color={statusColors[currentStatus]} />
          </div>
        )}
        {callState === 'ended' && (
          <div className="text-center py-4 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
            <p className="text-green-400 font-semibold text-sm">Call Ended · {formatDuration(callDuration)}</p>
            <p className="text-neutral-500 text-xs">Agent handled the call successfully!</p>
          </div>
        )}
      </div>

      {/* Live Transcript */}
      <div
        ref={transcriptRef}
        className="px-4 py-4 h-52 overflow-y-auto flex flex-col gap-3 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
      >
        {transcript.length === 0 && callState !== 'ended' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-neutral-700 text-xs text-center">
              {callState === 'idle' ? 'Live transcript will appear here during the call…' : 'Connecting…'}
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {transcript.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                msg.speaker === 'agent'
                  ? 'bg-primary-500/10 border border-primary-500/20 text-neutral-200 rounded-tl-sm'
                  : 'bg-neutral-800 text-neutral-300 rounded-tr-sm'
              }`}>
                <div className={`text-[9px] font-bold mb-1 ${msg.speaker === 'agent' ? 'text-primary-400' : 'text-neutral-500'}`}>
                  {msg.speaker === 'agent' ? agentName : 'You (Customer)'}
                </div>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Call Controls */}
      <div className="px-6 py-5 border-t border-neutral-800 flex items-center justify-center gap-4">
        {(callState === 'idle' || callState === 'ended') && (
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={callState === 'ended' ? resetCall : startCall}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-full px-8 py-3 shadow-lg shadow-green-500/30 transition-colors"
          >
            <Phone className="h-4 w-4" />
            {callState === 'ended' ? 'Call Again' : 'Start Demo Call'}
          </motion.button>
        )}
        {callState === 'connecting' && (
          <button disabled className="flex items-center gap-2 bg-neutral-800 text-neutral-500 font-bold text-sm rounded-full px-8 py-3 cursor-not-allowed">
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
          </button>
        )}
        {callState === 'active' && (
          <>
            <button className="h-12 w-12 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors" title="Mute">
              <Mic className="h-4 w-4 text-neutral-300" />
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={endCall}
              className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg shadow-red-500/30 transition-colors"
              title="End Call"
            >
              <PhoneOff className="h-5 w-5 text-white" />
            </motion.button>
            <button className="h-12 w-12 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors" title="Volume">
              <Volume2 className="h-4 w-4 text-neutral-300" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── HOMEPAGE SECTION (exported) ──────────────────────────────────────────────

export function LiveDemoSection() {
  return (
    <section id="demo" className="py-28 relative z-10 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary-500/8 blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-6"
          >
            <Badge variant="outline" className="border-primary-500/20 bg-primary-500/5 text-primary-400 font-bold px-3 py-1 rounded-full text-xs">
              🎙️ LIVE DEMO
            </Badge>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Hear Your AI Agent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
                In Action
              </span>
            </h2>

            <p className="text-neutral-400 text-base leading-relaxed max-w-md">
              Click &quot;Start Demo Call&quot; and watch Sangeeta — our AI agent — handle a real customer inquiry in Hinglish with sub-500ms response time.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { icon: <Zap className="h-4 w-4" />,     value: '<500ms',  label: 'Response',  color: 'text-amber-400' },
                { icon: <Globe className="h-4 w-4" />,   value: '14',      label: 'Languages', color: 'text-primary-400' },
                { icon: <Activity className="h-4 w-4" />,value: '99.9%',  label: 'Uptime',    color: 'text-green-400' },
              ].map((s) => (
                <div key={s.label} className="text-center bg-neutral-900/60 border border-neutral-800 rounded-xl py-4">
                  <span className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</span>
                  <div className={`text-lg font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90 text-white font-bold text-sm rounded-xl px-6 py-3 shadow-glow transition-all"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/Demoboarding"
                className="inline-flex items-center gap-2 border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl px-6 py-3 transition-colors"
              >
                <PhoneCall className="h-4 w-4" /> Full Demo Experience
              </Link>
            </div>
          </motion.div>

          {/* Right — Simulator */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <CallSimulator agentName="Sangeeta" language="hinglish" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default LiveDemoSection;
