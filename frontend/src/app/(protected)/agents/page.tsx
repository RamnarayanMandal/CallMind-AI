'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAgents } from '@/hooks/useAgents';
import { CreateAgentPayload } from '@/services/agent.service';
import { organizationService } from '@/services/organization.service';
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
import { Play, Bot, Plus, Loader2, MessageSquare, Globe, Volume2, Trash2, Sparkles, Building2, Pencil } from 'lucide-react';
import { Agent, Organization } from '@/types';
import { useRouter } from 'next/navigation';
import { LANGUAGES } from '@/components/demo/DemoWizard';


export default function AgentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = user?.organizationId || '';
  const {
    agents,
    isLoading,
    createAgent,
    isCreating,
    updateAgent,
    isUpdating,
    deleteAgent,
    refetch
  } = useAgents(organizationId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);

  // Form states for Live Prompt Preview
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('hi-IN');
  const [gender, setGender] = useState('female');
  const [tone, setTone] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');



  // Fetch organization data for dynamic previewing (Create Dialog)
  useEffect(() => {
    if (organizationId && isDialogOpen) {
      organizationService.getOne(organizationId)
        .then(setOrg)
        .catch(console.error);
    }
  }, [organizationId, isDialogOpen]);

  // Fetch organization data and populate form (Edit Dialog)
  useEffect(() => {
    if (organizationId && isEditDialogOpen && selectedAgent) {
      organizationService.getOne(organizationId)
        .then(setOrg)
        .catch(console.error);
      
      setName(selectedAgent.name);
      setLanguage(selectedAgent.language);
      setGender(selectedAgent.gender);
      setTone(selectedAgent.tone);
      setCustomInstructions(selectedAgent.customInstructions || '');
    }
  }, [organizationId, isEditDialogOpen, selectedAgent]);

  const handleCreateAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organizationId) return;

    try {
      const payload: CreateAgentPayload = {
        name,
        gender: gender as 'male' | 'female',
        tone: tone as any,
        language,
        customInstructions,
        organizationId,
      };

      await createAgent(payload);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleUpdateAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAgent) return;

    try {
      const payload: Partial<CreateAgentPayload> = {
        name,
        gender: gender as 'male' | 'female',
        tone: tone as any,
        language,
        customInstructions,
      };

      await updateAgent({ id: selectedAgent._id, payload });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const resetForm = () => {
    setName('');
    setLanguage('hi-IN');
    setGender('female');
    setTone('professional');
    setCustomInstructions('');
    setSelectedAgent(null);
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await deleteAgent(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Client-side prompt builder simulation for zero-latency prompt preview
  const generateLivePromptPreview = () => {
    if (!org) return 'Loading organization context... Please configure organization settings first.';

    const resolvedTone = {
      professional: 'professional and confident',
      friendly:     'warm and friendly',
      formal:       'formal and respectful',
      casual:       'relaxed and approachable',
      empathetic:   'empathetic and caring',
    }[tone] || 'professional';

    const langInstruction = {
      'hi-IN': '- Respond ONLY in Hindi (transliterated or Devanagari).',
      'hinglish': '- Respond in Hinglish (a natural mix of Hindi and English).',
      'en-US': '- Respond in clear, professional US English.',
      'en-IN': '- Respond in clear, professional Indian English.',
      'es-ES': '- Respond in clear Spanish.',
    }[language] || '- Respond in a clear, natural language.';

    const productsList = org.productInfo
      ? org.productInfo.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map(i => `- ${i}`).join('\n')
      : 'Details available upon request.';

    return `## IDENTITY
You are ${name || '[Agent Name]'}, a ${resolvedTone} voice assistant representing ${org.name}.
Gender: ${gender} (${gender === 'male' ? 'he/him' : 'she/her'}).

## ORGANIZATION
Company: ${org.name}
${org.industry ? `Industry: ${org.industry}` : ''}
${org.about ? `About: ${org.about}` : ''}
${org.website ? `Website: ${org.website}` : ''}

## PRODUCTS & SERVICES
${productsList}

${org.targetAudience ? `## TARGET AUDIENCE\n${org.targetAudience}\n` : ''}
${org.businessGoals ? `## BUSINESS GOALS\n${org.businessGoals}\n` : ''}
## COMMUNICATION RULES
${langInstruction}
- Tone must always be: ${resolvedTone}.
- Keep responses SHORT and CONVERSATIONAL — this is a VOICE call.
- Never use markdown, bullet symbols, asterisks, or formatting.

## STRICT SAFETY RULES
- NEVER mention OpenAI, Sarvam AI, Whisper, Twilio, or any AI provider.
- NEVER say you are an AI or robot unless unavoidable.
- NEVER break character. You ARE ${name || '[Agent Name]'} from ${org.name}.

${org.supportInstructions ? `## SUPPORT INSTRUCTIONS\n${org.supportInstructions}\n` : ''}
${customInstructions ? `## CUSTOM AGENT INSTRUCTIONS\n${customInstructions}\n` : ''}
## FALLBACK RESPONSES
If you do not know the answer, say: "Main aapko is matter mein help karne ki poori koshish karunga/karungi. Kya aap thoda aur detail de sakte hain?"`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">Manage your voice agents and their training instructions.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6 rounded-xl gap-2 cursor-pointer">
              <Plus className="h-4 w-4" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border/50 rounded-2xl">
            <form onSubmit={handleCreateAgent}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  Create New AI Agent
                </DialogTitle>
                <DialogDescription>
                  Configure personality settings. System prompts will be compiled dynamically with your Organization's profile.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                {/* Left side: Configuration form */}
                <div className="space-y-5">
                  <h3 className="font-bold text-sm tracking-wide text-primary uppercase">Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Agent Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sarah"
                        required
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                         {LANGUAGES.map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="gender">Voice Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="rounded-xl h-11">
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
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="Select tone" />
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="customInstructions">Custom Agent Instructions (Optional)</Label>
                      <span className="text-[10px] text-muted-foreground italic">Appended to the system prompt</span>
                    </div>
                    <Textarea
                      id="customInstructions"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="e.g. Always ask for the caller's phone number. Offer a 10% discount on first consultation."
                      className="min-h-[140px] rounded-xl resize-none"
                    />
                  </div>
                </div>

                {/* Right side: Live preview section */}
                <div className="space-y-5 border-t md:border-t-0 md:border-l border-border/50 pt-5 md:pt-0 md:pl-8 flex flex-col max-h-[500px]">
                  <h3 className="font-bold text-sm tracking-wide text-primary uppercase flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Live Prompt Preview
                  </h3>

                  {/* Organization Context Card */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/30 text-xs space-y-1.5">
                    <span className="font-bold text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Active Organization: {org?.name || 'Loading...'}
                    </span>
                    <p className="text-muted-foreground line-clamp-1"><strong>About:</strong> {org?.about || 'None configured'}</p>
                    <p className="text-muted-foreground line-clamp-1"><strong>Products:</strong> {org?.productInfo || 'None configured'}</p>
                  </div>

                  <div className="flex-1 min-h-0 bg-neutral-950 rounded-xl border border-border/30 overflow-y-auto p-4 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {generateLivePromptPreview()}
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-border/50 pt-4 mt-2">
                <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl h-11 px-8" disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Agent
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Agent Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border/50 rounded-2xl">
            <form onSubmit={handleUpdateAgent}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  Edit AI Agent: {selectedAgent?.name}
                </DialogTitle>
                <DialogDescription>
                  Modify identity or custom guidelines. System prompts will be compiled dynamically with your Organization's profile.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                {/* Left side: Configuration form */}
                <div className="space-y-5">
                  <h3 className="font-bold text-sm tracking-wide text-primary uppercase">Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name">Agent Name</Label>
                      <Input
                        id="edit-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sarah"
                        required
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hi-IN">Hindi</SelectItem>
                          <SelectItem value="hinglish">Hinglish</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="en-IN">English (India)</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-gender">Voice Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-tone">Personality Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="Select tone" />
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-customInstructions">Custom Agent Instructions (Optional)</Label>
                      <span className="text-[10px] text-muted-foreground italic">Appended to the system prompt</span>
                    </div>
                    <Textarea
                      id="edit-customInstructions"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="e.g. Always ask for the caller's phone number. Offer a 10% discount on first consultation."
                      className="min-h-[140px] rounded-xl resize-none"
                    />
                  </div>
                </div>

                {/* Right side: Live preview section */}
                <div className="space-y-5 border-t md:border-t-0 md:border-l border-border/50 pt-5 md:pt-0 md:pl-8 flex flex-col max-h-[500px]">
                  <h3 className="font-bold text-sm tracking-wide text-primary uppercase flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Live Prompt Preview
                  </h3>

                  {/* Organization Context Card */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/30 text-xs space-y-1.5">
                    <span className="font-bold text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Active Organization: {org?.name || 'Loading...'}
                    </span>
                    <p className="text-muted-foreground line-clamp-1"><strong>About:</strong> {org?.about || 'None configured'}</p>
                    <p className="text-muted-foreground line-clamp-1"><strong>Products:</strong> {org?.productInfo || 'None configured'}</p>
                  </div>

                  <div className="flex-1 min-h-0 bg-neutral-950 rounded-xl border border-border/30 overflow-y-auto p-4 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {generateLivePromptPreview()}
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-border/50 pt-4 mt-2">
                <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl h-11 px-8" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
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
                        <div className="flex flex-col">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-[10px] text-muted-foreground">Org-aware system instructions</span>
                        </div>
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
                        <Button variant="outline" size="sm" className="rounded-lg gap-1 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer" onClick={() => router.push(`/agents/${agent._id}/demo`)}>
                          <Play className="h-3 w-3" />
                          Demo
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border/50 hover:bg-accent/50 cursor-pointer" onClick={() => { setSelectedAgent(agent); setIsEditDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer" onClick={() => handleDeleteAgent(agent._id)}>
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
