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
  ownerId: string;
  isActive: boolean;
  createdAt: string;
}

// ── Agent ─────────────────────────────────────────────────
export interface Agent {
  _id: string;
  name: string;
  gender: 'male' | 'female';
  tone: 'professional' | 'friendly' | 'formal' | 'casual';
  language: string;
  systemPrompt?: string;
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
