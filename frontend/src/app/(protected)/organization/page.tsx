'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { organizationService } from '@/services/organization.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Building2, Save, Trash2, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Organization } from '@/types';

export default function OrganizationSettings() {
  const { user, logout } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?.organizationId) {
      fetchOrg();
    }
  }, [user]);

  const fetchOrg = async () => {
    try {
      const data = await organizationService.getOne(user!.organizationId!);
      setOrg(data);
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
      };
      await organizationService.update(org._id, payload);
      toast.success('Organization updated successfully');
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
          <p className="text-muted-foreground">Manage your business profile and training data.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Business Profile</CardTitle>
              </div>
              <CardDescription>
                Update your organization details and what the AI knows about your business.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdate}>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input id="name" name="name" defaultValue={org?.name} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="about">About Business</Label>
                  <Textarea id="about" name="about" defaultValue={org?.about} className="min-h-[100px] rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="productInfo">Product/Service Info</Label>
                  <Textarea id="productInfo" name="productInfo" defaultValue={org?.productInfo} className="min-h-[150px] rounded-xl" />
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
                <CardTitle>Training Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                The information you provide here is used as the foundational knowledge for all your AI voice agents.
              </p>
              <p>
                <strong>Pro Tip:</strong> Be specific about your pricing, common objections, and your unique selling points to make the agents more effective.
              </p>
              <div className="p-4 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <p className="font-medium">Need help?</p>
                <p className="text-xs mt-1">Contact our support team for agent optimization tips.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
