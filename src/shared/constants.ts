import type { PlatformMetadata, RolePermissionMap, UserRole } from './types.ts';

export const PLATFORM_DEFAULTS: PlatformMetadata = {
  name: 'LankaWorks',
  countryCode: 'LK',
  currency: 'LKR',
  provincesCount: 9,
  districtsCount: 25,
  trialMonths: 5,
  defaultMonthlyFeeLkr: 1500,
  cancellationNoticeHours: 12,
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissionMap> = {
  guest: {
    role: 'guest',
    label: 'Guest Customer',
    capabilities: [
      'browse_public_marketplace',
      'search_services_by_location',
      'submit_guest_booking',
      'track_booking_with_reference_pin',
      'request_guest_cancellation',
    ],
  },
  customer: {
    role: 'customer',
    label: 'Registered Customer',
    capabilities: [
      'browse_public_marketplace',
      'manage_customer_profile',
      'submit_customer_booking',
      'link_eligible_guest_bookings',
      'save_favourite_workers',
      'message_booked_workers',
      'submit_verified_reviews',
    ],
  },
  worker: {
    role: 'worker',
    label: 'Worker / Service Provider',
    capabilities: [
      'manage_worker_profile',
      'manage_services_and_pricing',
      'configure_service_locations',
      'manage_working_hours_and_calendar',
      'respond_to_bookings',
      'reply_to_reviews',
      'manage_subscription',
    ],
  },
  support: {
    role: 'support',
    label: 'Support Staff',
    capabilities: [
      'view_assigned_support_tickets',
      'assist_booking_inquiries',
      'moderate_flagged_reviews_scoped',
    ],
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    capabilities: [
      'manage_workers_and_approvals',
      'manage_customers_and_bookings',
      'manage_categories_and_locations',
      'manage_subscriptions_and_cms',
      'view_reports_and_audit_logs',
    ],
  },
  super_admin: {
    role: 'super_admin',
    label: 'Super Admin',
    capabilities: [
      'full_platform_control',
      'manage_staff_and_admin_roles',
      'configure_system_security_settings',
    ],
  },
};
