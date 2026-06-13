import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { SessionEvent } from '../entities/session-event.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { Recording } from '../entities/recording.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(SessionEvent) private eventRepo: Repository<SessionEvent>,
    @InjectRepository(ChatMessage) private chatRepo: Repository<ChatMessage>,
    @InjectRepository(Recording) private recordingRepo: Repository<Recording>,
  ) {}

  async getDashboard() {
    const [activeSessions, historicalSessions, totalCount] = await Promise.all([
      this.sessionRepo.find({ where: { status: 'active' }, relations: ['agent', 'customer'], order: { createdAt: 'DESC' } }),
      this.sessionRepo.find({ where: { status: 'ended' }, relations: ['agent', 'customer'], order: { endedAt: 'DESC' }, take: 50 }),
      this.sessionRepo.count(),
    ]);

    const enrichSession = async (s: Session) => {
      const [chatCount, recordings] = await Promise.all([
        this.chatRepo.count({ where: { sessionId: s.id } }),
        this.recordingRepo.find({ where: { sessionId: s.id } }),
      ]);
      const durationSec = s.endedAt
        ? Math.floor((s.endedAt.getTime() - s.createdAt.getTime()) / 1000)
        : Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 1000);
      return {
        id: s.id,
        roomName: s.roomName,
        status: s.status,
        agent: s.agent ? { id: s.agent.id, name: s.agent.name } : null,
        customer: s.customer ? { id: s.customer.id, name: s.customer.name } : null,
        createdAt: s.createdAt,
        endedAt: s.endedAt,
        durationSec,
        chatCount,
        recordings: recordings.map((r) => ({ id: r.id, status: r.status, fileUrl: r.fileUrl, duration: r.duration })),
      };
    };

    const [active, historical] = await Promise.all([
      Promise.all(activeSessions.map(enrichSession)),
      Promise.all(historicalSessions.map(enrichSession)),
    ]);

    return {
      stats: { total: totalCount, active: active.length, ended: totalCount - active.length },
      activeSessions: active,
      historicalSessions: historical,
    };
  }

  async forceEndSession(sessionId: string) {
    await this.sessionRepo.update(sessionId, { status: 'ended', endedAt: new Date() });
    await this.eventRepo.save(this.eventRepo.create({ sessionId, eventType: 'force_ended', metadata: { by: 'admin' } }));
    return { success: true };
  }

  async getSessionEvents(sessionId: string) {
    return this.eventRepo.find({ where: { sessionId }, order: { createdAt: 'ASC' } });
  }
}
