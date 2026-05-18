import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as os from 'os';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/admin',
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminGateway.name);
  private connectedAdmins = new Map<string, Socket>();
  private metricsInterval: NodeJS.Timeout;

  constructor(private readonly jwtService: JwtService) {
    this.startMetricsBroadcaster();
  }

  private startMetricsBroadcaster() {
    this.metricsInterval = setInterval(async () => {
      if (this.connectedAdmins.size === 0) return;

      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      const metrics = {
        cpuLoad: os.loadavg()[0],
        memoryUsage: {
          total: totalMem,
          used: usedMem,
          percentage: (usedMem / totalMem) * 100
        },
        uptime: process.uptime(),
        activeSockets: this.server.engine ? (this.server.engine as any).clientsCount : this.connectedAdmins.size,
        timestamp: new Date()
      };

      this.server.emit('admin:infrastructure:update', metrics);
    }, 3000);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) throw new UnauthorizedException('No token provided');

      const payload = await this.jwtService.verifyAsync(token);
      if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
        throw new UnauthorizedException('Not an admin');
      }

      this.connectedAdmins.set(client.id, client);
      this.logger.log(`Admin connected: ${client.id} (User: ${payload.email})`);
      this.server.emit('adminCount', { count: this.connectedAdmins.size });
    } catch (err) {
      this.logger.error(`Connection failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedAdmins.delete(client.id);
    this.logger.log(`Admin disconnected: ${client.id}`);
    this.server.emit('adminCount', { count: this.connectedAdmins.size });
  }

  broadcastSystemAlert(type: 'telephony' | 'ai' | 'billing', message: string, payload: any) {
    this.server.emit('admin:monitoring:update', { type, message, payload, timestamp: new Date() });
  }

  broadcastLiveCallUpdate(callData: any) {
    this.server.emit('admin:monitoring:update', callData);
  }
}
