import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledSession } from '../entities/scheduled-session.entity';
import { ScheduledSessionController } from './scheduled-session.controller';
import { ScheduledSessionService } from './scheduled-session.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledSession])],
  controllers: [ScheduledSessionController],
  providers: [ScheduledSessionService],
  exports: [ScheduledSessionService],
})
export class ScheduledSessionModule {}
