"use client"
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Phone,
  CheckCircle2,
  TrendingUp,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Eye,
  XCircle,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DashboardStats, Call } from "@/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { useAnalytics } from "@/hooks/useAnalytics";

export default function DashboardPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId || '';
  const { stats, recentCalls, isLoading } = useAnalytics(organizationId);

  const statCards = [
    { title: 'Total Calls', value: stats?.callStats.total || 0, icon: Phone, up: true, change: '+0%' },
    { title: 'Completed', value: stats?.callStats.completed || 0, icon: CheckCircle2, up: true, change: '+0%' },
    { title: 'Avg. Duration', value: `${stats?.callStats.avgDuration || 0}s`, icon: Clock, up: true, change: '+0s' },
    { title: 'Failed Calls', value: stats?.callStats.failed || 0, icon: XCircle, up: false, change: '0%' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time updates from your active agents.</p>
        </div>
        <Link href="/campaigns">
          <Button className="h-11 px-6 rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s, i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${s.up ? 'text-success' : 'text-destructive'}`}>
                {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {s.change} <span className="text-muted-foreground ml-1">growth</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 bg-card/50 overflow-hidden">
          <CardHeader className="border-b bg-accent/10">
            <CardTitle className="text-lg">Recent Call Activity</CardTitle>
            <CardDescription>Real-time updates from your active agents.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No calls found. Start a campaign to see activity.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentCalls.map((call) => (
                    <TableRow key={call._id} className="hover:bg-accent/20 cursor-pointer">
                      <TableCell className="pl-6 font-medium">
                        {call.phoneNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant={call.status === 'completed' ? 'success' : call.status === 'failed' ? 'destructive' : 'secondary'} className="rounded-md capitalize">
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{call.outcome}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Link href={`/dashboard/calls/${call._id}`}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">AI Performance</CardTitle>
            <CardDescription>Top topics from your conversations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(stats?.topTopics || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No conversation data available yet.</p>
            ) : (
              stats?.topTopics.map((topic, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                      #{i + 1}
                    </div>
                    <span className="text-sm font-medium">{topic._id}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{topic.count}</p>
                    <p className="text-[10px] text-muted-foreground">occurrences</p>
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <a href="/agents">Manage Agents</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

