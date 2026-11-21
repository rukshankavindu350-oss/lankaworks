import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { WorkspaceLayout, type WorkspaceNavItem } from '../components/layout/WorkspaceLayout.tsx';
import { useAuth, type WorkerProfileRecord } from '../contexts/AuthContext.tsx';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import {
  fetchSeedCounts,
  seedSriLankaLocationsAndCategories,
  type SeedStatusSummary,
} from '../lib/firestoreSeed.ts';
import type { WorkerApprovalStatus } from '../shared/types.ts';

const ADMIN_NAV: readonly WorkspaceNavItem[] = [
  { to: '/admin', label: 'Dashboard & Phase 03 Setup', end: true },
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

export function AdminPortalPage({ sectionTitle }: { sectionTitle: string }) {
  const {
    authReady,
    connectionOk,
    connectionError,
    firebaseUser,
    staffRole,
    serverSession,
    effectiveRole,
    loginWithEmail,
    loginWithGoogle,
    logout,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [seedSummary, setSeedSummary] = useState<SeedStatusSummary | null>(null);
  const [workers, setWorkers] = useState<WorkerProfileRecord[]>([]);
  const [staffUidInput, setStaffUidInput] = useState('');
  const [staffRoleSelect, setStaffRoleSelect] = useState<'support' | 'admin'>('support');
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAuthorizedAdmin =
    Boolean(firebaseUser?.emailVerified) &&
    (effectiveRole === 'super_admin' ||
      effectiveRole === 'admin' ||
      effectiveRole === 'support');

  const isSuperAdmin =
    Boolean(firebaseUser?.emailVerified) && effectiveRole === 'super_admin';

  const loadAdminData = useCallback(async () => {
    if (!isAuthorizedAdmin) return;
    try {
      const counts = await fetchSeedCounts();
      setSeedSummary(counts);
    } catch {
      // Handled via ErrorBoundary or state
    }

    if (effectiveRole === 'super_admin' || serverSession?.isBootstrapSuperAdmin) {
      try {
        const snap = await getDocs(collection(db, 'workers'));
        setWorkers(snap.docs.map((d) => d.data() as WorkerProfileRecord));
      } catch {
        setWorkers([]);
      }
    }
  }, [effectiveRole, isAuthorizedAdmin, serverSession?.isBootstrapSuperAdmin]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function handleAdminSignIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSeedCatalog() {
    if (!firebaseUser || (effectiveRole !== 'admin' && effectiveRole !== 'super_admin')) {
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const result = await seedSriLankaLocationsAndCategories(
        firebaseUser.uid,
        effectiveRole,
      );
      setSeedSummary(result);
      setStatusMessage(
        `Seeded ${result.provincesCount} provinces, ${result.districtsCount} districts, ${result.citiesCount} cities, and ${result.categoriesCount} categories.`,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleWorkerApproval(
    workerUid: string,
    nextStatus: WorkerApprovalStatus,
  ) {
    if (!firebaseUser || (effectiveRole !== 'admin' && effectiveRole !== 'super_admin')) {
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'workers', workerUid), {
        approvalStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'audit_logs', `wrk_${workerUid}_${Date.now()}`), {
        actorUid: firebaseUser.uid,
        actorRole: effectiveRole,
        action: `worker_${nextStatus}`,
        targetType: 'worker',
        targetId: workerUid,
        summary: `Updated worker ${workerUid} approval status to ${nextStatus}.`,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setStatusMessage(`Worker ${workerUid} updated to ${nextStatus}.`);
      await loadAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workers/${workerUid}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignStaff(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !isSuperAdmin) return;
    const targetUid = staffUidInput.trim();
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(targetUid)) {
      setErrorMessage('Invalid Target User UID.');
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await setDoc(doc(db, 'staff_roles', targetUid), {
        uid: targetUid,
        role: staffRoleSelect,
        modules:
          staffRoleSelect === 'admin'
            ? ['workers', 'categories', 'locations', 'bookings', 'reviews', 'cms']
            : ['support', 'bookings', 'reviews'],
        assignedBy: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', targetUid), {
        role: staffRoleSelect,
        updatedAt: serverTimestamp(),
      });
      setStatusMessage(`Assigned ${staffRoleSelect} role to ${targetUid}.`);
      setStaffUidInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `staff_roles/${targetUid}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceLayout
      brandTitle="LankaWorks Admin"
      breadcrumb={`Admin Portal / ${sectionTitle}`}
      navItems={ADMIN_NAV}
    >
      {!authReady ? (
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 text-sm text-[#52525B]">
          Verifying Administrative Session...
        </div>
      ) : !firebaseUser ? (
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 sm:p-8 max-w-md space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#52525B]">
              Restricted Access · No Public Registration
            </p>
            <h1 className="font-display text-2xl font-bold text-[#18181B]">
              Administrator Sign In
            </h1>
            <p className="text-xs text-[#52525B]">
              Only verified staff or the server-configured Super Admin account can access this portal.
            </p>
          </div>

          {errorMessage && (
            <div role="alert" className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="adm-email" className="block text-xs font-medium text-[#18181B]">
                Staff Email
              </label>
              <input
                id="adm-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="adm-pw" className="block text-xs font-medium text-[#18181B]">
                Password
              </label>
              <input
                id="adm-pw"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-[#18181B] text-white hover:bg-[#27272A]"
            >
              Sign In
            </button>
          </form>

          <button
            type="button"
            disabled={busy}
            onClick={() => loginWithGoogle('admin_only')}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5]"
          >
            Sign In with Verified Google Account
          </button>
        </div>
      ) : !isAuthorizedAdmin ? (
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 max-w-lg space-y-4">
          <h1 className="font-display text-xl font-bold text-[#18181B]">
            Access Denied
          </h1>
          <p className="text-sm text-[#52525B]">
            Signed in as {firebaseUser.email} (Role: {effectiveRole}, Email Verified:{' '}
            {firebaseUser.emailVerified ? 'Yes' : 'No'}). Administrative privileges require server-verified Super Admin or assigned staff permissions.
          </p>
          {serverSession && !serverSession.bootstrapConfigured && (
            <p className="text-xs text-[#D97706]">
              Note: Server environment variable INITIAL_SUPER_ADMIN_EMAIL is not configured in Secrets yet.
            </p>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5]"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-[#52525B]">
                Authenticated: {firebaseUser.email} · Role: {effectiveRole} · Server Token Verified:{' '}
                {serverSession ? 'Yes' : 'No'} · Staff Doc: {staffRole ? staffRole.role : 'Bootstrap'}
              </p>
              <h1 className="font-display text-2xl font-bold text-[#18181B]">
                {sectionTitle}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] shrink-0"
            >
              Sign Out
            </button>
          </div>

          {errorMessage && (
            <div role="alert" className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
              {errorMessage}
            </div>
          )}
          {statusMessage && (
            <div role="status" className="p-3 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] text-xs text-[#0F766E]">
              {statusMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-[#18181B]">
                Firestore &amp; Sri Lanka Catalog Seed
              </h2>
              <p className="text-xs text-[#52525B]">
                Firestore Connection:{' '}
                {connectionOk === true
                  ? 'Connected'
                  : connectionOk === false
                    ? `Issue (${connectionError})`
                    : 'Checking...'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm tabular-nums">
                <div className="p-3 rounded-lg bg-[#FAFAF9] border border-[#E4E4E7]">
                  <p className="text-xs text-[#52525B]">Provinces</p>
                  <p className="font-display text-xl font-bold">{seedSummary?.provincesCount ?? '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAFAF9] border border-[#E4E4E7]">
                  <p className="text-xs text-[#52525B]">Districts</p>
                  <p className="font-display text-xl font-bold">{seedSummary?.districtsCount ?? '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAFAF9] border border-[#E4E4E7]">
                  <p className="text-xs text-[#52525B]">Cities</p>
                  <p className="font-display text-xl font-bold">{seedSummary?.citiesCount ?? '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAFAF9] border border-[#E4E4E7]">
                  <p className="text-xs text-[#52525B]">Categories</p>
                  <p className="font-display text-xl font-bold">{seedSummary?.categoriesCount ?? '—'}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleSeedCatalog}
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50"
              >
                {busy ? 'Seeding...' : 'Seed 9 Provinces, 25 Districts & Categories'}
              </button>
            </div>

            {isSuperAdmin && (
              <form
                onSubmit={handleAssignStaff}
                className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-4"
              >
                <h2 className="font-display text-lg font-semibold text-[#18181B]">
                  Assign Staff Role (Super Admin Only)
                </h2>
                <p className="text-xs text-[#52525B]">
                  Grant Support Staff or Admin access to an existing verified user UID.
                </p>
                <div className="space-y-1.5">
                  <label htmlFor="staff-uid" className="block text-xs font-medium text-[#18181B]">
                    User UID
                  </label>
                  <input
                    id="staff-uid"
                    type="text"
                    required
                    value={staffUidInput}
                    onChange={(e) => setStaffUidInput(e.target.value)}
                    placeholder="Firebase User UID"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E4E7] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="staff-role" className="block text-xs font-medium text-[#18181B]">
                    Role
                  </label>
                  <select
                    id="staff-role"
                    value={staffRoleSelect}
                    onChange={(e) => setStaffRoleSelect(e.target.value as 'support' | 'admin')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E4E7] bg-white"
                  >
                    <option value="support">Support Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2.5 text-sm font-medium rounded-lg bg-[#18181B] text-white hover:bg-[#27272A]"
                >
                  Assign Staff Role
                </button>
              </form>
            )}
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#18181B]">
              Worker Approval Queue
            </h2>
            {workers.length === 0 ? (
              <p className="text-sm text-[#52525B]">
                No worker applications submitted yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E4E4E7]">
                {workers.map((w) => (
                  <div
                    key={w.uid}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#18181B]">
                        {w.businessName}
                      </p>
                      <p className="text-xs text-[#52525B] font-mono">
                        {w.uid} · Status: {w.approvalStatus}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['approved', 'rejected', 'suspended'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={busy || w.approvalStatus === st}
                          onClick={() => handleWorkerApproval(w.uid, st)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] capitalize disabled:opacity-40"
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
