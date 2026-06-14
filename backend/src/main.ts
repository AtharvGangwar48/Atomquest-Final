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
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      const allowed = [
        'http://localhost:3000',
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      // Allow any vercel.app subdomain
      if (
        allowed.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /\.render\.com$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Open CORS for hackathon demo — restrict in production
    },
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
