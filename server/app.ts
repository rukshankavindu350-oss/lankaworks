import express from 'express';
import type { Express } from 'express';
import {
  createRateLimiter,
  securityHeadersMiddleware,
} from './middleware/security.ts';
import { createAuthRouter } from './routes/auth.ts';
import { createHealthRouter } from './routes/health.ts';

export interface ServerAppOptions {
  apiRateLimitMax?: number;
}

export function createServerApp(options: ServerAppOptions = {}): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: '1mb' }));

  const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: options.apiRateLimitMax ?? 120,
    keyPrefix: 'api',
  });

  app.use('/api', apiLimiter);
  app.use('/api', createHealthRouter());
  app.use('/api/auth', createAuthRouter());

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  return app;
}
