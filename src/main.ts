import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/fitlers/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT') ?? 3000);
  const clientUrl = configService.get<string>('CLIENT_URL');

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: clientUrl || [
      'http://localhost:5173',
      'http://192.168.0.2:5173',
      'http://172.31.64.1:5173',
    ],
    credentials: true,
  });

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Sport Field Booking API')
    .setDescription('API for Sport Field Booking')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  console.log('✅ Server is logging on port', port);
  console.log('📃 API docs url:', `http://localhost:${port}/api/docs`);
}
bootstrap();
