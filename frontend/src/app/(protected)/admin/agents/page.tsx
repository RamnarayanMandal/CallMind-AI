'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAgents } from '@/hooks/useAgents';
import { useQuery } from '@tanstack/react-query';
import { CreateAgentPayload, agentService } from '@/services/agent.service';
import { organizationService } from '@/services/organization.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Play, Bot, Plus, Loader2, MessageSquare, Globe, Volume2, Trash2,
  Sparkles, Building2, Pencil, AlertCircle, Search,
} from 'lucide-react';
import { Agent, Organization } from '@/types';
import { useRouter } from 'next/navigation';
import { LANGUAGES } from '@/components/demo/DemoWizard';

export default function AdminAgentsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // ── Organization selector for admin ──────────────────────────
  const [selectedOrgId, setSelectedOrgId] = useState<string>(user?.organizationId || '');
  const [orgSearch, setOrgSearch] = useState('');

  const { data: orgsData } = useQuery({
    queryKey: ['admin-all-orgs', orgSearch],
    queryFn: () => organizationService.getAll(1, 50),
  });
  const allOrgs: Organization[] = (orgsData as any)?.data || [];
  const filteredOrgs = allOrgs.filter((o) =>
    o.name?.toLowerCase().includes(orgSearch.toLowerCase()),
  );

  // Auto-select first org if none selected
  useEffect(() => {
    if (!selectedOrgId && allOrgs.length > 0) {
      setSelectedOrgId(allOrgs[0]._id);
    }
  }, [allOrgs, selectedOrgId]);

  // ── Agents for selected org ───────────────────────────────────
  const { agents, isLoading, createAgent, isCreating, updateAgent, isUpdating, deleteAgent } =
    useAgents(selectedOrgId);

  // ── Org data for live prompt preview ─────────────────────────
  const [org, setOrg] = useState<Organization | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('hi-IN');
  const [gender, setGender] = useState('female');
  const [tone, setTone] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');

  useEffect(() => {
    if (selectedOrgId) {
      organizationService.getOne(selectedOrgId).then(setOrg).catch(console.error);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    if (isEditOpen && selectedAgent) {
      setName(selectedAgent.name);
      setLanguage(selectedAgent.language);
      setGender(selectedAgent.gender);
      setTone(selectedAgent.tone);
      setCustomInstructions(selectedAgent.customInstructions || '');
    }
  }, [isEditOpen, selectedAgent]);

  const resetForm = () => {
    setName('');
    setLanguage('hi-IN');
    setGender('female');
    setTone('professional');
    setCustomInstructions('');
    setSelectedAgent(null);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrgId) return;
    try {
      const payload: CreateAgentPayload = {
        name, gender: gender as 'male' | 'female', tone: tone as any,
        language, customInstructions, organizationId: selectedOrgId,
      };
      await createAgent(payload);
      setIsCreateOpen(false);
      resetForm();
    } catch { /* handled in hook */ }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAgent) return;
    try {
      await updateAgent({
        id: selectedAgent._id,
        payload: { name, gender: gender as any, tone: tone as any, language, customInstructions },
      });
      setIsEditOpen(false);
      resetForm();
    } catch { /* handled in hook */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAgent(deleteTarget._id);
      setDeleteTarget(null);
    } catch { /* handled in hook */ }
  };

  // Live prompt preview builder
  const generateLivePromptPreview = () => {
    if (!org) return 'Loading organization context...';

    const resolvedTone: Record<string, string> = {
      professional: 'professional and confident',
      friendly: 'warm and friendly',
      formal: 'formal and respectful',
      casual: 'relaxed and approachable',
      empathetic: 'empathetic and caring',
    };

    const langInstruction: Record<string, string> = {
      'hi-IN': '- Respond ONLY in Hindi (Devanagari or transliterated).',
      'en-IN': '- Respond in clear, professional English.',
      'hinglish': '- Respond in Hinglish (a natural mix of Hindi and English).',
    };

    const products = org.productInfo
      ? org.productInfo.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map((i) => `- ${i}`).join('\n')
      : 'Details available upon request.';

    return `## IDENTITY
You are ${name || '[Agent Name]'}, a ${resolvedTone[tone] || 'professional'} voice assistant representing ${org.name}.
Gender: ${gender} (${gender === 'male' ? 'he/him' : 'she/her'}).

## ORGANIZATION
Company: ${org.name}
${org.industry ? `Industry: ${org.industry}` : ''}
${org.about ? `About: ${org.about}` : ''}
${org.website ? `Website: ${org.website}` : ''}

## PRODUCTS & SERVICES
${products}

${org.targetAudience ? `## TARGET AUDIENCE\n${org.targetAudience}\n` : ''}
${org.businessGoals ? `## BUSINESS GOALS\n${org.businessGoals}\n` : ''}
## COMMUNICATION RULES
${langInstruction[language] || '- Respond clearly and naturally.'}
- Tone must always be: ${resolvedTone[tone] || 'professional'}.
- Keep responses SHORT and CONVERSATIONAL — this is a VOICE call.
- Never use markdown, bullet symbols, asterisks, or formatting.

## STRICT SAFETY RULES
- NEVER mention OpenAI, Sarvam AI, Whisper, Twilio, or any AI provider.
- NEVER say you are an AI or robot unless unavoidable.
- NEVER break character. You ARE ${name || '[Agent Name]'} from ${org.name}.

${org.supportInstructions ? `## SUPPORT INSTRUCTIONS\n${org.supportInstructions}\n` : ''}
${customInstructions ? `## CUSTOM AGENT INSTRUCTIONS\n${customInstructions}\n` : ''}
## FALLBACK RESPONSES
If you do not know the answer, say: "Main aapko is matter mein help karne ki poori koshish karunga/karungi."`;
  };

  // ── Shared agent form body ────────────────────────────────────
  const AgentForm = ({ onSubmit, submitLabel, isSubmitting }: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    submitLabel: string;
    isSubmitting: boolean;
  }) => (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
        {/* Left: Config */}
        <div className="space-y-5">
          <h3 className="font-bold text-sm tracking-wide text-blue-400 uppercase">Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-slate-300">Agent Name</Label>
              <Input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah" required
                className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white rounded-xl h-11">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-slate-700">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-slate-300">Voice Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="male" className="text-white">Male</SelectItem>
                  <SelectItem value="female" className="text-white">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">Personality Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['professional', 'friendly', 'formal', 'casual', 'empathetic'].map((t) => (
                    <SelectItem key={t} value={t} className="text-white capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Custom Instructions (Optional)</Label>
              <span className="text-[10px] text-slate-500 italic">Appended to system prompt</span>
            </div>
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Always ask for the caller's phone number. Offer a 10% discount..."
              className="min-h-[130px] rounded-xl resize-none bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-700 pt-5 md:pt-0 md:pl-8 flex flex-col max-h-[480px]">
          <h3 className="font-bold text-sm tracking-wide text-blue-400 uppercase flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> Live Prompt Preview
          </h3>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs space-y-1.5">
            <span className="font-bold text-[10px] uppercase text-slate-500 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Organization: {org?.name || 'Loading...'}
            </span>
            <p className="text-slate-400 line-clamp-1"><strong>About:</strong> {org?.about || 'None configured'}</p>
            <p className="text-slate-400 line-clamp-1"><strong>Products:</strong> {org?.productInfo || 'None configured'}</p>
          </div>
          <div className="flex-1 min-h-0 bg-slate-950 rounded-xl border border-slate-700 overflow-y-auto p-4 font-mono text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed">
            {generateLivePromptPreview()}
          </div>
        </div>
      </div>

      <DialogFooter className="border-t border-slate-700 pt-4 mt-2">
        <Button type="button" variant="outline" className="rounded-xl h-11 border-slate-700 text-slate-300"
          onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl h-11 px-8 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-500" /> My AI Agents
          </h1>
          <p className="text-slate-400">Manage voice agents across your organizations.</p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          disabled={!selectedOrgId}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Create Agent
        </Button>
      </div>

      {/* Organization selector */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> Select Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search organizations..."
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-700 text-white w-full"
              />
            </div>
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="sm:w-72 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select an organization..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                {filteredOrgs.map((o) => (
                  <SelectItem key={o._id} value={o._id} className="text-white hover:bg-slate-700">
                    {o.name}
                  </SelectItem>
                ))}
                {filteredOrgs.length === 0 && (
                  <div className="px-3 py-4 text-slate-500 text-sm text-center">No organizations found</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agents table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">
            Agents {selectedOrgId && org ? `— ${org.name}` : ''}
          </CardTitle>
          {agents.length > 0 && (
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              {agents.length} agent{agents.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {!selectedOrgId ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-500">
              <Building2 className="w-12 h-12 mb-3 text-slate-700" />
              <p>Select an organization to view its agents.</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-14 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-500">
              <Bot className="w-12 h-12 mb-3 text-slate-700" />
              <p className="mb-4">No agents found for this organization.</p>
              <Button
                onClick={() => { resetForm(); setIsCreateOpen(true); }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Create First Agent
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-400 pl-4">Agent</TableHead>
                    <TableHead className="text-slate-400">Language</TableHead>
                    <TableHead className="text-slate-400">Tone</TableHead>
                    <TableHead className="text-slate-400">Gender</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent._id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{agent.name}</span>
                            <span className="text-[10px] text-slate-500">Org-aware system instructions</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Globe className="h-4 w-4 text-slate-500" />
                          <span className="text-sm uppercase">{agent.language}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-300">
                          <MessageSquare className="h-4 w-4 text-slate-500" />
                          <span className="text-sm capitalize">{agent.tone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Volume2 className="h-4 w-4 text-slate-500" />
                          <span className="text-sm capitalize">{agent.gender}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={(agent as any).isActive ? 'success' : 'secondary'}
                          className="rounded-md capitalize text-xs"
                        >
                          {(agent as any).isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline" size="sm"
                            className="rounded-lg gap-1 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 text-xs"
                            onClick={() => router.push(`/agents/${agent._id}/demo`)}
                          >
                            <Play className="h-3 w-3" /> Demo
                          </Button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Edit"
                            onClick={() => { setSelectedAgent(agent); setIsEditOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete"
                            onClick={() => setDeleteTarget(agent)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-400" /> Create New AI Agent
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure personality settings. System prompts are compiled with your organization&apos;s profile.
            </DialogDescription>
          </DialogHeader>
          <AgentForm onSubmit={handleCreate} submitLabel="Create Agent" isSubmitting={isCreating} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-400" /> Edit Agent: {selectedAgent?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Modify agent identity and custom guidelines.
            </DialogDescription>
          </DialogHeader>
          <AgentForm onSubmit={handleUpdate} submitLabel="Save Changes" isSubmitting={isUpdating} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" /> Delete Agent
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">{deleteTarget?.name}</span>?
              This action cannot be undone and all associated configuration will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
