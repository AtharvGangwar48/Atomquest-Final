import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PresenceService } from '../presence/presence.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // socketId -> { userId, userName, sessionId }
  private clients = new Map<string, { userId: string; userName: string; sessionId?: string }>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private presenceService: PresenceService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      this.clients.set(client.id, { userId: payload.sub, userName: payload.name });
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const info = this.clients.get(client.id);
    if (!info || !info.sessionId) {
      this.clients.delete(client.id);
      return;
    }
    const { userId, userName, sessionId } = info;
    this.clients.delete(client.id);

    // Check if same user has another socket still connected in this session
    const stillConnected = [...this.clients.values()].some(
      (c) => c.userId === userId && c.sessionId === sessionId,
    );
    if (stillConnected) return;

    // Start reconnect grace period — don't mark as left yet
    await this.presenceService.disconnected(sessionId, userId, userName);
    this.server.to(sessionId).emit('participant_reconnecting', { userId, userName });

    // After TTL, if still no reconnect, mark as left
    setTimeout(async () => {
      const isReconnecting = await this.presenceService.isReconnecting(sessionId, userId);
      if (isReconnecting) {
        await this.presenceService.left(sessionId, userId, userName);
        this.server.to(sessionId).emit('participant_left', { userId, userName });
      }
    }, 60_000);
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(client: Socket, payload: { sessionId: string }) {
    const info = this.clients.get(client.id);
    if (!info) return;

    const { sessionId } = payload;
    info.sessionId = sessionId;
    client.join(sessionId);

    const wasReconnecting = await this.presenceService.isReconnecting(sessionId, info.userId);

    if (wasReconnecting) {
      await this.presenceService.reconnected(sessionId, info.userId, info.userName);
      this.server.to(sessionId).emit('participant_reconnected', { userId: info.userId, userName: info.userName });
    } else {
      await this.presenceService.joined(sessionId, info.userId, info.userName);
      this.server.to(sessionId).emit('participant_joined', { userId: info.userId, userName: info.userName });
    }

    const participants = await this.presenceService.getParticipants(sessionId);
    client.emit('participants', participants);

    // Send chat history to joining client
    const messages = await this.chatService.getMessages(sessionId);
    client.emit('chat_history', messages);
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: { sessionId: string; content: string }) {
    const info = this.clients.get(client.id);
    if (!info) return;

    const message = await this.chatService.saveMessage(payload.sessionId, info.userId, payload.content);
    this.server.to(payload.sessionId).emit('new_message', {
      id: message.id,
      content: message.content,
      senderId: info.userId,
      senderName: info.userName,
      createdAt: message.createdAt,
    });
  }

  @SubscribeMessage('media_state')
  async handleMediaState(client: Socket, payload: { sessionId: string; audio: boolean; video: boolean }) {
    const info = this.clients.get(client.id);
    if (!info) return;

    await this.presenceService.updateMedia(payload.sessionId, info.userId, payload.audio, payload.video);
    client.to(payload.sessionId).emit('peer_media_state', {
      userId: info.userId,
      audio: payload.audio,
      video: payload.video,
    });
  }

  @SubscribeMessage('leave_session')
  async handleLeave(client: Socket, payload: { sessionId: string }) {
    const info = this.clients.get(client.id);
    if (!info) return;

    await this.presenceService.left(payload.sessionId, info.userId, info.userName);
    this.server.to(payload.sessionId).emit('participant_left', { userId: info.userId, userName: info.userName });
    client.leave(payload.sessionId);
    info.sessionId = undefined;
  }

  @SubscribeMessage('send_file_message')
  async handleFileMessage(client: Socket, payload: { sessionId: string; messageId: string }) {
    const info = this.clients.get(client.id);
    if (!info) return;
    // Fetch the saved message and broadcast to room (excluding sender who already has it)
    const messages = await this.chatService.getMessages(payload.sessionId);
    const msg = messages.find((m: any) => m.id === payload.messageId);
    if (msg) {
      client.to(payload.sessionId).emit('new_message', msg);
    }
  }
}
