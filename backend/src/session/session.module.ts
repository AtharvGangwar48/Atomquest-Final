import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Session } from '../entities/session.entity';
import { SessionEvent } from '../entities/session-event.entity';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { LivekitService } from './livekit.service';
import { PresenceModule } from '../presence/presence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, SessionEvent]),
    PresenceModule,
    JwtModule.register({ secret: process.env.JWT_SECRET || 'your-secret-key' }),
  ],
  controllers: [SessionController],
  providers: [SessionService, LivekitService],
  exports: [SessionService, LivekitService],
})
export class SessionModule {}
