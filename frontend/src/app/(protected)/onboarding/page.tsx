'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Building2, MessageSquare, Globe, Bot, Sparkles, Phone, Mail, Clock, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/axios-client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

// ── Schema ────────────────────────────────────────────────────────
const onboardingSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  industryCategory: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  
  about: z.string().min(10, "Please provide a brief description of your business"),
  productsAndServicesText: z.string().min(10, "Please describe your products or services"),
  targetAudience: z.string().optional(),
  
  workingHours: z.string().optional(),
  supportHours: z.string().optional(),
  returnPolicy: z.string().optional(),
  shippingPolicy: z.string().optional(),
  refundPolicy: z.string().optional(),
  
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  tagline: z.string().optional(),
  defaultWelcomeMessage: z.string().optional(),
  escalationNumber: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, icon, error, children }: {
  label: string; icon: React.ReactNode; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wide">
        <span className="text-primary-400">{icon}</span>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "", industryCategory: "", website: "", email: "", phoneNumber: "",
      about: "", productsAndServicesText: "", targetAudience: "",
      workingHours: "Mon-Fri 9AM-6PM", supportHours: "", returnPolicy: "", shippingPolicy: "", refundPolicy: "",
      logoUrl: "", tagline: "", defaultWelcomeMessage: "Hello, how can I help you today?", escalationNumber: ""
    },
  });

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await form.trigger(['name', 'industryCategory', 'website', 'email', 'phoneNumber']);
    if (step === 2) isValid = await form.trigger(['about', 'productsAndServicesText', 'targetAudience']);
    if (step === 3) isValid = await form.trigger(['workingHours', 'supportHours', 'returnPolicy', 'shippingPolicy', 'refundPolicy']);
    if (step === 4) isValid = await form.trigger(['logoUrl', 'tagline', 'defaultWelcomeMessage', 'escalationNumber']);
    
    if (isValid) setStep(s => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        productsAndServices: data.productsAndServicesText.split('\n').map(s => s.trim()).filter(Boolean),
      };
      // @ts-ignore
      delete payload.productsAndServicesText;

      await apiClient.post('/organizations', payload);
      toast.success("Organization setup complete!");
      await refreshUser();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to setup organization");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-primary-500 rounded-xl px-4 py-3 text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all";

  const renderStepIndicators = () => {
    const steps = ['Basic Info', 'Products', 'Policies', 'Branding'];
    return (
      <div className="flex items-center justify-center gap-2 pt-2">
        {steps.map((s, i) => {
          const current = i + 1;
          const isActive = step === current;
          const isPast = step > current;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-3 py-1 ${
                isActive ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 
                isPast ? 'bg-primary-500 text-white' : 'text-neutral-600'
              }`}>
                {isPast ? <CheckIcon className="h-2 w-2" /> : <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-primary-400' : 'bg-neutral-700'}`} />}
                {s}
              </div>
              {i < 3 && <div className={`h-px w-4 ${isPast ? 'bg-primary-500' : 'bg-neutral-800'}`} />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary-500/6 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-secondary-500/6 blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 mx-auto mb-2">
            <Bot className="h-8 w-8 text-primary-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Organization Setup
          </h1>
          <p className="text-neutral-400 text-base max-w-md mx-auto">
            Give your AI agent the context it needs to represent your business properly.
          </p>
          {renderStepIndicators()}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md shadow-2xl overflow-hidden relative min-h-[450px]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="p-6 sm:p-8 flex-1">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <Field label="Organization Name" icon={<Building2 className="h-3.5 w-3.5" />} error={form.formState.errors.name?.message}>
                      <input id="name" placeholder="e.g. Acme Corp" className={inputCls} {...form.register("name")} />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Industry" icon={<Globe className="h-3.5 w-3.5" />}>
                        <input placeholder="e.g. Real Estate, Retail" className={inputCls} {...form.register("industryCategory")} />
                      </Field>
                      <Field label="Website" icon={<Globe className="h-3.5 w-3.5" />}>
                        <input type="url" placeholder="https://example.com" className={inputCls} {...form.register("website")} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Support Email" icon={<Mail className="h-3.5 w-3.5" />} error={form.formState.errors.email?.message}>
                        <input type="email" placeholder="support@example.com" className={inputCls} {...form.register("email")} />
                      </Field>
                      <Field label="Support Phone" icon={<Phone className="h-3.5 w-3.5" />}>
                        <input placeholder="+1 (555) 000-0000" className={inputCls} {...form.register("phoneNumber")} />
                      </Field>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <Field label="About Your Business" icon={<MessageSquare className="h-3.5 w-3.5" />} error={form.formState.errors.about?.message}>
                      <textarea rows={3} placeholder="We provide high-quality services to..." className={`${inputCls} resize-none`} {...form.register("about")} />
                    </Field>
                    <Field label="Products & Services (One per line)" icon={<ShoppingBag className="h-3.5 w-3.5" />} error={form.formState.errors.productsAndServicesText?.message}>
                      <textarea rows={4} placeholder="Premium Support Package - $99/mo\nEnterprise Consultation" className={`${inputCls} resize-none`} {...form.register("productsAndServicesText")} />
                    </Field>
                    <Field label="Target Audience" icon={<Building2 className="h-3.5 w-3.5" />}>
                      <input placeholder="e.g. Small business owners in healthcare" className={inputCls} {...form.register("targetAudience")} />
                    </Field>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Working Hours" icon={<Clock className="h-3.5 w-3.5" />}>
                        <input placeholder="Mon-Fri 9AM-6PM" className={inputCls} {...form.register("workingHours")} />
                      </Field>
                      <Field label="Support Hours" icon={<Clock className="h-3.5 w-3.5" />}>
                        <input placeholder="24/7" className={inputCls} {...form.register("supportHours")} />
                      </Field>
                    </div>
                    <Field label="Return/Refund Policy" icon={<MessageSquare className="h-3.5 w-3.5" />}>
                      <textarea rows={2} placeholder="30-day money-back guarantee..." className={`${inputCls} resize-none`} {...form.register("returnPolicy")} />
                    </Field>
                    <Field label="Shipping Policy" icon={<Rocket className="h-3.5 w-3.5" />}>
                      <textarea rows={2} placeholder="Free shipping on orders over $50..." className={`${inputCls} resize-none`} {...form.register("shippingPolicy")} />
                    </Field>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <Field label="Default AI Welcome Message" icon={<Sparkles className="h-3.5 w-3.5" />}>
                      <input placeholder="Hello, welcome to Acme Corp. How can I help you today?" className={inputCls} {...form.register("defaultWelcomeMessage")} />
                    </Field>
                    <Field label="Human Escalation Phone Number" icon={<Phone className="h-3.5 w-3.5" />}>
                      <input placeholder="Number to forward complex calls to" className={inputCls} {...form.register("escalationNumber")} />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Company Tagline" icon={<MessageSquare className="h-3.5 w-3.5" />}>
                        <input placeholder="Innovating the future." className={inputCls} {...form.register("tagline")} />
                      </Field>
                      <Field label="Logo URL" icon={<Globe className="h-3.5 w-3.5" />} error={form.formState.errors.logoUrl?.message}>
                        <input type="url" placeholder="https://..." className={inputCls} {...form.register("logoUrl")} />
                      </Field>
                    </div>
                    
                    <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl px-4 py-3 flex gap-3 mt-4">
                      <Sparkles className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        This information will be used to auto-generate the brain for all AI agents in your organization. You can update this later in the Knowledge Base.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="px-6 sm:px-8 pb-6 pt-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-between">
              {step > 1 ? (
                <button type="button" onClick={prevStep} className="px-6 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-all flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : <div />}
              
              {step < 4 ? (
                <button type="button" onClick={nextStep} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={isLoading} className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-glow transition-all flex items-center gap-2">
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Finalizing...</> : <><Rocket className="h-4 w-4" /> Launch Platform</>}
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}