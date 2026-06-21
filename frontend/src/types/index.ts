import { userRole } from "./admin.types";

// ── Shared API response envelope ──────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── Auth ───────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: userRole;
  organizationId?: string;
  isEmailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ── Organization ──────────────────────────────────────────
export interface Organization {
  _id: string;
  name: string;
  about: string;
  productInfo: string;
  website?: string;
  industry?: string;
  targetAudience?: string;
  businessGoals?: string;
  supportInstructions?: string;
  tone?: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
}

// ── Agent ─────────────────────────────────────────────────
export interface Agent {
  _id: string;
  name: string;
  gender: 'male' | 'female';
  tone: 'professional' | 'friendly' | 'formal' | 'casual' | 'empathetic';
  language: string;
  customInstructions?: string;
  generatedSystemPrompt?: string;
  systemPrompt?: string;
  enabledTools?: string[];
  organizationId: string;
  isActive: boolean;
  createdAt: string;
}

// ── Customer ──────────────────────────────────────────────
export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  organizationId: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

// ── Call ──────────────────────────────────────────────────
export type CallStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'cancelled';
export type CallOutcome = 'interested' | 'not-interested' | 'follow-up' | 'no-answer' | 'unknown';

export interface Call {
  _id: string;
  customerId: string | Customer;
  agentId: string | Agent;
  organizationId: string;
  status: CallStatus;
  outcome: CallOutcome;
  callSid?: string;
  recordingUrl?: string;
  recordingDuration?: number;
  phoneNumber: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  errorMessage?: string;
  createdAt: string;
}

// ── Conversation ──────────────────────────────────────────
export interface TranscriptEntry {
  role: 'agent' | 'customer';
  content: string;
  timestamp: string;
}

export interface Conversation {
  _id: string;
  callId: string;
  organizationId: string;
  transcript: TranscriptEntry[];
  summary?: string;
  keyInsights?: string;
  outcome: string;
  topics: string[];
  totalTurns: number;
  createdAt: string;
}

// ── Analytics ─────────────────────────────────────────────
export interface DashboardStats {
  callStats: {
    total: number;
    completed: number;
    failed: number;
    avgDuration: number;
  };
  outcomeStats: Array<{ _id: string; count: number }>;
  dailyTrend: Array<{ _id: string; count: number }>;
  topTopics: Array<{ _id: string; count: number }>;
}

// ── Subscription / Plans ──────────────────────────────────
export interface Plan {
  _id: string;
  name: string;
  price: number;
  yearlyPrice?: number;
  description: string;
  features: string[];
  minutesLimit: number;
  agentLimit: number;
  isPopular?: boolean;
  isActive: boolean;
  razorpayPlanId?: string;
  trialDays?: number;
  createdAt?: string;
}

export interface CreatePlanDto {
  name: string;
  price: number;
  yearlyPrice?: number;
  description?: string;
  features?: string[];
  minutesLimit?: number;
  agentLimit?: number;
  isPopular?: boolean;
  isActive?: boolean;
  razorpayPlanId?: string;
  trialDays?: number;
}

export interface SubscriptionRecord {
  _id: string;
  organizationId: string;
  planId: string | Plan;
  razorpaySubscriptionId: string;
  status: 'created' | 'active' | 'halted' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
  minutesUsed: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
}

export interface SubscriptionUsageData {
  aiMinutesUsed: number;
  aiCost: number;
  callMinutesUsed: number;
  callCost: number;
  currentBill: number;
  remainingBalance: number;
  minutesLimit: number;
  planName: string | null;
  periodStart?: string;
  periodEnd?: string;
}

export interface CreateSubscriptionResponse {
  razorpaySubscriptionId: string;
  _id: string;
}

// ── Conversation (extended) ───────────────────────────────
export interface ActionLogEntry {
  action: string;
  success: boolean;
  data?: Record<string, any>;
  timestamp: string;
}

export interface ConversationExtended extends Conversation {
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  customerIntent?: string;
  leadStatus?: 'hot' | 'warm' | 'cold' | 'closed';
  callDate?: string;
  actionLog?: ActionLogEntry[];
  avgSttLatencyMs?: number;
  avgLlmLatencyMs?: number;
  avgTtsLatencyMs?: number;
  avgTotalLatencyMs?: number;
}

// ── Admin Analytics ────────────────────────────────────────
export interface AdminSystemOverview {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  successRate: number;
  period: string;
  callTrend: Array<{ _id: string; count: number; completed: number }>;
  topOrgs: Array<{ orgName: string; totalCalls: number }>;
}

export interface OrgUsageRow {
  organizationId: string;
  orgName: string;
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  totalMinutes: number;
  successRate: number;
  lastCall?: string;
}

export interface Recording {
  _id: string;
  callId: string;
  organizationId: string;
  url: string;
  durationSeconds: number;
  fileSize: number;
  format: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  userId?: string;
  user?: { email: string };
  action: string;
  resourceType: string;
  resourceId?: string;
  description?: string;
  details?: { message?: string };
  ip?: string;
  createdAt: string;
}

