import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Session } from '../entities/session.entity';
import { SessionEvent } from '../entities/session-event.entity';
import { LivekitService } from './livekit.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(SessionEvent)
    private eventRepo: Repository<SessionEvent>,
    private livekitService: LivekitService,
    private jwtService: JwtService,
  ) {}

  async createSession(agentId: string) {
    const roomName = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = this.sessionRepo.create({
      agentId,
      roomName,
      status: 'created',
    });
    await this.sessionRepo.save(session);

    const joinToken = this.jwtService.sign(
      { sessionId: session.id, role: 'customer' },
      { expiresIn: '24h' },
    );
    session.joinToken = joinToken;
    await this.sessionRepo.save(session);

    await this.logEvent(session.id, 'session_created', { agentId });

    return { sessionId: session.id, joinToken, joinUrl: `/session/join?token=${joinToken}` };
  }

  async joinSession(token: string, userId: string, userName: string) {
    let decoded;
    try {
      decoded = this.jwtService.verify(token);
    } catch {
      throw new ForbiddenException('Invalid or expired token');
    }

    const session = await this.sessionRepo.findOne({ where: { id: decoded.sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status === 'ended') throw new ForbiddenException('Session has ended');

    if (decoded.role === 'customer' && !session.customerId) {
      session.customerId = userId;
      session.status = 'active';
      await this.sessionRepo.save(session);
    }

    const livekitToken = this.livekitService.generateToken(
      session.roomName,
      userId,
      JSON.stringify({ userId, userName }),
    );

    await this.logEvent(session.id, 'participant_joined', { userId, userName });

    return {
      roomToken: livekitToken,
      roomName: session.roomName,
      wsUrl: this.livekitService.getWsUrl(),
      sessionId: session.id,
    };
  }

  async endSession(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.agentId !== userId && session.customerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    session.status = 'ended';
    session.endedAt = new Date();
    await this.sessionRepo.save(session);
    await this.logEvent(sessionId, 'session_ended', { userId });

    return { success: true };
  }

  async getSessionHistory(userId: string, role: string) {
    const where = role === 'agent' ? { agentId: userId } : { customerId: userId };
    return this.sessionRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['agent', 'customer'],
    });
  }

  async getSession(sessionId: string) {
    return this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['agent', 'customer'],
    });
  }

  async agentJoin(sessionId: string, userId: string, userName: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.agentId !== userId) throw new ForbiddenException('Not the session agent');
    if (session.status === 'ended') throw new ForbiddenException('Session has ended');

    if (session.status === 'created') {
      session.status = 'active';
      await this.sessionRepo.save(session);
    }

    const livekitToken = this.livekitService.generateToken(
      session.roomName,
      userId,
      JSON.stringify({ userId, userName }),
    );

    await this.logEvent(sessionId, 'agent_joined', { userId, userName });

    return {
      roomToken: livekitToken,
      roomName: session.roomName,
      wsUrl: this.livekitService.getWsUrl(),
      sessionId: session.id,
    };
  }

  private async logEvent(sessionId: string, eventType: string, metadata: any) {
    const event = this.eventRepo.create({ sessionId, eventType, metadata });
    await this.eventRepo.save(event);
  }
}
