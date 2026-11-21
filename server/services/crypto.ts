import crypto from 'node:crypto';

const BOOKING_REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateBookingReference(): string {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += BOOKING_REF_CHARS[bytes[i] % BOOKING_REF_CHARS.length];
  }
  return `LW-${code}`;
}

export function generateGuestPin(): string {
  const num = crypto.randomInt(100000, 1000000);
  return String(num);
}

export function hashGuestPin(pin: string): string {
  if (!/^\d{6}$/.test(pin)) {
    throw new Error('Guest PIN must be exactly 6 digits.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(pin, salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyGuestPin(pin: string, storedHash: string): boolean {
  if (!/^\d{6}$/.test(pin) || !storedHash.includes(':')) {
    return false;
  }
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) {
    return false;
  }
  const derived = crypto.scryptSync(pin, salt, 32);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, expected);
}
