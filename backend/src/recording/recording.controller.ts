import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecordingService } from './recording.service';
import { SessionService } from '../session/session.service';

@Controller('recordings')
export class RecordingController {
  constructor(
    private recordingService: RecordingService,
    private sessionService: SessionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('start')
  async startRecording(@Body('sessionId') sessionId: string) {
    const session = await this.sessionService.getSession(sessionId);
    return this.recordingService.startRecording(sessionId, session?.roomName || '');
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/stop')
  stopRecording(@Param('id') id: string) {
    return this.recordingService.stopRecording(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getRecording(@Param('id') id: string) {
    return this.recordingService.getRecording(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session/:sessionId')
  getSessionRecordings(@Param('sessionId') sessionId: string) {
    return this.recordingService.getSessionRecordings(sessionId);
  }
}
