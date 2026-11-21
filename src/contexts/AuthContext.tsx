import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../lib/firebase.ts';
import type { UserRole, WorkerApprovalStatus } from '../shared/types.ts';

export interface UserProfileRecord {
  uid: string;
  role: UserRole;
  displayName: string;
  photoUrl?: string;
  status: 'active' | 'suspended';
}

export interface UserPrivateRecord {
  uid: string;
  email: string;
  phone?: string;
  address?: string;
  savedWorkerIds?: string[];
}

export interface StaffRoleRecord {
  uid: string;
  role: 'support' | 'admin' | 'super_admin';
  modules: string[];
  assignedBy: string;
}

export interface WorkerProfileRecord {
  uid: string;
  businessName: string;
  bio: string;
  photoUrl?: string;
  approvalStatus: WorkerApprovalStatus;
  serviceCategoryIds: string[];
  provinceIds: string[];
  districtIds: string[];
  cityIds?: string[];
  workingHoursSummary?: string;
  ratingAvg: number;
  reviewCount: number;
}

export interface ServerVerifiedSession {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isBootstrapSuperAdmin: boolean;
  bootstrapConfigured: boolean;
}

interface AuthContextValue {
  authReady: boolean;
  connectionOk: boolean | null;
  connectionError: string | null;
  firebaseUser: User | null;
  userProfile: UserProfileRecord | null;
  userPrivateInfo: UserPrivateRecord | null;
  staffRole: StaffRoleRecord | null;
  workerProfile: WorkerProfileRecord | null;
  serverSession: ServerVerifiedSession | null;
  effectiveRole: UserRole;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerAccount: (params: {
    email: string;
    password: string;
    displayName: string;
    role: 'customer' | 'worker';
  }) => Promise<void>;
  loginWithGoogle: (defaultRole?: 'customer' | 'worker' | 'admin_only') => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updateCustomerPrivateProfile: (params: {
    displayName: string;
    phone: string;
    address: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccountState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileRecord | null>(null);
  const [userPrivateInfo, setUserPrivateInfo] = useState<UserPrivateRecord | null>(null);
  const [staffRole, setStaffRole] = useState<StaffRoleRecord | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileRecord | null>(null);
  const [serverSession, setServerSession] = useState<ServerVerifiedSession | null>(null);

  const loadUserRecords = useCallback(async (user: User | null) => {
    if (!user) {
      setUserProfile(null);
      setUserPrivateInfo(null);
      setStaffRole(null);
      setWorkerProfile(null);
      setServerSession(null);
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const verifyRes = await fetch('/api/auth/session-verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (verifyRes.ok) {
        const verified = (await verifyRes.json()) as ServerVerifiedSession;
        setServerSession(verified);
      } else {
        setServerSession(null);
      }
    } catch {
      setServerSession(null);
    }

    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      setUserProfile(
        userSnap.exists() ? (userSnap.data() as UserProfileRecord) : null,
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    }

    try {
      const privateSnap = await getDoc(doc(db, 'users', user.uid, 'private', 'info'));
      setUserPrivateInfo(
        privateSnap.exists() ? (privateSnap.data() as UserPrivateRecord) : null,
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `users/${user.uid}/private/info`,
      );
    }

    try {
      const staffSnap = await getDoc(doc(db, 'staff_roles', user.uid));
      setStaffRole(
        staffSnap.exists() ? (staffSnap.data() as StaffRoleRecord) : null,
      );
    } catch {
      setStaffRole(null);
    }

    try {
      const workerSnap = await getDoc(doc(db, 'workers', user.uid));
      setWorkerProfile(
        workerSnap.exists() ? (workerSnap.data() as WorkerProfileRecord) : null,
      );
    } catch {
      setWorkerProfile(null);
    }
  }, []);

  useEffect(() => {
    testConnection().then((result) => {
      setConnectionOk(result.ok);
      setConnectionError(result.error ?? null);
    });

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      await loadUserRecords(user);
      setAuthReady(true);
    });

    return () => unsub();
  }, [loadUserRecords]);

