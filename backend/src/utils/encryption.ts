/**
 * Encryption Utility for Sensitive Data (API Keys)
 * 
 * Uses AES-256-GCM for encryption with:
 * - Random IV for each encryption
 * - Authentication tag for integrity verification
 * - Environment-based encryption key
 * 
 * IMPORTANT: Set ENCRYPTION_KEY in production environment
 * Generate with: openssl rand -base64 32
 */

import crypto from 'crypto';

// Encryption settings
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment or generate a development key
 * In production, ENCRYPTION_KEY MUST be set
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && !envKey) {
    console.error('FATAL: ENCRYPTION_KEY environment variable must be set in production');
    console.error('Generate one with: openssl rand -base64 32');
    process.exit(1);
  }
  
  if (envKey) {
    // Decode base64 key from environment
    const keyBuffer = Buffer.from(envKey, 'base64');
    if (keyBuffer.length < KEY_LENGTH) {
      // If key is too short, hash it to get correct length
      return crypto.createHash('sha256').update(envKey).digest();
    }
    return keyBuffer.slice(0, KEY_LENGTH);
  }
  
  // Development-only: derive key from a fixed string (NOT SECURE FOR PRODUCTION)
  // This allows development to work without setting ENCRYPTION_KEY
  console.warn('WARNING: Using development encryption key. Set ENCRYPTION_KEY in production!');
  return crypto.createHash('sha256').update('dev-encryption-key-not-for-production').digest();
}

/**
 * Encrypt sensitive data (e.g., API keys)
 * Returns a string in format: iv:authTag:encryptedData (all base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + AuthTag + EncryptedData
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * Expects string in format: iv:authTag:encryptedData (all base64)
 */
export function decrypt(encryptedString: string): string {
  if (!encryptedString) return '';
  
  // Check if it's an encrypted string (has the expected format)
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    // Not encrypted (legacy plain text) - return as-is
    // This allows backward compatibility during migration
    return encryptedString;
  }
  
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, it might be plain text (legacy)
    // or the encryption key changed
    console.error('Decryption failed, returning original value:', error);
    return encryptedString;
  }
}

/**
 * Check if a string is encrypted (has the expected format)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

/**
 * Mask a sensitive value for display (e.g., "sk-abc...xyz")
 */
export function maskSensitiveValue(value: string, showStart = 8, showEnd = 4): string {
  if (!value || value.length <= showStart + showEnd) {
    return value ? '***' : '';
  }
  return `${value.slice(0, showStart)}...${value.slice(-showEnd)}`;
}
