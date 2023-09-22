import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AudioTranscriptionService } from 'src/audio-transcription/audio-transcription.service';
import { TextArmandizerService } from 'src/text-armandizer/text-armandizer.service';
import {
  Chat,
  Client,
  Contact,
  Message,
  MessageContent,
  MessageSendOptions,
  MessageTypes,
  WAState,
} from 'whatsapp-web.js';

export const ME = '553197131929@c.us';
// const RAFA = '5511916227172@c.us';
// const GUGA = '553175559189@c.us';
// const PENO = '553197011329@c.us';
// const CHAIRS = '553196295683@c.us';
// const GIGA = '553198708663@c.us';
// const CONTADOR_ANCAP = '553192960772@c.us';
// const COLOMBIA = '553198648535@c.us';

export const CO_WORKING = '120363030514613873@g.us';
const BOT_STATUS = '120363153213988815@g.us';
const VIEW_ONCE = '120363152979623961@g.us';
export const SLEEP = '553192264220-1570192011@g.us';
// const LIB_DEVS = '5511989784605-1570726812@g.us';
const BRUXAO = '553175733236-1578264676@g.us';
// const MINHA_CONVERSA = '553197131929-1529539375@g.us';
const EVERY_MONDAY = '120363026953756950@g.us';
const CUIDADOS_VO = '120363045186217095@g.us';
const FAMILIA_MARRA = '553184853596-1424691550@g.us';
const SINAIS = '5511989929646-1576764335@g.us';
// const CHESS_1e4 = '120363045419364334@g.us';

// const wait = (ms) =>
//   new Promise((resolve) => setTimeout(() => resolve(null), ms));

const isViewOnce = (message: Message) =>
  ((message.rawData as any).isViewOnce as boolean) || false;

@Injectable()
export class CommandService {
  private logger = new Logger(CommandService.name);
  constructor(
    private textArmandizerService: TextArmandizerService,
    private audioTranscriptionService: AudioTranscriptionService,
    private configService: ConfigService,
  ) {}

  private getCommandFunction(message: Message) {
    const commandMap = new Map([
      [['ping'], this.pingCommand.bind(this)],
      [['armandize', 'a'], this.armandizeCommand.bind(this)],
      [['sticker', 's'], this.createStickerCommand.bind(this)],
      [['transcribe', 't'], this.transcribeAudioCommand.bind(this)],
    ]);

    const matchingCommand = Array.from(commandMap.keys()).find((aliases) => {
      return aliases.some((alias) => {
        return this.checkMatchingAlias({ message, alias });
      });
    });
    this.sanitizeMessageBody({ message, matchingCommand });
    return commandMap.get(matchingCommand)?.bind(this);
  }

  public async runCommand(message: Message, client: Client): Promise<void> {
    const commandFn = this.getCommandFunction(message);
    if (!commandFn) return;
    const chat = await message.getChat();
    try {
      await message.react('✅');
      await commandFn(message, client);
    } catch (e) {
      message
        .react('❌')
        .catch((e) =>
          this.logger.error(`Failed to react to message: ${e.message}`),
        );
      await this.safeReplyToMessage({
        message,
        client,
        replyArgs: {
          content: `An error ocurred: ${e.message}`,
          chatId: chat.id._serialized,
          options: {
            sendSeen: false,
          },
        },
      });
    }
  }

  public logMessageInfo({
    message,
    contact,
    chat,
  }: {
    message: Message;
    contact: Contact;
    chat: Chat;
  }) {
    this.logger.log('Message received');
    this.logger.log(
      `FROM: ${this.getContactName(contact)} (${
        message.author
      }) IN: ${this.getChatName(chat)} (${message.from})`,
    );
    this.logger.log(`TYPE: ${message.type}`);
    this.logger.log(`BODY: ${message.body}`);
  }

  public async runMessageCreatedTriggers(message: Message, client: Client) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();

