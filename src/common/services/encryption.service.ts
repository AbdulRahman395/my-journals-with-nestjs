import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const key = process.env.JOURNAL_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('JOURNAL_ENCRYPTION_KEY is not defined in environment variables');
    }
    this.key = Buffer.from(key, 'hex');
  }

  encrypt(text: string | null): { iv: string; content: string; tag: string } | null {
    if (text === null) return null;
    
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
    };
  }

  decrypt(payload: { iv: string; content: string; tag: string } | null): string | null {
    if (!payload) return null;
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(payload.iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.content, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}

// This is a transformer that will be used by TypeORM to handle encryption/decryption
export const encryptedColumn = {
  to: (value: string | null) => {
    const encryptionService = new EncryptionService();
    return value ? encryptionService.encrypt(value) : null;
  },
  from: (value: { iv: string; content: string; tag: string } | null) => {
    const encryptionService = new EncryptionService();
    return value ? encryptionService.decrypt(value) : null;
  },
};
