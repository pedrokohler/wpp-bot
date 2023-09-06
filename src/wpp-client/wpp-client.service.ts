import { Injectable, Logger } from '@nestjs/common';
import { Client, LocalAuth, Message, RemoteAuth } from 'whatsapp-web.js';
import { CommandService } from 'src/commands/command.service';
import { ConfigService } from '@nestjs/config';
import mongoose, { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { MongoStore } from 'wwebjs-mongo';

@Injectable()
export class WppClientService {
  private readonly logger = new Logger(WppClientService.name);
  public readonly client: Client;
  constructor(
    private configService: ConfigService,
    private commandService: CommandService,
    @InjectConnection() private connection: Connection,
  ) {
    const store = new MongoStore({ mongoose: { ...mongoose, connection } });
    this.client = new Client({
      authStrategy:
        configService.get<string>('NODE_ENV') !== 'production'
          ? new LocalAuth()
          : new RemoteAuth({
              store,
              backupSyncIntervalMs: 300 * 1000,
            }),
      puppeteer: {
        executablePath: configService.get<string>('PUPPETEER_EXECUTABLE_PATH'),
        args: ['--no-sandbox'],
      },
    });

    this.logger.log('Setting up client.');

    this.client.on('qr', (qrString) => {
      this.logger.log(
        ` https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          qrString,
        )}`,
      );
    });

    this.client.on('ready', () => {
      this.logger.log('Client is ready!');
    });

    this.client.on('auth_failure', (message) => {
      this.logger.error('Auth failure', message);
    });

    this.client.on('change_state', (state) => {
      this.logger.warn('State changed', state);
    });

    this.client.on('disconnected', (reason) => {
      this.logger.error('Disconnected', reason);
    });

    this.client.on('message_create', this.handleMessageCreate.bind(this));

    this.client.initialize();
  }

  private async handleMessageCreate(message: Message) {
    await this.commandService.runMessageCreatedTriggers(message);
    await this.commandService.runCommand(message);
  }

  public async onModuleDestroy() {
    this.logger.log('Destroying client.');
    await this.client.destroy();
    this.logger.log('Client destroyed.');
  }
}
