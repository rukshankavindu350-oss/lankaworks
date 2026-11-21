export type UserRole =
  | 'guest'
  | 'customer'
  | 'worker'
  | 'support'
  | 'admin'
  | 'super_admin';

export type WorkerApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'suspended';

export interface RolePermissionMap {
  readonly role: UserRole;
  readonly label: string;
  readonly capabilities: readonly string[];
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  phase: string;
  timestamp: string;
  config: {
    hasEmailProvider: boolean;
    hasSuperAdminBootstrap: boolean;
  };
}

export interface PlatformMetadata {
  name: string;
  countryCode: string;
  currency: string;
  provincesCount: number;
  districtsCount: number;
  trialMonths: number;
  defaultMonthlyFeeLkr: number;
  cancellationNoticeHours: number;
}
