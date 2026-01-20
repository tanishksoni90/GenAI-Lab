/**
 * Password Utility - Secure password generation
 * 
 * Generates cryptographically secure random passwords
 * that are not predictable from user data.
 */

import crypto from 'crypto';

// Character sets for password generation
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

interface PasswordOptions {
  length?: number;
  includeLowercase?: boolean;
  includeUppercase?: boolean;
  includeNumbers?: boolean;
  includeSpecial?: boolean;
}

/**
 * Generate a cryptographically secure random password
 * 
 * Default: 16 characters with lowercase, uppercase, numbers, and special chars
 * This ensures the password is not predictable from any user data
 */
export function generateSecurePassword(options: PasswordOptions = {}): string {
  const {
    length = 16,
    includeLowercase = true,
    includeUppercase = true,
    includeNumbers = true,
    includeSpecial = true,
  } = options;

  // Build character set based on options
  let charset = '';
  const requiredChars: string[] = [];

  if (includeLowercase) {
    charset += LOWERCASE;
    // Ensure at least one lowercase
    requiredChars.push(LOWERCASE[crypto.randomInt(LOWERCASE.length)]);
  }
  if (includeUppercase) {
    charset += UPPERCASE;
    // Ensure at least one uppercase
    requiredChars.push(UPPERCASE[crypto.randomInt(UPPERCASE.length)]);
  }
  if (includeNumbers) {
    charset += NUMBERS;
    // Ensure at least one number
    requiredChars.push(NUMBERS[crypto.randomInt(NUMBERS.length)]);
  }
  if (includeSpecial) {
    charset += SPECIAL;
    // Ensure at least one special char
    requiredChars.push(SPECIAL[crypto.randomInt(SPECIAL.length)]);
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be included');
  }

  if (length < requiredChars.length) {
    throw new Error(
      `Password length must be at least ${requiredChars.length} to include all required character types`
    );
  }

  // Generate remaining random characters
  const remainingLength = Math.max(0, length - requiredChars.length);
  const randomChars: string[] = [];
  
  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = crypto.randomInt(charset.length);
    randomChars.push(charset[randomIndex]);
  }

  // Combine required and random characters, then shuffle
  const allChars = [...requiredChars, ...randomChars];
  
  // Fisher-Yates shuffle using crypto.randomInt for security
  for (let i = allChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
  }

  return allChars.join('');
}

/**
 * Generate a temporary password for admin-created accounts
 * 
 * Returns a secure random password that should be:
 * 1. Communicated to the user securely
 * 2. Required to be changed on first login
 */
export function generateTemporaryPassword(): string {
  return generateSecurePassword({
    length: 12,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSpecial: true,
  });
}

/**
 * Validate password strength
 * 
 * Returns an object with validation results
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password should be at least 8 characters');
  }

  if (password.length >= 12) {
    score++;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain at least one number');
  }

  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain at least one special character');
  }

  // Check for common patterns
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /admin/i,
    /@GenAI$/i, // Our old predictable pattern!
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Password contains a common or predictable pattern');
      break;
    }
  }

  return {
    isValid: score >= 3,
    score: Math.min(4, score),
    feedback,
  };
}
