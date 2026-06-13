import { Controller, Post, Get, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionService } from './session.service';
import { PresenceService } from '../presence/presence.service';

@Controller('sessions')
export class SessionController {
  constructor(
    private sessionService: SessionService,
    private presenceService: PresenceService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createSession(@Req() req) {
    try {
      console.log('Creating session for user:', req.user.id);
      const result = await this.sessionService.createSession(req.user.id);
      console.log('Session created successfully:', result);
      return result;
    } catch (err) {
      console.error('Create session error:', err.message, err.stack);
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  joinSession(@Body('token') token: string, @Req() req) {
    return this.sessionService.joinSession(token, req.user.id, req.user.name);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/end')
  endSession(@Param('id') id: string, @Req() req) {
    return this.sessionService.endSession(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(@Req() req) {
    return this.sessionService.getSessionHistory(req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getSession(@Param('id') id: string) {
    return this.sessionService.getSession(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/agent-join')
  agentJoin(@Param('id') id: string, @Req() req) {
    return this.sessionService.agentJoin(id, req.user.id, req.user.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return this.presenceService.getParticipants(id);
  }
}
