'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTools } from '@/hooks/use-tools';
import { useIntegrations } from '@/hooks/use-integrations';
import { Tool } from '@/types/tool.types';
import { Plus, Trash2, Zap, Settings2, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { ToolModal } from './tool-modal';

export default function ToolsPage() {
  const { tools, isLoading, deleteTool, seedEcommerceTools, createTool, updateTool } = useTools();
  const { integrations } = useIntegrations();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const handleSeedEcommerce = async () => {
    const shopifyIntegration = integrations.find(i => i.type === 'shopify');
    
    setIsSeeding(true);
    try {
      await seedEcommerceTools(shopifyIntegration?._id);
      toast.success('E-commerce tools have been seeded successfully.');
    } catch (error) {
      toast.error('Failed to seed tools');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this tool? Agents will no longer be able to use it.')) return;
    try {
      await deleteTool(id);
      toast.success('Tool removed');
    } catch (error) {
      toast.error('Failed to remove tool');
    }
  };

  const handleSaveTool = async (data: Partial<Tool>) => {
    try {
      if (selectedTool) {
        await updateTool({ id: selectedTool._id, data });
        toast.success('Tool updated successfully');
      } else {
        await createTool(data);
        toast.success('Tool created successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save tool');
      throw error;
    }
  };

  const openCreateModal = () => {
    setSelectedTool(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tool: Tool) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Tools</h2>
          <p className="text-muted-foreground">Manage the actions your AI agents can perform during calls.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSeedEcommerce} disabled={isSeeding}>
            {isSeeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Enable E-Commerce Tools
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" /> Custom Tool
          </Button>
        </div>
      </div>

      {tools.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-64 border-dashed">
          <CardContent className="flex flex-col items-center text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Settings2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No tools configured</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Enable standard tools or create custom tools to allow your AI agents to fetch real-time data and perform actions.
            </p>
            <Button onClick={handleSeedEcommerce}>Enable E-Commerce Defaults</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool: Tool) => (
            <Card key={tool._id} className="overflow-hidden relative">
              <div className={`h-2 w-full absolute top-0 ${tool.isActive ? 'bg-primary' : 'bg-gray-300'}`} />
              <CardHeader className="pb-3 pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{tool.displayName}</CardTitle>
                    <CardDescription className="text-xs font-mono mt-1">{tool.name}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditModal(tool)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(tool._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{tool.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-md bg-secondary/20 px-2 py-1 text-xs font-medium text-secondary-foreground">
                    {tool.category}
                  </span>
                  {tool.isBuiltIn && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      Built-in
                    </span>
                  )}
                  {tool.integrationId && (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Connected
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ToolModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tool={selectedTool}
        integrations={integrations}
        onSave={handleSaveTool}
      />
    </div>
  );
}
