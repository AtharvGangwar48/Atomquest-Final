import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../entities/session.entity';
import { SessionEvent } from '../entities/session-event.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Session, SessionEvent])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
