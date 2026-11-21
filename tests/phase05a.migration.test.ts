import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  assertValidDecodedTokenClaims,
  CANONICAL_FIREBASE_PROJECT_ID,
  CANONICAL_FIREBASE_PROJECT_NUMBER,
  getBackendFirebaseIdentity,
  validateFirebaseProjectId,
} from '../server/services/firebaseAuth.ts';

test('firebase-applet-config.json targets canonical lankaworks-70eea project and has zero legacy references', () => {
  const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const raw = fs.readFileSync(cfgPath, 'utf8');
  const cfg = JSON.parse(raw) as Record<string, string>;

  assert.equal(cfg.projectId, 'lankaworks-70eea');
  assert.equal(cfg.messagingSenderId, '4668975390');
  assert.equal(cfg.authDomain, 'lankaworks-70eea.firebaseapp.com');
  assert.equal(cfg.storageBucket, 'lankaworks-70eea.firebasestorage.app');
  assert.ok(cfg.appId.startsWith('1:4668975390:web:'));
  assert.ok(cfg.oAuthClientId.startsWith('4668975390-'));
  assert.ok(cfg.firestoreDatabaseId.length > 0);

  assert.doesNotMatch(raw, /reflecting-effort-znj8s/);
  assert.doesNotMatch(raw, /17847292549/);
});

test('Backend Firebase Admin SDK rejects legacy or mismatched project IDs and binds to lankaworks-70eea', () => {
  const identity = getBackendFirebaseIdentity();
  assert.equal(identity.projectId, CANONICAL_FIREBASE_PROJECT_ID);
  assert.equal(identity.canonical, true);
  assert.equal(CANONICAL_FIREBASE_PROJECT_NUMBER, '4668975390');

  assert.throws(() => validateFirebaseProjectId('reflecting-effort-znj8s'), /legacy Firebase project/i);
  assert.throws(() => validateFirebaseProjectId('remixed-project-id'), /not configured/i);
  assert.throws(() => validateFirebaseProjectId('other-project'), /Mismatched Firebase project/i);
  assert.equal(validateFirebaseProjectId('lankaworks-70eea'), 'lankaworks-70eea');
});

test('Backend token claim validator rejects tokens issued for reflecting-effort-znj8s', () => {
  assert.throws(
    () =>
      assertValidDecodedTokenClaims({
        aud: 'reflecting-effort-znj8s',
        iss: 'https://securetoken.google.com/reflecting-effort-znj8s',
        sub: 'user-123',
      }),
    /audience or issuer/i,
  );

  assert.throws(
    () =>
      assertValidDecodedTokenClaims({
        aud: 'lankaworks-70eea',
        iss: 'https://securetoken.google.com/reflecting-effort-znj8s',
        sub: 'user-123',
      }),
    /audience or issuer/i,
  );

  assert.doesNotThrow(() =>
    assertValidDecodedTokenClaims({
      aud: 'lankaworks-70eea',
      iss: 'https://securetoken.google.com/lankaworks-70eea',
      sub: 'user-123',
    }),
  );
});

test('Client firebase.ts enforces canonical lankaworks-70eea projectId guard', () => {
  const clientSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/firebase.ts'), 'utf8');
  assert.match(clientSrc, /lankaworks-70eea/);
  assert.match(clientSrc, /getFirestore\(app,\s*firebaseConfig\.firestoreDatabaseId\)/);
});
