'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Rocket, Building2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/axios-client";

import { useAuth } from "@/hooks/useAuth";

const onboardingSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  about: z.string().min(10, "Please provide a brief description of your business"),
  productInfo: z.string().min(10, "Please describe the products or services you want the AI to handle"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: "", about: "", productInfo: "" },
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsLoading(true);
    try {
      await apiClient.post('/organizations', data);
      toast.success("Organization setup complete!");
      // Update user state so ProtectedLayout sees the new organizationId
      await refreshUser();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to setup organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 hero-gradient">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-4">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Let's setup your AI agent</h1>
          <p className="text-muted-foreground text-lg">
            Tell us about your business so we can train your voice agents.
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 shadow-2xl overflow-hidden">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <Label htmlFor="name">Organization Name</Label>
                  </div>
                  <Input
                    id="name"
                    placeholder="e.g. Acme Sales Corp"
                    className="h-12 rounded-xl bg-neutral-900/50"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <Label htmlFor="about">About your Business</Label>
                  </div>
                  <Textarea
                    id="about"
                    placeholder="What does your company do? (e.g. We provide cloud-based security solutions for startups)"
                    className="min-h-[100px] rounded-xl bg-neutral-900/50 resize-none"
                    {...form.register("about")}
                  />
                  {form.formState.errors.about && (
                    <p className="text-xs text-destructive">{form.formState.errors.about.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    <Label htmlFor="productInfo">Product/Service Details</Label>
                  </div>
                  <Textarea
                    id="productInfo"
                    placeholder="What products should the AI sell or support? List features, pricing, or key value props."
                    className="min-h-[120px] rounded-xl bg-neutral-900/50 resize-none"
                    {...form.register("productInfo")}
                  />
                  {form.formState.errors.productInfo && (
                    <p className="text-xs text-destructive">{form.formState.errors.productInfo.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup & Launch Dashboard"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
