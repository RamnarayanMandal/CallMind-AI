'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useIntegrations } from '@/hooks/use-integrations';
import { Integration, IntegrationTemplate } from '@/types/integration.types';
import { Plus, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationsPage() {
  const { integrations, templates, isLoading, isLoadingTemplates, createIntegration, testIntegration, deleteIntegration } = useIntegrations();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsSubmitting(true);
    try {
      const { name, shopDomain, baseUrl, ...credentials } = formData;
      
      const finalBaseUrl = selectedTemplate.type === 'custom' 
        ? baseUrl 
        : selectedTemplate.baseUrlTemplate.replace('{shopDomain}', shopDomain || '');

      await createIntegration({
        name: name || selectedTemplate.name,
        type: selectedTemplate.type,
        baseUrl: finalBaseUrl,
        authType: selectedTemplate.authType,
        shopDomain,
        credentials,
      });
      toast.success('Integration added successfully');
      setIsConnectModalOpen(false);
      setSelectedTemplate(null);
      setFormData({});
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to connect integration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    try {
      toast.promise(testIntegration(id), {
        loading: 'Testing connection...',
        success: (data) => data.success ? 'Connection successful!' : `Connection failed: ${data.message}`,
        error: 'Failed to test connection',
      });
    } catch (error) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this integration? Tools using this integration will stop working.')) return;
    try {
      await deleteIntegration(id);
      toast.success('Integration removed');
    } catch (error) {
      toast.error('Failed to remove integration');
    }
  };

  if (isLoading || isLoadingTemplates) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
          <p className="text-muted-foreground">Connect external services to give your AI agents new capabilities.</p>
        </div>
        <Button onClick={() => setIsConnectModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Connect App
        </Button>
      </div>

      {integrations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-64 border-dashed">
          <CardContent className="flex flex-col items-center text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No integrations yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Connect your CRM, Helpdesk, or E-commerce platform to enable your AI to perform actions and fetch data.
            </p>
            <Button onClick={() => setIsConnectModalOpen(true)}>Browse Apps</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration: Integration) => (
            <Card key={integration._id} className="overflow-hidden relative">
              <div className={`h-2 w-full absolute top-0 ${integration.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              <CardHeader className="pb-3 pt-6">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(integration._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="uppercase text-xs font-semibold">{integration.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2 text-sm mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="flex items-center gap-1 font-medium">
                      {integration.lastTestStatus === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                       integration.lastTestStatus === 'failed' ? <XCircle className="h-4 w-4 text-red-500" /> :
                       <div className="h-2 w-2 rounded-full bg-yellow-500 mr-1" />}
                      {integration.lastTestStatus || 'Untested'}
                    </span>
                  </div>
                  {integration.lastTestedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Tested:</span>
                      <span>{new Date(integration.lastTestedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {integration.lastTestError && (
                    <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100 break-words">
                      {integration.lastTestError}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => handleTest(integration._id)}>
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connect Integration</DialogTitle>
            <DialogDescription>
              Choose a platform to connect with your AI agent.
            </DialogDescription>
          </DialogHeader>

          {!selectedTemplate ? (
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              {templates.map((template: IntegrationTemplate) => (
                <Card key={template.type} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTemplate(template)}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{template.icon}</div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <CardDescription className="mt-2">{template.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4 mt-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {selectedTemplate.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Connect {selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Connection Name</Label>
                <Input 
                  placeholder="e.g. My Shopify Store" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>

              {selectedTemplate.type === 'shopify' && (
                <div className="space-y-2">
                  <Label>Shop Domain</Label>
                  <Input 
                    placeholder="mystore.myshopify.com" 
                    value={formData.shopDomain || ''} 
                    onChange={e => setFormData({ ...formData, shopDomain: e.target.value })} 
                    required 
                  />
                </div>
              )}

              {selectedTemplate.type === 'custom' && (
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input 
                    placeholder="https://api.myapp.com/v1" 
                    value={formData.baseUrl || ''} 
                    onChange={e => setFormData({ ...formData, baseUrl: e.target.value })} 
                    required 
                  />
                </div>
              )}

              <div className="pt-4 space-y-4 border-t">
                <h4 className="font-medium">Authentication ({selectedTemplate.authType.toUpperCase()})</h4>
                
                {selectedTemplate.credentialFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input 
                      type="password"
                      placeholder={`Enter ${field.label}`} 
                      value={formData[field.key] || ''} 
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} 
                      required={field.required} 
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setSelectedTemplate(null)}>Back</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Connect {selectedTemplate.name}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
