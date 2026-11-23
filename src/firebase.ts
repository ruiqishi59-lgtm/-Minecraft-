import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { DeviceCategory } from './utils/device';
import { BlockType, InventoryItem, WorldSaveData } from './types';

export const ADMIN_EMAIL = 'ruiqishi59@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(
  app,
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)'
);
export const auth = getAuth(app);

// Google Workspace OAuth scopes (least privilege: only gmail.send for feedback delivery)
export const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory only cache for OAuth access token (never persisted to localStorage/sessionStorage)
let cachedGmailAccessToken: string | null = null;
let tokenAutoLockTimer: ReturnType<typeof setTimeout> | null = null;
let configuredAutoLockMinutes = 10;
let isSigningInFlow = false;

const tokenListeners = new Set<(hasToken: boolean) => void>();

function notifyTokenListeners() {
  const has = Boolean(cachedGmailAccessToken);
  tokenListeners.forEach((cb) => cb(has));
}

export const subscribeTokenState = (cb: (hasToken: boolean) => void) => {
  tokenListeners.add(cb);
  cb(Boolean(cachedGmailAccessToken));
  return () => {
    tokenListeners.delete(cb);
  };
};

function clearAutoLockTimer() {
  if (tokenAutoLockTimer !== null) {
    clearTimeout(tokenAutoLockTimer);
    tokenAutoLockTimer = null;
  }
}

export function setConfiguredAutoLockMinutes(minutes: number) {
  if ([0, 5, 10, 30].includes(minutes)) {
    configuredAutoLockMinutes = minutes;
    if (cachedGmailAccessToken) {
      scheduleTokenAutoLock();
    }
  }
}

function scheduleTokenAutoLock() {
  clearAutoLockTimer();
  if (!cachedGmailAccessToken || configuredAutoLockMinutes <= 0) return;
  tokenAutoLockTimer = setTimeout(() => {
    cachedGmailAccessToken = null;
    clearAutoLockTimer();
    notifyTokenListeners();
  }, configuredAutoLockMinutes * 60 * 1000);
}

function setInMemoryGmailToken(token: string | null) {
  cachedGmailAccessToken = token;
  if (token) {
    scheduleTokenAutoLock();
  } else {
    clearAutoLockTimer();
  }
  notifyTokenListeners();
}

export const getInMemoryGmailToken = (): string | null => {
  return cachedGmailAccessToken;
};

export const isVerifiedGoogleUser = (user: User | null | undefined): boolean => {
  if (!user || !user.email || !user.emailVerified) return false;
  return user.providerData.some((p) => p.providerId === 'google.com');
};

export const isAdminUser = (user: User | null | undefined): boolean => {
  if (!isVerifiedGoogleUser(user) || !user?.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL;
};

export const signInWithGoogleFirebase = async (): Promise<{
  user: User;
  accessToken: string | null;
}> => {
  try {
    isSigningInFlow = true;
    const result = await signInWithPopup(auth, provider);
    if (!isVerifiedGoogleUser(result.user)) {
      await signOut(auth);
      throw new Error('僅限使用已驗證的 Google 帳號登入，已阻擋未驗證來源。');
    }
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken) {
      setInMemoryGmailToken(accessToken);
    }
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  } finally {
    isSigningInFlow = false;
  }
};

export const reauthenticateWithGoogle = async (): Promise<{
  user: User;
  accessToken: string | null;
}> => {
  if (!auth.currentUser) {
    return signInWithGoogleFirebase();
  }
  try {
    isSigningInFlow = true;
    const result = await reauthenticateWithPopup(auth.currentUser, provider);
    if (!isVerifiedGoogleUser(result.user)) {
      await signOut(auth);
      throw new Error('身分重新驗證未通過（需使用已驗證的 Google 帳號）。');
    }
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken) {
      setInMemoryGmailToken(accessToken);
    }
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Google Re-auth error:', error);
    throw error;
  } finally {
    isSigningInFlow = false;
  }
};

