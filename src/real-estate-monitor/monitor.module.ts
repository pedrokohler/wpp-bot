import { Module } from '@nestjs/common';
import { RealEstateMonitorService } from './monitor.service';
import { EmailModule } from '../email/email.module';
import { WppClientModule } from 'src/wpp-client/wpp-client.module';

@Module({
  imports: [EmailModule, WppClientModule],
  providers: [RealEstateMonitorService],
})
export class RealEstateMonitorModule {}
