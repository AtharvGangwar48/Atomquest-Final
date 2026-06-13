import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEvent } from '../entities/session-event.entity';
import { PresenceService } from './presence.service';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEvent])],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
