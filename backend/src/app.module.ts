import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { ChatModule } from './chat/chat.module';
import { RecordingModule } from './recording/recording.module';
import { AdminModule } from './admin/admin.module';
import { MetricsModule } from './metrics/metrics.module';
import { PresenceModule } from './presence/presence.module';
import { StorageModule } from './storage/storage.module';
import { MeetingRequestModule } from './meeting-request/meeting-request.module';
import { NotificationModule } from './notification/notification.module';
import { ScheduledSessionModule } from './scheduled-session/scheduled-session.module';

const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for Neon connection');
    return {
      type: 'postgres' as const,
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
      extra: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
    };
  }
  return {
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'supportvision',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  };
};

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    SessionModule,
    ChatModule,
    RecordingModule,
    AdminModule,
    MetricsModule,
    PresenceModule,
    StorageModule,
    MeetingRequestModule,
    NotificationModule,
    ScheduledSessionModule,
  ],
})
export class AppModule {}
