import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { SessionEvent } from '../entities/session-event.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(SessionEvent)
    private eventRepo: Repository<SessionEvent>,
  ) {}

  async getDashboard() {
    const activeSessions = await this.sessionRepo.find({
      where: { status: 'active' },
      relations: ['agent', 'customer'],
    });

    const totalSessions = await this.sessionRepo.count();
    const endedToday = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.status = :status', { status: 'ended' })
      .andWhere('DATE(session.endedAt) = CURRENT_DATE')
      .getCount();

    return {
      activeSessions,
      stats: {
        total: totalSessions,
        active: activeSessions.length,
        endedToday,
      },
    };
  }

  async getSessionDetails(sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['agent', 'customer'],
    });

    const events = await this.eventRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });

    return { session, events };
  }

  async forceEndSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) return null;

    session.status = 'ended';
    session.endedAt = new Date();
    await this.sessionRepo.save(session);

    await this.eventRepo.save({
      sessionId,
      eventType: 'force_ended',
      metadata: { reason: 'admin_action' },
    });

    return session;
  }
}
