import React, { useEffect, useState } from 'react';
import { CharacterSkin } from '../types';
import { CHARACTER_SKINS, getSkinById } from '../game/skins';
import { soundManager } from '../game/audio';
import { Check, User, Sparkles, ArrowLeft, Shield, Lock, Coins, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getActivePoints,
  spendPoints,
  unlockSkin,
  getUnlockedSkins
} from '../utils/googleAuth';

interface SkinSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSkinId?: string;
  activeSkinId?: string;
  onSelectSkin: (skinId: string) => void;
  onOpenMarket?: () => void;
}

export const SkinSelectModal: React.FC<SkinSelectModalProps> = ({
  isOpen,
  onClose,
  currentSkinId,
  activeSkinId,
  onSelectSkin,
  onOpenMarket
}) => {
  const initialId = activeSkinId || currentSkinId || 'steve';
  const [selectedId, setSelectedId] = useState<string>(initialId);
  const [points, setPoints] = useState<number>(getActivePoints());
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(getUnlockedSkins());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(activeSkinId || currentSkinId || 'steve');
      setPoints(getActivePoints());
      setUnlockedSkins(getUnlockedSkins());
    }
  }, [isOpen, activeSkinId, currentSkinId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        soundManager.playButtonClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeSkin = getSkinById(selectedId);
  const isSelectedUnlocked = !activeSkin.isDeluxe || unlockedSkins.includes(activeSkin.id);

  const handleApply = (id: string) => {
    setSelectedId(id);
    const skin = getSkinById(id);
    if (!skin.isDeluxe || unlockedSkins.includes(id)) {
      onSelectSkin(id);
      soundManager.playButtonClick();
      setNotice(`已套用外觀：${skin.name}`);
      setTimeout(() => setNotice(null), 2500);
    }
  };

  const handleUnlockDeluxe = (skin: CharacterSkin) => {
    const currentPts = getActivePoints();
    if (currentPts < 1000) {
      if (onOpenMarket) {
        onClose();
        onOpenMarket();
      } else {
        alert(`積分不足！解鎖精緻人物【${skin.name}】需要 1000 點積分，您目前只有 ${currentPts} 點。請至市集儲值或加入每月 10NT 創世 VIP 獲取積分！`);
      }
      return;
    }

    const success = spendPoints(1000, `skin_${skin.id}`);
    if (success) {
      unlockSkin(skin.id);
      setPoints(getActivePoints());
      setUnlockedSkins(getUnlockedSkins());
      onSelectSkin(skin.id);
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      soundManager.playCraftSuccess();
      setNotice(`🎉 成功以 1000 積分解鎖精緻人物【${skin.name}】！`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div
      id="minecraft-skin-select-screen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md font-mono select-none text-white animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col h-full max-h-[640px] w-full max-w-3xl rounded-2xl border-4 border-stone-600 bg-stone-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-700 bg-stone-950 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <User className="h-5 w-5 text-amber-400" />
            <span className="text-lg sm:text-xl font-black text-stone-100">
              人物外觀與造型 (Character Skins)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-300">
              <Coins className="h-4 w-4 text-amber-400" />
              <span>{points} 點</span>
            </div>

            <button
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
              }}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-white px-2.5 py-1 rounded bg-stone-800 border border-stone-700 active:translate-y-0.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>返回</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="bg-emerald-950/90 border-b border-emerald-600 px-4 py-2 text-xs font-bold text-emerald-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left / Active Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-between p-4 rounded-xl bg-stone-950/80 border-2 border-stone-700 text-center">
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 tracking-wider">
                  造型預覽
                </span>
                {activeSkin.isDeluxe && (
                  <span className="rounded bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[9px] font-black text-stone-950 shadow-sm">
                    精緻旗艦 • 1000 點
                  </span>
                )}
              </div>

              {/* Blocky Character Figure 2D Representation */}
              <div className="relative w-32 h-56 flex flex-col items-center justify-center mx-auto my-2 p-2 bg-black/40 rounded-lg border border-stone-700 shadow-inner">
                {/* Halo/Crown indicator */}
                {activeSkin.accessories?.hasCrown && (
                  <div className="absolute top-1 left-8 right-8 h-1 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_#fbbf24]" />
                )}

                {/* Head */}
                <div
                  className="w-14 h-14 rounded-sm border border-black/40 relative shadow-md"
                  style={{ backgroundColor: activeSkin.skinColor }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-4 rounded-t-sm"
                    style={{ backgroundColor: activeSkin.hairColor }}
                  />
                  {/* Visor */}
                  {activeSkin.accessories?.hasVisor ? (
                    <div className="absolute top-5 left-1 right-1 h-3 bg-cyan-400/90 border border-cyan-200 shadow-[0_0_6px_#22d3ee] rounded-xs" />
                  ) : (
                    <div className="flex justify-center gap-3 mt-5">
                      <div className="w-1.5 h-1.5 rounded-xs" style={{ backgroundColor: activeSkin.eyeColor }} />
                      <div className="w-1.5 h-1.5 rounded-xs" style={{ backgroundColor: activeSkin.eyeColor }} />
                    </div>
                  )}
                </div>

                {/* Torso & Arms */}
                <div className="flex gap-1 mt-1">
                  {/* Arm L */}
                  <div
                    className="w-4 h-16 rounded-xs border border-black/30 flex flex-col justify-between"
                    style={{ backgroundColor: activeSkin.skinColor }}
                  >
                    <div className="h-6 w-full" style={{ backgroundColor: activeSkin.shirtColor }} />
                  </div>

                  {/* Body */}
                  <div
                    className="w-12 h-16 rounded-xs border border-black/30 relative flex flex-col justify-between"
                    style={{ backgroundColor: activeSkin.shirtColor }}
                  >
                    {activeSkin.accessories?.glowColor && (
                      <div
                        className="w-3 h-3 mx-auto mt-4 rounded-full border border-white animate-pulse"
                        style={{ backgroundColor: activeSkin.accessories.glowColor }}
                      />
                    )}
                  </div>

                  {/* Arm R */}
                  <div
                    className="w-4 h-16 rounded-xs border border-black/30 flex flex-col justify-between"
                    style={{ backgroundColor: activeSkin.skinColor }}
                  >
                    <div className="h-6 w-full" style={{ backgroundColor: activeSkin.shirtColor }} />
                  </div>
                </div>

                {/* Legs */}
                <div className="flex gap-1 mt-1">
                  <div
                    className="w-5 h-16 rounded-xs border border-black/30 flex flex-col justify-between"
                    style={{ backgroundColor: activeSkin.pantsColor }}
                  >
                    <div className="h-4 w-full" style={{ backgroundColor: activeSkin.shoesColor }} />
                  </div>
                  <div
                    className="w-5 h-16 rounded-xs border border-black/30 flex flex-col justify-between"
                    style={{ backgroundColor: activeSkin.pantsColor }}
                  >
                    <div className="h-4 w-full" style={{ backgroundColor: activeSkin.shoesColor }} />
                  </div>
                </div>
              </div>

              <div className="text-sm font-black text-stone-100 mt-2">{activeSkin.name}</div>
              <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                {activeSkin.description}
              </p>
            </div>

            <div className="w-full mt-3">
              {isSelectedUnlocked ? (
                <button
                  onClick={() => handleApply(activeSkin.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs tracking-wider border-2 border-emerald-400 shadow-md transition-all active:scale-[0.98]"
                >
                  ✓ 套用此外觀 (Apply Skin)
                </button>
              ) : (
                <button
                  onClick={() => handleUnlockDeluxe(activeSkin)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs tracking-wider shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Coins className="h-4 w-4 fill-stone-950" />
                  <span>以 1000 積分解鎖並穿戴</span>
                </button>
              )}
            </div>
          </div>

          {/* Right / Skin Catalog Grid (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-2 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300 mb-1">
              <span>造型庫一覽：</span>
              <span className="text-[11px] text-amber-300">精緻造型統一售價 1000 點</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CHARACTER_SKINS.map((skin) => {
                const isSelected = skin.id === selectedId;
                const isUnlocked = !skin.isDeluxe || unlockedSkins.includes(skin.id);

                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      setSelectedId(skin.id);
                      if (isUnlocked) {
                        onSelectSkin(skin.id);
                        soundManager.playButtonClick();
                      }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/70 shadow-lg text-white'
                        : 'border-stone-700 bg-stone-950/60 text-stone-300 hover:border-stone-500 hover:bg-stone-950'
                    }`}
                  >
                    {/* Small avatar box */}
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-black/40 flex items-center justify-center relative overflow-hidden shadow-inner shrink-0"
                      style={{ backgroundColor: skin.skinColor }}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-3"
                        style={{ backgroundColor: skin.hairColor }}
                      />
                      <div className="flex gap-1.5 mt-2">
                        <div className="w-1.5 h-1 rounded-xs" style={{ backgroundColor: skin.eyeColor }} />
                        <div className="w-1.5 h-1 rounded-xs" style={{ backgroundColor: skin.eyeColor }} />
                      </div>
                    </div>

                    {/* Skin details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate">{skin.name}</span>
                        {skin.isDeluxe && !isUnlocked && (
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                            <Lock className="h-2.5 w-2.5" />
                            1000點
                          </span>
                        )}
                        {isSelected && isUnlocked && (
                          <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate mt-0.5">
                        {skin.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-stone-700 bg-stone-950 px-5 py-3 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span>精緻人物具備專屬 3D 浮空羽翼、光環與高階裝甲配件</span>
          </div>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="py-1.5 px-4 rounded bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
