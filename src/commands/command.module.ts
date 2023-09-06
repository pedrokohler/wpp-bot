import { Module } from '@nestjs/common';
import { CommandService } from './command.service';
import { TextArmandizerModule } from 'src/text-armandizer/text-armandizer.module';
import { AudioTranscriptionModule } from 'src/audio-transcription/audio-transcription.module';

@Module({
  exports: [CommandService],
  imports: [TextArmandizerModule, AudioTranscriptionModule],
  providers: [CommandService],
})
export class CommandModule {}
