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

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private sessions = new Map<string, Set<string>>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const sessionId = client.data.sessionId;
    if (sessionId && this.sessions.has(sessionId)) {
      this.sessions.get(sessionId).delete(client.id);
    }
  }

  @SubscribeMessage('join_session')
  handleJoinSession(client: Socket, payload: { sessionId: string }) {
    const { sessionId } = payload;
    client.data.sessionId = sessionId;
    client.join(sessionId);

    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Set());
    }
    this.sessions.get(sessionId).add(client.id);

    this.server.to(sessionId).emit('user_joined', {
      userId: client.data.user.sub,
      userName: client.data.user.name,
    });
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: { sessionId: string; content: string }) {
    const { sessionId, content } = payload;
    const userId = client.data.user.sub;

    const message = await this.chatService.saveMessage(sessionId, userId, content);

    this.server.to(sessionId).emit('new_message', {
      id: message.id,
      content: message.content,
      senderId: userId,
      createdAt: message.createdAt,
    });
  }

  @SubscribeMessage('media_state')
  handleMediaState(client: Socket, payload: { sessionId: string; audio: boolean; video: boolean }) {
    const { sessionId, audio, video } = payload;
    client.to(sessionId).emit('peer_media_state', {
      userId: client.data.user.sub,
      audio,
      video,
    });
  }
}
