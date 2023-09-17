import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

@Injectable()
export class EmailService {
  private emailProviderUser: string;
  private emailProviderClientId: string;
  private emailProviderClientSecret: string;
  private emailProviderRefreshToken: string;

  private emailProvider: any;
  private oAuth2Client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.emailProvider = nodemailer;
    this.emailProviderUser = this.configService.get('email.provider.user');
    this.emailProviderClientId = this.configService.get(
      'email.provider.client.id',
    );
    this.emailProviderClientSecret = this.configService.get(
      'email.provider.client.secret',
    );
    this.emailProviderRefreshToken = this.configService.get(
      'email.provider.client.refreshToken',
    );
    this.oAuth2Client = new google.auth.OAuth2({
      clientId: this.emailProviderClientId,
      clientSecret: this.emailProviderClientSecret,
      redirectUri: 'https://developers.google.com/oauthplayground',
    });

    this.oAuth2Client.setCredentials({
      refresh_token: this.emailProviderRefreshToken,
    });
  }

  private async createTransport() {
    return this.emailProvider.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.emailProviderUser,
        clientId: this.emailProviderClientId,
        clientSecret: this.emailProviderClientSecret,
        refreshToken: this.emailProviderRefreshToken,
        accessToken: await this.oAuth2Client.getAccessToken(),
      },
    });
  }

  public async sendEmail({
    title,
    body,
  }: {
    title: string;
    body: string;
  }): Promise<void> {
    const emailMessage = {
      to: this.emailProviderUser,
      from: this.emailProviderUser,
      subject: title,
      text: body,
    };

    const transport = await this.createTransport();

    return new Promise((resolve, reject) => {
      transport.sendMail(emailMessage, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }
}
