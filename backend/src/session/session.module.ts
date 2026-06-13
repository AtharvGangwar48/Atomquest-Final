import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../entities/session.entity';
import { SessionEvent } from '../entities/session-event.entity';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { LivekitService } from './livekit.service';

@Module({
  imports: [TypeOrmModule.forFeature([Session, SessionEvent])],
  controllers: [SessionController],
  providers: [SessionService, LivekitService],
  exports: [SessionService, LivekitService],
})
export class SessionModule {}