export const ensureGmailSendToken = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  if (auth.currentUser && isVerifiedGoogleUser(auth.currentUser) && cachedGmailAccessToken) {
    scheduleTokenAutoLock();
    return { user: auth.currentUser, accessToken: cachedGmailAccessToken };
  }
  const { user, accessToken } = await signInWithGoogleFirebase();
  if (!accessToken) {
    throw new Error('未能取得 Gmail 寄信授權存取權杖，請重新確認授權後再試。');
  }
  return { user, accessToken };
};

export const revokeGmailAccessToken = async (): Promise<boolean> => {
  const token = cachedGmailAccessToken;
  setInMemoryGmailToken(null);
  if (!token) return true;
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `token=${encodeURIComponent(token)}`
    });
    return true;
  } catch {
    return false;
  }
};

export const signOutFirebase = async (): Promise<void> => {
  await revokeGmailAccessToken();
  await signOut(auth);
};

export const subscribeAuthState = (
  callback: (user: User | null, hasGmailToken: boolean) => void
) => {
  return onAuthStateChanged(auth, (user) => {
    if (!user && !isSigningInFlow) {
      setInMemoryGmailToken(null);
    }
    callback(user, Boolean(cachedGmailAccessToken));
  });
};

// User Security Profile & Tamper-Evident Security Audit Log
export interface UserSecurityProfileDoc {
  uid: string;
  email: string;
  autoLockMinutes: number;
  requireReauthForSensitiveActions: boolean;
  lastVerifiedDevice: DeviceCategory;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type SecurityEventType =
  | 'sign_in'
  | 'reauth_verified'
  | 'gmail_send'
  | 'admin_mail'
  | 'token_revoked'
  | 'settings_updated'
  | 'world_cloud_save'
  | 'world_cloud_delete';

export interface SecurityLogDoc {
  id: string;
  uid: string;
  eventType: SecurityEventType;
  deviceType: DeviceCategory;
  detail: string;
  createdAt: Timestamp | null;
}

export async function ensureUserSecurityProfile(
  user: User,
  deviceType: DeviceCategory
): Promise<UserSecurityProfileDoc | null> {
  if (!isVerifiedGoogleUser(user) || !user.email) return null;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email.toLowerCase(),
        autoLockMinutes: 10,
        requireReauthForSensitiveActions: true,
        lastVerifiedDevice: deviceType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      configuredAutoLockMinutes = 10;
      return {
        uid: user.uid,
        email: user.email.toLowerCase(),
        autoLockMinutes: 10,
        requireReauthForSensitiveActions: true,
        lastVerifiedDevice: deviceType,
        createdAt: null,
        updatedAt: null
      };
    }
    const data = snap.data();
    const autoLockMinutes =
      typeof data.autoLockMinutes === 'number' && [0, 5, 10, 30].includes(data.autoLockMinutes)
        ? data.autoLockMinutes
        : 10;
    setConfiguredAutoLockMinutes(autoLockMinutes);
    return {
      uid: String(data.uid || user.uid),
      email: String(data.email || user.email.toLowerCase()),
      autoLockMinutes,
      requireReauthForSensitiveActions: Boolean(data.requireReauthForSensitiveActions),
      lastVerifiedDevice: (data.lastVerifiedDevice as DeviceCategory) || deviceType,
      createdAt: (data.createdAt as Timestamp | null) || null,
      updatedAt: (data.updatedAt as Timestamp | null) || null
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  }
}

export async function updateUserSecuritySettings(
  user: User,
  updates: {
    autoLockMinutes?: number;
    requireReauthForSensitiveActions?: boolean;
    lastVerifiedDevice?: DeviceCategory;
  }
): Promise<void> {
  if (!isVerifiedGoogleUser(user)) {
    throw new Error('需先通過 Google 帳號驗證才可更新安全設定。');
  }
  const userRef = doc(db, 'users', user.uid);
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  };
  if (typeof updates.autoLockMinutes === 'number' && [0, 5, 10, 30].includes(updates.autoLockMinutes)) {
    payload.autoLockMinutes = updates.autoLockMinutes;
    setConfiguredAutoLockMinutes(updates.autoLockMinutes);
  }
  if (typeof updates.requireReauthForSensitiveActions === 'boolean') {
    payload.requireReauthForSensitiveActions = updates.requireReauthForSensitiveActions;
  }
  if (updates.lastVerifiedDevice) {
    payload.lastVerifiedDevice = updates.lastVerifiedDevice;
  }
  try {
    await updateDoc(userRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
  }
}

