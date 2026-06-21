import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tool } from '@/types/tool.types';
import { Integration } from '@/types/integration.types';
import { Loader2 } from 'lucide-react';

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool | null;
  integrations: Integration[];
  onSave: (data: Partial<Tool>) => Promise<void>;
}

export function ToolModal({ isOpen, onClose, tool, integrations, onSave }: ToolModalProps) {
  const [formData, setFormData] = useState<Partial<Tool>>({});
  const [parametersJson, setParametersJson] = useState('{\n  "type": "object",\n  "properties": {},\n  "required": []\n}');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (tool) {
        setFormData(tool);
        setParametersJson(tool.parameters ? JSON.stringify(tool.parameters, null, 2) : '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}');
      } else {
        setFormData({
          name: '',
          displayName: '',
          description: '',
          category: 'custom',
          method: 'GET',
          endpoint: '/',
          integrationId: '',
          responseMapping: '',
          responseTemplate: '',
        });
        setParametersJson('{\n  "type": "object",\n  "properties": {},\n  "required": []\n}');
      }
    }
  }, [isOpen, tool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(parametersJson);
      } catch (err) {
        alert("Invalid JSON in Parameters schema");
        setIsSubmitting(false);
        return;
      }
      
      await onSave({ ...formData, parameters: parsedParams });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tool ? 'Edit Tool' : 'Create Custom Tool'}</DialogTitle>
          <DialogDescription>
            Define how the AI agent interacts with your API.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input 
                value={formData.displayName || ''} 
                onChange={e => setFormData({ ...formData, displayName: e.target.value })} 
                required 
                placeholder="e.g. Search Products"
              />
            </div>
            <div className="space-y-2">
              <Label>Internal Name (no spaces)</Label>
              <Input 
                value={formData.name || ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })} 
                required 
                placeholder="e.g. search_products"
                disabled={!!tool}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (Prompt for AI)</Label>
            <Textarea 
              value={formData.description || ''} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              required 
              placeholder="Tell the AI exactly when and why to use this tool."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Integration Connection</Label>
              <Select 
                value={formData.integrationId || 'none'} 
                onValueChange={(val) => setFormData({ ...formData, integrationId: val === 'none' ? undefined : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Integration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Standalone API)</SelectItem>
                  {integrations.map(int => (
                    <SelectItem key={int._id} value={int._id}>{int.name} ({int.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input 
                value={formData.category || ''} 
                onChange={e => setFormData({ ...formData, category: e.target.value })} 
                placeholder="e.g. ecommerce"
              />
            </div>
          </div>

          <div className="grid grid-cols-[100px_1fr] gap-4">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select 
                value={formData.method || 'GET'} 
                onValueChange={(val) => setFormData({ ...formData, method: val as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Endpoint URL</Label>
              <Input 
                value={formData.endpoint || ''} 
                onChange={e => setFormData({ ...formData, endpoint: e.target.value })} 
                required 
                placeholder="e.g. /products/search.json"
              />
              <p className="text-xs text-muted-foreground">Use variables like {'{query}'} in the URL.</p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>AI Parameters (JSON Schema)</Label>
            <Textarea 
              value={parametersJson} 
              onChange={e => setParametersJson(e.target.value)} 
              className="font-mono text-xs"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">Define what information the AI should extract from the user to pass to this API.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Response Mapping (Dot Notation)</Label>
              <Input 
                value={formData.responseMapping || ''} 
                onChange={e => setFormData({ ...formData, responseMapping: e.target.value })} 
                placeholder="e.g. products.0"
              />
              <p className="text-xs text-muted-foreground">Extracts a specific nested field from the API JSON response.</p>
            </div>
            <div className="space-y-2">
              <Label>Response Template</Label>
              <Textarea 
                value={formData.responseTemplate || ''} 
                onChange={e => setFormData({ ...formData, responseTemplate: e.target.value })} 
                placeholder="e.g. Found {title} for {price}."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Formats the extracted data into a sentence for the AI to speak.</p>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tool ? 'Save Changes' : 'Create Tool'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
