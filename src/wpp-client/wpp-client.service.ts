import { Injectable, Logger } from '@nestjs/common';
import {
  Client,
  LocalAuth,
  Message,
  RemoteAuth,
  WAState,
} from 'whatsapp-web.js';
import { CommandService, ME } from 'src/commands/command.service';
import { ConfigService } from '@nestjs/config';
import mongoose, { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { MongoStore } from 'wwebjs-mongo';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class WppClientService {
  private readonly logger = new Logger(WppClientService.name);
  public client: Client;
  public intervalRef;
  constructor(
    private configService: ConfigService,
    private commandService: CommandService,
    private emailService: EmailService,
    @InjectConnection() private connection: Connection,
  ) {
    this.initializeClient();
  }

  private async handleMessageCreate(message: Message) {
    await this.commandService.runMessageCreatedTriggers(message, this.client);
    await this.commandService.runCommand(message, this.client);
  }

  public async sendMessage({ chatId, content }) {
    await this.client.sendMessage(chatId, content, { sendSeen: false });
  }

  public async onModuleDestroy() {
    this.logger.log('Destroying client.');
    await this.client.destroy();
    this.logger.log('Client destroyed.');
  }

  private async isClientOnline() {
    try {
      const contactId = ME;
      const contact = await this.client.getContactById(contactId);

      if (contact.isMe && contact.isUser) {
        this.logger.log('The client is running fine...');
      }
    } catch (error) {
      clearInterval(this.intervalRef);
      this.logger.error(`The client is down. Killing process...`);
      process.exit(1);
    }
  }

  // Export a function to start the polling interval.
  private startPolling() {
    clearInterval(this.intervalRef);
    const intervalInMilliseconds = 5000; // 20 minutes i.e. 20 minutes * 60 seconds * 1000 milliseconds
    this.intervalRef = setInterval(() => {
      this.isClientOnline();
    }, intervalInMilliseconds);
  }

  private initializeClient() {
    this.logger.log(
      `PUPPETEER_EXECUTABLE_PATH: ${this.configService.get<string>(
        'PUPPETEER_EXECUTABLE_PATH',
      )}`,
    );
    const store = new MongoStore({
      mongoose: { ...mongoose, connection: this.connection },
    });
    this.client = new Client({
      authStrategy:
        this.configService.get<string>('NODE_ENV') !== 'production'
          ? new LocalAuth()
          : new RemoteAuth({
              store,
              backupSyncIntervalMs: 300 * 1000,
            }),
      puppeteer: {
        executablePath: this.configService.get<string>(
          'PUPPETEER_EXECUTABLE_PATH',
        ),
        args: ['--no-sandbox'],
        // headless: false,
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
      this.startPolling();
      this.logger.log('Client is ready!');
      this.commandService.notifyBotStatus({
        client: this.client,
        status: WAState.CONNECTED,
        message: 'Bot is ready.',
      });
    });

    this.client.on('auth_failure', (message) => {
      this.logger.error('Auth failure', message);
      this.commandService.notifyBotStatus({
        client: this.client,
        status: WAState.UNLAUNCHED,
        message: `${message} at ${new Date().toTimeString()}`,
      });
    });

    this.client.on('change_state', (state) => {
      this.logger.warn('State changed', state);
    });

    this.client.on('disconnected', (reason) => {
      this.logger.error('Disconnected', reason);
      this.emailService
        .sendEmail({
          title: 'Bot disconnected',
          body: `Your bot was disconnected from whatsapp because of ${reason}`,
        })
        .catch((e) => this.logger.error(`Failed to send email: ${e.message}`));
      this.commandService
        .notifyBotStatus({
          client: this.client,
          status: WAState.UNPAIRED,
          message: `Bot disconnected ${new Date().toTimeString()}.`,
        })
        .catch((e) =>
          this.logger.error(
            `Failed to send whatsapp notification: ${e.message}`,
          ),
        );
    });

    this.client.on('message_create', this.handleMessageCreate.bind(this));

    this.client.initialize();
  }
}
