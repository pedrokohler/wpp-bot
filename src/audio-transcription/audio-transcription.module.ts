import { Module } from '@nestjs/common';
import { AudioTranscriptionService } from './audio-transcription.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  exports: [AudioTranscriptionService],
  providers: [AudioTranscriptionService],
})
export class AudioTranscriptionModule {}
