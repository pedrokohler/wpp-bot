import { Module } from '@nestjs/common';
import { WppClientService } from './wpp-client.service';
import { CommandModule } from 'src/commands/command.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [CommandModule, ConfigModule, MongooseModule, EmailModule],
  exports: [WppClientService],
  providers: [WppClientService],
})
export class WppClientModule {}
