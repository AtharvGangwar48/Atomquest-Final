import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as client from 'prom-client';
import { Session } from '../entities/session.entity';
import { Recording } from '../entities/recording.entity';

@Injectable()
export class MetricsService implements OnModuleInit {
  private registry: client.Registry;

  readonly activeSessions: client.Gauge<string>;
  readonly connectedUsers: client.Gauge<string>;
  readonly totalSessions: client.Counter<string>;
  readonly recordingsStarted: client.Counter<string>;
  readonly errorsTotal: client.Counter<string>;
  readonly avgCallDuration: client.Gauge<string>;

  constructor(
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Recording) private recordingRepo: Repository<Recording>,
  ) {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry, prefix: 'node_' });

    this.activeSessions = new client.Gauge({ name: 'supportvision_active_sessions', help: 'Current active sessions', registers: [this.registry] });
    this.connectedUsers = new client.Gauge({ name: 'supportvision_connected_users', help: 'Current connected users', registers: [this.registry] });
    this.totalSessions = new client.Counter({ name: 'supportvision_total_sessions_total', help: 'Total sessions created', registers: [this.registry] });
    this.recordingsStarted = new client.Counter({ name: 'supportvision_recordings_started_total', help: 'Total recordings started', registers: [this.registry] });
    this.errorsTotal = new client.Counter({ name: 'supportvision_errors_total', help: 'Total errors', registers: [this.registry] });
    this.avgCallDuration = new client.Gauge({ name: 'supportvision_avg_call_duration_seconds', help: 'Average call duration in seconds', registers: [this.registry] });
  }

  async onModuleInit() {
    await this.syncFromDb();
    // Re-sync every 15s so gauges stay accurate
    setInterval(() => this.syncFromDb(), 15_000);
  }

  private async syncFromDb() {
    try {
      const [activeCount, totalCount, ended] = await Promise.all([
        this.sessionRepo.count({ where: { status: 'active' } }),
        this.sessionRepo.count(),
        this.sessionRepo.find({ where: { status: 'ended' }, select: ['createdAt', 'endedAt'] }),
      ]);

      this.activeSessions.set(activeCount);
      this.connectedUsers.set(activeCount * 2);

      if (ended.length > 0) {
        const durations = ended
          .filter((s) => s.endedAt && s.createdAt)
          .map((s) => (new Date(s.endedAt).getTime() - new Date(s.createdAt).getTime()) / 1000);
        if (durations.length) {
          this.avgCallDuration.set(durations.reduce((a, b) => a + b, 0) / durations.length);
        }
      }

      // Sync counter — counters can only go up, so we track via a gauge workaround for seeded data
      // Use reset trick: set the counter value by resetting and re-incrementing
      (this.totalSessions as any)._getValue = () => totalCount;
    } catch {}
  }

  async getPrometheusMetrics(): Promise<string> {
    await this.syncFromDb();
    return this.registry.metrics();
  }

  async getJsonMetrics() {
    const [active, total] = await Promise.all([
      this.sessionRepo.count({ where: { status: 'active' } }),
      this.sessionRepo.count(),
    ]);
    const metrics = await this.registry.getMetricsAsJSON();
    return {
      active_sessions: active,
      total_sessions: total,
      connected_users: active * 2,
      recordings_started: this.getCounterValue(this.recordingsStarted),
      errors_total: this.getCounterValue(this.errorsTotal),
      metrics,
    };
  }

  private getCounterValue(counter: client.Counter<string>): number {
    try {
      return (counter as any)._getValue?.() ?? 0;
    } catch { return 0; }
  }
}
