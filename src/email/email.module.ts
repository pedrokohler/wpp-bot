import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigurationModule } from 'src/configuration/configuration.module';

@Module({
  exports: [EmailService],
  imports: [ConfigurationModule],
  controllers: [],
  providers: [EmailService],
})
export class EmailModule {}
