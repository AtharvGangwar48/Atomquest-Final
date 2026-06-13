import 'dotenv/config';

// Ensure JWT_SECRET is set before modules load
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
  console.log('⚠️ JWT_SECRET not in .env, using default');
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'http://localhost:3000',
      process.env.FRONTEND_URL,
      /\.vercel\.app$/,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.useGlobalPipes(new ValidationPipe());
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 SupportVision backend running on http://localhost:${port}`);
}

bootstrap();
