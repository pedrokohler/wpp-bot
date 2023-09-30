import { Module } from '@nestjs/common';
import { CommandService } from './command.service';
import { TextArmandizerModule } from 'src/text-armandizer/text-armandizer.module';
import { AudioTranscriptionModule } from 'src/audio-transcription/audio-transcription.module';
import { ConfigModule } from '@nestjs/config';
import { YoutubeModule } from 'src/youtube/youtube.module';
import { ChatBotModule } from 'src/chat-bot/chat-bot.module';

@Module({
  exports: [CommandService],
  imports: [
    TextArmandizerModule,
    AudioTranscriptionModule,
    ChatBotModule,
    ConfigModule,
    YoutubeModule,
  ],
  providers: [CommandService],
})
export class CommandModule {}
