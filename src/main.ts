import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allowed frontend origins — comma-separated list from env.
  // Local dev defaults to the Vite dev server; in production set CORS_ORIGINS
  // to your GitHub Pages URL, e.g. https://yourname.github.io
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());
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
