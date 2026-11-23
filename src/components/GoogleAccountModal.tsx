import React, { useState, useEffect, useMemo } from 'react';
import {
  LogOut,
  CheckCircle2,
  Cloud,
  Coins,
  ShieldCheck,
  Sparkles,
  X,
  Lock,
  Eye,
  EyeOff,
  Crown,
  AlertCircle,
  KeyRound,
  RefreshCw,
  History,
  ExternalLink
} from 'lucide-react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import {
  getStoredUser,
  loginWithGoogleAccount,
  logoutGoogleAccount,
  getActivePoints,
  GoogleUserProfile
} from '../utils/googleAuth';
import {
  ADMIN_EMAIL,
  auth,
  db,
  ensureUserSecurityProfile,
  isAdminUser,
  isVerifiedGoogleUser,
  logSecurityEvent,
  reauthenticateWithGoogle,
  revokeGmailAccessToken,
  SecurityLogDoc,
  signInWithGoogleFirebase,
  signOutFirebase,
  subscribeAuthState,
  subscribeTokenState,
  updateUserSecuritySettings,
  UserSecurityProfileDoc
} from '../firebase';
import { getDeviceCategory } from '../utils/device';
import { soundManager } from '../game/audio';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMarket?: () => void;
  onOpenMailbox?: () => void;
}

