/**
 * Input Sanitization Utility
 * 
 * Provides XSS protection and input validation for user-generated content.
 * This is a defense-in-depth measure - React also escapes by default,
 * but we sanitize at the API level for additional security.
 */

/**
 * HTML entities that should be escaped
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 * Use this for any user input that will be rendered as HTML
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove potentially dangerous HTML tags while preserving safe ones
 * This is more permissive than escapeHtml - use for rich text content
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '');
  
  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:/gi, 'data-blocked:');
  
  // Remove style tags (can contain expressions)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed|form|input|button)[^>]*>/gi, '');
  sanitized = sanitized.replace(/<\/(iframe|object|embed|form|input|button)>/gi, '');
  
  return sanitized;
}

/**
 * Sanitize user message content
 * For chat messages, we want to preserve markdown but remove XSS vectors
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  // For chat messages, we primarily need to:
  // 1. Remove script injection attempts
  // 2. Remove event handlers
  // 3. Block dangerous URLs
  // But preserve markdown syntax for rendering
  
  let sanitized = content;
  
  // Remove null bytes (can be used to bypass filters)
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[script removed]');
  
  // Remove event handlers in any HTML-like content
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*\{[^}]*\}/gi, ''); // React-style handlers
  
  // Block javascript: URLs (but preserve normal URLs)
  sanitized = sanitized.replace(/javascript\s*:/gi, 'javascript-blocked:');
  
  // Block vbscript: URLs
  sanitized = sanitized.replace(/vbscript\s*:/gi, 'vbscript-blocked:');
  
  // Remove HTML comments (can hide malicious content)
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
  
  // Limit consecutive special characters (potential DoS via regex)
  sanitized = sanitized.replace(/(.)\1{100,}/g, '$1$1$1...');
  
  return sanitized;
}

/**
 * Validate and sanitize a URL
 * Returns null if the URL is invalid or potentially malicious
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
  if (dangerousProtocols.some(protocol => trimmed.startsWith(protocol))) {
    return null;
  }
  
  // Only allow http, https, and relative URLs
  if (!trimmed.startsWith('http://') && 
      !trimmed.startsWith('https://') && 
      !trimmed.startsWith('/') &&
      !trimmed.startsWith('#')) {
    // Prepend https:// for URLs without protocol
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return `https://${url.trim()}`;
    }
    return null;
  }
  
  return url.trim();
}

/**
 * Trim and normalize whitespace in a string
 */
export function normalizeWhitespace(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(input: string, maxLength: number, suffix = '...'): string {
  if (!input || typeof input !== 'string') return '';
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength - suffix.length) + suffix;
}
