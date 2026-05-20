'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Building2, MessageSquare, Globe, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/axios-client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

// ── Schema (unchanged) ────────────────────────────────────────────────────────
const onboardingSchema = z.object({
  name:        z.string().min(2, "Organization name must be at least 2 characters"),
  about:       z.string().min(10, "Please provide a brief description of your business"),
  productInfo: z.string().min(10, "Please describe the products or services you want the AI to handle"),
  industry:    z.string().optional(),
  website:     z.string().optional(),
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
  const router  = useRouter();
  const { refreshUser } = useAuth();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: "", about: "", productInfo: "", industry: "", website: "" },
  });

  // ── Submit (business logic unchanged) ──────────────────────────────────────
  const onSubmit = async (data: OnboardingFormValues) => {
    setIsLoading(true);
    try {
      await apiClient.post('/organizations', data);
      toast.success("Organization setup complete!");
      await refreshUser();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to setup organization");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-primary-500 rounded-xl px-4 py-3 text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all";

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
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 mx-auto mb-2">
            <Bot className="h-8 w-8 text-primary-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Set Up Your Organization
          </h1>
          <p className="text-neutral-400 text-base max-w-md mx-auto">
            Tell us about your business so we can train your AI voice agents to handle calls perfectly.
          </p>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {['Organization Info', 'AI Training', 'Go Live'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-3 py-1 ${
                  i === 0 ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-neutral-600'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-primary-400' : 'bg-neutral-700'}`} />
                  {step}
                </div>
                {i < 2 && <div className="h-px w-4 bg-neutral-800" />}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md shadow-2xl overflow-hidden">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6 sm:p-8 space-y-6">

              {/* Org Name */}
              <Field
                label="Organization Name"
                icon={<Building2 className="h-3.5 w-3.5" />}
                error={form.formState.errors.name?.message}
              >
                <input
                  id="name"
                  placeholder="e.g. ABC Technology Pvt Ltd"
                  className={inputCls}
                  {...form.register("name")}
                />
              </Field>

              {/* Industry + Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Industry (Optional)" icon={<Globe className="h-3.5 w-3.5" />}>
                  <input
                    id="industry"
                    placeholder="e.g. E-Commerce, Healthcare"
                    className={inputCls}
                    {...form.register("industry")}
                  />
                </Field>
                <Field label="Website (Optional)" icon={<Globe className="h-3.5 w-3.5" />}>
                  <input
                    id="website"
                    type="url"
                    placeholder="https://yourcompany.com"
                    className={inputCls}
                    {...form.register("website")}
                  />
                </Field>
              </div>

              {/* About */}
              <Field
                label="About Your Business"
                icon={<MessageSquare className="h-3.5 w-3.5" />}
                error={form.formState.errors.about?.message}
              >
                <textarea
                  id="about"
                  rows={3}
                  placeholder="What does your company do? e.g. We provide cloud-based security solutions for startups."
                  className={`${inputCls} resize-none`}
                  {...form.register("about")}
                />
              </Field>

              {/* Product Info */}
              <Field
                label="Products / Services"
                icon={<Rocket className="h-3.5 w-3.5" />}
                error={form.formState.errors.productInfo?.message}
              >
                <textarea
                  id="productInfo"
                  rows={4}
                  placeholder="What products should the AI sell or support? List features, pricing, or key value props."
                  className={`${inputCls} resize-none`}
                  {...form.register("productInfo")}
                />
              </Field>

              {/* Info note */}
              <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl px-4 py-3 flex gap-3">
                <Sparkles className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-400 leading-relaxed">
                  This info is used to auto-generate your AI agent&apos;s system prompt. The more detail you provide, the smarter your agent will be.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="px-6 sm:px-8 pb-8">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-13 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-glow transition-all flex items-center justify-center gap-2 text-base"
              >
                {isLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Setting up…</>
                ) : (
                  <><Rocket className="h-5 w-5" /> Complete Setup &amp; Launch Dashboard</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {['SOC2 Type II', 'HIPAA Compliant', 'ISO 27001', 'GDPR Ready'].map((badge) => (
            <span key={badge} className="text-[10px] font-semibold text-neutral-600 bg-neutral-900/60 border border-neutral-800 rounded-full px-3 py-1">
              🔐 {badge}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}