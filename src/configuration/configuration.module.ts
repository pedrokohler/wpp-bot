import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Configuration } from './configuration.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [Configuration.envs],
      cache: true,
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigurationModule {}
