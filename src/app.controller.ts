import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { WppClientService } from './wpp-client/wpp-client.service';

interface MessagePayload {
  content: string;
  chatId: string;
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly wppClientService: WppClientService,
  ) {}

  @Get()
  getHello(): any {
    return this.appService.getHello();
  }

  @Post('message')
  sendMessage(@Body() message: MessagePayload): any {
    return this.wppClientService.sendMessage(message);
  }
}
