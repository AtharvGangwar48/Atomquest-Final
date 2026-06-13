import { Controller, Post, Get, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionService } from './session.service';

@Controller('sessions')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createSession(@Req() req) {
    return this.sessionService.createSession(req.user.id);
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
}
