import { Injectable } from '@nestjs/common';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class TextArmandizerService {
  private readonly punctuationRegex = /([.,\/#!$%\^&\*;:{}=\-_`~()\?]{1,3})/g;
  constructor(private readonly utilsService: UtilsService) {}

  private addRandomUpperCase(text) {
    const words = text.split(' ');
    const newText = words
      .map((word) => (Math.random() < 0.1 ? word.toUpperCase() : word))
      .join(' ');
    return newText;
  }

  private addRandomDoubleSpace(text) {
    const words = text.split(' ');
    const newText = words
      .map((word) => (Math.random() < 0.05 ? word + ' ' : word))
      .join(' ');
    return newText;
  }

  private addRandomQuotes(text) {
    const words = text.split(' ');
    const newText = words
      .map((word) => (Math.random() < 0.005 ? '"' + word + '"' : word))
      .join(' ');
    return newText;
  }

  private substituteQuotes(text) {
    return text
      .replace(/"/g, '"""')
      .replace(/(\w)"/g, '$1 "')
      .replace(/"(\w)/g, '" $1');
  }

  private addRandomTitleCase(text) {
    const words = text.split(' ');
    const newText = words
      .map((word) =>
        Math.random() < 0.7
          ? word.replace(/(\w)/, (v) => v.toUpperCase())
          : word,
      )
      .join(' ');
    return newText;
  }

  private addSpaceBetweenPonctuation(text) {
    return text.replace(this.punctuationRegex, ' $1 ');
  }

  private addRandomParagraph(text) {
    return text
      .split(/(?!\.{2,3})\./g)
      .map((sentence) =>
        Math.random() < 0.3 ? sentence + '.\n\n' : sentence + '.',
      )
      .join('');
  }

  private addRandomEmoji(text) {
    return text
      .split(' ')
      .map((word) => {
        const emojis = Math.random() < 0.9 ? ' 🤣🤣🤣🤣🤣 ' : ' 😏😏😏😏 ';
        return Math.random() < 0.005 ? word + emojis : word;
      })
      .join(' ');
  }

  private addRandomSpacesAtTheBeginningOfParagraph(text) {
    return text
      .split('\n\n')
      .map((paragraph, index) =>
        index > 0 && Math.random() < 0.7 && paragraph.length
          ? `            ${paragraph}`
          : paragraph,
      )
      .join('\n\n');
  }

  private addRandomEmojiWithDot(text) {
    return text
      .split('.')
      .map((word) => (Math.random() < 0.05 ? word + ' 🤣🤣🤣🤣🤣' : word))
      .join('.')
      .trim()
      .replace(/\.$/, '');
  }

  private addGymEmoji(text) {
    const numberOfEmojis = Math.floor(5 * Math.random()) + 1;
    const emojis = '🏋️‍♂️'.repeat(numberOfEmojis);
    return text.replace(/(academia)/gi, `$1 ${emojis}`);
  }

  private addPoopEmoji(text) {
    return text.replace(
      /(coc[ôo]|bosta|merda|caca|bostinha|merdinha|caquinha|cocozinho)(?=[\s,.:;"'!\?]|$)/gi,
      '$1 💩💩💩',
    );
  }

  private trimParagraphs(text) {
    return text
      .split('\n\n')
      .map((paragraph) => paragraph.trim())
      .join('\n\n');
  }

  public transformText(originalText) {
    const processText = this.utilsService.pipe(
      this.addRandomUpperCase.bind(this),
      this.addRandomQuotes.bind(this),
      this.substituteQuotes.bind(this),
      this.addRandomTitleCase.bind(this),
      this.addRandomEmoji.bind(this),
      this.addSpaceBetweenPonctuation.bind(this),
      this.addRandomDoubleSpace.bind(this),
      this.addRandomEmojiWithDot.bind(this),
      this.addGymEmoji.bind(this),
      this.addPoopEmoji.bind(this),
      this.addRandomParagraph.bind(this),
      this.trimParagraphs.bind(this),
      this.addRandomSpacesAtTheBeginningOfParagraph.bind(this),
    );

    return processText(originalText);
  }
}
