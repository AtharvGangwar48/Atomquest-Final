import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private messageRepo: Repository<ChatMessage>,
  ) {}

  async saveMessage(
    sessionId: string,
    senderId: string,
    content: string,
    type: 'text' | 'file' = 'text',
    fileUrl?: string,
    mimeType?: string,
  ) {
    const message = this.messageRepo.create({ sessionId, senderId, content, type, fileUrl, mimeType });
    return this.messageRepo.save(message);
  }

  async getMessages(sessionId: string) {
    const msgs = await this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });
    return msgs.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.sender?.name || 'Unknown',
      type: m.type,
      fileUrl: m.fileUrl,
      mimeType: m.mimeType,
      createdAt: m.createdAt,
    }));
  }
}
