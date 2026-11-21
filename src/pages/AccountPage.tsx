import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

type AuthMode = 'signin' | 'register' | 'reset';

function validateStrongPassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Include at least one uppercase letter.';
  if (!/[a-z]/.test(pw)) return 'Include at least one lowercase letter.';
  if (!/[0-9]/.test(pw)) return 'Include at least one number.';
  return null;
}

function formatAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('auth/operation-not-allowed')) {
    return 'Email/Password sign-in is not yet enabled in Firebase Console → Authentication → Sign-in method. You can use Google Sign-In now or enable Email/Password in Firebase Console.';
  }
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
    return 'Invalid email or password.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists.';
  }
  if (raw.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  return raw;
}

export function AccountPage() {
  const {
    authReady,
    firebaseUser,
    userProfile,
    userPrivateInfo,
    effectiveRole,
    loginWithEmail,
    registerAccount,
    loginWithGoogle,
    resendVerificationEmail,
    requestPasswordReset,
    updateCustomerPrivateProfile,
    logout,
    refreshAccountState,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(userProfile?.displayName || firebaseUser?.displayName || '');
    setPhone(userPrivateInfo?.phone || '');
    setAddress(userPrivateInfo?.address || '');
  }, [firebaseUser?.displayName, userPrivateInfo?.address, userPrivateInfo?.phone, userProfile?.displayName]);

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
        setStatusMessage('Signed in successfully.');
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
          role: 'customer',
        });
        setStatusMessage('Account created. A verification link has been sent to your email.');
      } else {
        await requestPasswordReset(email);
        setStatusMessage('Password reset email sent. Check your inbox.');
      }
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setErrorMessage(null);
    setStatusMessage(null);
    setBusy(true);
    try {
      await loginWithGoogle('customer');
      setStatusMessage('Signed in with Google.');
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setBusy(true);
    try {
      await updateCustomerPrivateProfile({ displayName, phone, address });
      setStatusMessage('Profile details saved securely.');
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#52525B]">
            Customer Account · Optional Registration
          </p>
          <h1 className="font-display text-3xl font-bold text-[#18181B]">
            {firebaseUser ? 'Your Customer Account' : 'Sign In or Create a Customer Account'}
          </h1>
          <p className="text-sm text-[#52525B] leading-relaxed">
            Customers can always browse and book as guests for free.{' '}
            <Link to="/track-booking" className="text-[#0F766E] underline underline-offset-4">
              Track a guest booking with Reference &amp; PIN
            </Link>
            .
          </p>
        </div>

        {!authReady ? (
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 text-sm text-[#52525B]">
            Checking authentication status...
          </div>
        ) : !firebaseUser ? (
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 sm:p-8 space-y-6 max-w-xl">
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
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    mode === tab
                      ? 'bg-white text-[#18181B] shadow-sm'
                      : 'text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {tab === 'signin'
                    ? 'Sign In'
                    : tab === 'register'
                      ? 'Register'
                      : 'Reset Password'}
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

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label htmlFor="cust-name" className="block text-xs font-medium text-[#18181B]">
                    Full Name
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    maxLength={100}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Kamal Perera"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="cust-email" className="block text-xs font-medium text-[#18181B]">
                  Email Address
                </label>
                <input
                  id="cust-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              {mode !== 'reset' && (
                <div className="space-y-1.5">
                  <label htmlFor="cust-password" className="block text-xs font-medium text-[#18181B]">
                    Password
                  </label>
                  <input
                    id="cust-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Min 8 chars, upper, lower & number' : 'Enter password'}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50 transition-colors"
              >
                {busy
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign In'
                    : mode === 'register'
                      ? 'Create Free Customer Account'
                      : 'Send Password Reset Link'}
              </button>
            </form>

            {mode !== 'reset' && (
              <div className="pt-4 border-t border-[#E4E4E7] space-y-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleGoogle}
                  className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] bg-white text-[#18181B] hover:bg-[#F4F4F5] disabled:opacity-50 transition-colors"
                >
                  Continue with Google
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-[#52525B]">
                  Signed in as {firebaseUser.email} · Role: {effectiveRole} ·{' '}
                  {firebaseUser.emailVerified ? 'Email Verified' : 'Email Unverified'}
                </p>
                <p className="font-display text-xl font-bold text-[#18181B]">
                  {userProfile?.displayName || firebaseUser.displayName || 'Customer'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!firebaseUser.emailVerified && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setErrorMessage(null);
                        try {
                          await resendVerificationEmail();
                          setStatusMessage('Verification email sent. Check your inbox.');
                        } catch (err) {
                          setErrorMessage(formatAuthError(err));
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59]"
                    >
                      Resend Verification Email
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => refreshAccountState()}
                      className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5]"
                    >
                      Refresh Status
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

            <form
              onSubmit={handleProfileSave}
              className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-4 max-w-xl"
            >
              <h2 className="font-display text-lg font-semibold text-[#18181B]">
                Private Contact Information
              </h2>
              <p className="text-xs text-[#52525B]">
                Stored in an owner-only private subcollection protected by Firestore Security Rules.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="prof-name" className="block text-xs font-medium text-[#18181B]">
                  Display Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7] bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="prof-phone" className="block text-xs font-medium text-[#18181B]">
                  Phone Number
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7] bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="prof-address" className="block text-xs font-medium text-[#18181B]">
                  Address
                </label>
                <input
                  id="prof-address"
                  type="text"
                  maxLength={300}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Colombo 05, Western Province"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7] bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50"
              >
                {busy ? 'Saving...' : 'Save Contact Details'}
              </button>
            </form>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
