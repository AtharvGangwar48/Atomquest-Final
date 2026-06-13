import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { SessionEvent } from '../entities/session-event.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { Recording } from '../entities/recording.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(SessionEvent) private eventRepo: Repository<SessionEvent>,
    @InjectRepository(ChatMessage) private chatRepo: Repository<ChatMessage>,
    @InjectRepository(Recording) private recordingRepo: Repository<Recording>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getDashboard() {
    const [activeSessions, historicalSessions, totalCount, totalCustomers, totalAgents] = await Promise.all([
      this.sessionRepo.find({ where: { status: 'active' }, relations: ['agent', 'customer'], order: { createdAt: 'DESC' } }),
      this.sessionRepo.find({ where: { status: 'ended' }, relations: ['agent', 'customer'], order: { endedAt: 'DESC' }, take: 50 }),
      this.sessionRepo.count(),
      this.userRepo.count({ where: { role: 'customer', isActive: true } }),
      this.userRepo.count({ where: { role: 'agent', isActive: true } }),
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
        id: s.id, roomName: s.roomName, status: s.status,
        agent: s.agent ? { id: s.agent.id, name: s.agent.name, isVerified: s.agent.isVerified } : null,
        customer: s.customer ? { id: s.customer.id, name: s.customer.name } : null,
        createdAt: s.createdAt, endedAt: s.endedAt, durationSec, chatCount,
        recordings: recordings.map((r) => ({ id: r.id, status: r.status, fileUrl: r.fileUrl, duration: r.duration })),
      };
    };

    const [active, historical] = await Promise.all([
      Promise.all(activeSessions.map(enrichSession)),
      Promise.all(historicalSessions.map(enrichSession)),
    ]);

    return {
      stats: { total: totalCount, active: active.length, ended: totalCount - active.length, totalCustomers, totalAgents },
      activeSessions: active,
      historicalSessions: historical,
    };
  }

  async getAllUsers(role?: 'agent' | 'customer') {
    const where: any = { isActive: true };
    if (role) where.role = role;
    const users = await this.userRepo.find({ where, order: { createdAt: 'DESC' } });
    return users.map((u) => ({ 
      id: u.id, 
      name: u.name, 
      email: u.email, 
      role: u.role, 
      employeeId: u.employeeId,
      isVerified: u.isVerified, 
      createdAt: u.createdAt 
    }));
  }

  async verifyAgent(userId: string, verified: boolean) {
    const user = await this.userRepo.findOne({ where: { id: userId, role: 'agent' } });
    if (!user) throw new NotFoundException('Agent not found');
    user.isVerified = verified;
    await this.userRepo.save(user);
    return { success: true, isVerified: verified };
  }

  async deleteUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = false;
    await this.userRepo.save(user);
    return { success: true };
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
