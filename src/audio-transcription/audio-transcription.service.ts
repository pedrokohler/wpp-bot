import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as FfmpegCommand from 'fluent-ffmpeg';
import { writeFile, unlink } from 'node:fs/promises';
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
// import speech, { v2 } from '@google-cloud/speech';

@Injectable()
export class AudioTranscriptionService {
  private readonly client: OpenAI;
  private readonly dir: string;
  constructor(private configService: ConfigService) {
    this.dir = `${__dirname}/temp_files`;
    this.client = new OpenAI({
      apiKey: configService.get<string>('OPEN_AI_SECRET_KEY'),
    });

    if (!existsSync(this.dir)) {
      mkdirSync(this.dir);
    }
  }

  public async transcribeFile(fileString: string) {
    const seed = Date.now();
    const outFilePath = `${this.dir}/tmp_out_${seed}.mp3`;
    const inFilePath = `${this.dir}/tmp_in_${seed}.opus`;

    await this.writeMp3File({ fileString, outFilePath, inFilePath });

    try {
      const response = await this.client.audio.transcriptions.create({
        file: createReadStream(outFilePath),
        model: 'whisper-1',
        response_format: 'verbose_json',
      });

      await this.cleanUp({ inFilePath, outFilePath });
      return response.text;
    } catch (e) {
      await this.cleanUp({ inFilePath, outFilePath });
      throw e;
    }
  }

  private async cleanUp({
    inFilePath,
    outFilePath,
  }: {
    inFilePath: string;
    outFilePath: string;
  }) {
    await unlink(outFilePath);
    await unlink(inFilePath);
  }

  private async writeMp3File({
    fileString,
    inFilePath,
    outFilePath,
  }: {
    fileString: string;
    inFilePath: string;
    outFilePath: string;
  }) {
    const buffer = Buffer.from(fileString, 'base64');
    await writeFile(inFilePath, buffer);

    return new Promise((resolve, reject) =>
      FfmpegCommand(inFilePath)
        .output(outFilePath)
        .saveToFile(outFilePath)
        .on('end', () => {
          resolve(outFilePath);
        })
        .on('error', (e) => {
          reject(e);
        }),
    );
  }
}
