import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

export function configureApp(app: NestExpressApplication): void {
  // Proxies on this machine (ngrok, the Angular dev server) forward the browser's protocol and host.
  app.set('trust proxy', 'loopback');
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableShutdownHooks();
}
