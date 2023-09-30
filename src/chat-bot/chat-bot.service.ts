import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ChatBotService {
  private readonly logger = new Logger();
  private readonly client: OpenAI;
  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: configService.get<string>('OPEN_AI_SECRET_KEY'),
    });
  }

  public async getChatResponse(
    prompt: string,
    temperature: number,
    maxTokens: number,
    model: string = 'gpt-3.5-turbo-instruct',
  ): Promise<string> {
    const response = await this.client.completions.create({
      prompt,
      temperature,
      model,
      max_tokens: maxTokens,
    });

    this.logger.warn(response);

    return response.choices[0].text;
  }
}
