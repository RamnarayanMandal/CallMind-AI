import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { DemoService } from './demo.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/demo',
})
export class DemoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DemoGateway.name);

  constructor(private readonly demoService: DemoService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.demoService.cleanupSession(client.id);
  }

  @SubscribeMessage('start-demo')
  async handleStartDemo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { agentId: string },
  ) {
    try {
      this.logger.log(`Starting demo for agent ${data.agentId} on client ${client.id}`);
      
      // Force clean up any existing demo session for this client to invalidate cache and context memory
      this.demoService.cleanupSession(client.id);
      
      const emit = (event: string, payload: any) => client.emit(event, payload);
      
      client.emit('demo-started', {
        status: 'ready',
        message: 'Demo session initialized successfully.',
      });

      // Pass emit to immediately trigger intro generation
      await this.demoService.initializeSession(client.id, data.agentId, emit);
    } catch (error) {
      this.logger.error(`Failed to start demo: ${error.message}`);
      client.emit('error', { message: 'Failed to initialize demo session.' });
    }
  }

  @SubscribeMessage('audio-stream')
  async handleAudioStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() audioData: ArrayBuffer,
  ) {
    try {
      // For streaming, we accumulate audio and process when silence is detected,
      // or stream directly to the STT provider.
      await this.demoService.processAudioStream(client.id, Buffer.from(audioData), (responseEvent, payload) => {
        client.emit(responseEvent, payload);
      });
    } catch (error) {
      this.logger.error('Error processing audio stream', error);
      client.emit('error', { message: 'Error processing audio.' });
    }
  }

  @SubscribeMessage('stop-demo')
  handleStopDemo(@ConnectedSocket() client: Socket) {
    this.demoService.cleanupSession(client.id);
    client.emit('demo-stopped');
  }
}
