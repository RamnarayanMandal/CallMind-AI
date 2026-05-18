'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Activity, Cpu, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdminSocket } from '@/store/useAdminSocket';

export default function AdminInfrastructurePage() {
  const { connect, disconnect, isConnected, infrastructureMetrics } = useAdminSocket();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const metrics = infrastructureMetrics || {
    cpuLoad: 0,
    memoryUsage: { percentage: 0, used: 0 },
    activeSockets: 0
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Server className="w-8 h-8 text-blue-500" />
            Infrastructure Control
          </h1>
          <p className="text-slate-400">Monitor Redis queues, background worker health, and compute resource allocation.</p>
        </div>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-4 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Cluster Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Total Sockets</CardTitle>
            <Activity className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.activeSockets} Connected</div>
            <p className="text-xs text-slate-500">Live platform load</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Memory Usage</CardTitle>
            <HardDrive className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{(metrics.memoryUsage.used / 1024 / 1024 / 1024).toFixed(2)} GB</div>
            <p className="text-xs text-slate-500">{metrics.memoryUsage.percentage.toFixed(1)}% of total system RAM</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">CPU Load Average</CardTitle>
            <Cpu className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.cpuLoad.toFixed(2)}</div>
            <p className="text-xs text-slate-500">1-minute node average</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 mt-6">
        <CardContent className="flex flex-col items-center justify-center p-12 text-slate-500 text-sm">
          <Server className="w-12 h-12 mb-4 text-slate-700 animate-pulse" />
          Bull Board queue monitoring connection established. Waiting for high-load events.
        </CardContent>
      </Card>
    </div>
  );
}
