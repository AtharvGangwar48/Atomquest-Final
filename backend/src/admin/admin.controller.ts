import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { MeetingRequestService } from '../meeting-request/meeting-request.service';
import { NotificationService } from '../notification/notification.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private meetingRequestService: MeetingRequestService,
    private notificationService: NotificationService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── Users ──────────────────────────────────────

  @Get('users')
  getUsers(@Query('role') role?: 'agent' | 'customer') {
    return this.adminService.getAllUsers(role);
  }

  @Patch('users/:id/verify')
  verifyAgent(@Param('id') id: string, @Body() body: { verified: boolean }) {
    return this.adminService.verifyAgent(id, body.verified);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ── Sessions ───────────────────────────────────

  @Post('sessions/:id/end')
  forceEndSession(@Param('id') id: string) {
    return this.adminService.forceEndSession(id);
  }

  @Get('sessions/:id/events')
  getSessionEvents(@Param('id') id: string) {
    return this.adminService.getSessionEvents(id);
  }

  // ── Meeting Requests ───────────────────────────

  @Get('meeting-requests')
  getMeetingRequests() {
    return this.meetingRequestService.getAll();
  }

  @Patch('meeting-requests/:id/status')
  updateMeetingRequest(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected'; adminNote?: string },
  ) {
    return this.meetingRequestService.updateStatus(id, body.status, body.adminNote);
  }

  // ── Notifications ──────────────────────────────

  @Post('notifications/send')
  sendNotification(
    @Req() req,
    @Body() body: { recipientIds: string[]; title: string; message: string; type?: 'info' | 'warning' | 'success' | 'meeting' },
  ) {
    return this.notificationService.send(req.user.id, body.recipientIds, body.title, body.message, body.type || 'info');
  }
}
