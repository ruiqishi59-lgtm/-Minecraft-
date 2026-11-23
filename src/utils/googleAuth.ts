// Account profile (in-memory only for PII/identity) & local game economy helpers

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  points: number;
  unlockedItems: string[];
  lastLogin: string;
  isVipMember?: boolean;
  vipExpiresAt?: string | null;
  vipSubscribedAt?: string | null;
}

const LEGACY_USER_STORAGE_KEY = 'minecraft_google_user';
const GUEST_POINTS_KEY = 'minecraft_guest_points';
const VIP_MEMBERSHIP_KEY = 'minecraft_vip_membership';
const UNLOCKED_ITEMS_KEY = 'minecraft_unlocked_account_items';
const UNLOCKED_SKINS_KEY = 'minecraft_unlocked_skins';

export const DEFAULT_GUEST_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23292524'/%3E%3Crect x='16' y='16' width='32' height='32' fill='%23d6a374'/%3E%3Crect x='16' y='14' width='32' height='10' fill='%234a3520'/%3E%3Crect x='22' y='28' width='6' height='6' fill='%231e3a8a'/%3E%3Crect x='36' y='28' width='6' height='6' fill='%231e3a8a'/%3E%3Crect x='26' y='38' width='12' height='4' fill='%2392400e'/%3E%3C/svg%3E";

// Strictly in-memory authenticated user profile (never written to localStorage to prevent PII/identity spoofing)
let inMemoryAuthProfile: GoogleUserProfile | null = null;

// Scrub any legacy stored email/profile PII from localStorage on module load
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  } catch {}
}

export function sanitizeHttpsImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return DEFAULT_GUEST_AVATAR;
  const trimmed = url.trim();
  if (trimmed === DEFAULT_GUEST_AVATAR) return DEFAULT_GUEST_AVATAR;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // invalid URL -> fall back safely
  }
  return DEFAULT_GUEST_AVATAR;
}

function getLocalUnlockedItems(): string[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string');
      }
    }
  } catch {}
  return [];
}

function saveLocalUnlockedItems(items: string[]) {
  try {
    localStorage.setItem(UNLOCKED_ITEMS_KEY, JSON.stringify(items));
  } catch {}
}

export const getStoredUser = (): GoogleUserProfile | null => {
  return inMemoryAuthProfile;
};

export const getActivePoints = (): number => {
  if (inMemoryAuthProfile) return inMemoryAuthProfile.points;
  try {
    const guestPoints = localStorage.getItem(GUEST_POINTS_KEY);
    if (guestPoints) {
      const parsed = parseInt(guestPoints, 10);
      if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }
  } catch {}
  return 100;
};

export const saveGoogleUser = (user: GoogleUserProfile) => {
  inMemoryAuthProfile = {
    ...user,
    avatar: sanitizeHttpsImageUrl(user.avatar)
  };
  try {
    localStorage.setItem(GUEST_POINTS_KEY, String(Math.max(0, Math.floor(user.points))));
    saveLocalUnlockedItems(user.unlockedItems || []);
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('google_user_updated', { detail: inMemoryAuthProfile }));
  }
};

export const addPoints = (amount: number): number => {
  const safeAmount = Number.isFinite(amount) ? Math.floor(amount) : 0;
  const current = getActivePoints();
  const updated = Math.max(0, current + safeAmount);
  try {
    localStorage.setItem(GUEST_POINTS_KEY, updated.toString());
  } catch {}

  if (inMemoryAuthProfile) {
    inMemoryAuthProfile = {
      ...inMemoryAuthProfile,
      points: updated
    };
    window.dispatchEvent(new CustomEvent('google_user_updated', { detail: inMemoryAuthProfile }));
    return updated;
  }

  window.dispatchEvent(new CustomEvent('google_user_updated', { detail: null }));
  return updated;
};

export const spendPoints = (amount: number, itemId?: string): boolean => {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  const current = getActivePoints();
  if (current < safeAmount) return false;
  const updated = current - safeAmount;

  try {
    localStorage.setItem(GUEST_POINTS_KEY, updated.toString());
  } catch {}

  const items = getLocalUnlockedItems();
  if (itemId && !items.includes(itemId)) {
    items.push(itemId);
    saveLocalUnlockedItems(items);
  }

  if (inMemoryAuthProfile) {
    const profileItems = [...(inMemoryAuthProfile.unlockedItems || [])];
    if (itemId && !profileItems.includes(itemId)) {
      profileItems.push(itemId);
    }
    inMemoryAuthProfile = {
      ...inMemoryAuthProfile,
      points: updated,
      unlockedItems: profileItems
    };
    window.dispatchEvent(new CustomEvent('google_user_updated', { detail: inMemoryAuthProfile }));
    return true;
  }

  window.dispatchEvent(new CustomEvent('google_user_updated', { detail: null }));
  return true;
};

export const loginWithGoogleAccount = (profile: {
  email: string;
  name: string;
  avatar?: string;
  id?: string;
}): GoogleUserProfile => {
  const currentPoints = getActivePoints();
  const existingItems = getLocalUnlockedItems();
  const vip = getVipStatus();

  const newUser: GoogleUserProfile = {
    id: profile.id || `google_${Date.now()}`,
    email: profile.email,
    name: profile.name,
    avatar: sanitizeHttpsImageUrl(profile.avatar),
    points: Math.max(currentPoints, 300),
    unlockedItems: existingItems,
    lastLogin: new Date().toISOString(),
    isVipMember: vip.isActive,
    vipExpiresAt: vip.expiresAt,
    vipSubscribedAt: vip.subscribedAt
  };

  saveGoogleUser(newUser);
  return newUser;
};

