import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createServerApp } from '../server/app.ts';
import { isSafeHttpUrl, isValidDocumentId } from '../server/middleware/security.ts';
import {
  generateBookingReference,
  generateGuestPin,
  hashGuestPin,
  verifyGuestPin,
} from '../server/services/crypto.ts';

async function withServer(
  rateLimitMax: number,
  fn: (baseUrl: string) => Promise<void>,
) {
  const app = createServerApp({ apiRateLimitMax: rateLimitMax });
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const addr = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${addr.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test('GET /api/health returns 200 and non-sensitive status payload', async () => {
  await withServer(50, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    const body = (await res.json()) as {
      status: string;
      service: string;
      phase: string;
      config: Record<string, boolean>;
    };
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'LankaWorks API');
    assert.equal(body.phase, '02-foundation');
    assert.equal(typeof body.config.hasEmailProvider, 'boolean');
  });
});

test('GET /api/meta/platform returns Sri Lanka defaults and roles', async () => {
  await withServer(50, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/meta/platform`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      platform: {
        countryCode: string;
        currency: string;
        provincesCount: number;
        districtsCount: number;
        trialMonths: number;
      };
      roles: Array<{ role: string; label: string }>;
    };
    assert.equal(body.platform.countryCode, 'LK');
    assert.equal(body.platform.currency, 'LKR');
    assert.equal(body.platform.provincesCount, 9);
    assert.equal(body.platform.districtsCount, 25);
    assert.equal(body.platform.trialMonths, 5);
    assert.equal(body.roles.length, 6);
  });
});

test('Unknown /api/* route returns 404 JSON instead of HTML', async () => {
  await withServer(50, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(res.status, 404);
    const body = (await res.json()) as { error: string };
    assert.equal(body.error, 'API endpoint not found.');
  });
});

test('API rate limiter returns 429 with Retry-After once threshold is exceeded', async () => {
  await withServer(2, async (baseUrl) => {
    const r1 = await fetch(`${baseUrl}/api/health`);
    const r2 = await fetch(`${baseUrl}/api/health`);
    const r3 = await fetch(`${baseUrl}/api/health`);
    assert.equal(r1.status, 200);
    assert.equal(r2.status, 200);
    assert.equal(r3.status, 429);
    assert.ok(Number(r3.headers.get('retry-after')) >= 1);
  });
});

test('Guest booking reference and salted scrypt PIN verification work securely', () => {
  const ref = generateBookingReference();
  assert.match(ref, /^LW-[A-Z2-9]{6}$/);

  const pin = generateGuestPin();
  assert.match(pin, /^\d{6}$/);

  const hashA = hashGuestPin(pin);
  const hashB = hashGuestPin(pin);
  assert.notEqual(hashA, hashB);
  assert.equal(verifyGuestPin(pin, hashA), true);
  assert.equal(verifyGuestPin('000000', hashA), false);
  assert.equal(verifyGuestPin('abc123', hashA), false);
});

test('Security validators reject unsafe URLs and invalid Firestore IDs', () => {
  assert.equal(isValidDocumentId('worker_colombo-01'), true);
  assert.equal(isValidDocumentId('../etc/passwd'), false);
  assert.equal(isValidDocumentId(''), false);

  assert.equal(isSafeHttpUrl('https://lankaworks.lk/video'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<script>'), false);
});
