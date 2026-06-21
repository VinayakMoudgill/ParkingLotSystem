import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow any origin in production (e.g. Vercel frontend → Railway backend).
  // Restrict to specific origins in a real production app via CORS_ORIGINS env.
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : true; // true = allow all origins
  app.enableCors({ origin: corsOrigins });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Host platforms (Render, Railway, etc.) inject the port via process.env.PORT
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Parking Lot System is running on port ${port}`);
}

bootstrap();
