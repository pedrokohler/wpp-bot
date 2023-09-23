import { Injectable, Logger } from '@nestjs/common';
import * as ytdl from 'ytdl-core';
import { unlink } from 'node:fs/promises';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { getBasicInfo } from 'ytdl-core';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly dir: string;
  constructor(private configService: ConfigService) {
    this.dir = `${__dirname}/temp_files`;

    if (!existsSync(this.dir)) {
      mkdirSync(this.dir);
    }
  }

  public async downloadVideo(url) {
    const seed = Date.now();
    const outFilePath = `${this.dir}/tmp_out_${seed}.mp4`;

    return new Promise((resolve, reject) => {
      const download = ytdl(url, {
        quality: '18',
      }).pipe(createWriteStream(outFilePath));

      download.once('close', () => {
        resolve(outFilePath);
      });

      download.once('error', (err) => {
        reject(err);
      });
    });
  }

  public async deleteVideo(path) {
    await unlink(path);
  }

  public async getVideoInfo(url) {
    const info = await getBasicInfo(url);
    return info;
  }
}
