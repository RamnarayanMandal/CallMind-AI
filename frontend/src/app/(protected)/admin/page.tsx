'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bot, CreditCard, Activity, AlertCircle } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { useAdminStats } from '@/hooks/useAdmin';
import { Alert, AlertDescription } from '@/components/ui/alert';

const mockChartData = [
  { name: 'Mon', minutes: 120 },
  { name: 'Tue', minutes: 210 },
  { name: 'Wed', minutes: 180 },
  { name: 'Thu', minutes: 390 },
  { name: 'Fri', minutes: 250 },
  { name: 'Sat', minutes: 110 },
  { name: 'Sun', minutes: 90 },
];

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-12 text-slate-400">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-blue-500"></div>
          Loading Dashboard Analytics...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard statistics: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fallback safe values
  const displayStats = stats || {
    totalUsers: 0,
    totalAgents: 0,
    activeSubscriptions: 0,
    systemHealth: 'Unknown'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Control Center</h1>
        <p className="text-slate-400">Monitor system performance, subscriptions, and AI agent usage across all organizations.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{displayStats.totalUsers}</div>
            <p className="text-xs text-slate-500">+4% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Deployed Agents</CardTitle>
            <Bot className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{displayStats.totalAgents}</div>
            <p className="text-xs text-slate-500">+12 active in realtime</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Active Subscriptions</CardTitle>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{displayStats.activeSubscriptions}</div>
            <p className="text-xs text-slate-500">Razorpay tracked</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">System Health</CardTitle>
            <Activity className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{displayStats.systemHealth}</div>
            <p className="text-xs text-slate-500">Latency: 45ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">AI Minutes Consumed</CardTitle>
            <CardDescription className="text-slate-400">Total system wide voice activity over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="minutes" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">API Cost Projection</CardTitle>
            <CardDescription className="text-slate-400">Estimated OpenAI & Telephony costs (USD)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
