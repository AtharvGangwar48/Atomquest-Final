import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private service: NotificationService) {}

  // Agent sends notification to one or many customers
  @Post('send')
  send(
    @Req() req,
    @Body() body: { recipientIds: string[]; title: string; message: string; type?: 'info' | 'warning' | 'success' | 'meeting' },
  ) {
    return this.service.send(req.user.id, body.recipientIds, body.title, body.message, body.type || 'info');
  }

  // Get my notifications (customer)
  @Get()
  getMyNotifications(@Req() req) {
    return this.service.getForUser(req.user.id);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req) {
    return this.service.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req) {
    return this.service.markRead(id, req.user.id);
  }

  @Patch('mark-all-read')
  markAllRead(@Req() req) {
    return this.service.markAllRead(req.user.id);
  }
}
