'use client';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomers } from '@/hooks/useCustomers';
import { useAgents } from '@/hooks/useAgents';
import { callService } from '@/services/call.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Upload, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Phone,
  Calendar,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function CustomersPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId || '';
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { 
    customers, 
    isLoading, 
    uploadCsv, 
    isUploading, 
    refetch,
    createCustomer,
    updateCustomer,
    isUpdating 
  } = useCustomers(organizationId);

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map(c => c._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkCall = async () => {
    if (!selectedAgentId) {
      toast.error('Please select an agent first');
      return;
    }
    
    const count = selectedIds.length;
    toast.promise(
      (async () => {
        for (const id of selectedIds) {
          const customer = customers.find(c => c._id === id);
          if (!customer) continue;
          const call = await callService.create({
            agentId: selectedAgentId,
            customerId: id,
            organizationId,
            phoneNumber: customer.phone
          });
          await callService.execute(call._id);
        }
      })(),
      {
        loading: `Initiating ${count} calls...`,
        success: `Successfully started ${count} calls`,
        error: 'Failed to start some calls',
      }
    );
    setSelectedIds([]);
  };

  const handleUpdateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organizationId || !editingCustomer) return;
    
    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        company: formData.get('company') as string,
      };
      
      await updateCustomer({ id: editingCustomer._id, payload });
      setIsEditOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const { agents } = useAgents(organizationId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isCalling, setIsCalling] = useState<string | null>(null);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0]._id);
    }
  }, [agents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && organizationId) {
      uploadCsv({ file, organizationId });
    }
  };

  const handleManualAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organizationId) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        company: formData.get('company') as string,
        organizationId,
      };
      
      await createCustomer(payload);
      setIsDialogOpen(false);
    } catch (error) {
      // Handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedulingCustomer, setSchedulingCustomer] = useState<any>(null);

  const handleScheduleCall = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organizationId || !schedulingCustomer || !selectedAgentId) return;

    try {
      const formData = new FormData(e.currentTarget);
      const scheduledAt = formData.get('scheduledAt') as string;

      await callService.create({
        agentId: selectedAgentId,
        customerId: schedulingCustomer._id,
        organizationId,
        phoneNumber: schedulingCustomer.phone,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });

      toast.success(`Call scheduled for ${schedulingCustomer.name}`);
      setIsScheduleOpen(false);
      setSchedulingCustomer(null);
    } catch (error: any) {
      toast.error('Failed to schedule call');
    }
  };

  const handleCallCustomer = async (customer: any) => {
    if (!selectedAgentId) {
      toast.error('Please select an agent first');
      return;
    }

    setIsCalling(customer._id);
    try {
      const call = await callService.create({
        agentId: selectedAgentId,
        customerId: customer._id,
        organizationId,
        phoneNumber: customer.phone
      });
      await callService.execute(call._id);
      toast.success(`Call initiated to ${customer.name}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate call');
    } finally {
      setIsCalling(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-24">
      {/* Bulk Actions Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-primary/20 backdrop-blur-md">
            <span className="text-sm font-bold">{selectedIds.length} leads selected</span>
            <div className="h-6 w-px bg-primary-foreground/20" />
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-9 rounded-xl font-bold gap-2"
              onClick={handleBulkCall}
            >
              <Phone className="h-4 w-4" />
              Start Bulk Call
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 rounded-xl text-primary-foreground/70 hover:text-primary-foreground"
              onClick={() => setSelectedIds([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your leads and start AI voice calls.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4 bg-accent/30 p-1.5 rounded-xl border border-border/50">
            <span className="text-xs font-medium ml-2 text-muted-foreground">Using Agent:</span>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-[180px] h-9 border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent._id} value={agent._id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="h-11 rounded-xl gap-2"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Import CSV"}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
              <form onSubmit={handleManualAdd}>
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Enter the details of the lead you want to add to your database.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" placeholder="+1234567890" required className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input id="company" name="company" placeholder="Acme Inc." className="rounded-xl" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="rounded-xl w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Customer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
              <form onSubmit={handleUpdateCustomer}>
                <DialogHeader>
                  <DialogTitle>Update Customer Details</DialogTitle>
                  <DialogDescription>
                    Modify the information for {editingCustomer?.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input id="edit-name" name="name" defaultValue={editingCustomer?.name} required className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-email">Email Address</Label>
                    <Input id="edit-email" name="email" type="email" defaultValue={editingCustomer?.email} className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input id="edit-phone" name="phone" defaultValue={editingCustomer?.phone} required className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-company">Company</Label>
                    <Input id="edit-company" name="company" defaultValue={editingCustomer?.company} className="rounded-xl" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="rounded-xl w-full" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Customer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
              <form onSubmit={handleScheduleCall}>
                <DialogHeader>
                  <DialogTitle>Schedule AI Call</DialogTitle>
                  <DialogDescription>
                    Set a specific date and time to call {schedulingCustomer?.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="scheduledAt">Date & Time</Label>
                    <Input 
                      id="scheduledAt" 
                      name="scheduledAt" 
                      type="datetime-local" 
                      required 
                      className="rounded-xl"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="rounded-xl w-full">
                    Schedule Call
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 overflow-hidden">
        <CardHeader className="bg-accent/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, email, or phone..." className="pl-10 h-11 rounded-xl bg-background border-border/50" />
            </div>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <Badge variant="secondary" className="h-8 px-4 rounded-full font-medium">
              {customers.length} Contacts Found
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="w-[50px] pl-6">
                  <Checkbox 
                    checked={selectedIds.length === customers.length && customers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="py-4">Customer Details</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-8 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-20 animate-pulse bg-accent/5" />
                  </TableRow>
                ))
              ) : customers.map((customer) => (
                <TableRow 
                  key={customer._id} 
                  className={cn(
                    "hover:bg-accent/10 border-b border-border/10 transition-colors",
                    selectedIds.includes(customer._id) && "bg-primary/5"
                  )}
                >
                  <TableCell className="pl-6">
                    <Checkbox 
                      checked={selectedIds.includes(customer._id)}
                      onCheckedChange={() => toggleSelect(customer._id)}
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold">{customer.name}</span>
                      <span className="text-sm text-muted-foreground">{customer.email || 'No email provided'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{customer.company || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{customer.phone}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.isActive ? "success" : "outline"} className="rounded-md capitalize">
                      {customer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        className="h-9 px-4 rounded-lg gap-2"
                        onClick={() => handleCallCustomer(customer)}
                        disabled={isCalling !== null}
                      >
                        {isCalling === customer._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Phone className="h-4 w-4" />
                        )}
                        {isCalling === customer._id ? "Calling..." : "Call"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg hover:bg-background shadow-sm border border-transparent hover:border-border"
                        onClick={() => {
                          setSchedulingCustomer(customer);
                          setIsScheduleOpen(true);
                        }}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg hover:bg-background shadow-sm border border-transparent hover:border-border"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsEditOpen(true);
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                      <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                        <Users className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-bold">No customers found</h3>
                      <p className="text-sm max-w-xs mx-auto">
                        Your database is empty. Upload a CSV file or add customers manually to start calling.
                      </p>
                      <Button variant="outline" className="mt-4 h-10 rounded-xl" onClick={() => fileInputRef.current?.click()}>
                        Import Leads
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
