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
