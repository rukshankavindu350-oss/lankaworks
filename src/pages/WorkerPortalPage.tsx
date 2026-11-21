import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { WorkspaceLayout, type WorkspaceNavItem } from '../components/layout/WorkspaceLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';

const WORKER_NAV: readonly WorkspaceNavItem[] = [
  { to: '/worker', label: 'Overview & Onboarding', end: true },
  { to: '/worker/bookings', label: 'Bookings' },
  { to: '/worker/calendar', label: 'Booking Calendar' },
  { to: '/worker/services', label: 'Services & Pricing' },
  { to: '/worker/locations', label: 'Service Locations' },
  { to: '/worker/profile', label: 'Business Profile' },
  { to: '/worker/subscription', label: 'Subscription' },
];

interface CatalogItem {
  id: string;
  name: string;
  provinceId?: string;
}

interface WorkerServiceDoc {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  priceLkr: number;
  durationMinutes: number;
  isActive: boolean;
}

function validateStrongPassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Include at least one uppercase letter.';
  if (!/[a-z]/.test(pw)) return 'Include at least one lowercase letter.';
  if (!/[0-9]/.test(pw)) return 'Include at least one number.';
  return null;
}

export function WorkerPortalPage({ sectionTitle }: { sectionTitle: string }) {
  const {
    authReady,
    firebaseUser,
    workerProfile,
    effectiveRole,
    loginWithEmail,
    registerAccount,
    loginWithGoogle,
    resendVerificationEmail,
    requestPasswordReset,
    refreshAccountState,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [workingHoursSummary, setWorkingHoursSummary] = useState('Mon–Sat 08:30–18:00');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [districts, setDistricts] = useState<CatalogItem[]>([]);
  const [provinces, setProvinces] = useState<CatalogItem[]>([]);

  const [myServices, setMyServices] = useState<WorkerServiceDoc[]>([]);
  const [svcTitle, setSvcTitle] = useState('');
  const [svcCategoryId, setSvcCategoryId] = useState('');
  const [svcPriceLkr, setSvcPriceLkr] = useState('2500');
  const [svcDuration, setSvcDuration] = useState('60');
  const [svcDescription, setSvcDescription] = useState('');

  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMyServices = useCallback(async () => {
    if (!firebaseUser) {
      setMyServices([]);
      return;
    }
    try {
      const snap = await getDocs(
        query(collection(db, 'services'), where('workerId', '==', firebaseUser.uid)),
      );
      setMyServices(
        snap.docs.map((d) => ({
          id: d.id,
          title: String(d.data().title || ''),
          categoryId: String(d.data().categoryId || ''),
          description: String(d.data().description || ''),
          priceLkr: Number(d.data().priceLkr || 0),
          durationMinutes: Number(d.data().durationMinutes || 60),
          isActive: Boolean(d.data().isActive),
        })),
      );
    } catch {
      setMyServices([]);
    }
  }, [firebaseUser]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [catSnap, provSnap, distSnap] = await Promise.all([
          getDocs(query(collection(db, 'categories'), orderBy('order', 'asc'))),
          getDocs(query(collection(db, 'locations_provinces'), orderBy('order', 'asc'))),
          getDocs(collection(db, 'locations_districts')),
        ]);
        const loadedCats = catSnap.docs.map((d) => ({ id: d.id, name: String(d.data().name) }));
        setCategories(loadedCats);
        if (loadedCats.length > 0) {
          setSvcCategoryId((prev) => prev || loadedCats[0].id);
        }
        setProvinces(provSnap.docs.map((d) => ({ id: d.id, name: String(d.data().name) })));
        setDistricts(
          distSnap.docs
            .map((d) => ({
              id: d.id,
              name: String(d.data().name),
              provinceId: String(d.data().provinceId),
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } catch {
        // Catalog may be empty before initial admin seed
      }
    }
    loadCatalog();
    loadMyServices();
  }, [loadMyServices]);

  useEffect(() => {
    if (workerProfile) {
      setBusinessName(workerProfile.businessName);
      setBio(workerProfile.bio);
      setWorkingHoursSummary(workerProfile.workingHoursSummary || 'Mon–Sat 08:30–18:00');
      setSelectedCategories(workerProfile.serviceCategoryIds);
      setSelectedDistricts(workerProfile.districtIds);
    }
  }, [workerProfile]);

  async function handleAuth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
        setStatusMessage('Signed in to Worker Portal.');
      } else if (mode === 'register') {
        const pwErr = validateStrongPassword(password);
        if (pwErr) {
          setErrorMessage(pwErr);
          setBusy(false);
          return;
        }
        await registerAccount({
          email,
          password,
          displayName,
          role: 'worker',
        });
        setStatusMessage('Worker account registered. Please verify your email before submitting your business profile.');
      } else {
        await requestPasswordReset(email);
        setStatusMessage('Password reset email sent.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitWorkerProfile(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!firebaseUser.emailVerified) {
      setErrorMessage('Please verify your email address before submitting your worker profile.');
      return;
    }
    if (selectedCategories.length === 0 || selectedDistricts.length === 0) {
      setErrorMessage('Select at least one service category and one district.');
      return;
    }
    const derivedProvinces = Array.from(
      new Set(
        districts
          .filter((d) => selectedDistricts.includes(d.id) && d.provinceId)
          .map((d) => d.provinceId!),
      ),
    );
    if (derivedProvinces.length === 0) {
      setErrorMessage('Unable to resolve province for selected districts.');
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    const workerRef = doc(db, 'workers', firebaseUser.uid);

    try {
      if (!workerProfile) {
        await setDoc(workerRef, {
          uid: firebaseUser.uid,
          businessName: businessName.trim().slice(0, 120),
          bio: bio.trim().slice(0, 1000),
          approvalStatus: 'pending',
          serviceCategoryIds: selectedCategories.slice(0, 10),
          provinceIds: derivedProvinces.slice(0, 9),
          districtIds: selectedDistricts.slice(0, 25),
          cityIds: [],
          workingHoursSummary: workingHoursSummary.trim().slice(0, 200),
          ratingAvg: 0,
          reviewCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setStatusMessage('Worker profile submitted for Administrator approval (Status: Pending).');
      } else {
        await updateDoc(workerRef, {
          businessName: businessName.trim().slice(0, 120),
          bio: bio.trim().slice(0, 1000),
          serviceCategoryIds: selectedCategories.slice(0, 10),
          provinceIds: derivedProvinces.slice(0, 9),
          districtIds: selectedDistricts.slice(0, 25),
          workingHoursSummary: workingHoursSummary.trim().slice(0, 200),
          updatedAt: serverTimestamp(),
        });
        setStatusMessage('Business profile updated.');
      }
      await refreshAccountState();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `workers/${firebaseUser.uid}`);
    } finally {
      setBusy(false);
    }
  }

  function toggleSelection(list: string[], id: string, max: number): string[] {
    if (list.includes(id)) {
      return list.filter((item) => item !== id);
    }
    if (list.length >= max) return list;
    return [...list, id];
  }

  return (
    <WorkspaceLayout
      brandTitle="LankaWorks Worker"
      breadcrumb={`Worker Portal / ${sectionTitle}`}
      navItems={WORKER_NAV}
      primaryAction={{ label: 'Public Marketplace', to: '/' }}
    >
      {!authReady ? (
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 text-sm text-[#52525B]">
          Loading Worker Portal...
        </div>
      ) : !firebaseUser ? (
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 sm:p-8 max-w-xl space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#52525B]">
              Service Provider Onboarding · First 5 Months Free
            </p>
            <h1 className="font-display text-2xl font-bold text-[#18181B]">
              Worker Sign In &amp; Registration
            </h1>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F4F4F5] rounded-lg">
            {(['signin', 'register', 'reset'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setMode(tab);
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  mode === tab
                    ? 'bg-white text-[#18181B] shadow-sm'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                {tab === 'signin' ? 'Sign In' : tab === 'register' ? 'Register Worker' : 'Reset Password'}
              </button>
            ))}
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

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label htmlFor="wrk-name" className="block text-xs font-medium text-[#18181B]">
                  Your Full Name
                </label>
                <input
                  id="wrk-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7]"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="wrk-email" className="block text-xs font-medium text-[#18181B]">
                Email Address
              </label>
              <input
                id="wrk-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7]"
              />
            </div>
            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <label htmlFor="wrk-pw" className="block text-xs font-medium text-[#18181B]">
                  Password
                </label>
                <input
                  id="wrk-pw"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7]"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50"
            >
              {busy ? 'Processing...' : mode === 'signin' ? 'Sign In' : mode === 'register' ? 'Register Worker Account' : 'Send Reset Link'}
            </button>
          </form>

          {mode !== 'reset' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => loginWithGoogle('worker')}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5]"
            >
              Continue with Google (Worker Account)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-[#52525B]">
                {firebaseUser.email} · Role: {effectiveRole} ·{' '}
                {firebaseUser.emailVerified ? 'Email Verified' : 'Email Verification Required'} · Approval:{' '}
                <strong className="text-[#18181B] capitalize">
                  {workerProfile?.approvalStatus || 'Profile Incomplete'}
                </strong>
              </p>
              <h1 className="font-display text-2xl font-bold text-[#18181B]">
                {workerProfile?.businessName || sectionTitle}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {!firebaseUser.emailVerified && (
                <>
                  <button
                    type="button"
                    onClick={() => resendVerificationEmail()}
                    className="px-4 py-2 text-xs font-medium rounded-lg bg-[#0F766E] text-white"
                  >
                    Resend Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => refreshAccountState()}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] bg-white"
                  >
                    Refresh Verification
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => logout()}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5]"
              >
                Sign Out
              </button>
            </div>
          </div>

          {!firebaseUser.emailVerified ? (
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-2">
              <h2 className="font-display text-lg font-semibold text-[#18181B]">
                Verify Your Email to Continue
              </h2>
              <p className="text-sm text-[#52525B]">
                Firestore security rules require a verified email address before submitting your worker business profile for Administrator approval.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitWorkerProfile}
              className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-5"
            >
              <div className="space-y-1">
                <h2 className="font-display text-lg font-semibold text-[#18181B]">
                  {workerProfile ? 'Update Business Profile' : 'Submit Business Profile for Approval'}
                </h2>
                <p className="text-xs text-[#52525B]">
                  New worker profiles enter Pending status until approved by an authorized Administrator.
                </p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="biz-name" className="block text-xs font-medium text-[#18181B]">
                    Business or Trade Name
                  </label>
                  <input
                    id="biz-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Colombo Rapid Electricals"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="biz-hours" className="block text-xs font-medium text-[#18181B]">
                    Working Hours Summary
                  </label>
                  <input
                    id="biz-hours"
                    type="text"
                    maxLength={200}
                    value={workingHoursSummary}
                    onChange={(e) => setWorkingHoursSummary(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="biz-bio" className="block text-xs font-medium text-[#18181B]">
                  Service Experience &amp; Description (min 10 chars)
                </label>
                <textarea
                  id="biz-bio"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Licensed electrician with 8 years experience across Colombo and Gampaha..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
                />
              </div>

              {categories.length === 0 || districts.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#F4F4F5] text-xs text-[#52525B]">
                  Service categories or Sri Lanka districts have not been seeded yet ({provinces.length} provinces, {districts.length} districts, {categories.length} categories). An Admin must run the Phase 03 catalog seed in the Admin Portal first.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#18181B]">
                      Service Categories ({selectedCategories.length}/10)
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-[#E4E4E7] rounded-lg p-3 space-y-2">
                      {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-2 text-xs text-[#18181B] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat.id)}
                            onChange={() =>
                              setSelectedCategories((prev) => toggleSelection(prev, cat.id, 10))
                            }
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#18181B]">
                      Sri Lanka Service Districts ({selectedDistricts.length}/25)
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-[#E4E4E7] rounded-lg p-3 grid grid-cols-2 gap-2">
                      {districts.map((dist) => (
                        <label key={dist.id} className="flex items-center gap-2 text-xs text-[#18181B] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDistricts.includes(dist.id)}
                            onChange={() =>
                              setSelectedDistricts((prev) => toggleSelection(prev, dist.id, 25))
                            }
                          />
                          <span>{dist.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy || categories.length === 0 || districts.length === 0}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50"
              >
                {busy ? 'Submitting...' : workerProfile ? 'Save Business Profile' : 'Submit for Approval'}
              </button>
            </form>
          )}

          {firebaseUser.emailVerified && workerProfile && (
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-semibold text-[#18181B]">
                  Service Listings
                </h2>
                <p className="text-xs text-[#52525B]">
                  {workerProfile.approvalStatus === 'approved'
                    ? 'Your business is approved. Active services appear on the public marketplace.'
                    : `Your approval status is "${workerProfile.approvalStatus}". You may save draft services (inactive) until an Administrator approves your profile.`}
                </p>
              </div>

              <form
                onSubmit={async (e: FormEvent) => {
                  e.preventDefault();
                  if (!firebaseUser || !workerProfile) return;
                  const price = Number(svcPriceLkr);
                  const duration = Number(svcDuration);
                  if (!svcCategoryId || Number.isNaN(price) || price <= 0) {
                    setErrorMessage('Provide a valid category and positive LKR price.');
                    return;
                  }
                  setBusy(true);
                  setErrorMessage(null);
                  setStatusMessage(null);
                  const svcId = `svc_${firebaseUser.uid.slice(0, 8)}_${Date.now()}`;
                  const canActivate = workerProfile.approvalStatus === 'approved';
                  try {
                    await setDoc(doc(db, 'services', svcId), {
                      workerId: firebaseUser.uid,
                      workerBusinessName: workerProfile.businessName,
                      categoryId: svcCategoryId,
                      title: svcTitle.trim().slice(0, 120),
                      description: svcDescription.trim().slice(0, 1500),
                      priceLkr: price,
                      durationMinutes: Number.isNaN(duration) ? 60 : Math.min(1440, Math.max(15, duration)),
                      provinceIds: workerProfile.provinceIds,
                      districtIds: workerProfile.districtIds,
                      cityIds: workerProfile.cityIds ?? [],
                      isActive: canActivate,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                    setSvcTitle('');
                    setSvcDescription('');
                    setStatusMessage(
                      canActivate
                        ? 'Service published to the marketplace.'
                        : 'Service saved as inactive draft pending Admin approval.',
                    );
                    await loadMyServices();
                  } catch (err) {
                    handleFirestoreError(err, OperationType.CREATE, `services/${svcId}`);
                  } finally {
                    setBusy(false);
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
              >
                <div className="space-y-1.5">
                  <label htmlFor="svc-title" className="block text-xs font-medium text-[#18181B]">
                    Service Title
                  </label>
                  <input
                    id="svc-title"
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    value={svcTitle}
                    onChange={(e) => setSvcTitle(e.target.value)}
                    placeholder="Residential Circuit Breaker Inspection"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="svc-cat" className="block text-xs font-medium text-[#18181B]">
                    Category
                  </label>
                  <select
                    id="svc-cat"
                    value={svcCategoryId}
                    onChange={(e) => setSvcCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7] bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="svc-price" className="block text-xs font-medium text-[#18181B]">
                    Price (LKR)
                  </label>
                  <input
                    id="svc-price"
                    type="number"
                    min={100}
                    max={10000000}
                    required
                    value={svcPriceLkr}
                    onChange={(e) => setSvcPriceLkr(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="svc-dur" className="block text-xs font-medium text-[#18181B]">
                    Estimated Duration (Minutes)
                  </label>
                  <input
                    id="svc-dur"
                    type="number"
                    min={15}
                    max={1440}
                    required
                    value={svcDuration}
                    onChange={(e) => setSvcDuration(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7] font-mono"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label htmlFor="svc-desc" className="block text-xs font-medium text-[#18181B]">
                    Service Scope &amp; Details (min 10 chars)
                  </label>
                  <textarea
                    id="svc-desc"
                    rows={2}
                    required
                    minLength={10}
                    maxLength={1500}
                    value={svcDescription}
                    onChange={(e) => setSvcDescription(e.target.value)}
                    placeholder="Includes wiring safety test, trip switch testing, and fault isolation report."
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={busy || categories.length === 0}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#18181B] text-white hover:bg-[#27272A] disabled:opacity-50"
                  >
                    {busy ? 'Saving...' : 'Add Service Listing'}
                  </button>
                </div>
              </form>

              {myServices.length > 0 && (
                <div className="pt-4 border-t border-[#E4E4E7] divide-y divide-[#E4E4E7]">
                  {myServices.map((svc) => (
                    <div key={svc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#18181B]">{svc.title}</p>
                        <p className="text-xs text-[#52525B] tabular-nums">
                          LKR {svc.priceLkr.toLocaleString()} · {svc.durationMinutes} min ·{' '}
                          {svc.isActive ? 'Published' : 'Draft / Inactive'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {workerProfile.approvalStatus === 'approved' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              try {
                                await updateDoc(doc(db, 'services', svc.id), {
                                  isActive: !svc.isActive,
                                  updatedAt: serverTimestamp(),
                                });
                                await loadMyServices();
                              } catch (err) {
                                handleFirestoreError(err, OperationType.UPDATE, `services/${svc.id}`);
                              } finally {
                                setBusy(false);
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5]"
                          >
                            {svc.isActive ? 'Unpublish' : 'Publish'}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await deleteDoc(doc(db, 'services', svc.id));
                              await loadMyServices();
                            } catch (err) {
                              handleFirestoreError(err, OperationType.DELETE, `services/${svc.id}`);
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#FECACA] text-[#B91C1C] bg-white hover:bg-[#FEF2F2]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </WorkspaceLayout>
  );
}
