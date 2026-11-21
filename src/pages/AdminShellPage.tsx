import { WorkspaceLayout, type WorkspaceNavItem } from '../components/layout/WorkspaceLayout.tsx';

const ADMIN_NAV: readonly WorkspaceNavItem[] = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/workers', label: 'Worker Management' },
  { to: '/admin/customers', label: 'Customer Management' },
  { to: '/admin/services', label: 'Service Management' },
  { to: '/admin/categories', label: 'Category Management' },
  { to: '/admin/bookings', label: 'Booking Management' },
  { to: '/admin/reviews', label: 'Reviews Management' },
  { to: '/admin/subscriptions', label: 'Subscriptions' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/cms', label: 'Website Content' },
  { to: '/admin/support', label: 'Support Management' },
  { to: '/admin/staff', label: 'Staff Management' },
  { to: '/admin/settings', label: 'System Settings' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
];

interface AdminShellPageProps {
  sectionTitle: string;
}

export function AdminShellPage({ sectionTitle }: AdminShellPageProps) {
  return (
    <WorkspaceLayout
      brandTitle="LankaWorks Admin"
      breadcrumb={`Admin Portal / ${sectionTitle}`}
      navItems={ADMIN_NAV}
    >
      <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-3">
        <p className="text-xs font-medium text-[#52525B]">
          Isolated Admin Route (/admin) · No Public Registration
        </p>
        <h1 className="font-display text-2xl font-bold text-[#18181B]">
          {sectionTitle}
        </h1>
        <p className="text-sm text-[#52525B] max-w-2xl leading-relaxed">
          Role-verified Support Staff, Admin, and Super Admin authentication and
          server-enforced authorization guards will be connected in Phase 03 and
          expanded across all 18 administrative modules in Phase 08.
        </p>
      </div>
    </WorkspaceLayout>
  );
}
