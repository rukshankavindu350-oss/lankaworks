import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getServerConfig } from '../config/env.ts';
import type { UserRole } from '../../src/shared/types.ts';

export const CANONICAL_FIREBASE_PROJECT_ID = 'lankaworks-70eea';
export const CANONICAL_FIREBASE_PROJECT_NUMBER = '4668975390';
export const LEGACY_BLOCKED_PROJECT_IDS: ReadonlySet<string> = new Set([
  'reflecting-effort-znj8s',
]);

interface FirebaseAppletConfig {
  projectId?: string;
  firestoreDatabaseId?: string;
  messagingSenderId?: string;
}

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isBootstrapSuperAdmin: boolean;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedUser;
}

let cachedConfig: FirebaseAppletConfig | null = null;

export function validateFirebaseProjectId(projectId: string | undefined): string {
  const normalized = (projectId || '').trim();
  if (!normalized || normalized === 'remixed-project-id') {
    throw new Error('Firebase project is not configured.');
  }
  if (LEGACY_BLOCKED_PROJECT_IDS.has(normalized)) {
    throw new Error(
      `Refusing legacy Firebase project "${normalized}". Canonical project is "${CANONICAL_FIREBASE_PROJECT_ID}".`,
    );
  }
  if (normalized !== CANONICAL_FIREBASE_PROJECT_ID) {
    throw new Error(
      `Mismatched Firebase project "${normalized}". Expected "${CANONICAL_FIREBASE_PROJECT_ID}".`,
    );
  }
  return normalized;
}

function readAppletConfig(): FirebaseAppletConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Missing firebase-applet-config.json.');
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw) as FirebaseAppletConfig;
  validateFirebaseProjectId(parsed.projectId);
  cachedConfig = parsed;
  return parsed;
}

export function getBackendFirebaseIdentity(): {
  projectId: string;
  firestoreDatabaseId: string;
  canonical: boolean;
} {
  const cfg = readAppletConfig();
  return {
    projectId: validateFirebaseProjectId(cfg.projectId),
    firestoreDatabaseId: cfg.firestoreDatabaseId || '(default)',
    canonical: cfg.projectId === CANONICAL_FIREBASE_PROJECT_ID,
  };
}

function getFirebaseAdminAuth() {
  const { projectId } = getBackendFirebaseIdentity();
  const app = getApps().length
    ? getApp()
    : initializeApp({ projectId });
  return getAuth(app);
}

export function assertValidDecodedTokenClaims(
  decoded: Pick<DecodedIdToken, 'aud' | 'iss' | 'sub'>,
  expectedProjectId: string = CANONICAL_FIREBASE_PROJECT_ID,
): void {
  const expectedIssuer = `https://securetoken.google.com/${expectedProjectId}`;
  if (decoded.aud !== expectedProjectId || decoded.iss !== expectedIssuer || !decoded.sub) {
    throw new Error('Firebase ID token audience or issuer does not match canonical project.');
  }
}

export function isBootstrapSuperAdminEmail(
  email: string | null | undefined,
  emailVerified: boolean,
): boolean {
  if (!emailVerified || !email) {
    return false;
  }
  const configured = getServerConfig().initialSuperAdminEmail;
  if (!configured) {
    return false;
  }
  return email.trim().toLowerCase() === configured;
}

export async function verifyBearerIdToken(
  authHeader: string | undefined,
): Promise<DecodedIdToken> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Bearer authorization token.');
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || token.length > 8192) {
    throw new Error('Invalid authorization token format.');
  }
  const adminAuth = getFirebaseAdminAuth();
  const decoded = await adminAuth.verifyIdToken(token);
  assertValidDecodedTokenClaims(decoded, CANONICAL_FIREBASE_PROJECT_ID);
  return decoded;
}

export async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const decoded = await verifyBearerIdToken(req.headers.authorization);
    const email = decoded.email ?? null;
    const emailVerified = Boolean(decoded.email_verified);
    req.authUser = {
      uid: decoded.uid,
      email,
      emailVerified,
      isBootstrapSuperAdmin: isBootstrapSuperAdminEmail(email, emailVerified),
    };
    next();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed.';
    res.status(401).json({ error: message });
  }
}

export function requireVerifiedEmail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.authUser || !req.authUser.emailVerified) {
    res.status(403).json({
      error: 'Email verification is required for this action.',
    });
    return;
  }
  next();
}

export function requireServerSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.authUser || !req.authUser.isBootstrapSuperAdmin) {
    res.status(403).json({
      error: 'Super Admin server authorization required.',
    });
    return;
  }
  next();
}

export function resolveEffectiveRoleHint(
  storedRole: UserRole | null,
  authUser: AuthenticatedUser,
): UserRole {
  if (authUser.isBootstrapSuperAdmin) {
    return 'super_admin';
  }
  if (storedRole) {
    return storedRole;
  }
  return 'customer';
}
