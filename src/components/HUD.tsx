import React, { useState, useEffect } from 'react';
import { InventoryItem, PlayerStats, WeatherType, BiomeType } from '../types';
import { CloudRain, Zap, Sun, Moon, Shield, Sparkles, Compass, Backpack, Hammer, Smartphone, Monitor, ShoppingCart, Bot, User, Coins, Crown, Eye, Mail } from 'lucide-react';
import { getStoredUser, getActivePoints, isVipActive, GoogleUserProfile } from '../utils/googleAuth';

interface HUDProps {
  currentBiome?: BiomeType;
  worldName?: string;
  stats: PlayerStats;
  inventory: (InventoryItem | null)[];
  activeHotbarIndex: number;
  onSelectHotbar: (index: number) => void;
  timeInfo: { hours: number; minutes: number; text: string; icon: string };
  weatherType: WeatherType;
  isLightning: boolean;
  playerPos: { x: number; y: number; z: number };
  isFlying: boolean;
  hurtTimer: number;
  isPointerLocked: boolean;
  spawnProtectionTimer?: number;
  isMobileMode: boolean;
  onToggleMobileMode: () => void;
  onOpenInventory: () => void;
  onOpenCrafting?: () => void;
  onOpenHelp: () => void;
  onOpenDrive: () => void;
  onCycleWeather: () => void;
  onOpenMainMenu: () => void;
  onToggleGameMode: () => void;
  onOpenSettings?: () => void;
  onOpenPause?: () => void;
  onSwitchDimension?: () => void;
  onOpenMarket?: () => void;
  onOpenAIGuide?: () => void;
  onOpenGoogleAccount?: () => void;
  onOpenMailbox?: () => void;
  mailboxUnreadCount?: number;
  viewMode?: 'first_person' | 'third_person_back' | 'third_person_front';
  onTogglePerspective?: () => void;
  currentDimension?: 'default' | 'heaven';
  dimension?: 'default' | 'heaven';
  miningProgress?: number;
  miningBlockName?: string;
  miningNotice?: string;
  bossInfo?: {
    id: string;
    title: string;
    health: number;
    maxHealth: number;
    phase?: number;
    avatarUrl?: string;
  } | null;
  portalLockedNotice?: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  currentBiome,
  worldName,
  stats,
  inventory,
  activeHotbarIndex,
  onSelectHotbar,
  timeInfo,
  weatherType,
  isLightning,
  playerPos,
  isFlying,
  hurtTimer,
  isPointerLocked,
  spawnProtectionTimer = 0,
  isMobileMode,
  onToggleMobileMode,
  onOpenInventory,
  onOpenCrafting,
  onOpenHelp,
  onOpenDrive,
  onCycleWeather,
  onOpenMainMenu,
  onToggleGameMode,
  onOpenSettings,
  onOpenPause,
  onSwitchDimension,
  onOpenMarket,
  onOpenAIGuide,
  onOpenGoogleAccount,
  onOpenMailbox,
  mailboxUnreadCount = 0,
  viewMode = 'first_person',
  onTogglePerspective,
  currentDimension,
  dimension = 'default',
  miningProgress = 0,
  miningBlockName = '',
  miningNotice = '',
  bossInfo = null,
  portalLockedNotice = null
}) => {
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  const [userPoints, setUserPoints] = useState<number>(100);

  useEffect(() => {
    const sync = () => {
      setGoogleUser(getStoredUser());
      setUserPoints(getActivePoints());
    };
    sync();
    window.addEventListener('google_user_updated', sync);
    return () => window.removeEventListener('google_user_updated', sync);
  }, []);

  // Safe action click helper: exits pointer lock and stops bubbling so buttons ALWAYS respond on first click
  const safeAction = (e: React.MouseEvent | React.TouchEvent, handler?: () => void) => {
    e.stopPropagation();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    handler?.();
  };

  // Hotbar items are the first 9 slots
  const hotbarItems = inventory.slice(0, 9);
  const activeItem = hotbarItems[activeHotbarIndex];
  const gameMode = stats.gameMode;

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-mono z-40">
      {/* 1. Red Hurt Screen Flash Overlay */}
      {hurtTimer > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.45)',
            boxShadow: 'inset 0 0 100px rgba(185, 28, 28, 0.9)'
          }}
        />
      )}

      {/* 2. Lightning Flash Full-screen */}
      {isLightning && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-white/75 transition-opacity duration-75" />
      )}

      {/* 3. Center Crosshair & Minecraft-style Mining Progress */}
      {(isPointerLocked || isMobileMode) && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative h-6 w-6 flex items-center justify-center">
            {/* Minecraft Standard Crosshair */}
            <div className="absolute top-2.5 left-0 h-1 w-6 bg-white/90 shadow-[0_0_2px_black]" />
            <div className="absolute top-0 left-2.5 h-6 w-1 bg-white/90 shadow-[0_0_2px_black]" />
            <div className="absolute top-2.5 left-2.5 h-1 w-1 bg-black/90" />

            {/* Circular SVG Mining Progress Ring */}
            {miningProgress > 0 && (
              <svg className="absolute -inset-3 h-12 w-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="17"
                  fill="none"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="17"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3.5"
                  strokeDasharray={106.8}
                  strokeDashoffset={106.8 * (1 - miningProgress)}
                  strokeLinecap="round"
                  className="transition-all duration-75"
                />
              </svg>
            )}
          </div>

          {/* Mining Progress label badge */}
          {miningProgress > 0 && (
            <div className="mt-4 flex items-center gap-1.5 rounded-full border border-amber-400/80 bg-black/90 px-3 py-1 text-xs font-bold text-amber-300 shadow-xl backdrop-blur-md animate-pulse">
              <span>⛏️ 正在挖掘 {miningBlockName || '方塊'}</span>
              <span className="text-white font-mono">{Math.round(miningProgress * 100)}%</span>
            </div>
          )}

          {/* Mining notice warning (e.g. need pickaxe for stone) */}
          {miningNotice && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-rose-500/80 bg-rose-950/95 px-3 py-1 text-xs font-black text-rose-200 shadow-2xl backdrop-blur-md animate-bounce">
              <span>{miningNotice}</span>
            </div>
          )}
        </div>
      )}

      {/* Spawn Protection Active Banner */}
      {spawnProtectionTimer > 0 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400 text-amber-200 text-xs font-bold shadow-xl animate-pulse pointer-events-none">
          <Shield className="h-3.5 w-3.5 text-amber-400" />
          <span>🛡️ 重生無敵保護 ({spawnProtectionTimer.toFixed(1)}s)</span>
        </div>
      )}

      {/* 3.5 Boss Health Bar (Seraphim Boss / 天界熾天使) */}
      {bossInfo && bossInfo.health > 0 && (
        <div className="pointer-events-none absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center w-[92%] max-w-lg transition-all">
          {/* Boss Header with Seraphim Avatar & Title */}
          <div className="flex items-center gap-2 mb-1 drop-shadow-[0_2px_4px_black]">
            <div className="relative h-7 w-7 rounded-full border-2 border-amber-400 bg-amber-950/80 overflow-hidden shadow-[0_0_10px_rgba(251,191,36,0.8)] shrink-0">
              <img
                src={bossInfo.avatarUrl || '/biblical_seraphim.jpg'}
                alt="聖經熾天使 Boss"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs">✨</span>
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider text-amber-300 drop-shadow-[0_1px_3px_black]">
              {bossInfo.title}
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-200/90 bg-amber-950/80 border border-amber-500/50 px-1.5 py-0.5 rounded">
              {Math.max(0, Math.ceil(bossInfo.health))} / {bossInfo.maxHealth} HP
            </span>
          </div>

          {/* Minecraft-style Segmented Boss Health Bar */}
          <div className="relative w-full h-4 sm:h-5 rounded-sm border-2 border-[#1a1a1a] bg-stone-950/90 shadow-[0_0_12px_rgba(0,0,0,0.8)] overflow-hidden p-0.5">
            <div className="relative h-full w-full bg-stone-900 rounded-xs overflow-hidden">
              <div
                className={`h-full transition-all duration-150 rounded-xs ${
                  (bossInfo.phase || 1) === 2
                    ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                    : 'bg-gradient-to-r from-purple-600 via-violet-500 to-amber-400 shadow-[0_0_12px_rgba(168,85,247,0.8)]'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (bossInfo.health / bossInfo.maxHealth) * 100))}%` }}
              />

              <div className="absolute inset-0 flex justify-between pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-full w-0.5 bg-black/60 shadow-[0_0_1px_black]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal Locked Alert Toast */}
      {portalLockedNotice && (
        <div className="pointer-events-none absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-xl border-2 border-rose-500 bg-rose-950/95 px-4 py-2 text-xs sm:text-sm font-black text-rose-200 shadow-2xl backdrop-blur-md animate-bounce">
          <span>{portalLockedNotice}</span>
        </div>
      )}

      {/* 4. Top Header Status Bar */}
      <div className="pointer-events-auto absolute top-2 right-2 left-2 z-20 flex flex-wrap items-center justify-between gap-1.5 pt-safe sm:top-3 sm:right-3 sm:left-3 sm:gap-2">
        {/* Left: App Title, World Name & Coordinates */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 backdrop-blur-md sm:gap-2 sm:px-3.5 sm:py-1.5">
          {worldName && (
            <span className="text-[11px] font-bold text-amber-300 sm:text-xs max-w-[110px] sm:max-w-[180px] truncate">
              {worldName}
            </span>
          )}
          {worldName && <div className="h-3 w-px bg-white/20" />}
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 sm:text-xs">
            <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">POS:</span>
          </div>
          <span className="text-[11px] text-gray-200 sm:text-xs">
            {Math.floor(playerPos.x)},{Math.floor(playerPos.y)},{Math.floor(playerPos.z)}
          </span>
          {currentBiome && (
            <>
              <div className="h-3 w-px bg-white/20" />
              <div
                className={`flex items-center gap-1 rounded border px-1.5 py-0.2 text-[9px] font-bold ${
                  currentBiome === 'desert'
                    ? 'bg-amber-600/70 text-amber-100 border-amber-400/40'
                    : currentBiome === 'snow'
                    ? 'bg-sky-600/70 text-sky-100 border-sky-300/40'
                    : currentBiome === 'swamp'
                    ? 'bg-teal-800/80 text-teal-100 border-teal-400/30'
                    : currentBiome === 'mountains'
                    ? 'bg-slate-600/70 text-slate-100 border-slate-400/40'
                    : currentBiome === 'forest'
                    ? 'bg-emerald-700/70 text-emerald-100 border-emerald-400/40'
                    : currentBiome === 'heaven'
                    ? 'bg-indigo-600/80 text-amber-200 border-yellow-300/40'
                    : 'bg-green-600/70 text-green-100 border-green-400/40'
                }`}
                title={`當前生物群系：${
                  currentBiome === 'desert'
                    ? '沙漠 (Desert)'
                    : currentBiome === 'snow'
                    ? '雪地 (Snow / Tundra)'
                    : currentBiome === 'swamp'
                    ? '沼澤 (Swamp)'
                    : currentBiome === 'mountains'
                    ? '山地 (Mountains)'
                    : currentBiome === 'forest'
                    ? '森林 (Forest)'
                    : currentBiome === 'heaven'
                    ? '天堂神域 (Heaven)'
                    : '平原 (Plains)'
                }`}
              >
                <span>
                  {currentBiome === 'desert'
                    ? '🏜️'
                    : currentBiome === 'snow'
                    ? '❄️'
                    : currentBiome === 'swamp'
                    ? '🌿'
                    : currentBiome === 'mountains'
                    ? '🏔️'
                    : currentBiome === 'forest'
                    ? '🌲'
                    : currentBiome === 'heaven'
                    ? '☁️'
                    : '🌾'}
                </span>
                <span>
                  {currentBiome === 'desert'
                    ? '沙漠'
                    : currentBiome === 'snow'
                    ? '雪地'
                    : currentBiome === 'swamp'
                    ? '沼澤'
                    : currentBiome === 'mountains'
                    ? '山地'
                    : currentBiome === 'forest'
                    ? '森林'
                    : currentBiome === 'heaven'
                    ? '天堂'
                    : '平原'}
                </span>
              </div>
            </>
          )}
          {isFlying && (
            <span className="rounded bg-amber-500/80 px-1 py-0.2 text-[9px] font-bold text-black uppercase">
              飛行
            </span>
          )}
        </div>

        {/* Center: Day/Night Time & Weather */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 backdrop-blur-md sm:gap-2 sm:px-3 sm:py-1.5">
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-300 sm:text-xs">
            <span className="text-xs sm:text-sm">{timeInfo.icon}</span>
            <span>{timeInfo.text}</span>
          </div>

          <div className="h-3 w-px bg-white/20" />

          {/* Weather Indicator & Cycle Button */}
          <button
            onClick={onCycleWeather}
            title="點擊切換天氣 (晴天 / 下雨 / 雷暴)"
            className="flex items-center gap-1 text-[11px] text-blue-300 transition-colors hover:text-white sm:text-xs"
          >
            {weatherType === 'clear' && (
              <>
                <Sun className="h-3 w-3 text-amber-400 sm:h-3.5 sm:w-3.5" />
                <span>晴天</span>
              </>
            )}
            {weatherType === 'rain' && (
              <>
                <CloudRain className="h-3 w-3 text-blue-400 sm:h-3.5 sm:w-3.5" />
                <span>雨天</span>
              </>
            )}
            {weatherType === 'thunder' && (
              <>
                <Zap className="h-3 w-3 text-amber-300 sm:h-3.5 sm:w-3.5" />
                <span className="font-bold text-amber-300">雷暴</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Unlock Mouse Cursor button (shown when desktop pointer is locked) */}
          {isPointerLocked && !isMobileMode && (
            <button
              onClick={(e) => safeAction(e)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="解除滑鼠鎖定，自由點選畫面按鈕 [ESC 鍵]"
              className="flex items-center gap-1 rounded-lg border border-amber-400/80 bg-amber-950/90 px-2 py-1 text-[11px] font-bold text-amber-200 shadow-md backdrop-blur-md hover:bg-amber-800 sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95"
            >
              <span>🔓 解鎖游標 [ESC]</span>
            </button>
          )}

          {/* Game Mode Switcher Button */}
          <button
            onClick={(e) => safeAction(e, onToggleGameMode)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            title="點擊切換遊戲模式 (生存 / 創造)"
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold backdrop-blur-md transition-all sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95 ${
              stats.gameMode === 'creative'
                ? 'border-amber-400 bg-amber-500/30 text-amber-300 hover:bg-amber-500/40'
                : 'border-emerald-500/50 bg-emerald-950/80 text-emerald-300 hover:bg-emerald-800'
            }`}
          >
            {stats.gameMode === 'creative' ? (
              <span>🎨 創造</span>
            ) : (
              <span>⚔️ 生存</span>
            )}
          </button>

          {/* Perspective Toggle Button (First Person / Third Person) */}
          {onTogglePerspective && (
            <button
              onClick={(e) => safeAction(e, onTogglePerspective)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="切換視角：第一人稱 / 背後第三人稱 / 正面第三人稱 [F5 鍵]"
              className="flex items-center gap-1 rounded-lg border border-purple-400/60 bg-purple-950/80 px-2 py-1 text-[11px] font-bold text-purple-200 shadow-md backdrop-blur-md transition-all hover:bg-purple-900 hover:text-white sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95"
            >
              <Eye className="h-3.5 w-3.5 text-purple-300" />
              <span>
                {viewMode === 'first_person' ? '第一人稱' : viewMode === 'third_person_back' ? '背後視角' : '正面視角'}
              </span>
              <span className="hidden lg:inline text-[9px] text-purple-300/70">[F5]</span>
            </button>
          )}

          {/* Mobile / Tablet / PC Mode Switcher Button */}
          <button
            onClick={(e) => safeAction(e, onToggleMobileMode)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            title="切換平板/手機觸控 / 電腦鍵鼠操作模式"
            className={`flex min-h-[38px] items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold backdrop-blur-md transition-all sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95 ${
              isMobileMode
                ? 'border-amber-500/80 bg-amber-950/80 text-amber-300'
                : 'border-white/20 bg-black/60 text-gray-300 hover:bg-white/20'
            }`}
          >
            {isMobileMode ? (
              <>
                <Smartphone className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">平板/觸控</span>
              </>
            ) : (
              <>
                <Monitor className="h-3.5 w-3.5 text-gray-300" />
                <span className="hidden sm:inline">電腦模式</span>
              </>
            )}
          </button>

          <button
            onClick={(e) => safeAction(e, onOpenDrive)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-950/80 px-2 py-1 text-[11px] font-semibold text-blue-300 shadow-md backdrop-blur-md transition-all hover:bg-blue-800 hover:text-white sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">存檔</span>
          </button>

          {/* Market & VIP Button */}
          {onOpenMarket && (
            <button
              onClick={(e) => safeAction(e, onOpenMarket)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="方塊市集：每月 10NT VIP 會員、精緻旗艦人物 (1000點) 與點數儲值"
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold shadow-md backdrop-blur-md transition-all sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95 ${
                isVipActive()
                  ? 'border-amber-400 bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-stone-950 font-black'
                  : 'border-amber-500/60 bg-amber-950/80 text-amber-300 hover:bg-amber-900 hover:text-white'
              }`}
            >
              {isVipActive() ? (
                <Crown className="h-3.5 w-3.5 fill-stone-950 text-stone-950" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span>{isVipActive() ? '創世VIP' : '市集'}</span>
              <span className={`hidden sm:inline text-[10px] ${isVipActive() ? 'text-stone-900 font-bold' : 'text-amber-200/90 font-normal'}`}>
                ({userPoints})
              </span>
            </button>
          )}

          {/* AI Guide Button */}
          {onOpenAIGuide && (
            <button
              onClick={(e) => safeAction(e, onOpenAIGuide)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="遊戲玩法 AI 導覽助手：解答合成、世界觀與技巧"
              className="flex items-center gap-1 rounded-lg border border-emerald-500/60 bg-emerald-950/80 px-2 py-1 text-[11px] font-bold text-emerald-300 shadow-md backdrop-blur-md transition-all hover:bg-emerald-900 hover:text-white sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95"
            >
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              <span>AI導覽</span>
            </button>
          )}

          {/* Mailbox & Feedback Button */}
          {onOpenMailbox && (
            <button
              onClick={(e) => safeAction(e, onOpenMailbox)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="玩家信箱與意見箱（可寄送意見至 ruiqishi59@gmail.com）"
              className="relative flex min-h-[38px] items-center gap-1 rounded-lg border border-sky-400/70 bg-sky-950/85 px-2 py-1 text-[11px] font-bold text-sky-200 shadow-md backdrop-blur-md transition-all hover:bg-sky-900 hover:text-white sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95"
            >
              <Mail className="h-3.5 w-3.5 text-sky-300" />
              <span>信箱</span>
              {mailboxUnreadCount > 0 && (
                <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded bg-rose-500 px-1 text-[10px] font-black text-white">
                  {mailboxUnreadCount > 99 ? '99+' : mailboxUnreadCount}
                </span>
              )}
            </button>
          )}

          {/* Google Account Button - Privacy protected: Never displays user email/real name on screen */}
          {onOpenGoogleAccount && (
            <button
              onClick={(e) => safeAction(e, onOpenGoogleAccount)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="個人帳號安全中心 (點擊開啟，隱私保護僅本人可見)"
              className="flex min-h-[38px] items-center gap-1 rounded-lg border border-blue-500/60 bg-blue-950/80 px-2 py-1 text-[11px] font-bold text-blue-200 shadow-md backdrop-blur-md transition-all hover:bg-blue-900 hover:text-white sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95"
            >
              <User className="h-3.5 w-3.5 text-blue-300" />
              <span className="hidden md:inline">
                {googleUser ? '個人帳號' : '帳號中心'}
              </span>
            </button>
          )}

          {/* Dimension Switcher (Overworld <-> Heaven) */}
          {onSwitchDimension && (
            <button
              onClick={(e) => safeAction(e, onSwitchDimension)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title={currentDimension === 'heaven' ? '點擊返回主世界' : '點擊前往天堂以太世界'}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold backdrop-blur-md transition-all sm:px-2.5 sm:py-1.5 sm:text-xs active:scale-95 ${
                currentDimension === 'heaven'
                  ? 'border-amber-400 bg-amber-500/30 text-amber-300 hover:bg-amber-500/50'
                  : 'border-sky-400/60 bg-sky-950/80 text-sky-300 hover:bg-sky-800'
              }`}
            >
              <span>{currentDimension === 'heaven' ? '🌲 回主世界' : '☁️ 往天堂'}</span>
            </button>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={(e) => safeAction(e, onOpenSettings)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="遊戲設定 (音量、音樂、雲層、皮膚)"
              className="rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-[11px] font-bold text-gray-300 hover:bg-white/20 hover:text-white sm:text-xs active:scale-95"
            >
              ⚙️
            </button>
          )}

          <button
            onClick={(e) => safeAction(e, onOpenHelp)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            title="操作指南與生存手冊"
            className="rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-[11px] text-gray-300 hover:bg-white/20 hover:text-white sm:text-xs active:scale-95"
          >
            ?
          </button>

          <button
            onClick={(e) => safeAction(e, onOpenPause ? onOpenPause : onOpenMainMenu)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            title="開啟遊戲暫停選單 [ESC]"
            className="flex items-center gap-1 rounded-lg border border-amber-500/50 bg-stone-900/95 px-2.5 py-1 text-[11px] font-bold text-amber-300 shadow-md backdrop-blur-md transition-all hover:bg-stone-800 hover:text-white sm:px-3 sm:py-1.5 sm:text-xs active:scale-95"
          >
            <span>⏸️ 暫停</span>
          </button>
        </div>
      </div>

      {/* 5. Bottom Center: Health, Hunger, Active Item Name, Hotbar & Backpack Button */}
      <div
        className={`pointer-events-auto absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 pb-safe transition-all ${
          isMobileMode ? 'bottom-2 sm:bottom-3' : 'bottom-4'
        }`}
      >
        {/* Hearts & Food Bars OR Creative Mode Pill */}
        {stats.gameMode === 'survival' ? (
          <div className="flex w-full items-center justify-between px-1">
            {/* Health Hearts (10 hearts = 20 HP) */}
            <div className="flex gap-0.5 drop-shadow-[0_1px_2px_black]">
              {Array.from({ length: 10 }).map((_, i) => {
                const heartValue = (i + 1) * 2;
                const isFull = stats.health >= heartValue;
                const isHalf = stats.health >= heartValue - 1 && !isFull;
                return (
                  <span
                    key={i}
                    className={`text-xs sm:text-sm ${
                      isFull ? 'text-red-500' : isHalf ? 'text-red-400' : 'text-gray-600'
                    }`}
                  >
                    {isFull ? '❤️' : isHalf ? '💔' : '🖤'}
                  </span>
                );
              })}
            </div>

            {/* Hunger Bar (10 drumsticks) */}
            <div className="flex gap-0.5 drop-shadow-[0_1px_2px_black]">
              {Array.from({ length: 10 }).map((_, i) => {
                const hungerValue = (i + 1) * 2;
                const isFull = stats.hunger >= hungerValue;
                const isHalf = stats.hunger >= hungerValue - 1 && !isFull;
                return (
                  <span
                    key={i}
                    className={`text-xs sm:text-sm ${
                      isFull || isHalf ? 'opacity-100' : 'opacity-30 grayscale'
                    }`}
                  >
                    🍖
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/50 bg-black/80 px-3.5 py-0.5 text-xs text-amber-300 shadow-md backdrop-blur-md">
            <span className="font-bold">🎨 創造模式</span>
            <span className="text-[10px] text-stone-300">• 無限方塊 • 自由飛行 • 無敵之軀</span>
          </div>
        )}

        {/* Directly on the top of the Hotbar: Backpack & Crafting Buttons + Active Item Label */}
        <div className="flex w-full items-end justify-between px-1 -mb-1 z-10 gap-1.5">
          <div className="flex items-end gap-1">
            {/* Backpack button placed directly on the top border of the hotbar */}
            <button
              id="hud-hotbar-top-backpack-btn"
              onClick={(e) => safeAction(e, onOpenInventory)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title={gameMode === 'creative' ? "點擊開啟創造模式無限物品庫 [鍵盤 E 鍵]" : "點擊開啟隨身背包 [鍵盤 E 鍵]"}
              className="flex items-center gap-1.5 rounded-t-lg border-2 border-b-0 border-amber-400 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 px-3 py-1 text-xs font-black text-white shadow-xl active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Backpack className="h-4 w-4 text-amber-200" />
              <span>{gameMode === 'creative' ? '🎨 物品庫 [E]' : '🎒 背包 [E]'}</span>
            </button>

            {/* 3x3 Crafting Table GUI button */}
            {onOpenCrafting && (
              <button
                id="hud-hotbar-top-crafting-btn"
                onClick={(e) => safeAction(e, onOpenCrafting)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                title="開啟 3×3 高級合成工作台 GUI [鍵盤 R 鍵或右鍵工作台方塊]"
                className="flex items-center gap-1.5 rounded-t-lg border-2 border-b-0 border-emerald-400 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 px-3 py-1 text-xs font-black text-white shadow-xl active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Hammer className="h-4 w-4 text-emerald-200" />
                <span>🛠️ 合成台 [R]</span>
              </button>
            )}
          </div>

          {/* Active item label tooltip */}
          {activeItem ? (
            <div className="rounded-t-lg bg-black/90 border border-b-0 border-white/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 shadow-md backdrop-blur-sm sm:text-xs">
              {activeItem.name} {gameMode === 'creative' ? '∞' : (activeItem.count > 1 ? `x${activeItem.count}` : '')}
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Hotbar (9 items slots + dedicated Backpack Slot on the hotbar) */}
        <div className="flex items-center gap-0.5 rounded-xl rounded-tl-none border-2 border-[#3b3b3b] bg-[#1e1e1e]/95 p-1 shadow-2xl backdrop-blur-md sm:gap-1 sm:p-1.5">
          {hotbarItems.map((item, idx) => {
            const isSelected = idx === activeHotbarIndex;
            return (
              <div
                key={idx}
                onClick={(e) => safeAction(e, () => onSelectHotbar(idx))}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={`relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-95 xs:h-10 xs:w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 ${
                  isSelected
                    ? 'scale-105 border-2 border-white bg-white/25 shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                    : 'border border-gray-700 bg-black/40 hover:bg-white/10'
                }`}
              >
                {/* Hotbar slot number */}
                <span className="absolute top-0.5 left-1 text-[8px] font-bold text-gray-400 hidden sm:inline">
                  {idx + 1}
                </span>

                {/* Item representation */}
                {item ? (
                  <div className="flex flex-col items-center justify-center">
                    {item.type === 'spawn_egg' ? (
                      <div
                        className="flex h-6 w-5 sm:h-7 sm:w-6 items-center justify-center rounded-full border border-black/60 shadow-inner"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, ${item.eggSecondaryColor || '#ffffff'} 0%, ${item.iconColor} 65%)`
                        }}
                      >
                        <span className="text-xs sm:text-sm select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          {item.iconSymbol || '🥚'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base select-none sm:text-xl">{item.iconSymbol || '📦'}</span>
                    )}
                    {gameMode === 'creative' ? (
                      <span className="absolute right-0.5 bottom-0 text-[9px] font-extrabold text-amber-300 drop-shadow-[0_1px_2px_black] sm:right-1 sm:text-[11px]">
                        ∞
                      </span>
                    ) : (
                      item.count > 1 && (
                        <span className="absolute right-0.5 bottom-0 text-[8px] font-extrabold text-white drop-shadow-[0_1px_2px_black] sm:right-1 sm:text-[10px]">
                          {item.count}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-gray-800" />
                )}
              </div>
            );
          })}

          {/* Integrated Backpack Button directly placed on the Hotbar as an extra slot */}
          <div
            id="hud-hotbar-slot-backpack"
            onClick={(e) => safeAction(e, onOpenInventory)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            title={gameMode === 'creative' ? "開啟創造模式物品庫 [E 鍵]" : "開啟隨身背包與合成配方 [E 鍵]"}
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-2 border-amber-400 bg-gradient-to-b from-amber-900/90 to-amber-950/90 hover:from-amber-800 hover:to-amber-900 text-amber-200 shadow-md transition-all active:scale-95 xs:h-10 xs:w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 ml-0.5"
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-base select-none sm:text-xl">{gameMode === 'creative' ? '🎨' : '🎒'}</span>
              <span className="hidden sm:inline text-[7px] md:text-[8px] font-black text-amber-300 -mt-0.5">
                {gameMode === 'creative' ? '物品庫' : '背包'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
