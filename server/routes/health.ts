import { Router } from 'express';
import { PLATFORM_DEFAULTS, ROLE_DEFINITIONS } from '../../src/shared/constants.ts';
import type { HealthResponse } from '../../src/shared/types.ts';
import { getServerConfig } from '../config/env.ts';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    const cfg = getServerConfig();
    const payload: HealthResponse = {
      status: 'ok',
      service: 'LankaWorks API',
      phase: '02-foundation',
      timestamp: new Date().toISOString(),
      config: {
        hasEmailProvider: Boolean(cfg.resendApiKey),
        hasSuperAdminBootstrap: Boolean(cfg.initialSuperAdminEmail),
      },
    };
    res.json(payload);
  });

  router.get('/meta/platform', (_req, res) => {
    res.json({
      platform: PLATFORM_DEFAULTS,
      roles: Object.values(ROLE_DEFINITIONS).map((r) => ({
        role: r.role,
        label: r.label,
      })),
    });
  });

  return router;
}
