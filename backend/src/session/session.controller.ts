import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
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
    return this.sessionService.createSession(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  async joinSession(@Body() body: { token: string }, @Req() req) {
    if (!body.token) {
      throw new Error('Token required');
    }
    return this.sessionService.joinSession(body.token, req.user.id, req.user.name);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/end')
  async endSession(@Param('id') id: string, @Req() req) {
    return this.sessionService.endSession(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@Req() req) {
    return this.sessionService.getSessionHistory(req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getSession(@Param('id') id: string) {
    return this.sessionService.getSession(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/agent-join')
  async agentJoin(@Param('id') id: string, @Req() req) {
    return this.sessionService.agentJoin(id, req.user.id, req.user.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/participants')
  async getParticipants(@Param('id') id: string) {
    return this.presenceService.getParticipants(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('agent/customers')
  async getAgentCustomers(@Req() req) {
    return this.sessionService.getAgentCustomers(req.user.id);
  }
}
