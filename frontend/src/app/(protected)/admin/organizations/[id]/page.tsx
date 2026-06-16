'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, AlertCircle, Building2, Mail, Globe, Calendar, User,
  CreditCard, PhoneCall, Cpu, IndianRupee, Activity, Clock, TrendingUp, Shield,
  Bot, Zap, BarChart3, Crown
} from 'lucide-react';
import Link from 'next/link';
import { adminService } from '@/services/admin.service';
import { format } from 'date-fns';

export default function AdminOrganizationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-organization', id],
    queryFn: () => adminService.getOrganizationById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading organization details...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load organization: {(error as Error)?.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { organization: org, admin: owner, subscription: sub, usageTrends, agents, recentCalls } = data;

  const totalCost = usageTrends.reduce((s, t) => s + t.aiCost + t.callCost, 0);
  const totalMinutes = usageTrends.reduce((s, t) => s + t.minutes, 0);
  const totalCalls = usageTrends.reduce((s, t) => s + t.calls, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Building2 className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{org.name}</h1>
            <p className="text-slate-400 flex items-center gap-2 mt-1">
              {org.industry && <><span>{org.industry}</span><span className="text-slate-600">·</span></>}
              Created {format(new Date(org.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        <Link href="/admin/organizations">
          <Button variant="outline" className="text-slate-400">← Back</Button>
        </Link>
      </div>

      {/* Admin Details */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-white">Admin Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Name</p>
              <p className="text-white font-medium">{owner?.name || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <p className="text-white font-medium truncate">{owner?.email || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Role</p>
              <p className="text-white font-medium capitalize">{owner?.role?.toLowerCase() || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <Badge variant={owner?.isActive ? 'success' : 'secondary'} className="rounded-md">
                {owner?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white">Organization Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 col-span-2">
              <p className="text-xs text-slate-500 mb-1">About</p>
              <p className="text-slate-300 text-sm">{org.about || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Website</p>
              <p className="text-blue-400 text-sm truncate">{org.website || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Industry</p>
              <p className="text-slate-300">{org.industry || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Brand Tone</p>
              <p className="text-slate-300 capitalize">{org.tone || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 col-span-2">
              <p className="text-xs text-slate-500 mb-1">Products / Services</p>
              <p className="text-slate-300 text-sm">{org.productInfo || 'N/A'}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 col-span-2">
              <p className="text-xs text-slate-500 mb-1">Target Audience</p>
              <p className="text-slate-300 text-sm">{org.targetAudience || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Agent Details */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-white">AI Agents</CardTitle>
            <CardDescription className="text-slate-400 ml-auto">
              {agents?.length || 0} agents · {agents?.filter(a => a.isActive).length || 0} active
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!agents || agents.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No agents deployed for this organization</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                    <th className="pb-2 pl-2">Agent</th>
                    <th className="pb-2">Language</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Total Calls</th>
                    <th className="pb-2 text-right">Minutes</th>
                    <th className="pb-2 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Cpu className="w-3 h-3 text-purple-400" /> AI Cost
                      </span>
                    </th>
                    <th className="pb-2 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <PhoneCall className="w-3 h-3 text-blue-400" /> Call Cost
                      </span>
                    </th>
                    <th className="pb-2 text-right pr-2">
                      <span className="flex items-center justify-end gap-1">
                        <IndianRupee className="w-3 h-3 text-emerald-400" /> Total
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent, idx) => (
                    <tr key={agent._id} className={`border-b border-slate-800/50 text-slate-300 ${idx === 0 ? 'bg-cyan-950/20' : ''}`}>
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-2">
                          {idx === 0 && <Crown className="w-4 h-4 text-amber-400" />}
                          <Bot className="w-4 h-4 text-cyan-400" />
                          <span className="font-medium text-white">{agent.name}</span>
                        </div>
                      </td>
                      <td className="py-3 uppercase text-xs">{agent.language}</td>
                      <td className="py-3">
                        <Badge variant={agent.isActive ? 'success' : 'secondary'} className="rounded-md text-xs">
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium">{agent.totalCalls}</td>
                      <td className="py-3 text-right">{agent.totalMinutes.toFixed(1)}</td>
                      <td className="py-3 text-right text-purple-400">₹{agent.aiCost.toFixed(2)}</td>
                      <td className="py-3 text-right text-blue-400">₹{agent.callCost.toFixed(2)}</td>
                      <td className="py-3 text-right pr-2 font-semibold text-white">₹{agent.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Details */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <CardTitle className="text-white">Billing Details</CardTitle>
            <CardDescription className="text-slate-400 ml-auto">
              Last 30 days
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Subscription */}
          {sub ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Shield className="w-4 h-4" />
                  <p className="text-xs text-slate-500">Plan</p>
                </div>
                <p className="text-white font-bold text-lg">{sub.planName}</p>
                <p className="text-xs text-slate-500">₹{sub.planPrice}/mo</p>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-400" /> Status
                </p>
                <Badge variant={sub.status === 'active' ? 'success' : 'secondary'} className="rounded-md capitalize">
                  {sub.status}
                </Badge>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Period
                </p>
                <p className="text-white text-sm">
                  {sub.currentPeriodStart ? format(new Date(sub.currentPeriodStart), 'dd MMM') : 'N/A'}
                  {' — '}
                  {sub.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), 'dd MMM yyyy') : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-400" /> Minutes
                </p>
                <p className="text-white font-bold text-lg">{sub.minutesUsed.toLocaleString()}</p>
                <p className="text-xs text-slate-500">of {sub.minutesLimit >= 999999 ? '∞' : sub.minutesLimit.toLocaleString()}</p>
                {sub.minutesLimit < 999999 && sub.minutesLimit > 0 && (
                  <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(sub.minutesUsed / sub.minutesLimit) > 0.8 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (sub.minutesUsed / sub.minutesLimit) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active subscription</p>
            </div>
          )}

          {/* 30-Day Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" /> Total Calls
              </p>
              <p className="text-white font-bold text-2xl">{totalCalls}</p>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> AI Minutes
              </p>
              <p className="text-white font-bold text-2xl">{Math.round(totalMinutes)}</p>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> AI Cost
              </p>
              <p className="text-white font-bold text-2xl text-purple-400">
                ₹{usageTrends.reduce((s, t) => s + t.aiCost, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Total Cost
              </p>
              <p className="text-white font-bold text-2xl text-emerald-400">
                ₹{totalCost.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Usage Trend (simple table) */}
          {usageTrends.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" /> Daily Usage (Last 30 Days)
              </h3>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                      <th className="pb-2">Date</th>
                      <th className="pb-2 text-right">Calls</th>
                      <th className="pb-2 text-right">Minutes</th>
                      <th className="pb-2 text-right">AI Cost</th>
                      <th className="pb-2 text-right">Call Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageTrends.map((t) => (
                      <tr key={t.date} className="border-b border-slate-800/50 text-slate-300">
                        <td className="py-2 text-slate-500">{format(new Date(t.date), 'dd MMM')}</td>
                        <td className="py-2 text-right">{t.calls}</td>
                        <td className="py-2 text-right">{t.minutes.toFixed(1)}</td>
                        <td className="py-2 text-right text-purple-400">₹{t.aiCost.toFixed(2)}</td>
                        <td className="py-2 text-right text-blue-400">₹{t.callCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Calls */}
          {recentCalls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" /> Recent Calls
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                      <th className="pb-2">Phone</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Outcome</th>
                      <th className="pb-2 text-right">Duration</th>
                      <th className="pb-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCalls.slice(0, 10).map((call) => (
                      <tr key={call._id} className="border-b border-slate-800/50 text-slate-300">
                        <td className="py-2">{call.phoneNumber}</td>
                        <td className="py-2">
                          <Badge variant={call.status === 'completed' ? 'success' : 'secondary'} className="rounded-md capitalize text-xs">
                            {call.status}
                          </Badge>
                        </td>
                        <td className="py-2 capitalize">{call.outcome}</td>
                        <td className="py-2 text-right">{Math.round(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</td>
                        <td className="py-2 text-right text-slate-500">
                          {format(new Date(call.createdAt), 'dd MMM HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}