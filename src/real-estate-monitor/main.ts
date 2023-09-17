import { NestFactory } from '@nestjs/core';
import { RealEstateMonitorModule } from './monitor.module';

async function bootstrap() {
  const app = await NestFactory.create(RealEstateMonitorModule);
  await app.listen(3000);
}
bootstrap();
