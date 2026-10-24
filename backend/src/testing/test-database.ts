import { MongoDBContainer } from '@testcontainers/mongodb';

export interface TestDatabase {
  uri: string;
  stop(): Promise<void>;
}

// Keep the image in sync with docker-compose.yml.
export async function startTestDatabase(): Promise<TestDatabase> {
  const container = await new MongoDBContainer('mongo:8.0').start();
  return {
    // The container runs a single-node replica set that is only reachable directly.
    uri: `${container.getConnectionString()}/test?directConnection=true`,
    stop: async () => {
      await container.stop();
    },
  };
}
