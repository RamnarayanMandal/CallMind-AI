'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'empathetic', label: 'Empathetic' },
];

interface OrganizationFormData {
  name: string;
  about: string;
  productInfo: string;
  targetAudience?: string;
  industry?: string;
  businessGoals?: string;
  supportInstructions?: string;
  tone?: string;
  website?: string;
}

interface OrganizationFormProps {
  initialData?: Partial<OrganizationFormData>;
  onSubmit: (data: OrganizationFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export function OrganizationForm({ initialData, onSubmit, onCancel, loading, mode = 'create' }: OrganizationFormProps) {
  const [form, setForm] = useState<OrganizationFormData>({
    name: '',
    about: '',
    productInfo: '',
    targetAudience: '',
    industry: '',
    businessGoals: '',
    supportInstructions: '',
    tone: 'professional',
    website: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const updateField = (field: keyof OrganizationFormData, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm text-slate-400 mb-1.5 block">Organization Name *</label>
          <Input required placeholder="e.g., Acme Corp" value={form.name} onChange={e => updateField('name', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-slate-400 mb-1.5 block">About *</label>
          <textarea required rows={3} placeholder="What does your company do?" value={form.about} onChange={e => updateField('about', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-slate-400 mb-1.5 block">Products / Services *</label>
          <textarea required rows={2} placeholder="Describe your key products or services" value={form.productInfo} onChange={e => updateField('productInfo', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Industry</label>
          <Input placeholder="e.g., SaaS / AI Technology" value={form.industry || ''} onChange={e => updateField('industry', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Website</label>
          <Input placeholder="https://example.com" value={form.website || ''} onChange={e => updateField('website', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Target Audience</label>
          <Input placeholder="e.g., SMBs in retail" value={form.targetAudience || ''} onChange={e => updateField('targetAudience', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Brand Tone</label>
          <select value={form.tone || 'professional'} onChange={e => updateField('tone', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer">
            {tones.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-slate-400 mb-1.5 block">Business Goals</label>
          <textarea rows={2} placeholder="e.g., Generate leads, automate support calls" value={form.businessGoals || ''} onChange={e => updateField('businessGoals', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-slate-400 mb-1.5 block">Support Instructions</label>
          <textarea rows={2} placeholder="e.g., Always ask for consent. Never make medical claims." value={form.supportInstructions || ''} onChange={e => updateField('supportInstructions', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Saving...' : mode === 'create' ? 'Create Organization' : 'Save Changes'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <X className="w-4 h-4" /> Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
