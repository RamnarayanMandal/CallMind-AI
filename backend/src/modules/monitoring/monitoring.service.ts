import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Call, CallDocument } from '../call/schemas/call.schema';

export interface MetricPoint {
  timestamp: Date;
  value: number;
  metadata?: any;
}

export interface LatencyMetrics {
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface MonitoringDashboard {
  apiLatency: LatencyMetrics;
  aiLatency: LatencyMetrics;
  callLatency: LatencyMetrics;
  errorRates: {
    totalCalls: number;
    failedCalls: number;
    errorRate: number;
    failedAiRequests: number;
  };
  websocketPerformance: {
    activeConnections: number;
    avgResponseTime: number;
  };
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  
  // In-memory metrics storage (in production, use Redis or time-series DB)
  private apiLatencies: number[] = [];
  private aiLatencies: number[] = [];
  private callLatencies: number[] = [];
  private errorCount = 0;
  private totalRequests = 0;

  constructor(
    @InjectModel(Call.name) private readonly callModel: Model<CallDocument>,
  ) {}

  /**
   * Record API latency
   */
  recordApiLatency(latencyMs: number): void {
    this.apiLatencies.push(latencyMs);
    if (this.apiLatencies.length > 1000) {
      this.apiLatencies.shift(); // Keep last 1000 samples
    }
  }

  /**
   * Record AI latency
   */
  recordAiLatency(latencyMs: number): void {
    this.aiLatencies.push(latencyMs);
    if (this.aiLatencies.length > 1000) {
      this.aiLatencies.shift();
    }
  }

  /**
   * Record call latency
   */
  recordCallLatency(latencyMs: number): void {
    this.callLatencies.push(latencyMs);
    if (this.callLatencies.length > 1000) {
      this.callLatencies.shift();
    }
  }

  /**
   * Record error
   */
  recordError(): void {
    this.errorCount++;
    this.totalRequests++;
  }

  /**
   * Record request
   */
  recordRequest(): void {
    this.totalRequests++;
  }

  /**
   * Get monitoring dashboard data
   */
  async getMonitoringDashboard(): Promise<MonitoringDashboard> {
    const [apiLatency, aiLatency, callLatency, errorRates] = await Promise.all([
      this.getLatencyMetrics(this.apiLatencies),
      this.getLatencyMetrics(this.aiLatencies),
      this.getLatencyMetrics(this.callLatencies),
      this.getErrorRates(),
    ]);

    return {
      apiLatency,
      aiLatency,
      callLatency,
      errorRates,
      websocketPerformance: {
        activeConnections: 0, // Would need WebSocket server reference
        avgResponseTime: 0,
      },
    };
  }

  /**
   * Get latency trends over time
   */
  async getLatencyTrends(
    type: 'api' | 'ai' | 'call',
    hours: number = 24,
  ): Promise<MetricPoint[]> {
    // In production, this would query a time-series database
    // For now, return simulated data
    const now = new Date();
    const points: MetricPoint[] = [];
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      points.push({
        timestamp,
        value: Math.random() * 100 + 50, // Simulated latency
      });
    }
    
    return points;
  }

  /**
   * Get error rates over time
   */
  async getErrorRatesOverTime(hours: number = 24): Promise<MetricPoint[]> {
    const now = new Date();
    const points: MetricPoint[] = [];
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      points.push({
        timestamp,
        value: Math.random() * 5, // Simulated error rate %
      });
    }
    
    return points;
  }

  /**
   * Get call success rate
   */
  async getCallSuccessRate(organizationId?: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const matchStage: any = { createdAt: { $gte: since } };
    if (organizationId) {
      matchStage.organizationId = organizationId;
    }

    const result = await this.callModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = result[0] || { total: 0, completed: 0, failed: 0 };
    return {
      total: stats.total,
      completed: stats.completed,
      failed: stats.failed,
      successRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    };
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  private getLatencyMetrics(samples: number[]): LatencyMetrics {
    if (samples.length === 0) {
      return { avg: 0, p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0 };
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      avg: Math.round(sum / sorted.length),
      p50: this.getPercentile(sorted, 50),
      p90: this.getPercentile(sorted, 90),
      p95: this.getPercentile(sorted, 95),
      p99: this.getPercentile(sorted, 99),
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  private getPercentile(sorted: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private getErrorRates() {
    const errorRate = this.totalRequests > 0
      ? Math.round((this.errorCount / this.totalRequests) * 100 * 100) / 100
      : 0;

    return {
      totalCalls: this.totalRequests,
      failedCalls: this.errorCount,
      errorRate,
      failedAiRequests: 0, // Would need to track separately
    };
  }
}
