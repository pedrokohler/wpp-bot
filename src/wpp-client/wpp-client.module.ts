import { Module } from '@nestjs/common';
import { WppClientService } from './wpp-client.service';
import { CommandModule } from 'src/commands/command.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [CommandModule, ConfigModule, MongooseModule],
  exports: [WppClientService],
  providers: [WppClientService],
})
export class WppClientModule {}
