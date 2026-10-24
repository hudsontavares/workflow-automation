import { Module } from '@nestjs/common';

import { TokenCipher } from './token-cipher.js';
import { UsersRepository } from './users.repository.js';

@Module({
  providers: [TokenCipher, UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
