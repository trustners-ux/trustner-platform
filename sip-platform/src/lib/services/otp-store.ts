/* ─────────────────────────────────────────────────────────
   OTP Store for Financial Planning Verification

   In-memory singleton that persists within a single Vercel
   serverless instance. Send and verify routes share state
   because they import the same module-level instance.

   Limitation: Cold starts create a fresh Map, so if the
   verify request hits a different instance the OTP won't
   be found. For Phase 1 traffic this is acceptable —
   Vercel reuses warm instances aggressively.

   Phase 4 upgrade: Vercel KV or Upstash Redis.
   ───────────────────────────────────────────────────────── */

interface OTPEntry {
  otp: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

class OTPStore {
  private store = new Map<string, OTPEntry>();

  /** Store an OTP for a phone number */
  set(phone: string, entry: OTPEntry): void {
    this.store.set(phone, entry);
    this.cleanup();
  }

  /** Retrieve a valid (non-expired) OTP entry */
  get(phone: string): OTPEntry | undefined {
    const entry = this.store.get(phone);
    if (entry && Date.now() > entry.expiresAt) {
      this.store.delete(phone);
      return undefined;
    }
    return entry;
  }

  /** Remove an OTP after successful verification */
  delete(phone: string): void {
    this.store.delete(phone);
  }

  /** Get attempt count for rate-limiting */
  getAttempts(phone: string): number {
    return this.store.get(phone)?.attempts || 0;
  }

  /** Check if the phone is rate-limited (3+ attempts within 10 min window) */
  isRateLimited(phone: string): boolean {
    const entry = this.store.get(phone);
    if (!entry) return false;
    // Rate-limited if 3+ attempts and the last OTP hasn't fully expired + 10 min buffer
    return entry.attempts >= 3 && Date.now() < entry.expiresAt + 600000;
  }

  /** Evict entries older than 15 minutes to prevent memory growth */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt + 600000) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton — persists within the serverless instance lifetime
export const otpStore = new OTPStore();
