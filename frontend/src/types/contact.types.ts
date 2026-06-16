export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'contacted' | 'resolved' | 'closed';
  assignedAgentId?: any;
  callId?: any;
  response?: string;
  respondedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateContactData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}