      this.logMessageInfo({ message, chat, contact });
      await this.autoTranscribePrivateAudios({
        message,
        chat,
        contact,
        client,
      });
      await this.autoTranscribeWhitelistedGroupAudios({
        message,
        chat,
        contact,
        client,
      });
      await this.forwardViewOnceMedia({ message, client });
    } catch (e) {
      this.logger.error(e);
    }
  }

  private async forwardViewOnceMedia({
    message,
    client,
  }: {
    message: Message;
    client: Client;
  }) {
    if (isViewOnce(message)) {
      const chat = await client.getChatById(VIEW_ONCE);
      const media = await message.downloadMedia();
      await chat.sendMessage(media);
      await chat.markUnread();
    }
  }

  public async notifyBotStatus({
    client,
    status,
    message,
  }: {
    client: Client;
    status: WAState;
    message: string;
  }) {
    const emoji = status !== WAState.CONNECTED ? '❌' : '✅';
    const chat = await client.getChatById(BOT_STATUS);
    await chat.sendMessage(
      `${emoji} ${message} (env: ${this.configService.get<string>(
        'NODE_ENV',
      )})`,
    );
    await chat.markUnread();
  }

  private async autoTranscribePrivateAudios({
    message,
    contact,
    chat,
    client,
  }: {
    message: Message;
    contact: Contact;
    chat: Chat;
    client: Client;
  }) {
    if (
      chat.id.user === contact.id.user &&
      [MessageTypes.AUDIO, MessageTypes.VOICE].includes(message.type)
    ) {
      const transcription = await this.transcribeAudio(message);

      await this.safeReplyToMessage({
        message,
        client,
        replyArgs: {
          content: `*Transcrição automática:* ${transcription}`,
          chatId: chat.id._serialized,
          options: {
            sendSeen: false,
          },
        },
      });
    }
  }

  private async safeReplyToMessage({
    message,
    client,
    replyArgs,
  }: {
    message: Message;
    client: Client;
    replyArgs: {
      content?: MessageContent;
      chatId: string;
      options?: MessageSendOptions;
    };
  }) {
    const { chatId, content, options } = replyArgs;

    try {
      const originalMessage = await client.getMessageById(
        message.id._serialized,
      );

      this.logger.log(`The original message still exists`);
      await originalMessage.reply(content, chatId, options);
      return;
    } catch (error) {
      this.logger.error(error);
      this.logger.log(
        `Couldn't reply to original message. Replying to chat instead.`,
      );
      await client.sendMessage(
        chatId,
        `*AVISO:* A mensagem de ${message.from} que gerou a *resposta automática* abaixo não foi encontrada para que fosse marcada.`,
      );
      await client.sendMessage(chatId, content, options);
    }
  }

  private async autoTranscribeWhitelistedGroupAudios({
    message,
    // contact,
    chat,
    client,
  }: {
    message: Message;
    contact: Contact;
    chat: Chat;
    client: Client;
  }) {
    const groupWhitelist = [
      EVERY_MONDAY,
      BRUXAO,
      SLEEP,
      CUIDADOS_VO,
      FAMILIA_MARRA,
      SINAIS,
    ];
    if (
      // !this.isMessageSender({ person: ME, message }) &&
      groupWhitelist.includes(chat.id._serialized) &&
      [MessageTypes.AUDIO, MessageTypes.VOICE].includes(message.type)
    ) {
      const transcription = await this.transcribeAudio(message);

      await this.safeReplyToMessage({
        message,
        client,
        replyArgs: {
          content: `*Transcrição automática:* ${transcription}`,
          chatId: chat.id._serialized,
          options: {
            sendSeen: false,
          },
        },
      });
    }
  }

  private checkMatchingAlias({ message, alias }) {
    const regex = new RegExp(`^!${alias}(\s.*|$)`);
    return regex.test(message.body);
  }

  private sanitizeMessageBody({ message, matchingCommand }) {
    if (!matchingCommand || !message.body) return;

    const matchingAlias = matchingCommand.find((alias) =>
      this.checkMatchingAlias({ message, alias }),
    );

    message.body = message.body
      .replace(`!${matchingAlias} `, '')
      .replace(`!${matchingAlias}`, '');
  }

  private isMessageSender({ message, person }) {
    const imBeingChecked = person === ME;
    const isMessageFromMe = message.fromMe;

    return (
      message.author === person ||
      message.from === person ||
      (imBeingChecked && isMessageFromMe)
    );
  }

  private getContactName = (contact) => {
    if (contact.isMe) return 'Me';
    return contact.name || contact.pushname;
  };

  private getChatName = (chat) => {
    if (!chat.name) {
      const { user, server } = chat.id;
      return `${user}@${server}`;
    }
    return chat.name;
  };

  private async pingCommand(message: Message) {
    const delay = (Date.now() / 1000 - message.timestamp + 0.5) * 1000;
    await message.reply(
      `pong took approximately ${delay.toFixed(0)} ± 500ms`,
      undefined,
      {
        sendSeen: false,
      },
    );
  }

  private async getTargetMessage(message: Message) {
    if (message.hasQuotedMsg) {
      const quotedMessage = await message.getQuotedMessage();
      return quotedMessage;
    }

    return message;
  }

  private async armandizeCommand(message: Message) {
    const targetMessage = await this.getTargetMessage(message);

    const processedText = this.textArmandizerService.transformText(
      targetMessage.body,
    );

    await message.reply(processedText, undefined, {
      sendSeen: false,
    });
  }

  private async createStickerCommand(message: Message, client: Client) {
    const validTypes = [
      MessageTypes.IMAGE,
      MessageTypes.STICKER,
      MessageTypes.VIDEO,
    ];
    const targetMessage = await this.getTargetMessage(message);
    const chat = await targetMessage.getChat();

    if (!validTypes.includes(targetMessage.type)) {
      throw new Error(`Invalid message type "${targetMessage.type}"`);
    }

    const media = await targetMessage.downloadMedia();

    await this.safeReplyToMessage({
      message,
      client,
      replyArgs: {
        chatId: chat.id._serialized,
        options: {
          sendMediaAsSticker: true,
          sendSeen: false,
          media,
        },
      },
    });
  }

  private async transcribeAudio(message: Message) {
    const audio = await message.downloadMedia();

    const transcription = await this.audioTranscriptionService.transcribeFile(
      audio.data,
    );

    return transcription;
  }

  private async transcribeAudioCommand(message: Message, client: Client) {
    const whitelistedPeople = [ME];
    if (
      !whitelistedPeople.some((person) =>
        this.isMessageSender({ person, message }),
      )
    ) {
      throw new Error('User not authorized.');
    }

    const validTypes = [MessageTypes.AUDIO, MessageTypes.VOICE];
    if (!message.hasQuotedMsg) {
      throw new Error('You must quote a message.');
    }

    const chat = await message.getChat();
    const quotedMessage = await message.getQuotedMessage();

    if (!validTypes.includes(quotedMessage.type)) {
      throw new Error(
        `Invalid message type "${quotedMessage.type}". Message must be an audio.`,
      );
    }

    const transcription = await this.transcribeAudio(quotedMessage);

    await this.safeReplyToMessage({
      message,
      client,
      replyArgs: {
        chatId: chat.id._serialized,
        content: transcription,
        options: {
          sendSeen: false,
        },
      },
    });
  }
}