export async function logSecurityEvent(
  user: User | null | undefined,
  eventType: SecurityEventType,
  deviceType: DeviceCategory,
  detail: string
): Promise<void> {
  if (!user || !isVerifiedGoogleUser(user)) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await ensureUserSecurityProfile(user, deviceType);
    }
    const logRef = doc(collection(db, 'users', user.uid, 'security_logs'));
    await setDoc(logRef, {
      uid: user.uid,
      eventType,
      deviceType,
      detail: detail.slice(0, 200) || eventType,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Security log write skipped:', err);
  }
}

// ============================================================
// Firestore Cloud World Saves (/users/{userId}/worlds/{worldId})
// ============================================================
const ALLOWED_WORLD_TYPES = new Set(['default', 'flat', 'mountains', 'heaven', 'fusion']);
const ALLOWED_GAME_MODES = new Set(['survival', 'creative']);
const ALLOWED_DIFFICULTIES = new Set(['peaceful', 'easy', 'normal', 'hard']);
const ALLOWED_WEATHERS = new Set(['clear', 'rain', 'thunder']);
const FORBIDDEN_BLOCK_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function normalizeCloudWorldId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `world_${Date.now()}`;
}

function sanitizeInventorySlot(slot: InventoryItem | null | undefined): Record<string, unknown> | null {
  if (!slot || typeof slot !== 'object') return null;
  const clean: Record<string, unknown> = {
    id: String(slot.id || '').slice(0, 64),
    name: String(slot.name || '').slice(0, 64),
    count: Math.max(1, Math.min(999, Math.floor(Number(slot.count) || 1))),
    maxStack: Math.max(1, Math.min(999, Math.floor(Number(slot.maxStack) || 64))),
    type: slot.type === 'tool' || slot.type === 'material' || slot.type === 'spawn_egg' ? slot.type : 'block',
    iconColor: String(slot.iconColor || '#888888').slice(0, 32)
  };
  if (slot.blockType) clean.blockType = String(slot.blockType).slice(0, 32);
  if (slot.toolType) clean.toolType = String(slot.toolType).slice(0, 16);
  if (slot.toolTier) clean.toolTier = String(slot.toolTier).slice(0, 16);
  if (typeof slot.damage === 'number' && Number.isFinite(slot.damage)) clean.damage = slot.damage;
  if (slot.spawnMobType) clean.spawnMobType = String(slot.spawnMobType).slice(0, 32);
  if (slot.eggSecondaryColor) clean.eggSecondaryColor = String(slot.eggSecondaryColor).slice(0, 32);
  if (slot.iconSymbol) clean.iconSymbol = String(slot.iconSymbol).slice(0, 16);
  return clean;
}

