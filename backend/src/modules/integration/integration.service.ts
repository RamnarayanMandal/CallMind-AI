import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Integration, IntegrationDocument, AuthType } from './integration.schema';
import { CreateIntegrationDto, UpdateIntegrationDto } from './dto/integration.dto';
import { encrypt, decrypt } from '../../common/utils/encryption.util';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    @InjectModel(Integration.name) private readonly model: Model<IntegrationDocument>,
  ) {}

  async create(dto: CreateIntegrationDto): Promise<IntegrationDocument> {
    const { credentials, ...rest } = dto;
    const encryptedCredentials = credentials ? encrypt(JSON.stringify(credentials)) : undefined;
    return this.model.create({ ...rest, encryptedCredentials });
  }

  async findByOrg(organizationId: string): Promise<IntegrationDocument[]> {
    return this.model.find({ organizationId }).select('-encryptedCredentials').exec();
  }

  async findById(id: string): Promise<IntegrationDocument> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('Integration not found');
    return doc;
  }

  async update(id: string, dto: UpdateIntegrationDto): Promise<IntegrationDocument> {
    const { credentials, ...rest } = dto as any;
    const update: any = { ...rest };
    if (credentials) {
      update.encryptedCredentials = encrypt(JSON.stringify(credentials));
    }
    const doc = await this.model.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!doc) throw new NotFoundException('Integration not found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('Integration not found');
    await this.model.deleteOne({ _id: id });
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const integration = await this.findById(id);
    const headers = this.buildHeaders(integration);
    const testUrl = `${integration.baseUrl}`;

    try {
      await axios.get(testUrl, { headers, timeout: 8000 });
      await this.model.findByIdAndUpdate(id, {
        $set: { lastTestedAt: new Date(), lastTestStatus: 'success', lastTestError: null }
      });
      return { success: true, message: 'Connection successful' };
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || 'Connection failed';
      await this.model.findByIdAndUpdate(id, {
        $set: { lastTestedAt: new Date(), lastTestStatus: 'failed', lastTestError: errMsg }
      });
      return { success: false, message: errMsg };
    }
  }

  async executeRequest(
    integrationId: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    params?: Record<string, any>,
    body?: Record<string, any>,
  ): Promise<any> {
    const integration = await this.findById(integrationId);
    const headers = this.buildHeaders(integration);
    const url = `${integration.baseUrl}${endpoint}`;

    const response = await axios({
      method,
      url,
      headers,
      params: method === 'GET' ? params : undefined,
      data: method !== 'GET' ? body : undefined,
      timeout: 10000,
    });
    return response.data;
  }

  getDecryptedCredentials(integration: IntegrationDocument): Record<string, string> {
    if (!integration.encryptedCredentials) return {};
    try {
      return JSON.parse(decrypt(integration.encryptedCredentials));
    } catch {
      return {};
    }
  }

  private buildHeaders(integration: IntegrationDocument): Record<string, string> {
    const creds = this.getDecryptedCredentials(integration);
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...integration.headers };

    switch (integration.authType) {
      case AuthType.API_KEY:
        if (creds.apiKey) headers['X-API-Key'] = creds.apiKey;
        break;
      case AuthType.BEARER:
        if (creds.bearerToken || creds.accessToken)
          headers['Authorization'] = `Bearer ${creds.bearerToken || creds.accessToken}`;
        break;
      case AuthType.BASIC:
        if (creds.username && creds.password) {
          const b64 = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
          headers['Authorization'] = `Basic ${b64}`;
        }
        break;
      // Shopify uses X-Shopify-Access-Token
      default:
        if (creds.accessToken) headers['X-Shopify-Access-Token'] = creds.accessToken;
    }
    return headers;
  }

  // Pre-built integration templates
  getTemplates() {
    return [
      {
        type: 'shopify',
        name: 'Shopify',
        description: 'Connect your Shopify store to enable order tracking, product search, and customer lookup',
        authType: 'bearer',
        credentialFields: [{ key: 'accessToken', label: 'Admin API Access Token', required: true }],
        baseUrlTemplate: 'https://{shopDomain}/admin/api/2024-01',
        icon: '🛍️',
      },
      {
        type: 'hubspot',
        name: 'HubSpot CRM',
        description: 'Connect HubSpot to create leads, contacts, and support tickets from calls',
        authType: 'bearer',
        credentialFields: [{ key: 'accessToken', label: 'Private App Token', required: true }],
        baseUrlTemplate: 'https://api.hubapi.com',
        icon: '🟠',
      },
      {
        type: 'google_calendar',
        name: 'Google Calendar',
        description: 'Book appointments, check availability, and manage schedules',
        authType: 'oauth2',
        credentialFields: [
          { key: 'clientId', label: 'Client ID', required: true },
          { key: 'clientSecret', label: 'Client Secret', required: true },
          { key: 'accessToken', label: 'Access Token', required: true },
        ],
        baseUrlTemplate: 'https://www.googleapis.com/calendar/v3',
        icon: '📅',
      },
      {
        type: 'woocommerce',
        name: 'WooCommerce',
        description: 'Connect WooCommerce to enable order and product management',
        authType: 'basic',
        credentialFields: [
          { key: 'username', label: 'Consumer Key', required: true },
          { key: 'password', label: 'Consumer Secret', required: true },
        ],
        baseUrlTemplate: 'https://{domain}/wp-json/wc/v3',
        icon: '🛒',
      },
      {
        type: 'custom',
        name: 'Custom API',
        description: 'Connect any REST API with custom authentication',
        authType: 'api_key',
        credentialFields: [{ key: 'apiKey', label: 'API Key', required: false }],
        baseUrlTemplate: '',
        icon: '⚙️',
      },
    ];
  }
}
