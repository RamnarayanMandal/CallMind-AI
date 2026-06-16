export enum userRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
  FINANCE = 'FINANCE',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: userRole;
  isActive: boolean;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  activeSubscriptions: number;
  systemHealth: string;
}

export interface AdminPlan {
  _id: string;
  name: string;
  priceInr: number;
  razorpayPlanId: string;
  includedMinutes: number;
  maxAgents: number;
}

export interface AdminSubscription {
  _id: string;
  organizationId: any; // Ideally expanded Organization type
  planId: AdminPlan;
  razorpaySubscriptionId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  minutesUsed: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface AdminOrgBilling {
  _id: string;
  name: string;
  industry: string;
  ownerEmail: string;
  usersCount: number;
  planName: string;
  minutesUsed: number;
  minutesLimit: number;
  aiCost: number;
  callCost: number;
  totalCost: number;
  status: string;
  createdAt: string;
}

export interface AdminOrgAgentStat {
  _id: string;
  name: string;
  gender: string;
  language: string;
  isActive: boolean;
  createdAt: string;
  totalCalls: number;
  totalMinutes: number;
  aiCost: number;
  callCost: number;
  totalCost: number;
}

export interface AdminOrgDetail {
  organization: {
    _id: string;
    name: string;
    industry: string;
    website: string;
    about: string;
    productInfo: string;
    targetAudience: string;
    tone: string;
    ownerId: string;
    createdAt: string;
  };
  admin: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  subscription: {
    id: string;
    planName: string;
    planPrice: number;
    status: string;
    minutesUsed: number;
    minutesLimit: number;
    aiCostPer1kTokens: number;
    telephonyCostPerMinute: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    createdAt: string;
  } | null;
  usageTrends: Array<{
    date: string;
    calls: number;
    minutes: number;
    aiCost: number;
    callCost: number;
  }>;
  agents: AdminOrgAgentStat[];
  recentCalls: Array<{
    _id: string;
    phoneNumber: string;
    status: string;
    outcome: string;
    durationSeconds: number;
    recordingUrl?: string;
    createdAt: string;
  }>;
}
