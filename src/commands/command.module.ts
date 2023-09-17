import { Module } from '@nestjs/common';
import { CommandService } from './command.service';
import { TextArmandizerModule } from 'src/text-armandizer/text-armandizer.module';
import { AudioTranscriptionModule } from 'src/audio-transcription/audio-transcription.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  exports: [CommandService],
  imports: [TextArmandizerModule, AudioTranscriptionModule, ConfigModule],
  providers: [CommandService],
})
export class CommandModule {}