function buildValidatedCloudWorldPayload(user: User, world: WorldSaveData) {
  const safeId = normalizeCloudWorldId(world.id);
  const safeName = (world.name || '我的雲端世界').trim().slice(0, 64) || '我的雲端世界';
  const safeGameMode = ALLOWED_GAME_MODES.has(world.gameMode) ? world.gameMode : 'survival';
  const safeDifficulty = world.difficulty && ALLOWED_DIFFICULTIES.has(world.difficulty) ? world.difficulty : 'normal';
  const safeWorldType = ALLOWED_WORLD_TYPES.has(world.worldType) ? world.worldType : 'default';
  const safeWeather = ALLOWED_WEATHERS.has(world.weather) ? world.weather : 'clear';
  const safeSeed = Number.isFinite(world.seed) ? Math.floor(world.seed) : 88888;
  const rawTime = Number.isFinite(world.timeOfDay) ? world.timeOfDay : 0.25;
  const safeTimeOfDay = Math.max(0, Math.min(1, rawTime > 1 ? (rawTime % 24) / 24 : rawTime));

  const rawInv = Array.isArray(world.player?.inventory) ? world.player.inventory.slice(0, 36) : [];
  const safeInventory: Array<Record<string, unknown> | null> = [];
  for (let i = 0; i < 36; i++) {
    safeInventory.push(sanitizeInventorySlot(rawInv[i]));
  }

  const safeModifiedBlocks: Record<string, string> = {};
  if (world.modifiedBlocks && typeof world.modifiedBlocks === 'object') {
    let count = 0;
    for (const [k, v] of Object.entries(world.modifiedBlocks)) {
      if (count >= 15000) break;
      if (FORBIDDEN_BLOCK_KEYS.has(k)) continue;
      if (/^-?\d+,-?\d+,-?\d+$/.test(k) && typeof v === 'string' && v.length > 0 && v.length <= 32) {
        safeModifiedBlocks[k] = v;
        count++;
      }
    }
  }

  const playerGameMode =
    world.player?.gameMode && ALLOWED_GAME_MODES.has(world.player.gameMode)
      ? world.player.gameMode
      : safeGameMode;

  return {
    id: safeId,
    uid: user.uid,
    version: 1,
    name: safeName,
    gameMode: safeGameMode,
    difficulty: safeDifficulty,
    worldType: safeWorldType,
    seed: safeSeed,
    timeOfDay: safeTimeOfDay,
    weather: safeWeather,
    player: {
      x: Number.isFinite(world.player?.x) ? world.player.x : 0,
      y: Number.isFinite(world.player?.y) ? world.player.y : 14,
      z: Number.isFinite(world.player?.z) ? world.player.z : 0,
      yaw: Number.isFinite(world.player?.yaw) ? world.player.yaw : 0,
      pitch: Number.isFinite(world.player?.pitch) ? world.player.pitch : 0,
      health: Number.isFinite(world.player?.health) ? Math.max(0, Math.min(20, world.player.health)) : 20,
      hunger: Number.isFinite(world.player?.hunger) ? Math.max(0, Math.min(20, world.player.hunger!)) : 20,
      gameMode: playerGameMode,
      inventory: safeInventory
    },
    modifiedBlocks: safeModifiedBlocks
  };
}

