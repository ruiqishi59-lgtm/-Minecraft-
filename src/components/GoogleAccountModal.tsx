import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
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
  isAdminUser,
  signInWithGoogleFirebase,
  signOutFirebase
} from '../firebase';
import { soundManager } from '../game/audio';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMarket?: () => void;
  onOpenMailbox?: () => void;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  onOpenMarket,
  onOpenMailbox
}) => {
  const [user, setUser] = useState<GoogleUserProfile | null>(null);
  const [points, setPoints] = useState<number>(100);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPrivateDetails, setShowPrivateDetails] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      setUser(getStoredUser());
      setPoints(getActivePoints());
    };
    update();
    window.addEventListener('google_user_updated', update);
    return () => window.removeEventListener('google_user_updated', update);
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin =
    isAdminUser(auth.currentUser) ||
    user?.email?.toLowerCase() === ADMIN_EMAIL;

  const handleRealGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const { user: fbUser } = await signInWithGoogleFirebase();
      const loggedUser = loginWithGoogleAccount({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || '冒險家',
        avatar: fbUser.photoURL || undefined
      });
      setUser(loggedUser);
      setPoints(loggedUser.points);
      confetti({ particleCount: 50, spread: 60 });
      soundManager.playCraftSuccess();
      setStatusMessage(
        fbUser.email?.toLowerCase() === ADMIN_EMAIL
          ? `🎉 歡迎管理員 ${ADMIN_EMAIL}！信箱管理與發信權限已解鎖。`
          : '🎉 Google 帳號已成功透過 Firebase 安全登入！'
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

  const handleSignOut = async () => {
    try {
      await signOutFirebase();
    } catch (e) {
      console.error('Firebase signOut error:', e);
    }
    logoutGoogleAccount();
    setUser(null);
    setPoints(getActivePoints());
    setStatusMessage('已登出 Google 帳號。');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm font-mono select-none">
      <div className="relative w-full max-w-lg max-h-[92dvh] rounded-2xl border-2 border-blue-500/50 bg-[#1a1a1a] text-stone-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 bg-[#121212] px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-900 shadow font-bold text-lg shrink-0">
              <svg className="h-6 w-6" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-blue-300">
                  Google 帳號中心
                </h2>
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
                  Firebase Auth
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                信箱與意見箱身分驗證 • 意見郵件發送授權
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
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {user && auth.currentUser ? (
            <div className="space-y-4">
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
                        已驗證
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
                        onClick={() => setShowPrivateDetails((prev) => !prev)}
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
                            <span>顯示完整帳號</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-800 text-[11px] text-stone-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>已連結 Firebase 安全驗證，僅本人與管理員依權限存取信箱資料。</span>
                </div>
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

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSignOut}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-900/50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>登出 Google 帳號</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-stone-900 p-4">
                <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span>登入 Google 帳號啟用完整服務</span>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-xs text-stone-300 list-disc list-inside leading-relaxed">
                  <li>
                    <strong className="text-white">玩家信箱同步</strong>：接收管理員回覆與官方重要公告。
                  </li>
                  <li>
                    <strong className="text-white">意見箱郵件寄送</strong>：將問題回報與建議直接寄至{' '}
                    <span className="text-amber-300">{ADMIN_EMAIL}</span>。
                  </li>
                  <li>
                    <strong className="text-white">管理權限驗證</strong>：若使用{' '}
                    <span className="text-amber-300">{ADMIN_EMAIL}</span> 登入，將自動解鎖管理員收件夾與信箱發訊權限。
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
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
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
            <span>Firebase Authentication & Gmail 授權保護</span>
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
