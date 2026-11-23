import React, { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  X,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Zap,
  Globe2,
  Coins,
  ArrowRight,
  Clock,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../game/audio';
import {
  getVipStatus,
  subscribeVip,
  cancelVip,
  VipSubscriptionInfo,
  getStoredUser
} from '../utils/googleAuth';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requiredForWorld?: boolean;
}

export const VipModal: React.FC<VipModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  requiredForWorld = false
}) => {
  const [vipInfo, setVipInfo] = useState<VipSubscriptionInfo>(getVipStatus());
  const [selectedMethod, setSelectedMethod] = useState<'credit' | 'linepay' | 'gpay' | 'telecom'>('credit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setVipInfo(getVipStatus());
    };
    update();
    window.addEventListener('vip_status_updated', update);
    window.addEventListener('google_user_updated', update);
    return () => {
      window.removeEventListener('vip_status_updated', update);
      window.removeEventListener('google_user_updated', update);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setIsProcessing(true);
    soundManager.playButtonClick();

    setTimeout(() => {
      const res = subscribeVip(selectedMethod);
      if (res.success) {
        setVipInfo(getVipStatus());
        setIsProcessing(false);
        soundManager.playCraftSuccess();
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });
        setStatusNotice('🎉 恭喜成為創世 VIP 會員！已解鎖「萬界融合新地形」與 500 點市集點數！');
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1200);
        }
      }
    }, 900);
  };

  const handleCancel = () => {
    if (confirm('確定要取消創世 VIP 會員訂閱嗎？取消後將於到期後失去萬界融合地形遊玩權限。')) {
      cancelVip();
      setVipInfo(getVipStatus());
      soundManager.playButtonClick();
      setStatusNotice('已取消 VIP 自動續訂。');
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md font-mono select-none text-white animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-amber-500/50 bg-[#151310] text-stone-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Golden Glow */}
        <div className="relative overflow-hidden border-b border-amber-500/30 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 px-6 py-5">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-500/20 blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-stone-950 shadow-lg shadow-amber-500/30 font-black">
                <Crown className="h-7 w-7 fill-stone-950 stroke-stone-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-amber-300 tracking-wider">
                    創世 VIP 會員特權
                  </h2>
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/40">
                    每月 NT$ 10
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  全宇宙唯一解鎖「萬界融合地形」的專屬通行證
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Urgent notice if blocked from playing fusion world */}
          {requiredForWorld && !vipInfo.isActive && (
            <div className="rounded-2xl border border-amber-500/60 bg-amber-500/10 p-3.5 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-amber-300">需要創世 VIP 會員才能遊玩</div>
                <div className="text-stone-300 mt-0.5">
                  「萬界融合新地形」融合了所有世界的地貌，為 VIP 會員專屬內容。每月只需 NT$ 10 即可立即解鎖並暢玩！
                </div>
              </div>
            </div>
          )}

          {/* Active Status Card if already subscribed */}
          {vipInfo.isActive ? (
            <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-sm text-emerald-300">您目前是有效創世 VIP 會員</span>
                </div>
                <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                  尊榮特權生效中
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-300 border-t border-emerald-500/20 pt-2">
                <div className="flex items-center gap-1.5 text-stone-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>剩餘有效期：</span>
                  <span className="font-bold text-emerald-300">{vipInfo.daysRemaining} 天</span>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-stone-400 hover:text-red-400 underline text-[11px]"
                >
                  取消自動續訂
                </button>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-2.5 text-xs font-bold text-stone-950 hover:brightness-110 shadow-lg shadow-amber-500/20"
              >
                <Crown className="h-4 w-4" />
                <span>續訂 1 個月 (+30天, NT$ 10)</span>
              </button>
            </div>
          ) : null}

          {/* Pricing & Value Proposition Highlight */}
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 p-4 relative overflow-hidden">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  銅板價暢享全宇宙
                </span>
                <h3 className="text-base font-black text-stone-100 mt-0.5">
                  月費只要 10 元台幣
                </h3>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-stone-400">NT$</span>
                  <span className="text-3xl font-black text-amber-400">10</span>
                  <span className="text-xs text-stone-400">/ 月</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">隨時可退 · 立即生效</div>
              </div>
            </div>
          </div>

          {/* Feature List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              會員專屬特權 (VIP Benefits)
            </h4>

            {/* Benefit 1: The Fusion World */}
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-stone-900/80 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Globe2 className="h-5 w-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-stone-100 flex items-center gap-1.5">
                  <span>🌌 解鎖「萬界融合新地形 (Fusion)」</span>
                  <span className="rounded bg-amber-500/30 text-amber-300 text-[9px] px-1 font-bold">
                    唯一途徑
                  </span>
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  將超平坦平原、經典丘陵與村莊、高聳險峰山脈、以及雲端浮空以太天島完全融為一體，所有方塊與生態同時共存！
                </p>
              </div>
            </div>

            {/* Benefit 2: Monthly Points Bonus */}
            <div className="flex items-start gap-3 rounded-2xl border border-stone-800 bg-stone-900/60 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                <Coins className="h-5 w-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-stone-100">
                  🎁 每月贈送 500 點市集積分 (價值 NT$ 150)
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  直接在市集兌換以太水晶鎬、熾焰聖劍、飛行羽翼等傳奇工具。
                </p>
              </div>
            </div>

            {/* Benefit 3: Crown Badge */}
            <div className="flex items-start gap-3 rounded-2xl border border-stone-800 bg-stone-900/60 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Award className="h-5 w-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-stone-100">
                  👑 專屬金色創世 VIP 王冠標記
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  在 HUD 頂部、存檔列表與個人檔案中自豪展示您的尊爵會員徽章。
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Selector if not active or renewing */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-300">
              選擇付款方式 (每月 NT$ 10)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('credit')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedMethod === 'credit'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                }`}
              >
                <CreditCard className="h-4 w-4 text-amber-400" />
                <span>信用卡 / 簽帳卡</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('linepay')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedMethod === 'linepay'
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                    : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-[9px] text-white font-black">
                  L
                </span>
                <span>LINE Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('gpay')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedMethod === 'gpay'
                    ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                    : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded bg-blue-500 text-[9px] text-white font-black">
                  G
                </span>
                <span>Google Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('telecom')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedMethod === 'telecom'
                    ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                    : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                }`}
              >
                <Smartphone className="h-4 w-4 text-sky-400" />
                <span>電信帳單代收</span>
              </button>
            </div>
          </div>

          {/* Feedback notice */}
          {statusNotice && (
            <div className="rounded-xl border border-emerald-500/60 bg-emerald-950/60 p-3 text-center text-xs font-bold text-emerald-300 animate-in fade-in">
              {statusNotice}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-stone-800 bg-[#100f0d] px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>256 位元安全加密，隨時可終止</span>
          </div>

          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-6 py-3 font-black text-stone-950 text-sm shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                <span>付款開通中...</span>
              </div>
            ) : (
              <>
                <Crown className="h-4 w-4 fill-stone-950" />
                <span>{vipInfo.isActive ? '立即續訂 (NT$ 10)' : '立即開通 VIP (每月 NT$ 10)'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
