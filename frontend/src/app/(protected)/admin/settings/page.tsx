'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  ShieldCheck,
  Database,
  Phone,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  Globe,
  Wifi,
} from 'lucide-react';
import { telephonyConfigService, TelephonyConfig, UpdateTelephonyConfigPayload } from '@/services/telephony-config.service';

// ─── Provider Meta-data ───────────────────────────────────────────────────────

interface ProviderMeta {
  id: string;
  label: string;
  description: string;
  color: string;
  gradient: string;
  accountIdLabel: string;
  authTokenLabel: string;
  fromNumberLabel: string;
  icon: React.ReactNode;
  docs: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'vobiz',
    label: 'Vobiz',
    description: 'Indian telephony via Plivo-compatible API. Best for INR billing & domestic calls.',
    color: 'text-violet-400',
    gradient: 'from-violet-600/20 to-purple-600/10',
    accountIdLabel: 'Auth ID',
    authTokenLabel: 'Auth Token',
    fromNumberLabel: 'Caller Number',
    icon: <Wifi className="w-5 h-5 text-violet-400" />,
    docs: 'https://www.vobiz.in',
  },
  {
    id: 'twilio',
    label: 'Twilio',
    description: 'Industry-leading cloud communications platform with global reach.',
    color: 'text-red-400',
    gradient: 'from-red-600/20 to-rose-600/10',
    accountIdLabel: 'Account SID',
    authTokenLabel: 'Auth Token',
    fromNumberLabel: 'Twilio Number',
    icon: <Phone className="w-5 h-5 text-red-400" />,
    docs: 'https://console.twilio.com',
  },
  {
    id: 'telnyx',
    label: 'Telnyx',
    description: 'Cost-effective carrier-grade VoIP with real-time control & AI integrations.',
    color: 'text-green-400',
    gradient: 'from-green-600/20 to-emerald-600/10',
    accountIdLabel: 'API Key',
    authTokenLabel: 'Connection ID',
    fromNumberLabel: 'Telnyx DID',
    icon: <Zap className="w-5 h-5 text-green-400" />,
    docs: 'https://portal.telnyx.com',
  },
  {
    id: 'knowlarity',
    label: 'Knowlarity',
    description: 'Leading cloud communication solution for Indian enterprises.',
    color: 'text-blue-400',
    gradient: 'from-blue-600/20 to-cyan-600/10',
    accountIdLabel: 'Access Token',
    authTokenLabel: 'SR Number',
    fromNumberLabel: 'Caller ID',
    icon: <Globe className="w-5 h-5 text-blue-400" />,
    docs: 'https://www.knowlarity.com',
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<TelephonyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showToken, setShowToken] = useState(false);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState('vobiz');
  const [accountId, setAccountId] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [fromNumber, setFromNumber] = useState('');

  // ── Fetch current config ──────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await telephonyConfigService.getTelephonyConfig();
      setConfig(data);
      setSelectedProvider(data.defaultTelephonyProvider || 'vobiz');
      setAccountId(data.telephonyAccountId || '');
      setAuthToken(''); // never pre-fill token from masked value
      setFromNumber(data.telephonyFromNumber || '');
    } catch (err) {
      console.error('Failed to load telephony config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ── Save handler ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!accountId.trim()) {
      setErrorMsg('Account ID / Auth ID is required.');
      setSaveStatus('error');
      return;
    }

    setSaving(true);
    setSaveStatus('idle');
    setErrorMsg('');

    const payload: UpdateTelephonyConfigPayload = {
      defaultTelephonyProvider: selectedProvider,
      telephonyAccountId: accountId.trim(),
      telephonyFromNumber: fromNumber.trim() || undefined,
    };

    // Only send token if user typed a new one (not blank, not masked)
    if (authToken && !authToken.includes('*')) {
      payload.telephonyAuthToken = authToken;
    }

    try {
      await telephonyConfigService.updateTelephonyConfig(payload);
      setSaveStatus('success');
      await fetchConfig();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to save. Please try again.');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider) || PROVIDERS[0];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Settings className="w-7 h-7 text-blue-500" />
            </div>
            Platform Settings
          </h1>
          <p className="text-slate-400 ml-14">Configure global platform settings, telephony providers, and security.</p>
        </div>
      </div>

      {/* ── Telephony Provider Config ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Phone className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Telephony Provider</h2>
            <p className="text-sm text-slate-400">Select and configure the default outbound call provider for all agents.</p>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 text-white overflow-hidden">
          <CardContent className="p-6 space-y-8">

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading configuration…</span>
                </div>
              </div>
            ) : (
              <>
                {/* Status badge */}
                {config?.hasCredentials && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">
                      Active provider: <strong className="capitalize">{config.defaultTelephonyProvider}</strong>
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}

                {/* ── Provider Cards ── */}
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-3">Select Provider</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PROVIDERS.map((provider) => (
                      <button
                        key={provider.id}
                        id={`provider-card-${provider.id}`}
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all duration-200 group ${
                          selectedProvider === provider.id
                            ? `bg-gradient-to-br ${provider.gradient} border-${provider.color.split('-')[1]}-500/40 shadow-lg shadow-${provider.color.split('-')[1]}-500/10`
                            : 'bg-slate-950/60 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40'
                        }`}
                      >
                        {selectedProvider === provider.id && (
                          <span className="absolute top-2 right-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        )}
                        <div className={`p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/50 group-hover:border-slate-600 transition-colors ${
                          selectedProvider === provider.id ? 'border-opacity-0 bg-slate-900/50' : ''
                        }`}>
                          {provider.icon}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${selectedProvider === provider.id ? provider.color : 'text-slate-200'}`}>
                            {provider.label}
                          </p>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5 hidden md:block">
                            {provider.description.split('.')[0]}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Selected provider description */}
                  <p className="text-xs text-slate-500 mt-3 px-1">{currentProvider.description}</p>
                </div>

                {/* ── Credentials Form ── */}
                <div className={`p-5 rounded-xl bg-gradient-to-br ${currentProvider.gradient} border border-slate-700/50 space-y-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    {currentProvider.icon}
                    <span className={`text-sm font-semibold ${currentProvider.color}`}>
                      {currentProvider.label} Credentials
                    </span>
                  </div>

                  {/* Account ID */}
                  <div className="space-y-1.5">
                    <label htmlFor="telephony-account-id" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {currentProvider.accountIdLabel}
                    </label>
                    <input
                      id="telephony-account-id"
                      type="text"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      placeholder={`Enter ${currentProvider.accountIdLabel}`}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/70 border border-slate-700 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                    />
                  </div>

                  {/* Auth Token */}
                  <div className="space-y-1.5">
                    <label htmlFor="telephony-auth-token" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {currentProvider.authTokenLabel}
                    </label>
                    <div className="relative">
                      <input
                        id="telephony-auth-token"
                        type={showToken ? 'text' : 'password'}
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder={config?.hasCredentials ? '••••••••••••  (leave blank to keep current)' : `Enter ${currentProvider.authTokenLabel}`}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-slate-950/70 border border-slate-700 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Caller Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="telephony-from-number" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {currentProvider.fromNumberLabel}
                    </label>
                    <input
                      id="telephony-from-number"
                      type="text"
                      value={fromNumber}
                      onChange={(e) => setFromNumber(e.target.value)}
                      placeholder="e.g. +911171366938"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/70 border border-slate-700 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                    />
                  </div>

                  {/* Docs link */}
                  <a
                    href={currentProvider.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1"
                  >
                    <Globe className="w-3 h-3" />
                    View {currentProvider.label} documentation →
                  </a>
                </div>

                {/* Status Messages */}
                {saveStatus === 'error' && (
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-400">{errorMsg}</p>
                  </div>
                )}
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-400">Telephony configuration saved successfully!</p>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    id="save-telephony-config-btn"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Security & Gateway Cards ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-base">Global Security</CardTitle>
            </div>
            <CardDescription className="text-slate-400">Configure JWT and Rate Limiting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <div>
                <p className="font-medium text-sm">Strict Rate Limiting</p>
                <p className="text-xs text-slate-500">100 req / minute per IP</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7">Modify</Button>
            </div>
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <div>
                <p className="font-medium text-sm">JWT Expiry</p>
                <p className="text-xs text-slate-500">Currently set to 7 days</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7">Modify</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              <CardTitle className="text-base">API Gateways</CardTitle>
            </div>
            <CardDescription className="text-slate-400">External Provider Webhooks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <div>
                <p className="font-medium text-sm">Razorpay Webhook</p>
                <p className="text-xs text-emerald-500">Verified & Active</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7">Rotate Secret</Button>
            </div>
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <div>
                <p className="font-medium text-sm">Telephony Webhook</p>
                <p className="text-xs text-emerald-500 capitalize">{config?.defaultTelephonyProvider || 'vobiz'} · Active</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7">View URL</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
