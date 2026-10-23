/// <reference types="node" />
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { env } from 'node:process';

declare const process: { env: Record<string, string | undefined> };

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  const allowedOrigins = (env.WEB_ORIGIN ?? 'http://localhost:5173,http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });
  await app.listen(env.PORT ?? 3000);
}

void bootstrap();
