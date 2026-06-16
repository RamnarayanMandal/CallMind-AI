'use client';

import React, { useState } from 'react';
import {
  Check, Loader2, CreditCard, Zap, Shield, Star,
  AlertCircle, TrendingDown, Calendar, Activity,
  Users, PhoneCall, ArrowUpRight, CheckCircle2,
  Clock, XCircle, RefreshCw, Rocket, Ban,
} from 'lucide-react';
import { usePlans, useSubscribe, useCurrentSubscription, useCallStatus, useCreateOrder, useVerifyOrder, useSubscriptionUsage } from '@/hooks/use-subscription';
import { useAuth } from '@/hooks/use-auth';
import type { Plan, SubscriptionRecord } from '@/types';

/* ─── Razorpay loader ─────────────────────────────────────── */
const loadRazorpay = (): Promise<boolean> =>
  new Promise(resolve => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

/* ─── Status badge ────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: SubscriptionRecord['status'] }) => {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    active:    { label: 'Active',    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', Icon: CheckCircle2 },
    trialing:  { label: 'Trial',     cls: 'bg-blue-500/15   text-blue-400   border-blue-500/30',    Icon: Shield },
    created:   { label: 'Pending',   cls: 'bg-amber-500/15  text-amber-400  border-amber-500/30',   Icon: Clock },
    halted:    { label: 'Halted',    cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30',  Icon: AlertCircle },
    past_due:  { label: 'Past Due',  cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30',  Icon: AlertCircle },
    cancelled: { label: 'Cancelled', cls: 'bg-red-500/15    text-red-400    border-red-500/30',     Icon: XCircle },
    expired:   { label: 'Expired',   cls: 'bg-slate-500/15  text-slate-400  border-slate-500/30',   Icon: XCircle },
  };
  const { label, cls, Icon } = map[status] ?? map.created;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
};

/* ─── Progress bar ────────────────────────────────────────── */
const UsageBar = ({ used, limit, label, color }: {
  used: number; limit: number; label: string; color: string;
}) => {
  const isUnlimited = limit >= 999999;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isWarning = !isUnlimited && pct >= 80;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className={`font-semibold ${isWarning ? 'text-orange-400' : 'text-white'}`}>
          {isUnlimited ? `${used.toLocaleString()} / ∞` : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        {isUnlimited ? (
          <div className={`h-full w-full ${color} opacity-30 animate-pulse`} />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-700 ${isWarning ? 'bg-orange-500' : color}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      {!isUnlimited && <p className="text-xs text-slate-500">{pct}% used</p>}
    </div>
  );
};

/* ─── Current Subscription Card ───────────────────────────── */
const CurrentSubscriptionCard = ({ sub }: { sub: SubscriptionRecord }) => {
  const plan = typeof sub.planId === 'object' ? sub.planId as Plan : null;
  const renewalDate = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';
  const startDate = sub.currentPeriodStart
    ? new Date(sub.currentPeriodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : 'N/A';
  const minutesUsed = sub.minutesUsed ?? 0;
  const minutesLimit = plan?.minutesLimit ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 p-6 md:p-8 shadow-2xl">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-600/10 blur-2xl" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        {/* Left */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-xl bg-blue-600/20 border border-blue-500/30 px-3 py-1.5">
              <CreditCard className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">Current Plan</span>
            </div>
            <StatusBadge status={sub.status} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{plan?.name ?? 'Unknown Plan'}</h2>
          {plan?.description && <p className="text-slate-400 text-sm max-w-md">{plan.description}</p>}
          <div className="flex flex-wrap gap-3 mt-1">
            <div className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Renews <span className="text-slate-300 font-medium ml-1">{renewalDate}</span>
            </div>
            {sub.currentPeriodStart && (
              <div className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5">
                <Activity className="h-3.5 w-3.5 text-slate-500" />
                From <span className="text-slate-300 font-medium ml-1">{startDate}</span>
              </div>
            )}
            {plan?.price !== undefined && (
              <div className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-white font-semibold">₹{plan.price.toLocaleString()}</span>
                <span className="text-slate-500">/mo</span>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex gap-3 shrink-0">
          <div className="flex flex-col items-center bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-4 min-w-[90px]">
            <PhoneCall className="h-5 w-5 text-blue-400 mb-1.5" />
            <p className="text-xl font-bold text-white">{minutesUsed.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">Min Used</p>
          </div>
          <div className="flex flex-col items-center bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-4 min-w-[90px]">
            <Users className="h-5 w-5 text-purple-400 mb-1.5" />
            <p className="text-xl font-bold text-white">
              {(plan?.agentLimit ?? 0) >= 999 ? '∞' : plan?.agentLimit ?? '–'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Agents</p>
          </div>
        </div>
      </div>

      {/* Usage bar */}
      <div className="relative mt-6 space-y-4 border-t border-slate-700/40 pt-5">
        <UsageBar used={minutesUsed} limit={minutesLimit} label="AI Call Minutes" color="bg-blue-500" />
      </div>

      {/* Trial notice */}
      {plan?.trialDays && plan.trialDays > 0 && sub.status === 'trialing' && (
        <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-300">
          <Shield className="h-4 w-4 shrink-0" />
          <span>
            You are on a <strong>{plan.trialDays}-day free trial</strong>. Buy a plan before it ends to keep calling uninterrupted.
          </span>
        </div>
      )}
    </div>
  );
};

/* ─── Skeleton ────────────────────────────────────────────── */
const SubscriptionSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-4">
    <div className="flex gap-3">
      <div className="h-7 w-28 bg-slate-800 rounded-full" />
      <div className="h-7 w-20 bg-slate-800 rounded-full" />
    </div>
    <div className="h-8 w-48 bg-slate-800 rounded-lg" />
    <div className="h-4 w-72 bg-slate-800 rounded" />
    <div className="flex gap-3 mt-2">
      {[1,2,3].map(i => <div key={i} className="h-8 w-32 bg-slate-800 rounded-lg" />)}
    </div>
    <div className="border-t border-slate-800 pt-4">
      <div className="h-2 bg-slate-800 rounded-full" />
    </div>
  </div>
);

/* ─── Plan Card ───────────────────────────────────────────── */
const PlanCard = ({
  plan, billingCycle, isLoading, onSubscribe,
}: {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  isLoading: boolean;
  onSubscribe: (plan: Plan) => void;
}) => {
  const price = billingCycle === 'yearly' && plan.yearlyPrice
    ? Math.round(plan.yearlyPrice / 12)
    : plan.price;
  const savings = plan.yearlyPrice
    ? Math.round(((plan.price * 12 - plan.yearlyPrice) / (plan.price * 12)) * 100)
    : 0;

  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 ${
      plan.isPopular
        ? 'border-blue-500 bg-slate-900 shadow-2xl shadow-blue-900/30 ring-1 ring-blue-500/20'
        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
    }`}>
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
          <Star className="w-3 h-3" /> MOST POPULAR
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <p className="text-slate-400 text-sm mt-1 min-h-[40px]">{plan.description}</p>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">₹{price.toLocaleString()}</span>
          <span className="text-slate-400">/mo</span>
        </div>
        {billingCycle === 'yearly' && plan.yearlyPrice && savings > 0 && (
          <p className="text-green-400 text-sm mt-1.5 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Save {savings}% · ₹{plan.yearlyPrice.toLocaleString()}/year
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <p className="text-blue-400 font-bold text-lg">
            {(plan.minutesLimit ?? 0) >= 999999 ? '∞' : (plan.minutesLimit ?? 0).toLocaleString()}
          </p>
          <p className="text-slate-500 text-xs">AI Minutes</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <p className="text-purple-400 font-bold text-lg">
            {(plan.agentLimit ?? 0) >= 999 ? '∞' : plan.agentLimit}
          </p>
          <p className="text-slate-500 text-xs">AI Agents</p>
        </div>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {(plan.features || []).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> {f}
          </li>
        ))}
      </ul>

      {plan.trialDays && plan.trialDays > 0 ? (
        <p className="text-center text-xs text-blue-400 mb-3 flex items-center justify-center gap-1">
          <Shield className="w-3.5 h-3.5" /> {plan.trialDays}-day free trial included
        </p>
      ) : null}

      <button
        id={`subscribe-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={() => onSubscribe(plan)}
        disabled={isLoading}
        className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
          plan.isPopular
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isLoading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          : 'Subscribe Now'
        }
      </button>
    </div>
  );
};

/* ─── Page ────────────────────────────────────────────────── */
export default function BillingPage() {
  const { user } = useAuth();
  const { data: plans = [], isLoading: plansLoading, isError: plansError } = usePlans();
  const { data: currentSub, isLoading: subLoading, isError: subError, refetch: refetchSub } =
    useCurrentSubscription(user?.organizationId);
  const { data: callStatus } = useCallStatus(user?.organizationId);
  const { data: usage } = useSubscriptionUsage(user?.organizationId);
  const { subscribe, isSubscribing } = useSubscribe();
  const { createOrder, isCreatingOrder } = useCreateOrder();
  const { verifyOrder, isVerifyingOrder } = useVerifyOrder();
  
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [autoRenew, setAutoRenew] = useState(false);

  const activePlans = plans.filter(p => p.isActive !== false);

  const handleSubscribe = async (plan: Plan) => {
    const loaded = await loadRazorpay();
    if (!loaded) { alert('Razorpay SDK failed to load.'); return; }
    
    setLoadingPlan(plan._id);
    try {
      if (autoRenew) {
        // --- AUTO-RENEW FLOW (Subscriptions API) ---
        const result = await subscribe(plan._id);
        const opts = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: result.razorpaySubscriptionId,
          name: 'CallMind AI',
          description: `${plan.name} Plan (Auto-Renew)`,
          handler: () => { window.location.href = '/dashboard?subscribed=true'; },
          theme: { color: '#3b82f6' },
          modal: { ondismiss: () => setLoadingPlan(null) },
        };
        new (window as any).Razorpay(opts).open();
      } else {
        // --- MANUAL RECHARGE FLOW (Orders API) ---
        if (!user?.organizationId) {
          alert('Organization ID not found');
          return;
        }
        const orderInfo = await createOrder({ organizationId: user.organizationId, planId: plan._id, isYearly: billingCycle === 'yearly' });
        const opts = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderInfo.amount,
          currency: orderInfo.currency || 'INR',
          name: 'CallMind AI',
          description: `${plan.name} Plan (Manual Recharge)`,
          order_id: orderInfo.orderId,
          handler: async (response: any) => {
            try {
              await verifyOrder({
                organizationId: user?.organizationId,
                planId: plan._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                isYearly: billingCycle === 'yearly'
              });
              window.location.href = '/dashboard?subscribed=true';
            } catch (err) {
              console.error('Verification failed', err);
            } finally {
              setLoadingPlan(null);
            }
          },
          theme: { color: '#3b82f6' },
          modal: { ondismiss: () => setLoadingPlan(null) },
        };
        new (window as any).Razorpay(opts).open();
      }
    } catch {
      setLoadingPlan(null);
    }
  };

  /* Block banner config */
  const blockBanner = (() => {
    if (!callStatus || callStatus.canCall) return null;
    switch (callStatus.blockReason) {
      case 'no_subscription':
        return { icon: Rocket, title: 'Get started — choose a plan',
          desc: "You don't have an active subscription. Pick a plan below to start making AI calls.",
          cls: 'border-blue-500/40 bg-blue-500/10 text-blue-300', iconCls: 'text-blue-400' };
      case 'plan_expired':
        return { icon: Ban, title: 'Your plan has expired',
          desc: 'Your subscription period has ended. Renew now to continue making calls without interruption.',
          cls: 'border-red-500/40 bg-red-500/10 text-red-300', iconCls: 'text-red-400' };
      case 'minutes_exhausted':
        return { icon: AlertCircle, title: 'AI minutes exhausted',
          desc: "You've used all included minutes. Upgrade to a higher plan to keep calling.",
          cls: 'border-orange-500/40 bg-orange-500/10 text-orange-300', iconCls: 'text-orange-400' };
      default: return null;
    }
  })();

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-10">

      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-1.5 rounded-full">
          <CreditCard className="w-4 h-4" /> Billing &amp; Subscriptions
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">Manage Your Plan</h1>
        <p className="text-slate-400 text-lg">View your subscription, track usage, and upgrade anytime.</p>
      </div>

      {/* Block Banner */}
      {blockBanner && (() => {
        const { icon: Icon, title, desc, cls, iconCls } = blockBanner;
        return (
          <div className={`flex items-start gap-4 rounded-2xl border px-5 py-4 ${cls}`}>
            <Icon className={`w-6 h-6 shrink-0 mt-0.5 ${iconCls}`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{title}</p>
              <p className="text-sm opacity-80 mt-0.5">{desc}</p>
            </div>
            <a href="#plans" className="shrink-0 mt-0.5 text-sm font-semibold underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity">
              View plans ↓
            </a>
          </div>
        );
      })()}

      {/* Current Subscription */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> Current Subscription
          </h2>
          {!subLoading && (
            <button onClick={() => refetchSub()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          )}
        </div>

        {subLoading && <SubscriptionSkeleton />}

        {!subLoading && subError && (
          <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> Could not load subscription data. Please try again.
          </div>
        )}

        {!subLoading && !subError && !currentSub && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-medium">No active subscription</p>
            <p className="text-slate-500 text-sm">Choose a plan below to get started.</p>
          </div>
        )}

        {!subLoading && !subError && currentSub && <CurrentSubscriptionCard sub={currentSub} />}
      </section>

      {/* Usage & Cost Breakdown */}
      {usage && currentSub && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Usage &amp; Billing Summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Activity className="w-3 h-3" /> AI Minutes</p>
              <p className="text-white font-bold text-xl">{usage.aiMinutesUsed.toLocaleString()}</p>
              <p className="text-slate-500 text-xs">of {usage.minutesLimit >= 999999 ? '∞' : usage.minutesLimit.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> AI Cost</p>
              <p className="text-white font-bold text-xl">₹{usage.aiCost.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" /> Current Bill</p>
              <p className="text-white font-bold text-xl">₹{usage.currentBill.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
              <p className="text-slate-400 text-xs flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-emerald-400" /> Remaining</p>
              <p className="text-white font-bold text-xl">₹{usage.remainingBalance.toLocaleString()}</p>
            </div>
          </div>
        </section>
      )}

      {/* Available Plans */}
      <section id="plans" className="pt-8 border-t border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">Upgrade Your Plan</h2>
          <p className="text-slate-400">Select the plan that best fits your scale.</p>
        </div>

        <div className="flex flex-col items-center gap-6 mb-8">
          {/* Billing Toggle */}
          <div className="inline-flex bg-slate-800/80 border border-slate-700 rounded-xl p-1 gap-1">
            {(['monthly', 'yearly'] as const).map(cycle => (
              <button key={cycle} onClick={() => setBillingCycle(cycle)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === cycle ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {cycle === 'yearly' ? (
                  <>Yearly <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Save 20%
                  </span></>
                ) : 'Monthly'}
              </button>
            ))}
          </div>

          {/* Payment Options Toggle */}
          <label className="flex items-center gap-3 cursor-pointer bg-slate-800/40 border border-slate-700/50 px-5 py-3 rounded-xl hover:bg-slate-800/80 transition-colors">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Enable Auto-Renewal</span>
              <span className="text-xs text-slate-400">
                {autoRenew ? 'We will automatically charge you when the plan expires.' : 'You will need to manually recharge when the plan expires.'}
              </span>
            </div>
          </label>
        </div>
      </section>

      {/* Plans error */}
      {plansError && (
        <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4" /> Could not load plans. Please refresh.
        </div>
      )}

      {/* Plans skeleton */}
      {plansLoading && (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
              <div className="h-6 bg-slate-800 rounded w-24" />
              <div className="h-10 bg-slate-800 rounded w-36" />
              <div className="space-y-2">{[1,2,3,4].map(j => <div key={j} className="h-4 bg-slate-800 rounded" />)}</div>
              <div className="h-11 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Plans grid */}
      {!plansLoading && activePlans.length > 0 && (
        <section id="plans">
          <h2 className="text-lg font-semibold  flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-amber-400" /> Available Plans
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {activePlans.map(plan => (
              <PlanCard key={plan._id} plan={plan} billingCycle={billingCycle}
                isLoading={loadingPlan === plan._id || isSubscribing}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        </section>
      )}

      {!plansLoading && activePlans.length === 0 && !plansError && (
        <div className="text-center py-12 text-slate-500">No plans available at the moment. Contact support.</div>
      )}

      <p className="text-center text-slate-500 text-sm pb-4">
        All prices inclusive of GST · Cancel anytime · Secure payments via Razorpay
      </p>
    </div>
  );
}
