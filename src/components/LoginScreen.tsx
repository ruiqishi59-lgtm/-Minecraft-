import React, { useState } from 'react';
import { Cloud, ShieldCheck, Lock, Sparkles, AlertCircle, UserCheck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ensureUserSecurityProfile,
  isAdminUser,
  logSecurityEvent,
  signInWithGoogleFirebase
} from '../firebase';
import { loginWithGoogleAccount } from '../utils/googleAuth';
import { getDeviceCategory } from '../utils/device';
import { soundManager } from '../game/audio';

interface LoginScreenProps {
  authReady: boolean;
  onLoginSuccess: () => void;
  onContinueGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  authReady,
  onLoginSuccess,
  onContinueGuest
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    soundManager.playButtonClick();

    try {
      const { user } = await signInWithGoogleFirebase();
      const deviceType = getDeviceCategory();

      loginWithGoogleAccount({
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || '冒險家',
        avatar: user.photoURL || undefined
      });

      await ensureUserSecurityProfile(user, deviceType);
      await logSecurityEvent(
        user,
        'sign_in',
        deviceType,
        isAdminUser(user)
          ? '透過登入畫面完成管理員 Google OAuth 驗證'
          : '透過登入畫面完成 Google OAuth 安全登入'
      );

      confetti({ particleCount: 45, spread: 60 });
      soundManager.playCraftSuccess();
      onLoginSuccess();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMessage('已取消 Google 登入視窗，您可重新點擊按鈕或先以訪客模式試玩。');
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('瀏覽器封鎖了彈出登入視窗，請允許彈出視窗後再試。');
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Google OAuth 驗證失敗，請稍後再試。'
        );
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      id="firebase-auth-login-screen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-safe pb-safe bg-black/65 backdrop-blur-sm font-mono text-white select-none overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-none border-4 border-black bg-[#1c1c1c]/95 shadow-[inset_2px_2px_0_#5a5a5a,inset_-3px_-4px_0_#0e0e0e,0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Classic Blocky Header Banner */}
        <div className="border-b-4 border-black bg-gradient-to-b from-[#2f2f2f] to-[#212121] px-6 py-5 text-center">
          <div className="inline-flex items-center gap-1.5 bg-emerald-950/90 border-2 border-emerald-500/60 px-3 py-1 text-[11px] font-bold text-emerald-300 mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Firebase Authentication • Google OAuth 2.0</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-black tracking-wider text-[#e6e6e6]"
            style={{
              textShadow: '0 3px 0 #444444, 0 5px 0 #111111'
            }}
          >
            盜版Rickie -2015
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-300 font-bold">
            安全登入您的 Google 帳號，雲端同步保存世界冒險進度
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {!authReady ? (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-stone-300">
              <div className="h-8 w-8 rounded-none border-4 border-emerald-400 border-t-transparent animate-spin" />
              <p className="text-xs sm:text-sm font-bold tracking-wider">
                正在向 Firebase 確認驗證狀態...
              </p>
            </div>
          ) : (
            <>
              {/* Security & Cloud Sync Benefits */}
              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div className="flex items-start gap-3 border-2 border-stone-700 bg-stone-900/90 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-sky-950 border border-sky-500/50 text-sky-300">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sky-300">安全雲端世界存檔</div>
                    <p className="mt-0.5 text-[11px] text-stone-400 leading-relaxed">
                      即時同步世界地形修改、種子碼、座標與 36 格背包至個人專屬 Firestore 雲端空間。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-2 border-stone-700 bg-stone-900/90 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300">零密碼與嚴格權限隔離</div>
                    <p className="mt-0.5 text-[11px] text-stone-400 leading-relaxed">
                      全程透過 Google 官方彈窗授權登入，僅本人 UID 可讀寫自己的雲端世界與安全日誌。
                    </p>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 border-2 border-rose-500/70 bg-rose-950/90 px-3.5 py-2.5 text-xs font-bold text-rose-200">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Primary Google OAuth Sign-In Button */}
              <button
                id="login-screen-google-btn"
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleLogin}
                className="w-full min-h-[52px] flex items-center justify-center gap-3 rounded-none border-2 border-black bg-white hover:bg-stone-100 active:translate-y-[2px] py-3 px-4 font-bold text-sm sm:text-base text-[#1f1f1f] shadow-[inset_2px_2px_0_#ffffff,inset_-2px_-3px_0_#cbd5e1,0_4px_0_rgba(0,0,0,0.65)] transition-all cursor-pointer disabled:opacity-60"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
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
                  {isSigningIn ? '正在開啟 Google 安全驗證...' : '使用 Google 帳號登入 (Sign in with Google)'}
                </span>
              </button>

              {/* Secondary Guest / Local Option */}
              <button
                id="login-screen-guest-btn"
                type="button"
                disabled={isSigningIn}
                onClick={() => {
                  soundManager.playButtonClick();
                  onContinueGuest();
                }}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-none border-2 border-black bg-[#4d4d4d] hover:bg-[#5f5f5f] active:bg-[#3a3a3a] py-2.5 px-4 text-xs sm:text-sm font-bold text-stone-200 shadow-[inset_2px_2px_0_#7c7c7c,inset_-2px_-3px_0_#2b2b2b,0_3px_0_rgba(0,0,0,0.55)] transition-all cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4 text-amber-300" />
                <span>先以訪客模式遊玩（僅本機存檔，可隨時登入同步）</span>
                <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black bg-[#121212] px-5 py-3 flex items-center justify-between text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>支援桌機與平板觸控操作</span>
          </span>
          <span>Encrypted Firestore Sync</span>
        </div>
      </div>
    </div>
  );
};
