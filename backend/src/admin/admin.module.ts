import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../entities/session.entity';
import { SessionEvent } from '../entities/session-event.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { Recording } from '../entities/recording.entity';
import { User } from '../entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MeetingRequestModule } from '../meeting-request/meeting-request.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, SessionEvent, ChatMessage, Recording, User]),
    MeetingRequestModule,
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
