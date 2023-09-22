import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { EmailService } from '../email/email.service';
import { BRL, waitForMs } from './helpers';
import {
  blocklistPath,
  neighborhoodMapCoordinates,
  realEstateApiBaseUrl,
  realEstateClientBaseUrl,
} from './constants';
import { WppClientService } from 'src/wpp-client/wpp-client.service';
import { ME, SLEEP } from 'src/commands/command.service';

@Injectable()
export class RealEstateMonitorService {
  private logger = new Logger(RealEstateMonitorService.name);
  constructor(
    private emailService: EmailService,
    private wppService: WppClientService,
  ) {
    waitForMs(60_000).then(() => this.setContinuousPolling());
  }

  private async setContinuousPolling() {
    try {
      await this.pollFromClient();
      const intervalInSeconds = 60 * Math.random() + 60;
      await waitForMs(1000 * intervalInSeconds);
    } catch (e) {
      this.logger.error(`An error ocurred while polling: ${e.message}`);
      this.emailService
        .sendEmail({
          title: 'An error ocurred in your application',
          body: `Time: ${new Date().toTimeString()}
        ${e.message}
        ${JSON.stringify(e, null, 2)}
        `,
        })
        .catch((error) =>
          this.logger.error(
            `Error while notifying application error: ${error.message}`,
          ),
        );
    } finally {
      this.setContinuousPolling();
    }
  }

  private async notifyAll(newOpportunities) {
    const notificationTitle = `${
      newOpportunities.length
    } nova(s) oportunidade(s) encontrada(s) - ${Date.now()}`;

    const notificationBody = newOpportunities
      .reduce(
        (currentDescription, opportunity) =>
          `${currentDescription}${opportunity.description}\n\n`,
        '',
      )
      .trim();

    this.logger.log('Sending notifications...');
    await Promise.all([
      ...[SLEEP, ME].map(async (chatId) => {
        await this.wppService.sendMessage({
          chatId,
          content: `*Nova(s) oportunidade(s) encontrada(s):*\n        ${notificationBody}`,
        });
        const chat = await this.wppService.client.getChatById(chatId);
        await chat.markUnread();
      }),
      this.emailService.sendEmail({
        title: notificationTitle,
        body: `        ${notificationBody}`,
      }),
    ]);
  }

  private async pollFromClient() {
    this.logger.log('Started polling...');
    this.logger.log(`Fetching blocklist...`);
    const blocklist = await this.getBlockList();
    const newOpportunities = await this.checkNewOpportunities(blocklist);

    if (newOpportunities.length > 0) {
      await this.notifyAll(newOpportunities);

      this.logger.log(`Saving blocklist...`);
      await this.saveBlockList([
        ...blocklist,
        ...newOpportunities.map((opportunity) => opportunity.id),
      ]);
    } else {
      this.logger.log('No opportunities found.');
    }

    this.logger.log('Done!');
  }

  private extractResults(apiResponse: any) {
    const hits = apiResponse.hits.hits;
    return hits.map((hit) => {
      const source = hit._source;
      source.url = `${realEstateClientBaseUrl}/imovel/${source.id}/alugar/`;
      source.description = `
        ${source.type.toUpperCase()} de ${source.area}m²
        ${source.bedrooms} quartos
        ${source.bathrooms} banheiros
        ${source.parkingSpaces} vagas ${
          source.isFurnished ? '\n        Mobiliado' : ''
        }
        ${
          source.visitStatus === 'ACCEPT_NEW'
            ? 'DISPONÍVEL para visitas'
            : source.visitStatus
        } na ${source.address}, ${source.regionName} - ${source.city}.
        Preço total: ${BRL.format(source.totalCost)}
        Aluguel: ${BRL.format(source.rent)}
        IPTU + condomínio: ${BRL.format(source.iptuPlusCondominium)}
        Link: ${source.url}
      `;
      delete source.visitStatus;
      delete source.city;
      return source;
    });
  }

  async checkNewOpportunities(blocklist: string[]) {
    const neighborhoodsOfInterest = [
      'São Pedro',
      'Savassi',
      'Funcionários',
      'Sion',
      'Carmo',
      'Santo Antônio',
      'Santa Efigênia',
      'Cidade Nova',
      'Floresta',
      'Prado',
    ];

    const updatedBlocklist = [...blocklist];
    const results = [];

    for (const neighborhood of neighborhoodsOfInterest) {
      this.logger.log(`Polling for ${neighborhood}...`);
      const response = await this.fetchRealEstateOpportunities(
        neighborhood,
        updatedBlocklist,
      );

      const neighborhoodResults = this.extractResults(response);

      neighborhoodResults.forEach((result) => {
        this.logger.log(`Found ${result.id}`);
        results.push(result);
        updatedBlocklist.push(result.id);
      });

      const interval = 5000 * Math.random();
      await waitForMs(interval);
    }

    return results;
  }

  async saveBlockList(ids: string[]) {
    await fs.writeFile(blocklistPath, JSON.stringify(ids, undefined, 2), {
      encoding: 'utf-8',
    });
  }

  async getBlockList(): Promise<string[]> {
    try {
      const results = await fs.readFile(blocklistPath, { encoding: 'utf-8' });
      return JSON.parse(results);
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  async fetchRealEstateOpportunities(
    neighborhood: string,
    blocklist: string[],
  ) {
    const route = `${realEstateApiBaseUrl}/yellow-pages/v2/search?photos=12&relax_query=false`;

    const response = await fetch(route, {
      method: 'POST',
      body: JSON.stringify({
        filters: {
          availability: 'any',
          occupancy: 'any',
          blocklist,
          area: {
            max_area: 5000,
            min_area: 70,
          },
          cost: {
            cost_type: 'rent',
            max_value: 4600,
            min_value: 1000,
          },
          min_bathrooms: 2,
          min_bedrooms: 2,
          min_parking_spaces: 1,
          country_code: 'BR',
          keyword_match: [
            `neighborhood:${neighborhood}`,
            `city:Belo Horizonte`,
          ],
          map: neighborhoodMapCoordinates[neighborhood],
          sorting: {
            criteria: 'relevance_rent',
            order: 'desc',
          },
          page_size: 11,
          offset: 0,
        },
        return: [
          'id',
          'rent',
          'totalCost',
          'iptuPlusCondominium',
          'area',
          'address',
          'regionName',
          'city',
          'visitStatus',
          'activeSpecialConditions',
          'type',
          'forRent',
          'bedrooms',
          'parkingSpaces',
          'listingTags',
          'yield',
          'yieldStrategy',
          'neighbourhood',
          'categories',
          'bathrooms',
          'isFurnished',
          'installations',
        ],
        business_context: 'RENT',
        relax_query: false,
        force_raw_search: false,
        search_query_context: 'neighborhood',
      }),
    });

    const jsonData = await response.json();

    if (!response.ok) {
      this.logger.error(
        `Request failed. ${response.status}: ${response.statusText}`,
      );
      this.logger.error(jsonData);
    }

    return jsonData;
  }
}
