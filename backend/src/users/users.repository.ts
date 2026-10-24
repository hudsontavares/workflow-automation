import { randomUUID } from 'node:crypto';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { type Collection, Db } from 'mongodb';

import {
  type UserProfile,
  type User,
  UserProfileSchema,
  UserSchema,
} from '@workflow-automation/shared';
import type { GithubAccessToken, GithubUserProfile } from '../github/github-client.js';
import { TokenCipher } from './token-cipher.js';

export interface GithubSignIn {
  profile: GithubUserProfile;
  accessToken: GithubAccessToken;
}

@Injectable()
export class UsersRepository implements OnModuleInit {
  private readonly users: Collection<User>;

  constructor(
    db: Db,
    private readonly tokenCipher: TokenCipher,
  ) {
    this.users = db.collection<User>('users');
  }

  async onModuleInit() {
    await this.users.createIndexes([{ key: { githubId: 1 }, unique: true }]);
  }

  async saveGithubSignIn({ profile, accessToken }: GithubSignIn): Promise<User> {
    const existingUser = await this.users.findOne({ githubId: profile.id });
    const existingConnection = existingUser?.connections.find(
      (connection) => connection.app === 'github',
    );
    const now = new Date();

    const user = UserSchema.parse({
      _id: existingUser?._id ?? randomUUID(),
      githubId: profile.id,
      name: profile.name ?? profile.login,
      avatarUrl: profile.avatarUrl,
      connections: [
        {
          _id: existingConnection?._id ?? randomUUID(),
          app: 'github',
          account: { id: profile.id, login: profile.login },
          accessToken: this.tokenCipher.encrypt(accessToken.token),
          scopes: accessToken.scopes,
          createdAt: existingConnection?.createdAt ?? now,
        },
      ],
      createdAt: existingUser?.createdAt ?? now,
    });

    await this.users.replaceOne({ _id: user._id }, user, { upsert: true });
    return user;
  }

  async findProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.users.findOne(
      { _id: userId },
      {
        projection: {
          name: 1,
          avatarUrl: 1,
          'connections._id': 1,
          'connections.app': 1,
          'connections.account': 1,
        },
      },
    );
    return user ? UserProfileSchema.parse(user) : null;
  }

  async findGithubAccessToken(userId: string, connectionId: string): Promise<string | null> {
    const user = await this.users.findOne(
      { _id: userId, connections: { $elemMatch: { _id: connectionId, app: 'github' } } },
      { projection: { 'connections.$': 1 } },
    );
    const connection = user?.connections[0];
    return connection ? this.tokenCipher.decrypt(connection.accessToken) : null;
  }
}
