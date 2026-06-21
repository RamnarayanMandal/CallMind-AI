'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTools } from '@/hooks/use-tools';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/hooks/useAuth';
import { Tool } from '@/types/tool.types';
import { Settings2, Loader2, Zap, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentToolsPage() {
  const params = useParams();
  const agentId = params?.id as string;
  const { user } = useAuth();
  const orgId = user?.organizationId || '';

  const { tools, isLoading: toolsLoading } = useTools();
  const { agents, updateAgent, isUpdating } = useAgents(orgId || '');

  const agent = agents.find((a: any) => a._id === agentId);
  const enabledTools: string[] = agent?.enabledTools || [];

  const [savingToolId, setSavingToolId] = useState<string | null>(null);

  const handleToggleTool = async (toolName: string, isEnabled: boolean) => {
    if (!agent) return;
    setSavingToolId(toolName);

    const newEnabledTools = isEnabled
      ? [...enabledTools, toolName]
      : enabledTools.filter((t: string) => t !== toolName);

    try {
      await updateAgent({ id: agentId, payload: { enabledTools: newEnabledTools } as any });
      toast.success(isEnabled ? `Tool "${toolName}" enabled` : `Tool "${toolName}" disabled`);
    } catch {
      toast.error('Failed to update tool');
    } finally {
      setSavingToolId(null);
    }
  };

  if (toolsLoading || !agent) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const toolsByCategory = tools.reduce((acc: Record<string, Tool[]>, tool: Tool) => {
    const cat = tool.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Agent Tools</h2>
        <p className="text-muted-foreground">
          Control which tools <span className="font-semibold text-foreground">{agent?.name}</span> can use during live calls.
        </p>
      </div>

      {tools.length === 0 ? (
        <Card className="border-dashed flex flex-col items-center justify-center h-64">
          <CardContent className="flex flex-col items-center text-center p-6">
            <Settings2 className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No tools available</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Go to the <strong>AI Tools</strong> page to enable e-commerce or custom tools for your organization first.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(toolsByCategory).map(([category, categoryTools]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base capitalize flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                {category.replace(/_/g, ' ')} Tools
              </CardTitle>
              <CardDescription className="text-xs">
                {categoryTools.filter((t: Tool) => enabledTools.includes(t.name)).length} of {categoryTools.length} enabled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryTools.map((tool: Tool) => {
                  const isEnabled = enabledTools.includes(tool.name);
                  const isSaving = savingToolId === tool.name;

                  return (
                    <div
                      key={tool._id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{tool.displayName}</p>
                          {tool.integrationId && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 rounded px-1.5 py-0.5">
                              <Link2 className="h-2.5 w-2.5" /> Connected
                            </span>
                          )}
                          {tool.isBuiltIn && (
                            <span className="inline-flex items-center text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded px-1.5 py-0.5">
                              Built-in
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{tool.description}</p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleToggleTool(tool.name, checked)}
                          disabled={isSaving || isUpdating}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
