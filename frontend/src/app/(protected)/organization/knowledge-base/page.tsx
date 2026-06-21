'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useKnowledgeBase } from '@/hooks/use-knowledge-base';
import { FileText, Plus, Trash2, Upload, MessageSquare, Loader2, Link as LinkIcon, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function KnowledgeBasePage() {
  const { knowledgeItems, isLoading, createItem, uploadFile, deleteItem, testRAG, isTestingRAG } = useKnowledgeBase();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [addType, setAddType] = useState<'faq' | 'document'>('faq');
  
  const [formData, setFormData] = useState({ title: '', question: '', answer: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [testQuestion, setTestQuestion] = useState('');
  const [testResult, setTestResult] = useState<{ answer: string; sources: any[] } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createItem({
        type: addType,
        sourceType: 'manual',
        title: formData.title || (addType === 'faq' ? formData.question : 'Untitled Document'),
        question: addType === 'faq' ? formData.question : undefined,
        answer: addType === 'faq' ? formData.answer : undefined,
        content: addType === 'document' ? formData.content : undefined,
      });
      toast.success('Knowledge item added');
      setIsAddModalOpen(false);
      setFormData({ title: '', question: '', answer: '', content: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are currently supported');
      return;
    }

    setIsUploading(true);
    try {
      await uploadFile(file);
      toast.success('File uploaded and processed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTestRAG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuestion.trim()) return;
    try {
      const result = await testRAG(testQuestion);
      setTestResult(result);
    } catch (error) {
      toast.error('Failed to test knowledge base');
    }
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const faqs = knowledgeItems.filter((i: any) => i.type === 'faq');
  const documents = knowledgeItems.filter((i: any) => i.type !== 'faq');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
          <p className="text-muted-foreground">Train your AI with your company's data, FAQs, and policies.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsTestModalOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" /> Test AI
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Content
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs defaultValue="faqs" className="w-full">
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="faqs">FAQs ({faqs.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="faqs" className="mt-6 space-y-4">
              {faqs.length === 0 ? (
                <div className="text-center py-12 border rounded-xl border-dashed">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No FAQs added</h3>
                  <p className="text-muted-foreground text-sm mt-1">Add frequently asked questions to help the AI answer instantly.</p>
                </div>
              ) : (
                faqs.map((faq: any) => (
                  <Card key={faq._id}>
                    <CardHeader className="py-4 flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base font-medium">Q: {faq.question}</CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteItem(faq._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="py-4 pt-0 text-sm text-muted-foreground">
                      A: {faq.answer}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-6 space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-12 border rounded-xl border-dashed">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No documents added</h3>
                  <p className="text-muted-foreground text-sm mt-1">Upload PDFs or add text policies to provide deep knowledge.</p>
                </div>
              ) : (
                documents.map((doc: any) => (
                  <Card key={doc._id}>
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                          {doc.sourceType === 'pdf' ? <FileText className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
                        </div>
                        <div>
                          <CardTitle className="text-base font-medium">{doc.title}</CardTitle>
                          <CardDescription className="text-xs uppercase mt-0.5">{doc.type} • {doc.sourceType}</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteItem(doc._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Upload</CardTitle>
              <CardDescription>Upload a PDF document to train your AI instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
              />
              <Button 
                className="w-full h-32 border-dashed flex flex-col gap-2" 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span>Click to Upload PDF</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Content Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Knowledge Item</DialogTitle>
          </DialogHeader>
          <Tabs value={addType} onValueChange={(v: any) => setAddType(v)} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="faq">Q&A / FAQ</TabsTrigger>
              <TabsTrigger value="document">Text Document</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              {addType === 'faq' ? (
                <>
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Input placeholder="e.g. What are your working hours?" value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <Textarea className="h-32" placeholder="e.g. We are open Monday to Friday from 9 AM to 6 PM IST." value={formData.answer} onChange={e => setFormData({ ...formData, answer: e.target.value })} required />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Document Title</Label>
                    <Input placeholder="e.g. Return Policy 2024" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea className="h-48" placeholder="Paste your policy or document text here..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Item
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Test RAG Modal */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Knowledge Base Retrieval</DialogTitle>
            <DialogDescription>
              Ask a question to see what context the AI will retrieve from your uploaded knowledge.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            <form onSubmit={handleTestRAG} className="flex gap-2">
              <Input 
                placeholder="Ask something about your business..." 
                value={testQuestion} 
                onChange={e => setTestQuestion(e.target.value)} 
                className="flex-1"
              />
              <Button type="submit" disabled={isTestingRAG || !testQuestion.trim()}>
                {isTestingRAG ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>

            {testResult && (
              <div className="space-y-4 bg-muted/50 p-4 rounded-xl">
                <div>
                  <h4 className="font-semibold text-sm text-primary mb-2">AI Response</h4>
                  <p className="text-sm">{testResult.answer}</p>
                </div>
                {testResult.sources?.length > 0 && (
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase mb-2">Retrieved Context Sources</h4>
                    <ul className="space-y-2">
                      {testResult.sources.map((s: any, i: number) => (
                        <li key={i} className="text-xs bg-background p-2 rounded border">
                          <span className="font-medium">{s.title || 'FAQ'}</span>: {s.content || s.answer}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
