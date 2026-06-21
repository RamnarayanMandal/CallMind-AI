import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tool, ToolDocument } from './tool.schema';
import { IntegrationService } from '../integration/integration.service';

@Injectable()
export class ToolService {
  private readonly logger = new Logger(ToolService.name);

  constructor(
    @InjectModel(Tool.name) private readonly model: Model<ToolDocument>,
    private readonly integrationService: IntegrationService,
  ) {}

  async findByOrg(organizationId: string): Promise<ToolDocument[]> {
    return this.model.find({ organizationId, isActive: true }).populate('integrationId').exec();
  }

  async findByNames(organizationId: string, names: string[]): Promise<ToolDocument[]> {
    return this.model.find({ organizationId, name: { $in: names }, isActive: true }).exec();
  }

  async create(data: Partial<Tool>): Promise<ToolDocument> {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<Tool>): Promise<ToolDocument> {
    const doc = await this.model.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!doc) throw new NotFoundException('Tool not found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id });
  }

  async execute(
    toolName: string,
    params: Record<string, any>,
    organizationId: string,
  ): Promise<{ success: boolean; humanReadable: string; data?: any; error?: string }> {
    const tool = await this.model.findOne({ organizationId, name: toolName, isActive: true });
    if (!tool) {
      return { success: false, humanReadable: `Tool ${toolName} not found`, error: 'Tool not found' };
    }

    if (!tool.integrationId) {
      return { success: false, humanReadable: 'This tool is not connected to an integration', error: 'No integration linked' };
    }

    try {
      // Resolve endpoint template: /orders/{orderId} → /orders/12345
      let endpoint = tool.endpoint || '/';
      const mappedParams: Record<string, any> = {};
      const queryParams: Record<string, any> = {};

      for (const [llmKey, value] of Object.entries(params)) {
        const apiKey = tool.parameterMapping[llmKey] || llmKey;
        if (endpoint.includes(`{${apiKey}}`)) {
          endpoint = endpoint.replace(`{${apiKey}}`, encodeURIComponent(String(value)));
        } else if (endpoint.includes(`{${llmKey}}`)) {
          endpoint = endpoint.replace(`{${llmKey}}`, encodeURIComponent(String(value)));
        } else {
          queryParams[apiKey] = value;
        }
        mappedParams[apiKey] = value;
      }

      const method = (tool.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      const data = await this.integrationService.executeRequest(
        tool.integrationId.toString(),
        endpoint,
        method,
        method === 'GET' ? queryParams : undefined,
        method !== 'GET' ? mappedParams : undefined,
      );

      // Extract value using responseMapping (simple dot-path)
      let extracted = data;
      if (tool.responseMapping) {
        const path = tool.responseMapping.split('.');
        for (const key of path) {
          extracted = extracted?.[key];
        }
      }

      // Build human-readable response
      let humanReadable = tool.responseTemplate || JSON.stringify(extracted || data);
      if (tool.responseTemplate && extracted && typeof extracted === 'object') {
        for (const [k, v] of Object.entries(extracted as Record<string, any>)) {
          humanReadable = humanReadable.replace(`{${k}}`, String(v));
        }
        for (const [k, v] of Object.entries(params)) {
          humanReadable = humanReadable.replace(`{${k}}`, String(v));
        }
      }

      return { success: true, humanReadable, data: extracted || data };
    } catch (err: any) {
      this.logger.error(`Tool ${toolName} execution failed: ${err.message}`);
      return { success: false, humanReadable: 'I could not retrieve that information right now. Please try again.', error: err.message };
    }
  }

  // Get LLM-ready function schemas for a list of tool names
  async getFunctionSchemas(organizationId: string, toolNames: string[]): Promise<any[]> {
    const tools = await this.findByNames(organizationId, toolNames);
    return tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  // Seed pre-built E-Commerce tools for an org
  async seedEcommerceTools(organizationId: string, integrationId?: string): Promise<void> {
    const tools = [
      {
        name: 'get_order_status',
        displayName: 'Get Order Status',
        description: 'Retrieve the current status and details of a customer order by order ID or phone number',
        category: 'ecommerce',
        parameters: {
          type: 'object',
          properties: {
            orderId: { type: 'string', description: 'The order ID or order number' },
            phone: { type: 'string', description: 'Customer phone number to look up orders' },
          },
          required: [],
        },
        endpoint: '/orders.json',
        method: 'GET',
        parameterMapping: { orderId: 'name', phone: 'phone' },
        responseMapping: 'orders.0',
        responseTemplate: 'Your order {name} is currently {financial_status}. Fulfillment status: {fulfillment_status}.',
        isBuiltIn: true,
      },
      {
        name: 'search_products',
        displayName: 'Search Products',
        description: 'Search for products by name, category, or keyword',
        category: 'ecommerce',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Product name or keyword to search for' },
          },
          required: ['query'],
        },
        endpoint: '/products.json',
        method: 'GET',
        parameterMapping: { query: 'title' },
        responseMapping: 'products',
        responseTemplate: 'I found {count} products matching your search.',
        isBuiltIn: true,
      },
      {
        name: 'get_product_details',
        displayName: 'Get Product Details',
        description: 'Get detailed information about a specific product including price and availability',
        category: 'ecommerce',
        parameters: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'The product ID' },
          },
          required: ['productId'],
        },
        endpoint: '/products/{productId}.json',
        method: 'GET',
        parameterMapping: { productId: 'productId' },
        responseMapping: 'product',
        responseTemplate: '{title} is priced at {variants.0.price}. Status: {status}.',
        isBuiltIn: true,
      },
      {
        name: 'get_customer_details',
        displayName: 'Get Customer Details',
        description: 'Look up customer account information and order history by phone or email',
        category: 'ecommerce',
        parameters: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: 'Customer phone number' },
            email: { type: 'string', description: 'Customer email address' },
          },
          required: [],
        },
        endpoint: '/customers/search.json',
        method: 'GET',
        parameterMapping: { phone: 'query', email: 'query' },
        responseMapping: 'customers.0',
        responseTemplate: 'Found customer {first_name} {last_name} with {orders_count} orders.',
        isBuiltIn: true,
      },
      {
        name: 'create_lead',
        displayName: 'Create Lead',
        description: 'Save a potential customer as a lead with their contact details and interest',
        category: 'crm',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer full name' },
            phone: { type: 'string', description: 'Customer phone number' },
            email: { type: 'string', description: 'Customer email' },
            interest: { type: 'string', description: 'What the customer is interested in' },
          },
          required: ['name', 'phone'],
        },
        endpoint: '/customers.json',
        method: 'POST',
        parameterMapping: {},
        responseTemplate: 'I have saved your details. Our team will reach out to you shortly.',
        isBuiltIn: true,
      },
      {
        name: 'create_support_ticket',
        displayName: 'Create Support Ticket',
        description: 'Create a support ticket for customer issues, complaints, or requests',
        category: 'support',
        parameters: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'Brief description of the issue' },
            description: { type: 'string', description: 'Detailed description of the problem' },
            priority: { type: 'string', description: 'Priority level: low, normal, high, urgent', enum: ['low', 'normal', 'high', 'urgent'] },
          },
          required: ['subject'],
        },
        endpoint: '/admin/api/2024-01/disputes.json',
        method: 'POST',
        parameterMapping: {},
        responseTemplate: 'I have created a support ticket for your issue. Our support team will contact you within 24 hours.',
        isBuiltIn: true,
      },
    ];

    for (const tool of tools) {
      const exists = await this.model.findOne({ organizationId, name: tool.name });
      if (!exists) {
        await this.model.create({
          ...tool,
          organizationId,
          integrationId: integrationId || undefined,
        });
      }
    }
    this.logger.log(`Seeded ${tools.length} e-commerce tools for org=${organizationId}`);
  }
}
