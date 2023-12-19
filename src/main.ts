import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BaseApiDocumention } from './document/base.document';
import { SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CALLBACK_URL,
    credentials: true,
  });
  const documentOptions = new BaseApiDocumention().initializeOptions();
  const document = SwaggerModule.createDocument(app, documentOptions);
  SwaggerModule.setup('api/docs',app, document);
  await app.listen(3000);
}
bootstrap();

