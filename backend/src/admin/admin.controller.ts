import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/end')
  forceEndSession(@Param('id') id: string) {
    return this.adminService.forceEndSession(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions/:id/events')
  getSessionEvents(@Param('id') id: string) {
    return this.adminService.getSessionEvents(id);
  }
}
