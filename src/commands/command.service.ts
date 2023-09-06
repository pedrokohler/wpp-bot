import { Injectable, Logger } from '@nestjs/common';
import { AudioTranscriptionService } from 'src/audio-transcription/audio-transcription.service';
import { TextArmandizerService } from 'src/text-armandizer/text-armandizer.service';
import { Chat, Contact, Message, MessageTypes } from 'whatsapp-web.js';

const ME = '553197131929@c.us';
// const RAFA = '5511916227172@c.us';
// const GUGA = '553175559189@c.us';
// const PENO = '553197011329@c.us';
const CHAIRS = '553196295683@c.us';
const GIGA = '553198708663@c.us';
const SLEEP = '553192264220-1570192011@g.us';
// const LIB_DEVS = '5511989784605-1570726812@g.us';
const BRUXAO = '553175733236-1578264676@g.us';
// const MINHA_CONVERSA = '553197131929-1529539375@g.us';
const EVERY_MONDAY = '120363026953756950@g.us';
const CUIDADOS_VO = '120363045186217095@g.us';
const FAMILIA_MARRA = '553184853596-1424691550@g.us';
const SINAIS = '5511989929646-1576764335@g.us';

const wait = (ms) =>
  new Promise((resolve) => setTimeout(() => resolve(null), ms));

@Injectable()
export class CommandService {
  private logger = new Logger(CommandService.name);
  constructor(
    private textArmandizerService: TextArmandizerService,
    private audioTranscriptionService: AudioTranscriptionService,
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

  public async runCommand(message: Message): Promise<void> {
    const commandFn = this.getCommandFunction(message);
    if (!commandFn) return;
    try {
      await message.react('✅');
      await commandFn(message);
    } catch (e) {
      await message.react('❌');
      await message.reply(`An error ocurred: ${e.message}`);
    }
  }

  public async logMessageInfo({
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

  public async runMessageCreatedTriggers(message: Message) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();

      this.logMessageInfo({ message, chat, contact });

      this.reactWithEmojis({
        person: GIGA,
        name: 'GIGA',
        reactions: ['🔁', '🕊️'],
        message,
        delayBetweenReactions: 500,
      });

      this.reactWithEmojis({
        person: CHAIRS,
        name: 'CHAIRS',
        reactions: ['🪑'],
        message,
        delayBetweenReactions: 1,
      });

      this.autoTranscribePrivateAudios({ message, chat, contact });
      this.autoTranscribeWhitelistedGroupAudios({ message, chat, contact });
    } catch (e) {
      this.logger.error(e);
    }
  }

  private async autoTranscribePrivateAudios({
    message,
    contact,
    chat,
  }: {
    message: Message;
    contact: Contact;
    chat: Chat;
  }) {
    if (
      chat.id.user === contact.id.user &&
      [MessageTypes.AUDIO, MessageTypes.VOICE].includes(message.type)
    ) {
      const transcription = await this.transcribeAudio(message);
      message.reply(`*Transcrição automática:* ${transcription}`, undefined, {
        sendSeen: false,
      });
    }
  }

  private async autoTranscribeWhitelistedGroupAudios({
    message,
    // contact,
    chat,
  }: {
    message: Message;
    contact: Contact;
    chat: Chat;
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
      message.reply(`*Transcrição automática:* ${transcription}`, undefined, {
        sendSeen: false,
      });
    }
  }

  // private replyToPersonMessages({
  //   person,
  //   name,
  //   response,
  //   message,
  // }: {
  //   person: string;
  //   name?: string;
  //   response: string;
  //   message: Message;
  // }) {
  //   if (this.isMessageSender({ person, message })) {
  //     this.logger.log(`Responding to ${name}`);
  //     message.reply(response, undefined, { sendSeen: false });
  //   }
  // }

  private async reactWithEmojis({
    person,
    name,
    reactions,
    message,
    delayBetweenReactions,
  }: {
    person: string;
    name?: string;
    reactions: string[];
    message: Message;
    delayBetweenReactions: number;
  }) {
    if (this.isMessageSender({ person, message })) {
      this.logger.log(`Reacting to ${name}`);
      for (let i = 0; i < reactions.length; i++) {
        await message.react(reactions[i]);
        await wait(delayBetweenReactions);
      }
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

  private pingCommand(message: Message) {
    const delay = (Date.now() / 1000 - message.timestamp + 500) * 1000;
    message.reply(`pong took approximately ${delay.toFixed(0)}ms ± 500ms`);
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

    message.reply(processedText);
  }

  private async createStickerCommand(message: Message) {
    const validTypes = [
      MessageTypes.IMAGE,
      MessageTypes.STICKER,
      MessageTypes.VIDEO,
    ];
    const targetMessage = await this.getTargetMessage(message);

    if (!validTypes.includes(targetMessage.type)) {
      throw new Error(`Invalid message type "${targetMessage.type}"`);
    }

    targetMessage.reply(undefined, undefined, {
      sendMediaAsSticker: true,
      media: await targetMessage.downloadMedia(),
    });
  }

  private async transcribeAudio(message: Message) {
    const audio = await message.downloadMedia();

    const transcription = await this.audioTranscriptionService.transcribeFile(
      audio.data,
    );

    return transcription;
  }

  private async transcribeAudioCommand(message: Message) {
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

    const quotedMessage = await message.getQuotedMessage();

    if (!validTypes.includes(quotedMessage.type)) {
      throw new Error(
        `Invalid message type "${quotedMessage.type}". Message must be an audio.`,
      );
    }

    const transcription = await this.transcribeAudio(quotedMessage);

    message.reply(transcription);
  }
}
