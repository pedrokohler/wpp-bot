import { Injectable } from '@nestjs/common';
import { WppClientService } from './wpp-client/wpp-client.service';

@Injectable()
export class AppService {
  constructor(private wppClientService: WppClientService) {}
  getHello(): any {
    return this.wppClientService.client.getChats();
  }
}
