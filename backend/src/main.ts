import { NestFactory } from '@nestjs/core';

import { AppConfig } from './config/app-config.js';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

const app = await NestFactory.create(AppModule);
configureApp(app);
await app.listen(app.get(AppConfig).port);
