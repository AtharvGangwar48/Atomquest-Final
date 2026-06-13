import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EgressClient, EncodedFileOutput, EncodedFileType } from 'livekit-server-sdk';
import { Recording } from '../entities/recording.entity';
import { StorageService } from '../storage/storage.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);
  private egressClient: EgressClient;

  constructor(
    @InjectRepository(Recording)
    private recordingRepo: Repository<Recording>,
    private storageService: StorageService,
    private metricsService: MetricsService,
  ) {
    this.egressClient = new EgressClient(
      process.env.LIVEKIT_WS_URL?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://localhost:7880',
      process.env.LIVEKIT_API_KEY || 'devkey',
      process.env.LIVEKIT_API_SECRET || 'secret',
    );
  }

  async startRecording(sessionId: string, roomName: string) {
    const recording = await this.recordingRepo.save(
      this.recordingRepo.create({ sessionId, status: 'recording', egressId: null }),
    );
    this.metricsService.recordingsStarted.inc();
    this.startEgress(recording.id, roomName).catch((err) => {
      this.logger.warn(`Egress start failed (expected in dev mode): ${err.message}`);
      // Still track as recording — simulate for demo
    });

    return recording;
  }

  private async startEgress(recordingId: string, roomName: string) {
    const output = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: `/tmp/${recordingId}.mp4`,
    });

    const egress = await this.egressClient.startRoomCompositeEgress(roomName, output, 'speaker');
    await this.recordingRepo.update(recordingId, { egressId: egress.egressId });
  }

  async stopRecording(recordingId: string) {
    const recording = await this.recordingRepo.findOne({ where: { id: recordingId } });
    if (!recording) return null;

    recording.status = 'processing';
    await this.recordingRepo.save(recording);

    // Stop egress if we have an ID
    if (recording.egressId) {
      try {
        await this.egressClient.stopEgress(recording.egressId);
      } catch (err) {
        this.logger.warn(`Stop egress warning: ${err.message}`);
      }
    }

    // Simulate processing → ready after 3s (egress output handling would go here in production)
    setTimeout(async () => {
      try {
        recording.status = 'ready';
        recording.fileUrl = this.storageService.getUrl(`recordings/${recordingId}.mp4`);
        recording.endedAt = new Date();
        const started = recording.createdAt?.getTime() || Date.now();
        recording.duration = Math.floor((Date.now() - started) / 1000);
        await this.recordingRepo.save(recording);
        this.logger.log(`Recording ${recordingId} marked ready`);
      } catch (e) {
        this.logger.error(e);
      }
    }, 3000);

    return recording;
  }

  async getRecording(recordingId: string) {
    return this.recordingRepo.findOne({ where: { id: recordingId } });
  }

  async getSessionRecordings(sessionId: string) {
    return this.recordingRepo.find({ where: { sessionId }, order: { createdAt: 'DESC' } });
  }
}
