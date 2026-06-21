export enum IntegrationType {
  SHOPIFY = 'shopify',
  HUBSPOT = 'hubspot',
  GOOGLE_CALENDAR = 'google_calendar',
  WOOCOMMERCE = 'woocommerce',
  SALESFORCE = 'salesforce',
  ZOHO = 'zoho',
  CUSTOM = 'custom',
}

export enum AuthType {
  API_KEY = 'api_key',
  BEARER = 'bearer',
  BASIC = 'basic',
  OAUTH2 = 'oauth2',
  NONE = 'none',
}

export interface Integration {
  _id: string;
  organizationId: string;
  name: string;
  type: IntegrationType;
  baseUrl: string;
  authType: AuthType;
  isActive: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed' | 'untested';
  lastTestError?: string;
  shopDomain?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationTemplate {
  type: string;
  name: string;
  description: string;
  authType: string;
  credentialFields: { key: string; label: string; required: boolean }[];
  baseUrlTemplate: string;
  icon: string;
}
