/**
 * Encryption Utility for sensitive data (API keys, tokens)
 */

import crypto from 'crypto';

const { ENCRYPTION_KEY } = process.env;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

// Convert hex key to buffer
const key = Buffer.from(ENCRYPTION_KEY, 'hex');

if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
}

/**
 * Encrypt sensitive text (like API keys)
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('additional-auth-data'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive text
 */
export function decrypt(encryptedText: string): string {
  try {
    console.log('🔓 Starting decryption...');

    if (!encryptedText || typeof encryptedText !== 'string') {
      console.error('❌ Invalid input for decryption:', {
        encryptedText,
        type: typeof encryptedText,
      });
      throw new Error('Invalid encrypted data - must be a non-empty string');
    }

    const parts = encryptedText.split(':');
    console.log(`🔍 Encrypted data parts: ${parts.length} (expected 3)`);

    if (parts.length !== 3) {
      console.error(
        '❌ Invalid encrypted data format. Parts:',
        parts.length,
        'Data:',
        encryptedText,
      );
      throw new Error(
        `Invalid encrypted data format - expected 3 parts, got ${parts.length}`,
      );
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Validate each part
    if (!ivHex || !authTagHex || !encrypted) {
      console.error('❌ Empty parts in encrypted data:', {
        ivHex: !!ivHex,
        authTagHex: !!authTagHex,
        encrypted: !!encrypted,
      });
      throw new Error('Invalid encrypted data - contains empty parts');
    }

    console.log('🔑 Converting hex parts to buffers...');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== IV_LENGTH) {
      console.error('❌ Invalid IV length:', iv.length, 'expected:', IV_LENGTH);
      throw new Error(`Invalid IV length: ${iv.length}, expected ${IV_LENGTH}`);
    }

    if (authTag.length !== TAG_LENGTH) {
      console.error(
        '❌ Invalid auth tag length:',
        authTag.length,
        'expected:',
        TAG_LENGTH,
      );
      throw new Error(
        `Invalid auth tag length: ${authTag.length}, expected ${TAG_LENGTH}`,
      );
    }

    console.log('🔓 Creating decipher...');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('additional-auth-data'));
    decipher.setAuthTag(authTag);

    console.log('🔓 Decrypting data...');
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    console.log('✅ Decryption successful');
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      encryptedLength: encryptedText?.length || 0,
      encryptedPreview: `${encryptedText?.substring(0, 50)}...`,
      keyLength: key.length,
      algorithmUsed: ALGORITHM,
    });

    // Check if this looks like an encryption key mismatch
    if (
      error instanceof Error &&
      (error.message.includes(
        'Unsupported state or unable to authenticate data',
      ) ||
        error.message.includes('unable to authenticate data'))
    ) {
      console.log(
        '🔑 This appears to be an encryption key mismatch - the data was encrypted with a different key',
      );
      throw new Error(
        'ENCRYPTION_KEY_MISMATCH: This API key was encrypted with a different encryption key. Please re-enter your API key in the AI Settings.',
      );
    }

    throw new Error(
      `Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Hash data for comparison (passwords, etc.)
 */
export function hash(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512')
    .toString('hex');
  return `${actualSalt}:${hash}`;
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  try {
    const [salt, hash] = hashedData.split(':');
    const newHash = crypto
      .pbkdf2Sync(data, salt, 10000, 64, 'sha512')
      .toString('hex');
    return hash === newHash;
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
}

/**
 * Generate random encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Secure random string generation
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
