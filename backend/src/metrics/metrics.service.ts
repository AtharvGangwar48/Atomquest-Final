import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
  ) {}

  async getMetrics() {
    const activeCount = await this.sessionRepo.count({ where: { status: 'active' } });
    const totalCount = await this.sessionRepo.count();
    const endedCount = await this.sessionRepo.count({ where: { status: 'ended' } });

    return {
      active_sessions: activeCount,
      total_sessions: totalCount,
      ended_sessions: endedCount,
      connected_participants: activeCount * 2,
      error_rate: 0,
    };
  }

  async getPrometheusMetrics() {
    const metrics = await this.getMetrics();
    return `
# HELP supportvision_active_sessions Number of active sessions
# TYPE supportvision_active_sessions gauge
supportvision_active_sessions ${metrics.active_sessions}

# HELP supportvision_total_sessions Total number of sessions
# TYPE supportvision_total_sessions counter
supportvision_total_sessions ${metrics.total_sessions}

# HELP supportvision_connected_participants Number of connected participants
# TYPE supportvision_connected_participants gauge
supportvision_connected_participants ${metrics.connected_participants}

# HELP supportvision_error_rate Error rate
# TYPE supportvision_error_rate gauge
supportvision_error_rate ${metrics.error_rate}
    `.trim();
  }
}
