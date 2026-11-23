import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const ADMIN_EMAIL = 'ruiqishi59@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Google Workspace OAuth scopes (least privilege: only gmail.send for feedback delivery)
export const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory only cache for OAuth access token (never persisted to localStorage/sessionStorage)
let cachedGmailAccessToken: string | null = null;
let isSigningInFlow = false;

export const getInMemoryGmailToken = (): string | null => {
  return cachedGmailAccessToken;
};

export const isAdminUser = (user: User | null | undefined): boolean => {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL && user.emailVerified === true;
};

export const signInWithGoogleFirebase = async (): Promise<{
  user: User;
  accessToken: string | null;
}> => {
  try {
    isSigningInFlow = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken) {
      cachedGmailAccessToken = accessToken;
    }
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  } finally {
    isSigningInFlow = false;
  }
};

export const ensureGmailSendToken = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  if (auth.currentUser && cachedGmailAccessToken) {
    return { user: auth.currentUser, accessToken: cachedGmailAccessToken };
  }
  const { user, accessToken } = await signInWithGoogleFirebase();
  if (!accessToken) {
    throw new Error('未能取得 Gmail 寄信授權存取權杖，請重新確認授權後再試。');
  }
  return { user, accessToken };
};

export const signOutFirebase = async (): Promise<void> => {
  cachedGmailAccessToken = null;
  await signOut(auth);
};

export const subscribeAuthState = (
  callback: (user: User | null, hasGmailToken: boolean) => void
) => {
  return onAuthStateChanged(auth, (user) => {
    if (!user && !isSigningInFlow) {
      cachedGmailAccessToken = null;
    }
    callback(user, Boolean(cachedGmailAccessToken));
  });
};

// Startup Firestore connection check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Structured Firestore Error Handler (per error-handling-and-sdk reference)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
