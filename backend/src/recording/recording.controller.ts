import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecordingService } from './recording.service';

@Controller('recordings')
export class RecordingController {
  constructor(private recordingService: RecordingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('start')
  startRecording(@Body('sessionId') sessionId: string) {
    return this.recordingService.startRecording(sessionId);
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
