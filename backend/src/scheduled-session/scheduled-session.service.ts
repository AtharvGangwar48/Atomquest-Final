import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledSession } from '../entities/scheduled-session.entity';

@Injectable()
export class ScheduledSessionService {
  constructor(
    @InjectRepository(ScheduledSession)
    private repo: Repository<ScheduledSession>,
  ) {}

  async create(agentId: string, title: string, scheduledAt: Date, description?: string, customerId?: string) {
    const s = this.repo.create({ agentId, title, description, scheduledAt, customerId });
    return this.repo.save(s);
  }

  async getByAgent(agentId: string) {
    return this.repo.find({
      where: { agentId },
      relations: ['customer'],
      order: { scheduledAt: 'ASC' },
    });
  }

  async cancel(id: string, agentId: string) {
    await this.repo.update({ id, agentId }, { status: 'cancelled' });
    return { success: true };
  }

  // Get all customers who had sessions with this agent (for notification targeting)
  async getAgentCustomers(agentId: string): Promise<{ id: string; name: string; email: string }[]> {
    return [];
  }
}
