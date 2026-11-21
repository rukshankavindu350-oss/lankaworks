import { WorkspaceLayout, type WorkspaceNavItem } from '../components/layout/WorkspaceLayout.tsx';

const WORKER_NAV: readonly WorkspaceNavItem[] = [
  { to: '/worker', label: 'Overview', end: true },
  { to: '/worker/bookings', label: 'Bookings' },
  { to: '/worker/calendar', label: 'Booking Calendar' },
  { to: '/worker/services', label: 'Services & Pricing' },
  { to: '/worker/locations', label: 'Service Locations' },
  { to: '/worker/profile', label: 'Business Profile' },
  { to: '/worker/subscription', label: 'Subscription' },
];

interface WorkerShellPageProps {
  sectionTitle: string;
}

export function WorkerShellPage({ sectionTitle }: WorkerShellPageProps) {
  return (
    <WorkspaceLayout
      brandTitle="LankaWorks Worker"
      breadcrumb={`Worker Portal / ${sectionTitle}`}
      navItems={WORKER_NAV}
      primaryAction={{ label: 'Public Marketplace', to: '/' }}
    >
      <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-3">
        <p className="text-xs font-medium text-[#52525B]">
          Phase 02 Routing Shell · Scheduled for Phase 03 Auth & Phase 06–07
        </p>
        <h1 className="font-display text-2xl font-bold text-[#18181B]">
          {sectionTitle}
        </h1>
        <p className="text-sm text-[#52525B] max-w-2xl leading-relaxed">
          Worker authentication, approval status gating, profile setup, service
          management, and the Daily/Weekly/Monthly conflict-safe booking calendar
          will be activated after Phase 03 database and authentication setup.
        </p>
      </div>
    </WorkspaceLayout>
  );
}
