import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingRequest } from '../entities/meeting-request.entity';

@Injectable()
export class MeetingRequestService {
  constructor(
    @InjectRepository(MeetingRequest)
    private repo: Repository<MeetingRequest>,
  ) {}

  async create(customerId: string, topic: string, description: string, preferredTime: Date) {
    const req = this.repo.create({ customerId, topic, description, preferredTime });
    return this.repo.save(req);
  }

  async getByCustomer(customerId: string) {
    return this.repo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAll() {
    return this.repo.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: 'approved' | 'rejected', adminNote?: string) {
    await this.repo.update(id, { status, adminNote });
    return this.repo.findOne({ where: { id }, relations: ['customer'] });
  }
}
