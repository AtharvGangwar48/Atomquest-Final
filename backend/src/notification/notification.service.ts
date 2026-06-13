import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  async send(senderId: string, recipientIds: string[], title: string, message: string, type: Notification['type'] = 'info') {
    const notifications = recipientIds.map((recipientId) =>
      this.repo.create({ senderId, recipientId, title, message, type }),
    );
    return this.repo.save(notifications);
  }

  async getForUser(userId: string) {
    return this.repo.find({
      where: { recipientId: userId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    await this.repo.update({ id, recipientId: userId }, { isRead: true });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.repo.update({ recipientId: userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.repo.count({ where: { recipientId: userId, isRead: false } });
    return { count };
  }
}
