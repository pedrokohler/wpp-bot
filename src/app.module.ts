import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommandModule } from './commands/command.module';
import { TextArmandizerService } from './text-armandizer/text-armandizer.service';
import { UtilsService } from './utils/utils.service';
import { TextArmandizerModule } from './text-armandizer/text-armandizer.module';
import { UtilsModule } from './utils/utils.module';
import { WppClientModule } from './wpp-client/wpp-client.module';
import { AudioTranscriptionModule } from './audio-transcription/audio-transcription.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RealEstateMonitorModule } from './real-estate-monitor/monitor.module';

@Module({
  imports: [
    RealEstateMonitorModule,
    CommandModule,
    TextArmandizerModule,
    UtilsModule,
    WppClientModule,
    AudioTranscriptionModule,
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, TextArmandizerService, UtilsService],
})
export class AppModule {}
