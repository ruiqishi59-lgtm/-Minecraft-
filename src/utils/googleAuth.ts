// Google Account & Points management utility

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

const STORAGE_KEY = 'minecraft_google_user';
const GUEST_POINTS_KEY = 'minecraft_guest_points';
const VIP_MEMBERSHIP_KEY = 'minecraft_vip_membership';

const DEFAULT_GUEST_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23292524'/%3E%3Crect x='16' y='16' width='32' height='32' fill='%23d6a374'/%3E%3Crect x='16' y='14' width='32' height='10' fill='%234a3520'/%3E%3Crect x='22' y='28' width='6' height='6' fill='%231e3a8a'/%3E%3Crect x='36' y='28' width='6' height='6' fill='%231e3a8a'/%3E%3Crect x='26' y='38' width='12' height='4' fill='%2392400e'/%3E%3C/svg%3E";

const DEFAULT_GUEST_USER: GoogleUserProfile = {
  id: 'guest_player',
  email: 'guest@mineclone.local',
  name: '冒險家 (訪客)',
  avatar: DEFAULT_GUEST_AVATAR,
  points: 100, // starting beginner bonus
  unlockedItems: [],
  lastLogin: new Date().toISOString()
};

export const getStoredUser = (): GoogleUserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse stored Google user', e);
  }
  return null;
};

export const getActivePoints = (): number => {
  const user = getStoredUser();
  if (user) return user.points;
  const guestPoints = localStorage.getItem(GUEST_POINTS_KEY);
  return guestPoints ? parseInt(guestPoints, 10) : 100;
};

export const saveGoogleUser = (user: GoogleUserProfile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('google_user_updated', { detail: user }));
  } catch (e) {
    console.error('Failed to save Google user', e);
  }
};

export const addPoints = (amount: number): number => {
  const user = getStoredUser();
  if (user) {
    user.points = (user.points || 0) + amount;
    saveGoogleUser(user);
    return user.points;
  } else {
    const current = getActivePoints();
    const updated = current + amount;
    localStorage.setItem(GUEST_POINTS_KEY, updated.toString());
    window.dispatchEvent(new CustomEvent('google_user_updated', { detail: null }));
    return updated;
  }
};

export const spendPoints = (amount: number, itemId?: string): boolean => {
  const user = getStoredUser();
  if (user) {
    if (user.points < amount) return false;
    user.points -= amount;
    if (itemId && !user.unlockedItems.includes(itemId)) {
      user.unlockedItems.push(itemId);
    }
    saveGoogleUser(user);
    return true;
  } else {
    const current = getActivePoints();
    if (current < amount) return false;
    const updated = current - amount;
    localStorage.setItem(GUEST_POINTS_KEY, updated.toString());
    window.dispatchEvent(new CustomEvent('google_user_updated', { detail: null }));
    return true;
  }
};

export const loginWithGoogleAccount = (profile: {
  email: string;
  name: string;
  avatar?: string;
  id?: string;
}): GoogleUserProfile => {
  const existing = getStoredUser();
  const guestPoints = getActivePoints();

  const newUser: GoogleUserProfile = {
    id: profile.id || `google_${Date.now()}`,
    email: profile.email,
    name: profile.name,
    avatar: profile.avatar || DEFAULT_GUEST_AVATAR,
    // Preserve existing points or carry over guest points with a bonus
    points: existing?.points ?? Math.max(guestPoints, 300),
    unlockedItems: existing?.unlockedItems ?? [],
    lastLogin: new Date().toISOString()
  };

  saveGoogleUser(newUser);
  return newUser;
};

export const logoutGoogleAccount = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('google_user_updated', { detail: null }));
};

export interface VipSubscriptionInfo {
  isActive: boolean;
  expiresAt: string | null;
  subscribedAt: string | null;
  daysRemaining: number;
  monthlyPriceNT: number;
}

export const getVipStatus = (): VipSubscriptionInfo => {
  const user = getStoredUser();
  const now = Date.now();
  let expStr: string | null = null;
  let subStr: string | null = null;

  if (user && user.vipExpiresAt) {
    expStr = user.vipExpiresAt;
    subStr = user.vipSubscribedAt || null;
  } else {
    try {
      const localVip = localStorage.getItem(VIP_MEMBERSHIP_KEY);
      if (localVip) {
        const parsed = JSON.parse(localVip);
        expStr = parsed.expiresAt;
        subStr = parsed.subscribedAt;
      }
    } catch (e) {
      console.error('Failed to parse local VIP info', e);
    }
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
  expires.setDate(expires.getDate() + 30); // 30-day monthly cycle for NT$ 10
  const expIso = expires.toISOString();
  const nowIso = now.toISOString();

  // Save to user if logged in
  const user = getStoredUser();
  if (user) {
    user.isVipMember = true;
    user.vipExpiresAt = expIso;
    user.vipSubscribedAt = nowIso;
    // Monthly VIP reward: 500 bonus points!
    user.points = (user.points || 0) + 500;
    saveGoogleUser(user);
  }

  // Also save to device storage for guest/offline convenience
  try {
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

  // Dispatch events for live UI updates
  window.dispatchEvent(new CustomEvent('vip_status_updated', { detail: { isActive: true, expiresAt: expIso } }));
  window.dispatchEvent(new CustomEvent('google_user_updated', { detail: user }));

  return {
    success: true,
    expiresAt: expIso
  };
};

export const cancelVip = (): boolean => {
  const user = getStoredUser();
  if (user) {
    user.isVipMember = false;
    user.vipExpiresAt = null;
    saveGoogleUser(user);
  }
  localStorage.removeItem(VIP_MEMBERSHIP_KEY);
  window.dispatchEvent(new CustomEvent('vip_status_updated', { detail: { isActive: false } }));
  window.dispatchEvent(new CustomEvent('google_user_updated', { detail: user }));
  return true;
};

const UNLOCKED_SKINS_KEY = 'minecraft_unlocked_skins';

export const getUnlockedSkins = (): string[] => {
  const user = getStoredUser();
  const unlocked = new Set<string>(['steve', 'alex', 'diamond_knight', 'ender_hoodie', 'creeper_camo', 'aether_angel', 'cyber_steve', 'zombie_costume']);
  if (user && Array.isArray(user.unlockedItems)) {
    user.unlockedItems.forEach((it) => {
      if (it.startsWith('skin_')) {
        unlocked.add(it.replace('skin_', ''));
      }
    });
  }
  try {
    const local = localStorage.getItem(UNLOCKED_SKINS_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach((s) => unlocked.add(s));
      }
    }
  } catch (e) {
    console.error('Failed to parse unlocked skins', e);
  }
  return Array.from(unlocked);
};

export const unlockSkin = (skinId: string): boolean => {
  const user = getStoredUser();
  if (user) {
    if (!user.unlockedItems.includes(`skin_${skinId}`)) {
      user.unlockedItems.push(`skin_${skinId}`);
      saveGoogleUser(user);
    }
  }
  try {
    const list = getUnlockedSkins();
    if (!list.includes(skinId)) {
      list.push(skinId);
      localStorage.setItem(UNLOCKED_SKINS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to save unlocked skin', e);
  }
  window.dispatchEvent(new CustomEvent('skins_updated', { detail: skinId }));
  return true;
};

