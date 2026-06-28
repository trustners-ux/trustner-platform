/**
 * Onboarding token generator.
 * URL-safe 32-byte token = ~43 base64url chars. Sent in /onboarding/<token>
 * link. Never put PII in the token; resolve to candidate record on the server.
 */
import { randomBytes } from 'crypto';

export function generateOnboardingToken(): string {
  return randomBytes(32).toString('base64url');
}
