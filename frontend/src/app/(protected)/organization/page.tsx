'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { organizationService } from '@/services/organization.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Save, Trash2, Loader2, Info, Globe, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Organization } from '@/types';

export default function OrganizationSettings() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tone, setTone] = useState<string>('professional');

  useEffect(() => {
    if (user?.organizationId) {
      fetchOrg();
    }
  }, [user]);

  const fetchOrg = async () => {
    try {
      const data = await organizationService.getOne(user!.organizationId!);
      setOrg(data);
      if (data.tone) {
        setTone(data.tone);
      }
    } catch (error) {
      toast.error('Failed to load organization details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!org) return;
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        name: formData.get('name') as string,
        about: formData.get('about') as string,
        productInfo: formData.get('productInfo') as string,
        website: formData.get('website') as string,
        industry: formData.get('industry') as string,
        targetAudience: formData.get('targetAudience') as string,
        businessGoals: formData.get('businessGoals') as string,
        supportInstructions: formData.get('supportInstructions') as string,
        tone: tone,
      };
      await organizationService.update(org._id, payload);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Organization updated successfully! All active agents updated.');
      fetchOrg();
    } catch (error) {
      toast.error('Failed to update organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!org) return;
    if (!confirm('Are you absolutely sure? This will delete all associated data including agents and customers.')) return;
    
    setIsDeleting(true);
    try {
      await organizationService.remove(org._id);
      toast.success('Organization deleted');
      logout(); // Logout since they no longer have an organization
    } catch (error) {
      toast.error('Failed to delete organization');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground">Manage your business profile and global AI prompt templates.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Business Profile & Identity</CardTitle>
              </div>
              <CardDescription>
                Configure the primary identity, target audience, and style guidelines that agents will inherit.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdate}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input id="name" name="name" defaultValue={org?.name} placeholder="e.g. Dental Care Clinic" required className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website">Website URL (Optional)</Label>
                    <Input id="website" name="website" defaultValue={org?.website} placeholder="https://example.com" className="rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" name="industry" defaultValue={org?.industry} placeholder="e.g. Healthcare, SaaS, E-commerce" className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tone">Brand Communication Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select brand tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="empathetic">Empathetic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="about">About Business (Elevator Pitch)</Label>
                  <Textarea id="about" name="about" defaultValue={org?.about} placeholder="Describe what your organization does in 2-3 sentences." className="min-h-[80px] rounded-xl resize-none" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="productInfo">Products & Services (One per line or comma-separated)</Label>
                  <Textarea id="productInfo" name="productInfo" defaultValue={org?.productInfo} placeholder="e.g. Root canal therapy, Teeth whitening, Orthodontics" className="min-h-[100px] rounded-xl resize-none" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
                  <Textarea id="targetAudience" name="targetAudience" defaultValue={org?.targetAudience} placeholder="e.g. Families, busy professionals looking for dental care..." className="min-h-[80px] rounded-xl resize-none" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="businessGoals">Business Goals / AI Call Goals (Optional)</Label>
                  <Textarea id="businessGoals" name="businessGoals" defaultValue={org?.businessGoals} placeholder="e.g. Handle initial queries, book appointments, collect details" className="min-h-[80px] rounded-xl resize-none" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="supportInstructions">AI Compliance / Special Support Instructions (Optional)</Label>
                  <Textarea id="supportInstructions" name="supportInstructions" defaultValue={org?.supportInstructions} placeholder="e.g. Always state consultation price is 500 INR. Never diagnose illnesses." className="min-h-[100px] rounded-xl resize-none" />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 bg-muted/30 px-6 py-4">
                <Button type="submit" className="rounded-xl ml-auto" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                <CardTitle>Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Permanently delete your organization and all related data. This action is irreversible.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="destructive" className="rounded-xl" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete Organization
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Info className="h-5 w-5" />
                <CardTitle>Dynamic Prompt System</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>
                  We have upgraded the prompt architecture! All details you enter here are automatically injected into your agent's system prompts.
                </p>
              </div>
              <p>
                <strong>Industry & Website:</strong> Informs the agent of your corporate identity and domain constraints.
              </p>
              <p>
                <strong>Brand Tone:</strong> Sets the fallback mood (e.g. friendly, empathetic) for call scripts.
              </p>
              <p>
                <strong>Support & Safety:</strong> Add safety constraints to make sure the AI never promises things outside business boundaries.
              </p>
              <div className="p-4 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <p className="font-medium">Need help?</p>
                <p className="text-xs mt-1">Updates to these fields will immediately regenerate prompts for all active agents.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
