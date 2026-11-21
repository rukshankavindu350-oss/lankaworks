import dotenv from 'dotenv';

dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  appUrl: string;
  initialSuperAdminEmail: string;
  resendApiKey: string;
  emailFrom: string;
}

export function getServerConfig(): ServerConfig {
  const port = Number(process.env.PORT) || 3000;
  return {
    port,
    nodeEnv: process.env.NODE_ENV || 'development',
    appUrl: (process.env.APP_URL || 'http://localhost:3000').trim(),
    initialSuperAdminEmail: (process.env.INITIAL_SUPER_ADMIN_EMAIL || '')
      .trim()
      .toLowerCase(),
    resendApiKey: (process.env.RESEND_API_KEY || '').trim(),
    emailFrom: (process.env.EMAIL_FROM || 'LankaWorks <noreply@lankaworks.lk>').trim(),
  };
}
