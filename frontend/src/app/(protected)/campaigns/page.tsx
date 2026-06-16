'use client';
import { useAuth } from "@/hooks/useAuth";
import { useCalls } from "@/hooks/use-calls";
import { useDebounce } from "@/hooks/use-debounce";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  PhoneCall,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CampaignsPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId || '';
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const { calls, isLoading, executeCall, isExecuting } = useCalls(
    organizationId, 
    1, 
    50, 
    debouncedSearch, 
    statusFilter === "all" ? undefined : statusFilter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Scheduled</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="gap-1 animate-pulse border-primary text-primary"><PhoneCall className="h-3 w-3" /> Calling...</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage your AI voice call schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 rounded-xl gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total Scheduled</CardDescription>
            <CardTitle className="text-2xl font-bold">{calls.filter(c => c.status === 'pending').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">{calls.filter(c => c.status === 'in-progress').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-500">
              {calls.length > 0 ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100) : 0}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 overflow-hidden">
        <CardHeader className="bg-accent/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, phone or outcome..." 
                className="pl-10 h-11 rounded-xl bg-background border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="pl-8 py-4">Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outcome</TableHead>
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
              ) : calls.map((call: any) => (
                <TableRow key={call._id} className="hover:bg-accent/10 border-b border-border/10 transition-colors cursor-pointer">
                  <TableCell className="pl-8 py-4">
                    <span className="font-bold">{call.customerId?.name || 'Unknown'}</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{call.phoneNumber}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {call.scheduledAt ? format(new Date(call.scheduledAt), 'MMM dd, yyyy') : 'Manual'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {call.scheduledAt ? format(new Date(call.scheduledAt), 'hh:mm a') : 'Instant'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(call.status)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {call.outcome || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {call.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-9 px-4 rounded-lg gap-2 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => executeCall(call._id)}
                          disabled={isExecuting}
                        >
                          <Phone className="h-4 w-4" />
                          Call Now
                        </Button>
                      )}
                      <Link href={`/dashboard/calls/${call._id}`}>
                        <Button size="sm" variant="ghost" className="h-9 px-4 rounded-lg gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {calls.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                      <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                        <Calendar className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-bold">No calls scheduled</h3>
                      <p className="text-sm max-w-xs mx-auto">
                        Go to the Customers page to start calling or schedule a new campaign.
                      </p>
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
