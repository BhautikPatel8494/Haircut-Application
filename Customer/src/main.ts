import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { MainModule } from './main.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MainModule);
  app.useGlobalPipes(
    new ValidationPipe(),
  );
  await app.listen(3000, () => {
    console.log(`Listen In 3000`)
  });
}
bootstrap();
