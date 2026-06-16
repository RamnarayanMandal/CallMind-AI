'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Clock, User, Bot, MessageSquare,
  CheckCircle2, XCircle, AlertTriangle, Mic, Loader2,
  Calendar, Activity, Zap, ThumbsUp, ThumbsDown, Download,
} from 'lucide-react';
import { useCallDetail, useCallConversation } from '@/hooks/use-call-detail';
import apiClient from '@/lib/axios-client';
import type { Call, ConversationExtended } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL;

const formatDuration = (s: number) => {
  if (!s) return '0:00';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    completed: { icon: <CheckCircle2 className="w-4 h-4" />, cls: 'bg-green-900/40 text-green-400 border-green-800' },
    failed: { icon: <XCircle className="w-4 h-4" />, cls: 'bg-red-900/40 text-red-400 border-red-800' },
    'in-progress': { icon: <Activity className="w-4 h-4 animate-pulse" />, cls: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  };
  const cfg = map[status] ?? { icon: <AlertTriangle className="w-4 h-4" />, cls: 'bg-yellow-900/40 text-yellow-400 border-yellow-800' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      {cfg.icon} {status.replace('-', ' ').toUpperCase()}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, { cls: string }> = {
    interested: { cls: 'bg-green-900/40 text-green-400 border-green-800' },
    'not-interested': { cls: 'bg-red-900/40 text-red-400 border-red-800' },
    'follow-up': { cls: 'bg-blue-900/40 text-blue-400 border-blue-800' },
    'no-answer': { cls: 'bg-yellow-900/40 text-yellow-400 border-yellow-800' },
  };
  const cfg = map[outcome] ?? { cls: 'bg-slate-800 text-slate-400 border-slate-700' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      {outcome.replace('-', ' ').toUpperCase()}
    </span>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
      <p className="text-slate-400 text-xs flex items-center gap-1">{icon} {label}</p>
      <p className="text-white font-semibold text-base">{value}</p>
    </div>
  );
}

function LatencyBar({ label, value, color, max }: { label: string; value?: number; color: string; max: number }) {
  const pct = value ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={color}>{value ? `${value}ms` : '—'}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color.replace('text-', 'bg-')} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CallDetailPage() {
  const { id: callId } = useParams<{ id: string }>();

  const { data: call, isLoading: callLoading, isError: callError } = useCallDetail(callId);
  const { data: conv, isLoading: convLoading } = useCallConversation(callId);

  const conversation = conv as ConversationExtended | undefined;
  const isLoading = callLoading || convLoading;

  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);

  useEffect(() => {
    if (!call?.recordingUrl || !call?._id) return;
    setRecordingLoading(true);
    apiClient.get(`/calls/${call._id}/recording`, { responseType: 'blob' })
      .then(res => setRecordingUrl(URL.createObjectURL(res.data)))
      .catch(() => setRecordingUrl(null))
      .finally(() => setRecordingLoading(false));
  }, [call?._id, call?.recordingUrl]);

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-96 gap-3">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-slate-400">Loading call details…</p>
      </div>
    );
  }

  if (callError || !call) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-96 gap-3">
        <XCircle className="w-10 h-10 text-red-400" />
        <p className="text-white font-semibold text-lg">Call not found</p>
        <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">← Back to Dashboard</Link>
      </div>
    );
  }

  const agentName = typeof call.agentId === 'object' ? (call.agentId as any)?.name : 'Default Agent';
  const agentLanguage = typeof call.agentId === 'object' ? (call.agentId as any)?.language : null;
  const customerName = typeof call.customerId === 'object' ? (call.customerId as any)?.name : null;
  const customerPhone = typeof call.customerId === 'object' ? (call.customerId as any)?.phone : null;

  const maxLatency = Math.max(
    conversation?.avgSttLatencyMs ?? 0,
    conversation?.avgLlmLatencyMs ?? 0,
    conversation?.avgTtsLatencyMs ?? 0,
    2000,
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center flex-wrap gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Call Details</h1>
            <StatusBadge status={call.status} />
            <OutcomeBadge outcome={call.outcome} />
          </div>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(call.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {recordingUrl && (
            <>
              <audio controls src={recordingUrl} className="h-10 rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
              <a
                href={recordingUrl}
                download={`call-${call._id}.mp3`}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Download recording"
              >
                <Download className="w-4 h-4" />
              </a>
            </>
          )}
          {recordingLoading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<User className="w-3 h-3" />} label="Customer" value={customerName || <span className="font-mono">{call.phoneNumber}</span>} />
        <StatCard icon={<Phone className="w-3 h-3" />} label="Dialed" value={<span className="font-mono">{customerPhone || call.phoneNumber || '—'}</span>} />
        <StatCard icon={<Clock className="w-3 h-3" />} label="Duration" value={<span className="text-xl font-bold">{formatDuration(call.durationSeconds)}</span>} />
        {call.recordingDuration != null ? (
          <StatCard icon={<Mic className="w-3 h-3" />} label="Recording" value={formatDuration(call.recordingDuration)} />
        ) : (
          <StatCard icon={<Bot className="w-3 h-3" />} label="Agent" value={<span className="flex flex-col"><span>{agentName}</span>{agentLanguage && <span className="text-xs text-slate-400">{agentLanguage}</span>}</span>} />
        )}
      </div>

      {conversation && (conversation.avgSttLatencyMs || conversation.avgLlmLatencyMs || conversation.avgTtsLatencyMs) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Average AI Latency
          </h3>
          <div className="space-y-3">
            <LatencyBar label="STT (Speech → Text)" value={conversation.avgSttLatencyMs} color="text-blue-400" max={maxLatency} />
            <LatencyBar label="LLM (Text → Response)" value={conversation.avgLlmLatencyMs} color="text-purple-400" max={maxLatency} />
            <LatencyBar label="TTS (Response → Audio)" value={conversation.avgTtsLatencyMs} color="text-orange-400" max={maxLatency} />
            <LatencyBar label="Total Round-trip" value={conversation.avgTotalLatencyMs} color="text-green-400" max={maxLatency} />
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-slate-800">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <h3 className="text-white font-semibold">Conversation Transcript</h3>
          {conversation?.transcript && (
            <span className="ml-auto text-slate-500 text-xs">{conversation.transcript.length} messages</span>
          )}
        </div>
        <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
          {!conversation?.transcript || conversation.transcript.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Mic className="w-10 h-10 text-slate-600" />
              <p className="text-slate-500">No transcript available for this call</p>
            </div>
          ) : (
            conversation.transcript.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'agent' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'agent' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {msg.role === 'agent' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'agent'
                    ? 'bg-blue-950/50 text-blue-100 rounded-tl-none border border-blue-900/50'
                    : 'bg-slate-800 text-slate-200 rounded-tr-none'
                }`}>
                  {msg.content}
                  {msg.timestamp && (
                    <p className="text-xs opacity-40 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {conversation && (conversation.summary || conversation.sentiment || conversation.customerIntent || (conversation.topics?.length ?? 0) > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {conversation.summary && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> AI Summary
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">{conversation.summary}</p>
            </div>
          )}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            {conversation.sentiment && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1.5">Customer Sentiment</p>
                <p className={`font-semibold capitalize flex items-center gap-2 ${
                  conversation.sentiment === 'positive' ? 'text-green-400' :
                  conversation.sentiment === 'negative' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {conversation.sentiment === 'positive'
                    ? <ThumbsUp className="w-4 h-4" />
                    : conversation.sentiment === 'negative'
                      ? <ThumbsDown className="w-4 h-4" />
                      : <Activity className="w-4 h-4" />}
                  {conversation.sentiment}
                </p>
              </div>
            )}
            {conversation.leadStatus && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1.5">Lead Status</p>
                <p className={`font-semibold capitalize flex items-center gap-2 ${
                  conversation.leadStatus === 'hot' ? 'text-red-400' :
                  conversation.leadStatus === 'warm' ? 'text-orange-400' :
                  conversation.leadStatus === 'closed' ? 'text-green-400' : 'text-slate-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    conversation.leadStatus === 'hot' ? 'bg-red-400' :
                    conversation.leadStatus === 'warm' ? 'bg-orange-400' :
                    conversation.leadStatus === 'closed' ? 'bg-green-400' : 'bg-slate-400'
                  }`} />
                  {conversation.leadStatus}
                </p>
              </div>
            )}
            {conversation.outcome && conversation.outcome !== 'unknown' && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1.5">Outcome</p>
                <p className="text-white font-medium capitalize">{conversation.outcome.replace('-', ' ')}</p>
              </div>
            )}
            {conversation.topics && conversation.topics.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Key Topics</p>
                <div className="flex flex-wrap gap-2">
                  {conversation.topics.map((t, i) => (
                    <span key={i} className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {conversation.customerIntent && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:col-span-2">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" /> Customer Intent
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">{conversation.customerIntent}</p>
            </div>
          )}
        </div>
      )}

      {conversation?.actionLog && conversation.actionLog.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Actions Taken by AI</h3>
          <div className="space-y-2">
            {conversation.actionLog.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                a.success
                  ? 'bg-green-900/20 border border-green-800/40'
                  : 'bg-red-900/20 border border-red-800/40'
              }`}>
                {a.success
                  ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium capitalize">{a.action.replace(/_/g, ' ')}</p>
                  {a.data && <p className="text-slate-400 text-xs truncate">{JSON.stringify(a.data)}</p>}
                </div>
                {a.timestamp && (
                  <p className="text-slate-500 text-xs shrink-0">{new Date(a.timestamp).toLocaleTimeString()}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
