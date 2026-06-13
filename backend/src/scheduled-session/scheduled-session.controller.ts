import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScheduledSessionService } from './scheduled-session.service';

@Controller('scheduled-sessions')
@UseGuards(JwtAuthGuard)
export class ScheduledSessionController {
  constructor(private service: ScheduledSessionService) {}

  @Post()
  create(
    @Req() req,
    @Body() body: { title: string; scheduledAt: string; description?: string; customerId?: string },
  ) {
    return this.service.create(req.user.id, body.title, new Date(body.scheduledAt), body.description, body.customerId);
  }

  @Get()
  getMyScheduled(@Req() req) {
    return this.service.getByAgent(req.user.id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req) {
    return this.service.cancel(id, req.user.id);
  }
}
