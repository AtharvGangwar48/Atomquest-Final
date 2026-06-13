import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recording } from '../entities/recording.entity';

@Injectable()
export class RecordingService {
  constructor(
    @InjectRepository(Recording)
    private recordingRepo: Repository<Recording>,
  ) {}

  async startRecording(sessionId: string) {
    const recording = this.recordingRepo.create({
      sessionId,
      status: 'in_progress',
    });
    return this.recordingRepo.save(recording);
  }

  async stopRecording(recordingId: string) {
    const recording = await this.recordingRepo.findOne({ where: { id: recordingId } });
    if (!recording) return null;
    
    recording.status = 'processing';
    await this.recordingRepo.save(recording);

    setTimeout(async () => {
      recording.status = 'ready';
      recording.fileUrl = `/recordings/${recordingId}.mp4`;
      recording.duration = Math.floor(Math.random() * 600) + 60;
      await this.recordingRepo.save(recording);
    }, 5000);

    return recording;
  }

  async getRecording(recordingId: string) {
    return this.recordingRepo.findOne({ where: { id: recordingId } });
  }

  async getSessionRecordings(sessionId: string) {
    return this.recordingRepo.find({ where: { sessionId } });
  }
}
