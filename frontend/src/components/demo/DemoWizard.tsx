'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Bot,
  Building2,
  Mic,
  Phone,
  PhoneOff,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Languages,
  Loader2,
  AlertCircle,
  ArrowRight,
  PhoneCall,
  Activity,
  Globe,
  Zap,
  CheckCircle2,
  Volume2,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'hinglish', name: 'Hinglish', native: 'Hinglish' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
];

const INDUSTRIES = [
  'E-Commerce & Retail',
  'Healthcare & Telemedicine',
  'Real Estate & PropTech',
  'EdTech & Online Learning',
  'Banking & FinTech',
  'Travel & Hospitality',
  'Insurance',
  'Logistics & Supply Chain',
  'SaaS & Technology',
  'Other',
];

const CALL_VOLUMES = ['< 500 calls/month', '500 – 5,000', '5,000 – 50,000', '50,000 – 500,000', '500,000+'];

const VOICE_PERSONAS = [
  { id: 'sangeeta', name: 'Sangeeta', gender: 'Female', accent: 'Indian English', tone: 'Warm & Professional' },
  { id: 'arjun', name: 'Arjun', gender: 'Male', accent: 'Indian English', tone: 'Confident & Clear' },
  { id: 'priya', name: 'Priya', gender: 'Female', accent: 'Neutral', tone: 'Friendly & Upbeat' },
  { id: 'rahul', name: 'Rahul', gender: 'Male', accent: 'Neutral', tone: 'Calm & Trustworthy' },
];

