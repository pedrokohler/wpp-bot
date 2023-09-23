import { Module } from '@nestjs/common';
import { YoutubeService } from './youtube.service';

@Module({
  exports: [YoutubeService],
  providers: [YoutubeService],
})
export class YoutubeModule {}