const EVENT_LABELS: Record<string, string> = {
  sign_in: 'Google 帳號登入',
  reauth_verified: '身分重新驗證通過',
  gmail_send: '寄送意見郵件',
  admin_mail: '管理員發送信箱訊息',
  token_revoked: '撤銷並清除寄信權杖',
  settings_updated: '更新帳號安全防護設定'
};

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  onOpenMarket,
  onOpenMailbox
}) => {
  const [fbUser, setFbUser] = useState<User | null>(() => auth.currentUser);
  const [user, setUser] = useState<GoogleUserProfile | null>(null);
  const [points, setPoints] = useState<number>(100);
  const [hasGmailToken, setHasGmailToken] = useState<boolean>(false);
  const [securityProfile, setSecurityProfile] = useState<UserSecurityProfileDoc | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogDoc[]>([]);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isReauthing, setIsReauthing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPrivateDetails, setShowPrivateDetails] = useState<boolean>(false);

  const deviceCategory = useMemo(() => getDeviceCategory(), []);

  useEffect(() => {
    const unsubAuth = subscribeAuthState((u) => {
      setFbUser(u);
      if (!u) {
        setSecurityProfile(null);
        setSecurityLogs([]);
        setShowPrivateDetails(false);
      }
    });
    const unsubToken = subscribeTokenState((hasToken) => {
      setHasGmailToken(hasToken);
    });
    return () => {
      unsubAuth();
      unsubToken();
    };
  }, []);

  useEffect(() => {
    const update = () => {
      setUser(getStoredUser());
      setPoints(getActivePoints());
    };
    update();
    window.addEventListener('google_user_updated', update);
    return () => window.removeEventListener('google_user_updated', update);
  }, [isOpen]);

  // Load owner security profile & tamper-evident audit logs when modal is open & verified
  useEffect(() => {
    if (!isOpen || !fbUser || !isVerifiedGoogleUser(fbUser)) return;

    let cancelled = false;
    ensureUserSecurityProfile(fbUser, deviceCategory)
      .then((prof) => {
        if (!cancelled && prof) {
          setSecurityProfile(prof);
        }
      })
      .catch((err) => {
        console.warn('Could not load security profile:', err);
      });

    const unsubLogs = onSnapshot(
      collection(db, 'users', fbUser.uid, 'security_logs'),
      (snap) => {
        const list: SecurityLogDoc[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            uid: String(data.uid || ''),
            eventType: (data.eventType as SecurityLogDoc['eventType']) || 'sign_in',
            deviceType: (data.deviceType as SecurityLogDoc['deviceType']) || 'desktop',
            detail: String(data.detail || ''),
            createdAt: (data.createdAt as Timestamp | null) || null
          });
        });
        list.sort(
          (a, b) => (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now())
        );
        setSecurityLogs(list.slice(0, 8));
      },
      (err) => console.warn('Security logs listener warning:', err)
    );

    return () => {
      cancelled = true;
      unsubLogs();
    };
  }, [isOpen, fbUser, deviceCategory]);

  if (!isOpen) return null;

  // Strictly trust verified Firebase Google Auth claim (never localStorage or local email strings)
  const isAdmin = isAdminUser(fbUser);

  const handleRealGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const { user: signedUser } = await signInWithGoogleFirebase();
      const loggedUser = loginWithGoogleAccount({
        id: signedUser.uid,
        email: signedUser.email || '',
        name: signedUser.displayName || signedUser.email?.split('@')[0] || '冒險家',
        avatar: signedUser.photoURL || undefined
      });
      await ensureUserSecurityProfile(signedUser, deviceCategory);
      await logSecurityEvent(signedUser, 'sign_in', deviceCategory, '透過 Google OAuth 完成安全登入驗證');
      setUser(loggedUser);
      setPoints(loggedUser.points);
      confetti({ particleCount: 50, spread: 60 });
      soundManager.playCraftSuccess();
      setStatusMessage(
        isAdminUser(signedUser)
          ? `🛡️ 歡迎管理員 ${ADMIN_EMAIL}！已通過 Google 雙層驗證並啟用高強度保護。`
          : '🛡️ Google 帳號已成功透過 Firebase 安全登入！'
      );
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Google 登入視窗已取消或無法開啟，請允許彈出視窗後再試。';
      setErrorMessage(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualReauth = async () => {
    setIsReauthing(true);
    setErrorMessage(null);
    try {
      const { user: verifiedUser } = await reauthenticateWithGoogle();
      await logSecurityEvent(verifiedUser, 'reauth_verified', deviceCategory, '使用者手動完成身分重新驗證');
      soundManager.playCraftSuccess();
      setStatusMessage('✅ 身分重新驗證成功！此裝置為本人操作。');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '重新驗證失敗或已取消。');
    } finally {
      setIsReauthing(false);
    }
  };

  const handleToggleRevealPrivateDetails = async () => {
    if (showPrivateDetails) {
      setShowPrivateDetails(false);
      return;
    }
    if (securityProfile?.requireReauthForSensitiveActions && fbUser) {
      setIsReauthing(true);
      setErrorMessage(null);
      try {
        const { user: verifiedUser } = await reauthenticateWithGoogle();
        await logSecurityEvent(verifiedUser, 'reauth_verified', deviceCategory, '重新驗證後查看完整帳號個資');
        setShowPrivateDetails(true);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '需通過 Google 身分重新驗證才能顯示完整帳號資訊。');
      } finally {
        setIsReauthing(false);
      }
    } else {
      setShowPrivateDetails(true);
    }
  };

  const handleRevokeGmailToken = async () => {
    await revokeGmailAccessToken();
    if (fbUser) {
      await logSecurityEvent(fbUser, 'token_revoked', deviceCategory, '手動撤銷並清除記憶體 Gmail 寄信權杖');
    }
    soundManager.playButtonClick();
    setStatusMessage('🔒 已向 Google 撤銷並立即清除暫存寄信權杖，防止他人濫用。');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleToggleRequireReauth = async () => {
    if (!fbUser || !securityProfile) return;
    const nextVal = !securityProfile.requireReauthForSensitiveActions;
    try {
      await updateUserSecuritySettings(fbUser, {
        requireReauthForSensitiveActions: nextVal,
        lastVerifiedDevice: deviceCategory
      });
      setSecurityProfile({ ...securityProfile, requireReauthForSensitiveActions: nextVal });
      await logSecurityEvent(
        fbUser,
        'settings_updated',
        deviceCategory,
        `敏感操作重新驗證：${nextVal ? '已開啟' : '已關閉'}`
      );
      soundManager.playButtonClick();
      setStatusMessage(`🛡️ 敏感操作重新驗證已${nextVal ? '開啟' : '關閉'}。`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '更新安全設定失敗');
    }
  };

  const handleChangeAutoLock = async (minutes: number) => {
    if (!fbUser || !securityProfile) return;
    try {
      await updateUserSecuritySettings(fbUser, {
        autoLockMinutes: minutes,
        lastVerifiedDevice: deviceCategory
      });
      setSecurityProfile({ ...securityProfile, autoLockMinutes: minutes });
      await logSecurityEvent(
        fbUser,
        'settings_updated',
        deviceCategory,
        `權杖閒置自動清除時間調整為 ${minutes === 0 ? '不自動清除' : `${minutes} 分鐘`}`
      );
      soundManager.playButtonClick();
      setStatusMessage(
        minutes === 0
          ? '已設定為關閉前保留暫存權杖（登出仍立即清除）。'
          : `🛡️ 授權權杖將於閒置 ${minutes} 分鐘後自動銷毀。`
      );
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '更新自動鎖定設定失敗');
    }
  };

  const handleSignOut = async () => {
    if (fbUser) {
      await logSecurityEvent(fbUser, 'token_revoked', deviceCategory, '使用者主動登出並清除工作階段與權杖');
    }
    try {
      await signOutFirebase();
    } catch (e) {
      console.error('Firebase signOut error:', e);
    }
    logoutGoogleAccount();
    setUser(null);
    setShowPrivateDetails(false);
    setPoints(getActivePoints());
    setStatusMessage('🔒 已安全登出並撤銷授權權杖。');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const maskEmail = (email: string) => {
    if (!email) return '***';
    const parts = email.split('@');
    if (parts.length < 2) return '***';
    const name = parts[0];
    const maskedName = name.length > 2 ? `${name.slice(0, 2)}***` : '***';
    return `${maskedName}@${parts[1]}`;
  };

  const maskName = (name: string) => {
    if (!name) return '冒險家';
    if (name.length <= 1) return name;
    return `${name.charAt(0)}**`;
  };

  const formatLogTime = (ts: Timestamp | null) => {
    if (!ts || typeof ts.toDate !== 'function') return '剛剛';
    try {
      return ts.toDate().toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '剛剛';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 pt-safe pb-safe backdrop-blur-sm font-mono select-none">
      <div className="relative w-full max-w-xl max-h-[92dvh] rounded-2xl border-2 border-blue-500/50 bg-[#1a1a1a] text-stone-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 bg-[#121212] px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-900 shadow font-bold text-lg shrink-0">
              <svg className="h-6 w-6" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-blue-300">
                  Google 帳號安全中心
                </h2>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  高強度防盜保護
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                零本機密碼與權杖存儲 • Google OAuth + 防竄改活動日誌
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="flex items-center gap-2 bg-emerald-950/90 border-b border-emerald-600 px-5 py-2.5 text-xs font-bold text-emerald-200 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 bg-rose-950/90 border-b border-rose-600 px-5 py-2.5 text-xs font-bold text-rose-200 shrink-0">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 touch-pan-y">
          {user && fbUser && isVerifiedGoogleUser(fbUser) ? (
            <div className="space-y-4">
              {/* Identity Card */}
              <div className="rounded-2xl border border-stone-700 bg-stone-900/80 p-4 shadow-inner">
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-16 w-16 rounded-2xl border-2 border-blue-400 bg-stone-800 p-0.5 shadow object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-base text-stone-100 truncate">
                        {showPrivateDetails ? user.name : maskName(user.name)}
                      </h3>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        Google 已驗證
                      </span>
                      {isAdmin && (
                        <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/50">
                          <Crown className="h-3 w-3" />
                          信箱管理員
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 truncate mt-0.5">
                      {showPrivateDetails ? user.email : maskEmail(user.email)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isReauthing}
                        onClick={handleToggleRevealPrivateDetails}
                        className="flex min-h-[36px] items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-white px-2.5 py-1 rounded-md bg-stone-800/90 border border-stone-700 transition-colors"
                      >
                        {showPrivateDetails ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                            <span>隱藏個資</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 text-blue-400" />
                            <span>{securityProfile?.requireReauthForSensitiveActions ? '驗證後顯示個資' : '顯示完整帳號'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isReauthing}
                        onClick={handleManualReauth}
                        className="flex min-h-[36px] items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-white px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-700/60 transition-colors"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isReauthing ? 'animate-spin' : ''}`} />
                        <span>{isReauthing ? '驗證中...' : '立即重新驗證'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-800 text-[11px] text-stone-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>個資與授權權杖僅暫存於執行記憶體，絕不寫入本機 Storage。</span>
                </div>
              </div>

              {/* Account Protection Settings */}
              <div className="rounded-2xl border border-emerald-500/35 bg-emerald-950/15 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-300">
                    <KeyRound className="h-4 w-4" />
                    <span>帳號防盜與權杖安全鎖定</span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                      hasGmailToken
                        ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {hasGmailToken ? '寄信權杖啟用中（僅限記憶體）' : '寄信權杖已鎖定清除'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-900/80 p-3">
                  <div className="text-xs">
                    <div className="font-bold text-stone-100">敏感操作須重新驗證 Google 身分</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      查看完整帳號、管理員發信或刪除紀錄前再次確認本人操作
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleRequireReauth}
                    className={`min-h-[40px] min-w-[76px] rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                      securityProfile?.requireReauthForSensitiveActions !== false
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-700 text-stone-300'
                    }`}
                  >
                    {securityProfile?.requireReauthForSensitiveActions !== false ? '已開啟' : '已關閉'}
                  </button>
                </div>

                <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-3 space-y-2">
                  <div className="text-xs font-bold text-stone-100">
                    Gmail 授權權杖閒置自動清除時間
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { mins: 5, label: '5 分鐘' },
                      { mins: 10, label: '10 分鐘' },
                      { mins: 30, label: '30 分鐘' },
                      { mins: 0, label: '僅登出清' }
                    ].map((opt) => {
                      const active = (securityProfile?.autoLockMinutes ?? 10) === opt.mins;
                      return (
                        <button
                          key={opt.mins}
                          type="button"
                          onClick={() => handleChangeAutoLock(opt.mins)}
                          className={`min-h-[38px] rounded-lg border text-[11px] font-bold transition-colors ${
                            active
                              ? 'border-emerald-400 bg-emerald-600 text-white'
                              : 'border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRevokeGmailToken}
                    className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-950/50 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-900/70 transition-colors"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>立即撤銷並清除寄信權杖</span>
                  </button>

                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/50 bg-blue-950/50 px-3 py-2 text-xs font-bold text-blue-200 hover:bg-blue-900/70 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>檢查 Google 兩步驟驗證 (2FA)</span>
                  </a>
                </div>
              </div>

              {/* Tamper-Evident Security Activity Log */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
                    <History className="h-4 w-4 text-sky-400" />
                    <span>最近帳號安全活動日誌（唯讀防竄改）</span>
                  </div>
                  <span className="text-[10px] text-stone-500">僅本人可檢視</span>
                </div>
                {securityLogs.length === 0 ? (
                  <p className="text-[11px] text-stone-500 py-2">尚無近期安全紀錄</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {securityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-stone-800 bg-stone-950/70 px-2.5 py-1.5 text-[11px]"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-sky-300">
                            {EVENT_LABELS[log.eventType] || log.eventType}
                          </span>
                          <span className="mx-1.5 text-stone-600">•</span>
                          <span className="text-stone-300 truncate">{log.detail}</span>
                        </div>
                        <span className="text-[10px] text-stone-500 shrink-0">
                          {formatLogTime(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Points & Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>市集可用積分</span>
                    <Coins className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-amber-300 tabular-nums">
                    {points.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-amber-400">點</span>
                  </div>
                  {onOpenMarket && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenMarket();
                      }}
                      className="mt-3 min-h-[40px] rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-all text-center"
                    >
                      前往市集儲值/兌換
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                    <span>信箱與意見箱</span>
                    <Cloud className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="mt-2 text-xs text-stone-300 leading-relaxed">
                    {isAdmin
                      ? `已具備 ${ADMIN_EMAIL} 專屬信箱發送與意見箱管理權限。`
                      : '可查收官方通知信件，並將意見回饋直接寄送至管理員信箱。'}
                  </div>
                  {onOpenMailbox && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenMailbox();
                      }}
                      className="mt-3 min-h-[40px] rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-all text-center"
                    >
                      開啟信箱與意見箱
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  onClick={handleSignOut}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-900/50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>安全登出並撤銷授權</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-stone-900 p-4">
                <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span>Google 官方安全驗證防護</span>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-xs text-stone-300 list-disc list-inside leading-relaxed">
                  <li>
                    <strong className="text-white">不經手任何密碼</strong>：全程由 Google 官方 OAuth 2.0 驗證（支援兩步驟驗證與通行金鑰）。
                  </li>
                  <li>
                    <strong className="text-white">零本機權杖儲存</strong>：個資與寄信權杖不寫入 localStorage，閒置後自動清除。
                  </li>
                  <li>
                    <strong className="text-white">防偽造管理驗證</strong>：僅限經 Google 驗證的{' '}
                    <span className="text-amber-300">{ADMIN_EMAIL}</span> 解鎖管理權限，並記錄不可竄改活動日誌。
                  </li>
                </ul>
              </div>

              {/* Official Google Sign-In Material Style Button */}
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleRealGoogleSignIn}
                className="gsi-material-button w-full min-h-[48px] flex items-center justify-center gap-3 rounded-xl border border-[#747775] bg-white py-3 px-4 font-bold text-sm text-[#1f1f1f] hover:bg-[#f8f9fa] active:scale-[0.99] shadow-xl transition-all cursor-pointer disabled:opacity-60"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>
                  {isSigningIn ? '正在開啟 Google 登入...' : 'Sign in with Google'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-800 bg-[#121212] px-5 py-3 flex items-center justify-between text-xs text-stone-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <Lock className="h-3 w-3" />
            <span>Firebase Authentication & OAuth 撤銷保護</span>
          </div>

          <button
            onClick={onClose}
            className="min-h-[40px] rounded-lg bg-stone-800 px-4 py-1.5 text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
