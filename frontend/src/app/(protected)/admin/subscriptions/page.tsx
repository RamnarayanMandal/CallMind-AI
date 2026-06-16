'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, CreditCard, Check, X, Loader2,
  Package, Star, RefreshCw, AlertCircle, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useAdminPlans } from '@/hooks/use-subscription';
import type { Plan, CreatePlanDto } from '@/types';

const EMPTY_FORM: Partial<Plan> = {
  name: '', price: 0, yearlyPrice: 0, description: '', features: [],
  minutesLimit: 500, agentLimit: 1, isPopular: false, isActive: true,
  trialDays: 0,
};

export default function AdminSubscriptionsPage() {
  const { plans, isLoading, isError, error, createPlan, isCreating, updatePlan, isUpdating, deletePlan, refetch } =
    useAdminPlans();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<Partial<Plan>>(EMPTY_FORM);
  const [featuresText, setFeaturesText] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFeaturesText('');
    setShowModal(true);
  }, []);

  const openEdit = useCallback((plan: Plan) => {
    setEditing(plan);
    setForm({ ...plan });
    setFeaturesText((plan.features || []).join('\n'));
    setShowModal(true);
  }, []);

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    const payload: CreatePlanDto = {
      ...form as CreatePlanDto,
      features: featuresText.split('\n').map(f => f.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        await updatePlan({ id: editing._id, dto: payload });
      } else {
        await createPlan(payload);
      }
      setShowModal(false);
    } catch { /* toast is shown by hook */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlan(id);
      setDeleteId(null);
    } catch { /* toast is shown by hook */ }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-blue-500/10 rounded-xl">
              <CreditCard className="w-7 h-7 text-blue-400" />
            </span>
            Subscription Plans
          </h1>
          <p className="text-slate-400 mt-1">
            Create and manage pricing plans — changes apply instantly on the billing page.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/30"
          >
            <Plus className="w-4 h-4" /> New Plan
          </button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{(error as Error)?.message || 'Failed to load plans'}</span>
          <button onClick={() => refetch()} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-3">
              <div className="h-5 bg-slate-800 rounded w-24" />
              <div className="h-8 bg-slate-800 rounded w-32" />
              <div className="space-y-2">{[1,2,3].map(j => <div key={j} className="h-3 bg-slate-800 rounded" />)}</div>
              <div className="h-9 bg-slate-800 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && plans.length === 0 && (
        <div className="text-center py-24 bg-slate-900 border border-slate-800 rounded-2xl">
          <Package className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">No plans yet</h3>
          <p className="text-slate-400 mb-6">Create your first subscription plan to get started.</p>
          <button onClick={openCreate} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium">
            Create First Plan
          </button>
        </div>
      )}

      {/* Plans Grid */}
      {!isLoading && plans.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan._id}
              className={`relative bg-slate-900 border rounded-2xl p-6 flex flex-col gap-4 transition-all hover:border-blue-500/40 ${
                plan.isPopular ? 'border-blue-500 shadow-xl shadow-blue-900/20' : 'border-slate-800'
              } ${!plan.isActive ? 'opacity-55' : ''}`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="w-3 h-3" /> MOST POPULAR
                </span>
              )}

              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mt-0.5 line-clamp-2">{plan.description}</p>
                </div>
                {!plan.isActive && (
                  <span className="shrink-0 text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Inactive</span>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">₹{plan.price?.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                </div>
                {plan.yearlyPrice ? (
                  <span className="text-xs text-green-400 bg-green-900/20 border border-green-800/40 px-2 py-0.5 rounded-full mt-1 inline-block">
                    ₹{plan.yearlyPrice.toLocaleString()}/yr
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-800/60 rounded-xl p-2">
                  <p className="text-blue-400 font-bold text-sm">
                    {(plan.minutesLimit ?? 0) >= 999999 ? '∞' : (plan.minutesLimit ?? 0).toLocaleString()}
                  </p>
                  <p className="text-slate-500">Minutes</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-2">
                  <p className="text-purple-400 font-bold text-sm">
                    {(plan.agentLimit ?? 0) >= 999 ? '∞' : plan.agentLimit}
                  </p>
                  <p className="text-slate-500">Agents</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-2">
                  <p className="text-amber-400 font-bold text-sm">{plan.trialDays || 0}d</p>
                  <p className="text-slate-500">Trial</p>
                </div>
              </div>

              <ul className="space-y-1.5 flex-1">
                {(plan.features || []).slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
                {(plan.features || []).length > 4 && (
                  <li className="text-xs text-slate-500 pl-5">+{plan.features.length - 4} more features</li>
                )}
              </ul>

              {plan.razorpayPlanId && (
                <p className="text-xs text-slate-500 font-mono truncate">RPay: {plan.razorpayPlanId}</p>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => openEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeleteId(plan._id)}
                  className="px-3 py-2 text-sm bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Plan' : 'Create New Plan'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field label="Plan Name *">
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={INPUT} placeholder="e.g. Starter, Growth, Business" />
              </Field>
              <Field label="Description">
                <input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={INPUT} placeholder="Short plan description" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Monthly Price (₹)">
                  <input type="number" min={0} value={form.price || 0}
                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className={INPUT} />
                </Field>
                <Field label="Yearly Price (₹)">
                  <input type="number" min={0} value={form.yearlyPrice || 0}
                    onChange={e => setForm(f => ({ ...f, yearlyPrice: Number(e.target.value) }))} className={INPUT} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="AI Minutes">
                  <input type="number" min={0} value={form.minutesLimit || 0}
                    onChange={e => setForm(f => ({ ...f, minutesLimit: Number(e.target.value) }))} className={INPUT} />
                </Field>
                <Field label="Agents">
                  <input type="number" min={1} value={form.agentLimit || 1}
                    onChange={e => setForm(f => ({ ...f, agentLimit: Number(e.target.value) }))} className={INPUT} />
                </Field>
                <Field label="Trial Days">
                  <input type="number" min={0} value={form.trialDays || 0}
                    onChange={e => setForm(f => ({ ...f, trialDays: Number(e.target.value) }))} className={INPUT} />
                </Field>
              </div>

              <Field label="Features (one per line)">
                <textarea rows={5} value={featuresText} onChange={e => setFeaturesText(e.target.value)}
                  className={`${INPUT} resize-none text-sm`}
                  placeholder={'500 AI Minutes / month\n1 AI Agent\nStandard Support'} />
              </Field>
              <div className="flex items-center gap-6 pt-1">
                <Toggle label="Most Popular" value={!!form.isPopular} onChange={v => setForm(f => ({ ...f, isPopular: v }))} />
                <Toggle label="Active" value={!!form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-800">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSaving || !form.name?.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-900 rounded-2xl p-7 w-full max-w-sm shadow-2xl">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white text-center mb-2">Delete Plan?</h3>
            <p className="text-slate-400 text-sm text-center mb-7">
              Cannot be undone. Existing subscribers keep their plan until the period ends.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tiny sub-components ──────────────────────────────────────────────────────
const INPUT = 'w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
      {value
        ? <ToggleRight className="w-6 h-6 text-blue-400" />
        : <ToggleLeft className="w-6 h-6 text-slate-500" />}
      {label}
    </button>
  );
}
