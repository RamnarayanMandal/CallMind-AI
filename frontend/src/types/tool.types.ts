export interface Tool {
  _id: string;
  organizationId: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  parameters: any;
  integrationId?: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  parameterMapping?: Record<string, string>;
  responseMapping?: string;
  responseTemplate?: string;
  isBuiltIn: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