  const refreshAccountState = useCallback(async () => {
    if (!auth.currentUser) {
      await loadUserRecords(null);
      return;
    }
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    setFirebaseUser(auth.currentUser);
    await loadUserRecords(auth.currentUser);
  }, [loadUserRecords]);

  const ensureStandardProfileDocs = useCallback(
    async (user: User, role: 'customer' | 'worker', displayName: string) => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            uid: user.uid,
            role,
            displayName: displayName.trim().slice(0, 100) || 'LankaWorks User',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
        }
      }

      const privRef = doc(db, 'users', user.uid, 'private', 'info');
      const privSnap = await getDoc(privRef);
      if (!privSnap.exists() && user.email) {
        try {
          await setDoc(privRef, {
            uid: user.uid,
            email: user.email,
            phone: '',
            address: '',
            savedWorkerIds: [],
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(
            error,
            OperationType.CREATE,
            `users/${user.uid}/private/info`,
          );
        }
      }
    },
    [],
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await loadUserRecords(cred.user);
    },
    [loadUserRecords],
  );

  const registerAccount = useCallback(
    async ({
      email,
      password,
      displayName,
      role,
    }: {
      email: string;
      password: string;
      displayName: string;
      role: 'customer' | 'worker';
    }) => {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      await updateProfile(cred.user, {
        displayName: displayName.trim().slice(0, 100),
      });
      await sendEmailVerification(cred.user);
      await ensureStandardProfileDocs(cred.user, role, displayName);
      await loadUserRecords(cred.user);
    },
    [ensureStandardProfileDocs, loadUserRecords],
  );

  const loginWithGoogle = useCallback(
    async (defaultRole: 'customer' | 'worker' | 'admin_only' = 'customer') => {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      if (defaultRole !== 'admin_only') {
        await ensureStandardProfileDocs(
          cred.user,
          defaultRole,
          cred.user.displayName || 'LankaWorks User',
        );
      }
      await loadUserRecords(cred.user);
    },
    [ensureStandardProfileDocs, loadUserRecords],
  );

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user.');
    }
    await sendEmailVerification(auth.currentUser);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const updateCustomerPrivateProfile = useCallback(
    async ({
      displayName,
      phone,
      address,
    }: {
      displayName: string;
      phone: string;
      address: string;
    }) => {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('Sign in required.');
      }
      const uid = auth.currentUser.uid;
      try {
        await updateDoc(doc(db, 'users', uid), {
          displayName: displayName.trim().slice(0, 100),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }

      try {
        await setDoc(
          doc(db, 'users', uid, 'private', 'info'),
          {
            uid,
            email: auth.currentUser.email,
            phone: phone.trim().slice(0, 30),
            address: address.trim().slice(0, 300),
            savedWorkerIds: userPrivateInfo?.savedWorkerIds ?? [],
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `users/${uid}/private/info`,
        );
      }

      await loadUserRecords(auth.currentUser);
    },
    [loadUserRecords, userPrivateInfo?.savedWorkerIds],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    await loadUserRecords(null);
  }, [loadUserRecords]);

  let effectiveRole: UserRole = 'guest';
  if (firebaseUser) {
    if (serverSession?.isBootstrapSuperAdmin || staffRole?.role === 'super_admin') {
      effectiveRole = 'super_admin';
    } else if (staffRole?.role === 'admin') {
      effectiveRole = 'admin';
    } else if (staffRole?.role === 'support') {
      effectiveRole = 'support';
    } else if (userProfile?.role) {
      effectiveRole = userProfile.role;
    } else {
      effectiveRole = 'customer';
    }
  }

  return (
    <AuthContext.Provider
      value={{
        authReady,
        connectionOk,
        connectionError,
        firebaseUser,
        userProfile,
        userPrivateInfo,
        staffRole,
        workerProfile,
        serverSession,
        effectiveRole,
        loginWithEmail,
        registerAccount,
        loginWithGoogle,
        resendVerificationEmail,
        requestPasswordReset,
        updateCustomerPrivateProfile,
        logout,
        refreshAccountState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
