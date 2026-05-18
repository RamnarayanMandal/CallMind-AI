'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAgents } from '@/hooks/useAgents';
import { CreateAgentPayload } from '@/services/agent.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Play, Bot, Plus, Loader2, MessageSquare, Globe, Volume2, Trash2 } from 'lucide-react';
import { Agent } from '@/types';
import { useRouter } from 'next/navigation';

export default function AgentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = user?.organizationId || '';
  const { 
    agents, 
    isLoading, 
    createAgent, 
    isCreating, 
    deleteAgent, 
    refetch 
  } = useAgents(organizationId);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organizationId) return;
    
    try {
      const formData = new FormData(e.currentTarget);
      const payload: CreateAgentPayload = {
        name: formData.get('name') as string,
        gender: formData.get('gender') as 'male' | 'female',
        tone: formData.get('tone') as any,
        language: formData.get('language') as string,
        systemPrompt: formData.get('systemPrompt') as string,
        organizationId,
      };
      
      await createAgent(payload);
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await deleteAgent(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">Manage your voice agents and their training instructions.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6 rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-border/50">
            <form onSubmit={handleCreateAgent}>
              <DialogHeader>
                <DialogTitle>Create New AI Agent</DialogTitle>
                <DialogDescription>
                  Configure your agent's personality and voice settings.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Agent Name</Label>
                    <Input id="name" name="name" placeholder="e.g. Sarah Sales" required className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="language">Language</Label>
                    <Select name="language" defaultValue="en-US">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="hi-IN">Hindi</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Voice Gender</Label>
                    <Select name="gender" defaultValue="female">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tone">Personality Tone</Label>
                    <Select name="tone" defaultValue="professional">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemPrompt">System Instructions</Label>
                    <span className="text-[10px] text-muted-foreground italic">Training data for the agent</span>
                  </div>
                  <Textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    placeholder="You are a helpful sales assistant. Your goal is to..."
                    className="min-h-[150px] rounded-xl resize-none"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="rounded-xl h-11 px-8" disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Agent
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : agents.length === 0 ? (
          <Card className="border-dashed border-2 bg-accent/5 py-12 text-center">
            <CardContent className="space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">No agents yet</h3>
                <p className="text-muted-foreground">Create your first AI agent to start making calls.</p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl">Create Agent</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 bg-card/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Agent</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Tone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent._id} className="hover:bg-accent/20">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Bot className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm uppercase">{agent.language}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{agent.tone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{agent.gender}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg gap-1 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary" onClick={() => router.push(`/agents/${agent._id}/demo`)}>
                          <Play className="h-3 w-3" />
                          Demo
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAgent(agent._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