export const logoutGoogleAccount = () => {
  inMemoryAuthProfile = null;
  try {
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('google_user_updated', { detail: null }));
  }
};

export interface VipSubscriptionInfo {
  isActive: boolean;
  expiresAt: string | null;
  subscribedAt: string | null;
  daysRemaining: number;
  monthlyPriceNT: number;
}

export const getVipStatus = (): VipSubscriptionInfo => {
  const now = Date.now();
  let expStr: string | null = inMemoryAuthProfile?.vipExpiresAt || null;
  let subStr: string | null = inMemoryAuthProfile?.vipSubscribedAt || null;

  if (!expStr) {
    try {
      const localVip = localStorage.getItem(VIP_MEMBERSHIP_KEY);
      if (localVip) {
        const parsed = JSON.parse(localVip);
        expStr = parsed.expiresAt;
        subStr = parsed.subscribedAt;
      }
    } catch {}
  }

  if (expStr) {
    const expTime = new Date(expStr).getTime();
    if (expTime > now) {
      const daysRemaining = Math.max(1, Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)));
      return {
        isActive: true,
        expiresAt: expStr,
        subscribedAt: subStr,
        daysRemaining,
        monthlyPriceNT: 10
      };
    }
  }

  return {
    isActive: false,
    expiresAt: null,
    subscribedAt: null,
    daysRemaining: 0,
    monthlyPriceNT: 10
  };
};

export const isVipActive = (): boolean => {
  return getVipStatus().isActive;
};

export const subscribeVip = (paymentMethod: string = 'credit_card'): { success: boolean; expiresAt: string } => {
  const now = new Date();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  const expIso = expires.toISOString();
  const nowIso = now.toISOString();

  const updatedPoints = getActivePoints() + 500;
  try {
    localStorage.setItem(GUEST_POINTS_KEY, String(updatedPoints));
    localStorage.setItem(
      VIP_MEMBERSHIP_KEY,
      JSON.stringify({
        isActive: true,
        expiresAt: expIso,
        subscribedAt: nowIso,
        paymentMethod,
        priceNT: 10
      })
    );
  } catch (e) {
    console.error('Failed to save VIP subscription', e);
  }

  if (inMemoryAuthProfile) {
    inMemoryAuthProfile = {
      ...inMemoryAuthProfile,
      isVipMember: true,
      vipExpiresAt: expIso,
      vipSubscribedAt: nowIso,
      points: updatedPoints
    };
  }

  window.dispatchEvent(new CustomEvent('vip_status_updated', { detail: { isActive: true, expiresAt: expIso } }));
  window.dispatchEvent(new CustomEvent('google_user_updated', { detail: inMemoryAuthProfile }));

  return {
    success: true,
    expiresAt: expIso
  };
};

export const cancelVip = (): boolean => {
  if (inMemoryAuthProfile) {
    inMemoryAuthProfile = {
      ...inMemoryAuthProfile,
      isVipMember: false,
      vipExpiresAt: null
    };
  }
  try {
    localStorage.removeItem(VIP_MEMBERSHIP_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent('vip_status_updated', { detail: { isActive: false } }));
  window.dispatchEvent(new CustomEvent('google_user_updated', { detail: inMemoryAuthProfile }));
  return true;
};

export const getUnlockedSkins = (): string[] => {
  const unlocked = new Set<string>([
    'steve',
    'alex',
    'diamond_knight',
    'ender_hoodie',
    'creeper_camo',
    'aether_angel',
    'cyber_steve',
    'zombie_costume'
  ]);
  const items = inMemoryAuthProfile?.unlockedItems || getLocalUnlockedItems();
  items.forEach((it) => {
    if (it.startsWith('skin_')) {
      unlocked.add(it.replace('skin_', ''));
    }
  });
  try {
    const local = localStorage.getItem(UNLOCKED_SKINS_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach((s) => {
          if (typeof s === 'string') unlocked.add(s);
        });
      }
    }
  } catch {}
  return Array.from(unlocked);
};

export const unlockSkin = (skinId: string): boolean => {
  const items = getLocalUnlockedItems();
  if (!items.includes(`skin_${skinId}`)) {
    items.push(`skin_${skinId}`);
    saveLocalUnlockedItems(items);
  }
  if (inMemoryAuthProfile && !inMemoryAuthProfile.unlockedItems.includes(`skin_${skinId}`)) {
    inMemoryAuthProfile = {
      ...inMemoryAuthProfile,
      unlockedItems: [...inMemoryAuthProfile.unlockedItems, `skin_${skinId}`]
    };
  }
  try {
    const list = getUnlockedSkins();
    if (!list.includes(skinId)) {
      list.push(skinId);
      localStorage.setItem(UNLOCKED_SKINS_KEY, JSON.stringify(list));
    }
  } catch {}
  window.dispatchEvent(new CustomEvent('skins_updated', { detail: skinId }));
  return true;
};
