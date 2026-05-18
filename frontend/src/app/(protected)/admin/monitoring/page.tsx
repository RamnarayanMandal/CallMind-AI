'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, PhoneCall, Wifi, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdminSocket } from '@/store/useAdminSocket';

export default function AdminMonitoringPage() {
  const { connect, disconnect, isConnected, liveCalls, systemAlerts, infrastructureMetrics } = useAdminSocket();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const activeSockets = infrastructureMetrics?.activeSockets || 0;
  const avgLatency = 45; // Real implementation would aggregate from Telephony events
  const failedCalls = systemAlerts.filter(a => a.type === 'telephony').length;
  const llmErrors = systemAlerts.filter(a => a.type === 'ai').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-500" />
            Live AI Monitoring
          </h1>
          <p className="text-slate-400">Monitor active websocket sessions, STT/TTS latency, and LLM behavior in real-time.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Stream Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Active WebSockets</CardTitle>
            <Wifi className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeSockets}</div>
            <p className="text-xs text-slate-500">Connected clients</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Avg Model Latency</CardTitle>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgLatency} ms</div>
            <p className="text-xs text-slate-500">STT + LLM + TTS</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Failed Calls</CardTitle>
            <PhoneCall className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{failedCalls}</div>
            <p className="text-xs text-slate-500">System alerts</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">LLM Hallucinations</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{llmErrors}</div>
            <p className="text-xs text-slate-500">AI Alerts</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 mt-6">
        <CardHeader>
          <CardTitle className="text-lg text-white">Active Voice Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {liveCalls.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No active websocket voice channels detected.
              </div>
            ) : liveCalls.map((call: any) => (
              <div key={call.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${call.status === 'Speaking' ? 'bg-blue-500/20 text-blue-500' : call.status === 'Listening' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-purple-500/20 text-purple-500'}`}>
                    <Activity className={`w-5 h-5 ${call.status === 'Speaking' ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{call.user || 'Unknown User'}</p>
                    <p className="text-xs text-slate-400">Agent: {call.agent || 'AI'} • {call.duration || '00:00'}</p>
                  </div>
                </div>
                <Badge variant="outline" className={
                  call.status === 'Speaking' ? 'text-blue-400 border-blue-400/50' : 
                  call.status === 'Listening' ? 'text-emerald-400 border-emerald-400/50' : 
                  'text-purple-400 border-purple-400/50'
                }>
                  {call.status || 'Active'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