export async function saveWorldToCloud(
  user: User,
  world: WorldSaveData,
  deviceType: DeviceCategory
): Promise<WorldSaveData> {
  if (!isVerifiedGoogleUser(user)) {
    throw new Error('請先完成 Google 帳號登入驗證，才可安全同步世界進度至雲端。');
  }
  await ensureUserSecurityProfile(user, deviceType);

  const payload = buildValidatedCloudWorldPayload(user, world);
  const worldPath = `users/${user.uid}/worlds/${payload.id}`;
  const worldRef = doc(db, 'users', user.uid, 'worlds', payload.id);

  try {
    const existingSnap = await getDoc(worldRef);
    if (existingSnap.exists()) {
      await updateDoc(worldRef, {
        name: payload.name,
        gameMode: payload.gameMode,
        difficulty: payload.difficulty,
        worldType: payload.worldType,
        timeOfDay: payload.timeOfDay,
        weather: payload.weather,
        player: payload.player,
        modifiedBlocks: payload.modifiedBlocks,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(worldRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, worldPath);
  }

  await logSecurityEvent(user, 'world_cloud_save', deviceType, `同步世界進度至雲端：${payload.name}`);

  return {
    ...world,
    id: payload.id,
    name: payload.name,
    savedAt: new Date().toLocaleString('zh-TW'),
    cloudSynced: true
  };
}

export function subscribeCloudWorlds(
  user: User,
  onWorlds: (worlds: WorldSaveData[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isVerifiedGoogleUser(user)) {
    onWorlds([]);
    return () => {};
  }

  const worldsPath = `users/${user.uid}/worlds`;
  const q = query(collection(db, 'users', user.uid, 'worlds'), where('uid', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const list: Array<{ world: WorldSaveData; sortMs: number }> = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const createdTs = data.createdAt as Timestamp | undefined;
        const updatedTs = data.updatedAt as Timestamp | undefined;
        const sortMs = updatedTs?.toMillis?.() ?? createdTs?.toMillis?.() ?? Date.now();
        const p = (data.player || {}) as Record<string, unknown>;
        const rawInv = Array.isArray(p.inventory) ? p.inventory : [];
        const inventory: (InventoryItem | null)[] = Array.from({ length: 36 }, (_, idx) => {
          const slot = rawInv[idx];
          return slot && typeof slot === 'object' ? (slot as InventoryItem) : null;
        });

        const modifiedBlocks: Record<string, BlockType> = {};
        if (data.modifiedBlocks && typeof data.modifiedBlocks === 'object') {
          for (const [k, v] of Object.entries(data.modifiedBlocks as Record<string, unknown>)) {
            if (!FORBIDDEN_BLOCK_KEYS.has(k) && typeof v === 'string') {
              modifiedBlocks[k] = v as BlockType;
            }
          }
        }

        const world: WorldSaveData = {
          id: String(data.id || docSnap.id),
          version: Number(data.version || 1),
          name: String(data.name || '雲端世界'),
          gameMode: (data.gameMode as WorldSaveData['gameMode']) || 'survival',
          difficulty: (data.difficulty as WorldSaveData['difficulty']) || 'normal',
          worldType: (data.worldType as WorldSaveData['worldType']) || 'default',
          seed: Number(data.seed || 88888),
          createdAt: createdTs?.toDate ? createdTs.toDate().toLocaleString('zh-TW') : new Date().toLocaleString('zh-TW'),
          savedAt: updatedTs?.toDate ? updatedTs.toDate().toLocaleString('zh-TW') : new Date().toLocaleString('zh-TW'),
          timeOfDay: typeof data.timeOfDay === 'number' ? data.timeOfDay : 0.25,
          weather: (data.weather as WorldSaveData['weather']) || 'clear',
          player: {
            x: typeof p.x === 'number' ? p.x : 0,
            y: typeof p.y === 'number' ? p.y : 14,
            z: typeof p.z === 'number' ? p.z : 0,
            yaw: typeof p.yaw === 'number' ? p.yaw : 0,
            pitch: typeof p.pitch === 'number' ? p.pitch : 0,
            health: typeof p.health === 'number' ? p.health : 20,
            hunger: typeof p.hunger === 'number' ? p.hunger : 20,
            inventory,
            gameMode: (p.gameMode as WorldSaveData['gameMode']) || ((data.gameMode as WorldSaveData['gameMode']) || 'survival')
          },
          modifiedBlocks,
          cloudSynced: true
        };
        list.push({ world, sortMs });
      });

      list.sort((a, b) => b.sortMs - a.sortMs);
      onWorlds(list.map((item) => item.world));
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, worldsPath);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error('讀取雲端世界存檔失敗'));
      }
    }
  );
}

export async function renameWorldInCloud(
  user: User,
  worldId: string,
  newName: string
): Promise<void> {
  if (!isVerifiedGoogleUser(user)) return;
  const safeId = normalizeCloudWorldId(worldId);
  const safeName = newName.trim().slice(0, 64);
  if (!safeName) return;
  const worldPath = `users/${user.uid}/worlds/${safeId}`;
  const worldRef = doc(db, 'users', user.uid, 'worlds', safeId);
  try {
    const snap = await getDoc(worldRef);
    if (snap.exists()) {
      await updateDoc(worldRef, {
        name: safeName,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, worldPath);
  }
}

export async function deleteWorldFromCloud(
  user: User,
  worldId: string,
  deviceType: DeviceCategory
): Promise<void> {
  if (!isVerifiedGoogleUser(user)) return;
  const safeId = normalizeCloudWorldId(worldId);
  const worldPath = `users/${user.uid}/worlds/${safeId}`;
  const worldRef = doc(db, 'users', user.uid, 'worlds', safeId);
  try {
    const snap = await getDoc(worldRef);
    if (snap.exists()) {
      await deleteDoc(worldRef);
      await logSecurityEvent(user, 'world_cloud_delete', deviceType, `刪除雲端世界存檔：${safeId}`);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, worldPath);
  }
}

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
