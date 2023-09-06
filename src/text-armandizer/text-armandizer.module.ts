import { Module } from '@nestjs/common';
import { TextArmandizerService } from './text-armandizer.service';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [UtilsModule],
  exports: [TextArmandizerService],
  controllers: [],
  providers: [TextArmandizerService],
})
export class TextArmandizerModule {}
