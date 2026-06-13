import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEvent } from '../entities/session-event.entity';

const RECONNECT_TTL = 60;

@Injectable()
export class PresenceService implements OnModuleInit {
  private redis: RedisClientType;

  constructor(
    @InjectRepository(SessionEvent)
    private eventRepo: Repository<SessionEvent>,
  ) {}

  async onModuleInit() {
    try {
      this.redis = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      }) as RedisClientType;
      await this.redis.connect();
      console.log('✓ Redis connected');
    } catch (err) {
      console.warn('⚠ Redis connection failed, running without cache:', err.message);
    }
  }

  async joined(sessionId: string, userId: string, userName: string) {
    if (this.redis) {
      const key = `session:${sessionId}:participants`;
      await this.redis.hSet(key, userId, JSON.stringify({ userId, userName, status: 'joined', joinedAt: Date.now() }));
      await this.redis.del(`reconnect:${sessionId}:${userId}`);
    }
    await this.log(sessionId, 'joined', { userId, userName });
  }

  async left(sessionId: string, userId: string, userName: string) {
    if (this.redis) {
      await this.redis.hDel(`session:${sessionId}:participants`, userId);
    }
    await this.log(sessionId, 'left', { userId, userName });
  }

  async disconnected(sessionId: string, userId: string, userName: string) {
    if (this.redis) {
      await this.redis.set(`reconnect:${sessionId}:${userId}`, userName, { EX: RECONNECT_TTL });
    }
    await this.log(sessionId, 'disconnected', { userId, userName });
  }

  async isReconnecting(sessionId: string, userId: string): Promise<boolean> {
    if (!this.redis) return false;
    return (await this.redis.get(`reconnect:${sessionId}:${userId}`)) !== null;
  }

  async reconnected(sessionId: string, userId: string, userName: string) {
    if (this.redis) {
      await this.redis.del(`reconnect:${sessionId}:${userId}`);
      const key = `session:${sessionId}:participants`;
      await this.redis.hSet(key, userId, JSON.stringify({ userId, userName, status: 'joined', joinedAt: Date.now() }));
    }
    await this.log(sessionId, 'reconnected', { userId, userName });
  }

  async updateMedia(sessionId: string, userId: string, audio: boolean, video: boolean) {
    if (this.redis) {
      const key = `session:${sessionId}:participants`;
      const raw = await this.redis.hGet(key, userId);
      if (raw) {
        const data = JSON.parse(raw);
        await this.redis.hSet(key, userId, JSON.stringify({ ...data, audio, video }));
      }
    }
  }

  async getParticipants(sessionId: string) {
    if (!this.redis) return [];
    const all = await this.redis.hGetAll(`session:${sessionId}:participants`);
    return Object.values(all).map((v) => JSON.parse(v));
  }

  async log(sessionId: string, eventType: string, metadata: any) {
    const event = this.eventRepo.create({ sessionId, eventType, metadata });
    await this.eventRepo.save(event);
  }
}
