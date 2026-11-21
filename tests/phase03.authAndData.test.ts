import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import test from 'node:test';
import { createServerApp } from '../server/app.ts';
import {
  isBootstrapSuperAdminEmail,
  resolveEffectiveRoleHint,
} from '../server/services/firebaseAuth.ts';
import {
  INITIAL_SERVICE_CATEGORIES,
  SRI_LANKA_COUNTRY,
  SRI_LANKA_DISTRICTS,
  SRI_LANKA_MAJOR_CITIES,
  SRI_LANKA_PROVINCES,
} from '../src/shared/sriLankaData.ts';

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const app = createServerApp({ apiRateLimitMax: 100 });
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

test('Sri Lanka seed dataset contains all 9 provinces, 25 districts, valid cities, and categories', () => {
  assert.equal(SRI_LANKA_COUNTRY.code, 'LK');
  assert.equal(SRI_LANKA_COUNTRY.currency, 'LKR');
  assert.equal(SRI_LANKA_PROVINCES.length, 9);
  assert.equal(SRI_LANKA_DISTRICTS.length, 25);
  assert.ok(SRI_LANKA_MAJOR_CITIES.length >= 25);
  assert.equal(INITIAL_SERVICE_CATEGORIES.length, 10);

  const provinceIds = new Set(SRI_LANKA_PROVINCES.map((p) => p.id));
  const districtIds = new Set(SRI_LANKA_DISTRICTS.map((d) => d.id));
  assert.equal(provinceIds.size, 9);
  assert.equal(districtIds.size, 25);

  for (const dist of SRI_LANKA_DISTRICTS) {
    assert.ok(
      provinceIds.has(dist.provinceId),
      `District ${dist.name} references unknown province ${dist.provinceId}`,
    );
  }

  for (const city of SRI_LANKA_MAJOR_CITIES) {
    assert.ok(provinceIds.has(city.provinceId));
    assert.ok(districtIds.has(city.districtId));
  }
});

test('Server auth endpoints reject unauthenticated or malformed tokens with 401', async () => {
  await withServer(async (baseUrl) => {
    const res1 = await fetch(`${baseUrl}/api/auth/session-verify`, {
      method: 'POST',
    });
    assert.equal(res1.status, 401);

    const res2 = await fetch(`${baseUrl}/api/auth/session-verify`, {
      method: 'POST',
      headers: { Authorization: 'Bearer not-a-valid-jwt' },
    });
    assert.equal(res2.status, 401);

    const res3 = await fetch(`${baseUrl}/api/auth/super-admin/status`);
    assert.equal(res3.status, 401);
  });
});

test('Super Admin bootstrap check requires verified email and configured INITIAL_SUPER_ADMIN_EMAIL', () => {
  const prev = process.env.INITIAL_SUPER_ADMIN_EMAIL;
  try {
    process.env.INITIAL_SUPER_ADMIN_EMAIL = 'admin@lankaworks.lk';
    assert.equal(
      isBootstrapSuperAdminEmail('admin@lankaworks.lk', false),
      false,
    );
    assert.equal(
      isBootstrapSuperAdminEmail('ADMIN@LANKAWORKS.LK', true),
      true,
    );
    assert.equal(
      isBootstrapSuperAdminEmail('other@lankaworks.lk', true),
      false,
    );

    process.env.INITIAL_SUPER_ADMIN_EMAIL = '';
    assert.equal(
      isBootstrapSuperAdminEmail('admin@lankaworks.lk', true),
      false,
    );
  } finally {
    process.env.INITIAL_SUPER_ADMIN_EMAIL = prev;
  }
});

test('Role resolution never promotes non-bootstrap users to super_admin', () => {
  assert.equal(
    resolveEffectiveRoleHint('customer', {
      uid: 'u1',
      email: 'user@example.com',
      emailVerified: true,
      isBootstrapSuperAdmin: false,
    }),
    'customer',
  );
  assert.equal(
    resolveEffectiveRoleHint('customer', {
      uid: 'u2',
      email: 'admin@lankaworks.lk',
      emailVerified: true,
      isBootstrapSuperAdmin: true,
    }),
    'super_admin',
  );
});

test('Hardened firestore.rules contains default deny, PII isolation, and role immutability checks', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  assert.match(rules, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /incoming\(\)\.role in \['customer', 'worker'\]/);
  assert.match(rules, /incoming\(\)\.role == existing\(\)\.role/);
  assert.match(rules, /incoming\(\)\.approvalStatus == 'pending'/);
  assert.match(rules, /incoming\(\)\.approvalStatus == existing\(\)\.approvalStatus/);
  assert.match(rules, /match \/private\/\{docId\}/);
  assert.match(rules, /match \/audit_logs\/\{logId\}[\s\S]*allow update, delete: if false;/);
});
