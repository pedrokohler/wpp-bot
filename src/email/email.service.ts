import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

interface AccessToken {
  expiresAt: number;
  token: string;
}
@Injectable()
export class EmailService {
  private emailProviderUser: string;
  private emailProviderClientId: string;
  private emailProviderClientSecret: string;
  private emailProviderRefreshToken: string;

  private emailProvider: any;
  private oAuth2Client: OAuth2Client;
  private accessToken: AccessToken;

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

  private async updateAccessToken() {
    const response = await this.oAuth2Client.getAccessToken();
    this.accessToken = {
      token: response.token,
      expiresAt: response.res.data.expiry_date,
    };

    const refreshToken = response.res.data.refresh_token;

    if (refreshToken && refreshToken !== this.emailProviderRefreshToken) {
      console.log(
        "🚀 ~ file: email.service.ts:60 ~ EmailService ~ getAccessToken ~ IT'S A NEW REFRESH TOKEN",
        refreshToken,
      );
      this.oAuth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      await this.sendEmail({
        title: 'App refresh token changed',
        body: `
      Old refresh token: ${this.emailProviderRefreshToken}
      New refresh token: ${refreshToken}.
      Make sure to update it on your .env file.
      `,
      });
    }
  }

  private async getAccessToken() {
    if (
      !this.accessToken?.token ||
      Date.now() > this.accessToken?.expiresAt - 10_000
    ) {
      await this.updateAccessToken();
    }

    return this.accessToken.token;
  }

  private async createTransport() {
    const accessToken = await this.getAccessToken();
    return this.emailProvider.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.emailProviderUser,
        clientId: this.emailProviderClientId,
        clientSecret: this.emailProviderClientSecret,
        refreshToken: this.emailProviderRefreshToken,
        accessToken,
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
