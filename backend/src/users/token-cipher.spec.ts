import { describe, expect, it } from 'vitest';

import { createTestConfig } from '../testing/test-config.js';
import { TokenCipher } from './token-cipher.js';

const tokenCipher = new TokenCipher(createTestConfig('mongodb://localhost/unused'));

describe('TokenCipher', () => {
  it('decrypts what it encrypted', () => {
    expect(tokenCipher.decrypt(tokenCipher.encrypt('gho_secret'))).toBe('gho_secret');
  });

  it('never stores the plaintext', () => {
    expect(tokenCipher.encrypt('gho_secret')).not.toContain('gho_secret');
  });

  it('encrypts the same token differently each time', () => {
    expect(tokenCipher.encrypt('gho_secret')).not.toBe(tokenCipher.encrypt('gho_secret'));
  });

  it('refuses a tampered value', () => {
    const [iv, authTag] = tokenCipher.encrypt('gho_secret').split('.');
    const tampered = [iv, authTag, Buffer.from('gho_forged').toString('base64')].join('.');
    expect(() => tokenCipher.decrypt(tampered)).toThrow();
  });
});
