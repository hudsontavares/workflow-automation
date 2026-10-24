import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';

import { AppConfig } from '../config/app-config.js';

@Global()
@Module({
  providers: [
    {
      provide: MongoClient,
      inject: [AppConfig],
      useFactory: (config: AppConfig) => MongoClient.connect(config.mongodbUri),
    },
    {
      provide: Db,
      inject: [MongoClient],
      useFactory: (client: MongoClient) => client.db(),
    },
  ],
  exports: [Db],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(private readonly client: MongoClient) {}

  async onApplicationShutdown() {
    await this.client.close();
  }
}
