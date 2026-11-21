import { Router } from 'express';
import { getServerConfig } from '../config/env.ts';
import { createRateLimiter } from '../middleware/security.ts';
import {
  requireFirebaseAuth,
  requireServerSuperAdmin,
  type AuthenticatedRequest,
} from '../services/firebaseAuth.ts';

export function createAuthRouter(): Router {
  const router = Router();

  const authRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'auth',
  });

  router.use(authRateLimiter);

  router.post(
    '/session-verify',
    requireFirebaseAuth,
    (req: AuthenticatedRequest, res) => {
      const cfg = getServerConfig();
      const user = req.authUser!;
      res.json({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        isBootstrapSuperAdmin: user.isBootstrapSuperAdmin,
        bootstrapConfigured: Boolean(cfg.initialSuperAdminEmail),
      });
    },
  );

  router.get(
    '/super-admin/status',
    requireFirebaseAuth,
    requireServerSuperAdmin,
    (req: AuthenticatedRequest, res) => {
      res.json({
        authorized: true,
        uid: req.authUser!.uid,
        role: 'super_admin',
      });
    },
  );

  return router;
}
