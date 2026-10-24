import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { AppConfig } from '../config/app-config.js';

const algorithm = 'aes-256-gcm';

@Injectable()
export class TokenCipher {
  constructor(private readonly config: AppConfig) {}

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(algorithm, this.config.tokenEncryptionKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64')).join('.');
  }

  decrypt(encrypted: string): string {
    const [iv, authTag, ciphertext] = encrypted
      .split('.')
      .map((part) => Buffer.from(part, 'base64'));
    const decipher = createDecipheriv(algorithm, this.config.tokenEncryptionKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
}
