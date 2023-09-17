export class Configuration {
  static get envs() {
    return () => ({
      email: {
        provider: {
          user: process.env.GMAIL_APP_USER,
          client: {
            id: process.env.CLIENT_ID,
            secret: process.env.CLIENT_SECRET,
            refreshToken: process.env.CLIENT_REFRESH_TOKEN,
          },
        },
      },
    });
  }
}
