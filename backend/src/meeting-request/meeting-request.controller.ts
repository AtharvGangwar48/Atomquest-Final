import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MeetingRequestService } from './meeting-request.service';

@Controller('meeting-requests')
@UseGuards(JwtAuthGuard)
export class MeetingRequestController {
  constructor(private service: MeetingRequestService) {}

  @Post()
  create(@Req() req, @Body() body: { topic: string; description?: string; preferredTime: string }) {
    return this.service.create(req.user.id, body.topic, body.description || '', new Date(body.preferredTime));
  }

  @Get('my')
  getMine(@Req() req) {
    return this.service.getByCustomer(req.user.id);
  }

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'approved' | 'rejected'; adminNote?: string }) {
    return this.service.updateStatus(id, body.status, body.adminNote);
  }
}