const DEMO_TRANSCRIPT = [
  { speaker: 'agent', text: 'Namaste! Main Sangeeta bol rahi hoon, ABC Technology se. Aap se baat karke bahut khushi hui!', delay: 800 },
  { speaker: 'user', text: 'Hello, mujhe apni company ke liye AI calling solution chahiye.', delay: 3200 },
  { speaker: 'agent', text: 'Bilkul! Aapki company ki requirements ke baare mein thoda aur bataiye. Kya aap customer support ya sales calls automate karna chahte hain?', delay: 5800 },
  { speaker: 'user', text: 'Haan, mainly customer support calls. Humara call volume bohot zyada hai.', delay: 9000 },
  { speaker: 'agent', text: 'Samajh gaye! CallMind AI aapke liye perfect solution hai. Hum 10 million+ calls handle kar chuke hain 99.9% uptime ke saath. Kya main aapko ek demo schedule kar sakti hoon?', delay: 11500 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgFormData {
  orgName: string;
  industry: string;
  callVolume: string;
  website: string;
  phoneNumber: string;
}

interface AgentFormData {
  agentName: string;
  voicePersona: string;
  language: string;
  toneLevel: number;
  systemPrompt: string;
}

interface FormErrors {
  [key: string]: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
              ? {
                  height: [6, Math.random() * 36 + 8, 6],
                  opacity: [0.4, 1, 0.4],
                }
              : { height: 4, opacity: 0.2 }
          }
          transition={
            active
              ? {
                  duration: 0.6 + Math.random() * 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.03,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

function StepPill({
  step,
  current,
  label,
  icon,
}: {
  step: number;
  current: number;
  label: string;
  icon: React.ReactNode;
}) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className={`
          h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all
          ${done ? 'bg-primary-500 border-primary-500 text-white' : active ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-neutral-750 bg-neutral-900 text-neutral-500'}
        `}
        animate={{ scale: active ? 1.15 : 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {done ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">{icon}</span>}
      </motion.div>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${active ? 'text-primary-400' : done ? 'text-neutral-300' : 'text-neutral-600'}`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── STEP 1: Organization Setup ───────────────────────────────────────────────

function StepOrganization({
  data,
  onChange,
  errors,
}: {
  data: OrgFormData;
  onChange: (updates: Partial<OrgFormData>) => void;
  errors: FormErrors;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Building2 className="h-7 w-7 text-primary-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Set Up Your Organization</h2>
        <p className="text-neutral-400 text-xs max-w-sm mx-auto">
          Tell us about your business so we can tailor your AI voice agent experience.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-left">
        {/* Org Name */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-neutral-300 mb-2 uppercase tracking-wider">
            Organization Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={data.orgName}
            onChange={(e) => onChange({ orgName: e.target.value })}
            placeholder="e.g. ABC Technology Pvt Ltd"
            className={`w-full bg-neutral-900 border rounded-xl px-4 py-3 text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all ${errors.orgName ? 'border-red-500' : 'border-neutral-800 hover:border-neutral-700'}`}
          />
          {errors.orgName && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.orgName}
            </p>
          )}
        </div>

        {/* Industry */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-300 mb-2 uppercase tracking-wider">
            Industry <span className="text-red-400">*</span>
          </label>
          <select
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className={`w-full bg-neutral-900 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all appearance-none ${data.industry ? 'text-white' : 'text-neutral-600'} ${errors.industry ? 'border-red-500' : 'border-neutral-800 hover:border-neutral-700'}`}
          >
            <option value="" disabled>
              Select Industry
            </option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind} className="bg-neutral-900 text-white">
                {ind}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.industry}
            </p>
          )}
        </div>

        {/* Call Volume */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-300 mb-2 uppercase tracking-wider">
            Monthly Call Volume <span className="text-red-400">*</span>
          </label>
          <select
            value={data.callVolume}
            onChange={(e) => onChange({ callVolume: e.target.value })}
            className={`w-full bg-neutral-900 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all appearance-none ${data.callVolume ? 'text-white' : 'text-neutral-600'} ${errors.callVolume ? 'border-red-500' : 'border-neutral-800 hover:border-neutral-700'}`}
          >
            <option value="" disabled>
              Select Volume
            </option>
            {CALL_VOLUMES.map((v) => (
              <option key={v} value={v} className="bg-neutral-900 text-white">
                {v}
              </option>
            ))}
          </select>
          {errors.callVolume && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.callVolume}
            </p>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-300 mb-2 uppercase tracking-wider">
            Website URL
          </label>
          <input
            type="url"
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://yourcompany.com"
            className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-300 mb-2 uppercase tracking-wider">
            Business Phone
          </label>
          <input
            type="tel"
            value={data.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value })}
            placeholder="+91 98765 43210"
            className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-neutral-900">
        {['SOC2 Type II', 'HIPAA Compliant', 'ISO 27001', 'GDPR Ready'].map((badge) => (
          <span key={badge} className="text-[9px] font-bold text-neutral-500 bg-neutral-900/60 border border-neutral-850 rounded-full px-3 py-1">
            🔐 {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── STEP 2: AI Agent Builder ─────────────────────────────────────────────────

function StepAgentBuilder({
  data,
  onChange,
  errors,
}: {
  data: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  errors: FormErrors;
}) {
  const toneLabels = ['Formal', 'Professional', 'Balanced', 'Friendly', 'Casual'];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary-500/20 to-primary-500/20 border border-secondary-500/30 flex items-center justify-center mx-auto mb-4">
          <Bot className="h-7 w-7 text-secondary-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Design Your AI Agent</h2>
        <p className="text-neutral-400 text-xs max-w-sm mx-auto">
          Customize your agent&apos;s voice, personality, language, and behavior to match your brand.
        </p>
      </div>

      <div className="space-y-5 text-left">
        {/* Agent Name */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-300 mb-2 uppercase tracking-wider">
            Agent Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={data.agentName}
            onChange={(e) => onChange({ agentName: e.target.value })}
            placeholder="e.g. Sangeeta, Arjun, Priya"
            className={`w-full bg-neutral-900 border rounded-xl px-4 py-3 text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500/50 transition-all ${errors.agentName ? 'border-red-500' : 'border-neutral-800 hover:border-neutral-700'}`}
          />
          {errors.agentName && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.agentName}
            </p>
          )}
        </div>

        {/* Voice Persona Selection */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-300 mb-3 uppercase tracking-wider">
            Voice Persona <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {VOICE_PERSONAS.map((persona) => (
              <button
                type="button"
                key={persona.id}
                onClick={() => onChange({ voicePersona: persona.id, agentName: data.agentName || persona.name })}
                className={`relative p-3.5 rounded-xl border text-left transition-all group ${
                  data.voicePersona === persona.id
                    ? 'border-secondary-500 bg-secondary-500/10 ring-1 ring-secondary-500/30'
                    : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                }`}
              >
                {data.voicePersona === persona.id && (
                  <div className="absolute top-3 right-3 h-4 w-4 rounded-full bg-secondary-500 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      data.voicePersona === persona.id ? 'bg-secondary-500/20 text-secondary-400' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {persona.name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{persona.name}</div>
                    <div className="text-[9px] text-neutral-500">{persona.gender}</div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9px] text-neutral-500">
                    <span className="text-neutral-450">Accent: </span>
                    {persona.accent}
                  </div>
                  <div className="text-[9px] text-neutral-500">
                    <span className="text-neutral-450">Tone: </span>
                    {persona.tone}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {errors.voicePersona && (
            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.voicePersona}
            </p>
          )}
        </div>

        {/* Language */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-300 mb-2 uppercase tracking-wider">
            Primary Language <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-550 pointer-events-none" />
            <select
              value={data.language}
              onChange={(e) => onChange({ language: e.target.value })}
              className={`w-full bg-neutral-900 border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500/50 transition-all appearance-none ${data.language ? 'text-white' : 'text-neutral-600'} ${errors.language ? 'border-red-500' : 'border-neutral-800 hover:border-neutral-700'}`}
            >
              <option value="" disabled>
                Select language
              </option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-neutral-900 text-white">
                  {lang.native} — {lang.name}
                </option>
              ))}
            </select>
          </div>
          {errors.language && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.language}
            </p>
          )}
        </div>

        {/* Tone Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">
              Conversation Tone
            </label>
            <span className="text-[10px] font-extrabold text-secondary-400 bg-secondary-500/10 border border-secondary-500/20 px-2 py-0.5 rounded-full">
              {toneLabels[data.toneLevel - 1]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={data.toneLevel}
            onChange={(e) => onChange({ toneLevel: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-secondary-500"
          />
          <div className="flex justify-between text-[9px] text-neutral-600 mt-1">
            <span>Formal</span>
            <span>Casual</span>
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-300 mb-2 uppercase tracking-wider">
            Agent Instructions / Personality
          </label>
          <textarea
            value={data.systemPrompt}
            onChange={(e) => onChange({ systemPrompt: e.target.value })}
            rows={3}
            placeholder="Describe your agent's personality and goals..."
            className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500/50 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// ─── STEP 3: Call Simulator ───────────────────────────────────────────────────

function StepCallSimulator({ agentName, language }: { agentName: string; language: string }) {
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'Thinking' | 'Speaking' | 'Listening'>('Thinking');
  const [callDuration, setCallDuration] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const agentDisplayName = agentName || 'Sangeeta';
  const langLabel = LANGUAGES.find((l) => l.code === language)?.native || 'Hinglish';

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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const statusColors: Record<string, string> = {
    Thinking: '#f59e0b',
    Speaking: '#a855f7',
    Listening: '#22c55e',
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-primary-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <PhoneCall className="h-7 w-7 text-green-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Test Your AI Agent</h2>
        <p className="text-neutral-400 text-xs max-w-sm mx-auto">
          Listen to <strong className="text-white">{agentDisplayName}</strong> in action — watch a live simulated call in real time.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm overflow-hidden text-left">
        {/* Agent Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
              {agentDisplayName[0]}
            </div>
            {callState === 'active' && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-neutral-900" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">{agentDisplayName}</div>
            <div className="text-[11px] text-neutral-500 font-medium">
              AI Agent · {langLabel} · CallMind AI
            </div>
          </div>
          {callState === 'active' && (
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-450 animate-pulse" />
              {formatDuration(callDuration)}
            </div>
          )}
        </div>

        {/* Waveform / Status */}
        <div className="px-6 py-5 border-b border-neutral-800 bg-neutral-950/40">
          {callState === 'idle' && (
            <div className="text-center py-4">
              <Mic className="h-10 w-10 text-neutral-700 mx-auto mb-2 animate-pulse-slow" />
              <p className="text-neutral-550 text-sm">Click &quot;Start Demo Call&quot; to begin simulation</p>
            </div>
          )}

          {callState === 'connecting' && (
            <div className="text-center py-4 space-y-3">
              <Loader2 className="h-8 w-8 text-primary-400 mx-auto animate-spin" />
              <p className="text-neutral-450 text-sm">Connecting to {agentDisplayName}...</p>
              <AudioWaveform active={false} />
            </div>
          )}

          {callState === 'active' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{ backgroundColor: statusColors[currentStatus] }}
                  />
                  <span className="text-xs font-bold" style={{ color: statusColors[currentStatus] }}>
                    {currentStatus}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] border-neutral-700 text-neutral-400">
                  Sub-500ms latency
                </Badge>
              </div>
              <AudioWaveform active={currentStatus === 'Speaking'} color={statusColors[currentStatus]} />
            </div>
          )}

          {callState === 'ended' && (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
              <p className="text-green-400 font-semibold text-sm">Call Ended · {formatDuration(callDuration)}</p>
              <p className="text-neutral-500 text-xs">Your agent handled the call successfully!</p>
            </div>
          )}
        </div>

        {/* Live Transcript */}
        <div
          ref={transcriptRef}
          className="px-4 py-4 h-52 overflow-y-auto flex flex-col gap-3 scroll-smooth bg-neutral-950/20"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
        >
          {transcript.length === 0 && callState !== 'ended' && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-neutral-700 text-xs text-center">
                {callState === 'idle' ? 'Transcript will appear here during the call…' : 'Connecting…'}
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
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.speaker === 'agent'
                      ? 'bg-primary-500/10 border border-primary-500/20 text-neutral-200 rounded-tl-sm'
                      : 'bg-neutral-800 text-neutral-350 rounded-tr-sm'
                  }`}
                >
                  <div className={`text-[9px] font-bold mb-1 ${msg.speaker === 'agent' ? 'text-primary-400' : 'text-neutral-500'}`}>
                    {msg.speaker === 'agent' ? agentDisplayName : 'You (Customer)'}
                  </div>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Call Controls */}
        <div className="px-6 py-5 border-t border-neutral-850 flex items-center justify-center gap-4 bg-neutral-950/10">
          {(callState === 'idle' || callState === 'ended') && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={callState === 'ended' ? resetCall : startCall}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-full px-8 py-3 shadow-lg shadow-green-500/30 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {callState === 'ended' ? 'Call Again' : 'Start Demo Call'}
            </motion.button>
          )}

          {callState === 'connecting' && (
            <button
              disabled
              className="flex items-center gap-2 bg-neutral-850 text-neutral-500 font-bold text-sm rounded-full px-8 py-3 cursor-not-allowed"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting…
            </button>
          )}

          {callState === 'active' && (
            <>
              <button
                type="button"
                className="h-12 w-12 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors text-neutral-350"
                title="Mute"
              >
                <Mic className="h-4 w-4" />
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={endCall}
                className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg shadow-red-500/30 transition-colors"
                title="End Call"
              >
                <PhoneOff className="h-5 w-5 text-white" />
              </motion.button>
              <button
                type="button"
                className="h-12 w-12 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors text-neutral-350"
                title="Volume"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Zap className="h-4 w-4" />, label: '<500ms Latency', color: 'text-amber-400' },
          { icon: <Globe className="h-4 w-4" />, label: '14 Languages', color: 'text-primary-400' },
          { icon: <Activity className="h-4 w-4" />, label: '99.9% Uptime', color: 'text-green-400' },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1.5 bg-neutral-900/40 border border-neutral-800 rounded-xl py-3 backdrop-blur-sm">
            <span className={item.color}>{item.icon}</span>
            <span className="text-[10px] font-bold text-neutral-450">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ orgName, agentName }: { orgName: string; agentName: string }) {
  const items = [
    'Organization created successfully',
    'AI Agent trained and deployed',
    'Voice model initialized',
    'Dashboard access granted',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8 py-8"
    >
      <div className="relative mx-auto h-24 w-24">
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="relative h-full w-full rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-xl shadow-green-500/30">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white">You&apos;re All Set! 🎉</h2>
        <p className="text-neutral-400 text-sm max-w-sm mx-auto">
          <strong className="text-white">{agentName || 'Your AI Agent'}</strong> is live and ready to handle calls for{' '}
          <strong className="text-white">{orgName || 'your organization'}</strong>.
        </p>
      </div>

      {/* Checklist */}
      <div className="max-w-sm mx-auto space-y-3 text-left">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3"
          >
            <Check className="h-4 w-4 text-green-450 shrink-0" />
            <span className="text-xs font-semibold text-neutral-300">{item}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-sm mx-auto">
        <Button
          size="lg"
          className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90 font-bold shadow-glow w-full"
          asChild
        >
          <Link href="/onboarding">
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

// ─── MAIN DEMO WIZARD COMPONENT ───────────────────────────────────────────────

export function DemoWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState<FormErrors>( {});

  const [orgData, setOrgData] = useState<OrgFormData>({
    orgName: '',
    industry: '',
    callVolume: '',
    website: '',
    phoneNumber: '',
  });

  const [agentData, setAgentData] = useState<AgentFormData>({
    agentName: 'Sangeeta',
    voicePersona: 'sangeeta',
    language: 'hinglish',
    toneLevel: 3,
    systemPrompt:
      "You are Sangeeta, a warm and professional AI voice agent for the organization. Greet customers in Hinglish, resolve queries quickly, and always maintain a courteous tone. If you can't resolve an issue, escalate to a human agent.",
  });

  const STEPS = [
    { label: 'Organization', icon: <Building2 className="h-4 w-4" /> },
    { label: 'AI Agent', icon: <Bot className="h-4 w-4" /> },
    { label: 'Test Call', icon: <Phone className="h-4 w-4" /> },
  ];

  const validateStep1 = () => {
    const errs: FormErrors = {};
    if (!orgData.orgName.trim()) errs.orgName = 'Organization name is required';
    if (!orgData.industry) errs.industry = 'Please select an industry';
    if (!orgData.callVolume) errs.callVolume = 'Please select call volume';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: FormErrors = {};
    if (!agentData.agentName.trim()) errs.agentName = 'Agent name is required';
    if (!agentData.voicePersona) errs.voicePersona = 'Please select a voice persona';
    if (!agentData.language) errs.language = 'Please select a language';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step === 3) {
      setIsSubmitting(true);
      await new Promise((r) => setTimeout(r, 2200));
      setIsSubmitting(false);
      setIsComplete(true);
      return;
    }

    setErrors({});
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    handleNext();
  };

  const goBack = () => {
    setDirection(-1);
    handleBack();
  };

  return (
    <div className="w-full max-w-xl mx-auto relative z-10">
      {isComplete ? (
        <SuccessScreen orgName={orgData.orgName} agentName={agentData.agentName} />
      ) : (
        <div className="w-full space-y-6">
          {/* Progress Header */}
          <div>
            <div className="text-center mb-6">
              <Badge variant="outline" className="border-primary-500/20 bg-primary-500/5 text-primary-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Free Setup — No Credit Card Required
              </Badge>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-0">
              {STEPS.map((s, i) => (
                <React.Fragment key={i}>
                  <StepPill step={i + 1} current={step} label={s.label} icon={s.icon} />
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 max-w-16 mx-2 transition-colors ${step > i + 1 ? 'bg-primary-500' : 'bg-neutral-800'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Label */}
            <div className="text-center mt-3">
              <span className="text-[10px] font-semibold text-neutral-500">
                Step {step} of {STEPS.length}
              </span>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-md shadow-2xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                >
                  {step === 1 && (
                    <StepOrganization
                      data={orgData}
                      onChange={(u) => setOrgData((d) => ({ ...d, ...u }))}
                      errors={errors}
                    />
                  )}
                  {step === 2 && (
                    <StepAgentBuilder
                      data={agentData}
                      onChange={(u) => setAgentData((d) => ({ ...d, ...u }))}
                      errors={errors}
                    />
                  )}
                  {step === 3 && (
                    <StepCallSimulator agentName={agentData.agentName} language={agentData.language} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/40">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${step === i + 1 ? 'w-5 bg-primary-500' : step > i + 1 ? 'w-1.5 bg-primary-500/50' : 'w-1.5 bg-neutral-755'}`}
                  />
                ))}
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90 text-white font-bold text-xs rounded-xl px-5 py-2.5 shadow-glow disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Setting up…
                  </>
                ) : step === 3 ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Launch Agent
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DemoWizard;
