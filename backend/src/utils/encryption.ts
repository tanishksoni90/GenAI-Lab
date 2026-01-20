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

// Cache the encryption key to avoid repeated computation and log spam
let cachedKey: Buffer | null = null;
let devWarningLogged = false;

/**
 * Get the encryption key from environment or generate a development key
 * In production, ENCRYPTION_KEY MUST be set
 */
function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;
  
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
      console.error(`ENCRYPTION_KEY is too short (${keyBuffer.length} bytes). Expected at least ${KEY_LENGTH} bytes.`);
      console.error('Generate a proper key with: openssl rand -base64 32');
      if (isProduction) {
        process.exit(1);
      }
      // In non-production, derive key but warn about security risk
      console.warn('WARNING: Deriving key from weak input. NOT SECURE!');
      cachedKey = crypto.createHash('sha256').update(envKey).digest();
      return cachedKey;
    }
    cachedKey = keyBuffer.slice(0, KEY_LENGTH);
    return cachedKey;
  }
  
  // Development-only: derive key from a fixed string (NOT SECURE FOR PRODUCTION)
  // This allows development to work without setting ENCRYPTION_KEY
  if (!devWarningLogged) {
    console.warn('WARNING: Using development encryption key. Set ENCRYPTION_KEY in production!');
    devWarningLogged = true;
  }
  cachedKey = crypto.createHash('sha256').update('dev-encryption-key-not-for-production').digest();
  return cachedKey;
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
 * 
 * @param encryptedString - The encrypted string or legacy plain text
 * @returns The decrypted value, or the original string if:
 *   - Not in encrypted format (legacy plain text) - returned as-is for backward compatibility
 *   - Decryption fails (key rotation, corruption, tampering) - returns original to prevent
 *     breaking existing functionality during migration, but logs warning
 * 
 * @note IMPORTANT: Callers cannot distinguish between successfully decrypted plaintext
 *       and failed decryption returning ciphertext. If this is critical for your use case,
 *       use isEncrypted() to verify format first, or check if the returned value still
 *       looks encrypted (contains ':' separators). Consider migrating to a null-returning
 *       variant for strict decryption requirements.
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
    // Decryption failed - could be legacy plain text that happens to have colons,
    // or the encryption key changed. Don't log error details (may contain sensitive info).
    console.error('Decryption failed for value with encrypted format. Key may have changed or data is corrupted.');
    // Return original for backward compatibility with legacy unencrypted data
    // Note: This is a security trade-off for migration support
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
