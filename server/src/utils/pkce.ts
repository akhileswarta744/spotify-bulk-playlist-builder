import crypto from 'crypto';

/**
 * Generates a high-entropy cryptographically random string between 43 and 128 characters.
 */
export function generateRandomString(length: number = 64): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomBytes = crypto.randomBytes(length);
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible[randomBytes[i] % possible.length];
  }
  return text;
}

/**
 * Encodes a buffer to Base64URL without padding.
 */
export function base64urlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Creates SHA-256 code challenge from a code verifier for Spotify PKCE.
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64urlEncode(hash);
}

/**
 * Validates that a code verifier matches the code challenge.
 */
export function verifyCodeChallenge(verifier: string, challenge: string): boolean {
  return generateCodeChallenge(verifier) === challenge;
}
