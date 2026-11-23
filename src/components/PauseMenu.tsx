import React, { useEffect, useState } from 'react';
import { soundManager } from '../game/audio';
import { Shield, Sparkles, Check, Globe, HelpCircle, User, Settings as SettingsIcon, Swords, Palette, Bot, Coins, Mail } from 'lucide-react';

interface PauseMenuProps {
  isOpen?: boolean;
  onResume: () => void;
  onOpenSettings: () => void;
  onOpenHelp?: () => void;
  onOpenSkins?: () => void;
  onOpenSaveBackup?: () => void;
  onSaveWorld?: () => void;
  onSwitchDimension?: () => void;
  onOpenMarket?: () => void;
  onOpenAIGuide?: () => void;
  onOpenMailbox?: () => void;
  onOpenGoogleAccount?: () => void;
  isCloudSignedIn?: boolean;
  mailboxUnreadCount?: number;
  currentDimension?: 'default' | 'heaven';
  onToggleGameMode?: () => void;
  onQuitToTitle?: () => void;
  onQuitToMainMenu?: () => void;
  gameMode?: 'survival' | 'creative';
  worldName?: string;
  seed?: number;
  playerPos?: { x: number; y: number; z: number };
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onOpenSettings,
  onOpenHelp,
  onOpenSkins,
  onOpenSaveBackup,
  onSaveWorld,
  onSwitchDimension,
  onOpenMarket,
  onOpenAIGuide,
  onOpenMailbox,
  onOpenGoogleAccount,
  isCloudSignedIn = false,
  mailboxUnreadCount = 0,
  currentDimension = 'default',
  onToggleGameMode,
  onQuitToTitle,
  onQuitToMainMenu,
  gameMode = 'survival',
  worldName = '我的世界',
  seed = 88888,
  playerPos
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Listen for Escape key to quickly resume
  useEffect(() => {
    if (isOpen === false) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        soundManager.playButtonClick();
        onResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onResume]);

  if (isOpen !== undefined && !isOpen) return null;

  const handleAction = (cb?: () => void) => {
    if (!cb) return;
    soundManager.playButtonClick();
    cb();
  };

  const handleQuit = () => {
    soundManager.playButtonClick();
    if (onQuitToMainMenu) {
      onQuitToMainMenu();
    } else if (onQuitToTitle) {
      onQuitToTitle();
    }
  };

  const handleSave = () => {
    soundManager.playCraftSuccess();
    if (onSaveWorld) {
      onSaveWorld();
    } else if (onOpenSaveBackup) {
      onOpenSaveBackup();
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleToggleMode = () => {
    soundManager.playCraftSuccess();
    if (onToggleGameMode) {
      onToggleGameMode();
    }
  };

  return (
    <div
      id="minecraft-pause-screen"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center select-none px-4 py-6 overflow-y-auto"
    >
      {/* Pause Protection Badge */}
      <div className="mb-4 flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-3.5 py-1 text-xs font-mono font-medium text-emerald-300 shadow-lg animate-pulse">
        <Shield className="h-3.5 w-3.5 text-emerald-400" />
        <span>遊戲已完全暫停・免疫所有傷害・生物與時間已靜止</span>
      </div>

      {/* Title */}
      <h1
        id="pause-menu-title"
        className="text-2xl sm:text-3xl font-bold text-white tracking-widest mb-5 drop-shadow-[0_3px_4px_rgba(0,0,0,0.9)] font-mono text-center"
      >
        遊戲選單
      </h1>

      {/* Button Menu Stack - Classic Layout */}
      <div className="w-full max-w-md flex flex-col gap-2.5">
        {/* Row 1: Back to Game */}
        <button
          id="pause-btn-resume"
          onClick={() => handleAction(onResume)}
          className="w-full min-h-[46px] py-3 px-4 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-mono font-bold text-base tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
        >
          回到遊戲
        </button>

        {/* Row 2: Game Mode Toggle & Settings */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="pause-btn-gamemode"
            onClick={handleToggleMode}
            title="點擊切換遊戲模式"
            className={`w-full min-h-[46px] py-3 px-2 flex items-center justify-center gap-1.5 border-t-2 border-l-2 border-b-2 border-r-2 font-mono font-bold text-xs sm:text-sm tracking-wider transition-all shadow-lg active:translate-y-[1px] ${
              gameMode === 'creative'
                ? 'bg-amber-900/90 hover:bg-amber-800 border-t-amber-400 border-l-amber-400 border-b-amber-950 border-r-amber-950 text-amber-200'
                : 'bg-emerald-950/90 hover:bg-emerald-900 border-t-emerald-400 border-l-emerald-400 border-b-amber-950 border-r-emerald-950 text-emerald-200'
            }`}
          >
            {gameMode === 'creative' ? (
              <>
                <Palette className="h-4 w-4 text-amber-300" />
                <span>模式: 創造模式</span>
              </>
            ) : (
              <>
                <Swords className="h-4 w-4 text-emerald-300" />
                <span>模式: 生存模式</span>
              </>
            )}
          </button>

          <button
            id="pause-btn-settings"
            onClick={() => handleAction(onOpenSettings)}
            className="w-full min-h-[46px] py-3 px-2 flex items-center justify-center gap-1.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-mono font-bold text-xs sm:text-sm tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
          >
            <SettingsIcon className="h-4 w-4 text-neutral-300" />
            <span>設定...</span>
          </button>
        </div>

        {/* Row 3: Skins & Dimension Switch */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="pause-btn-skins"
            onClick={() => handleAction(onOpenSkins)}
            className="w-full min-h-[46px] py-3 px-2 flex items-center justify-center gap-1.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-mono font-bold text-xs sm:text-sm tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
          >
            <User className="h-4 w-4 text-neutral-300" />
            <span>人物外觀...</span>
          </button>

          {onSwitchDimension ? (
            <button
              id="pause-btn-dimension"
              onClick={() => handleAction(onSwitchDimension)}
              className="w-full min-h-[46px] py-3 px-2 flex items-center justify-center gap-1 bg-amber-900 hover:bg-amber-800 active:bg-amber-950 border-t-2 border-l-2 border-amber-500 border-b-2 border-r-2 border-amber-950 text-amber-100 font-mono font-bold text-xs tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
            >
              <Globe className="h-3.5 w-3.5 text-amber-300" />
              <span>{currentDimension === 'heaven' ? '回主世界 🌍' : '往天堂 ☁️'}</span>
            </button>
          ) : (
            <button
              id="pause-btn-help"
              onClick={() => handleAction(onOpenHelp)}
              className="w-full min-h-[46px] py-3 px-2 flex items-center justify-center gap-1.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-mono font-bold text-xs sm:text-sm tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
            >
              <HelpCircle className="h-4 w-4 text-neutral-300" />
              <span>操作與指南</span>
            </button>
          )}
        </div>

        {/* Row 4: Marketplace & AI Guide */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="pause-btn-market"
            onClick={() => handleAction(onOpenMarket)}
            className="w-full min-h-[46px] py-3 px-2 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-950/80 to-stone-900 hover:from-amber-900 border-t-2 border-l-2 border-amber-400 border-b-2 border-r-2 border-black text-amber-300 font-mono font-bold text-xs sm:text-sm tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
          >
            <Coins className="h-4 w-4 text-amber-400" />
            <span>方塊市集 [積分]</span>
          </button>

          <button
            id="pause-btn-ai-guide"
            onClick={() => handleAction(onOpenAIGuide)}
            className="w-full min-h-[46px] py-3 px-2 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-950/80 to-stone-900 hover:from-emerald-900 border-t-2 border-l-2 border-emerald-400 border-b-2 border-r-2 border-black text-emerald-300 font-mono font-bold text-xs sm:text-sm tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
          >
            <Bot className="h-4 w-4 text-emerald-400" />
            <span>玩法 AI 導覽</span>
          </button>
        </div>

        {/* Row 5: Save & Help */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="pause-btn-save-backup"
            onClick={handleSave}
            className={`w-full min-h-[46px] py-3 px-2 flex items-center justify-center gap-1.5 border-t-2 border-l-2 border-b-2 border-r-2 font-mono font-bold text-xs sm:text-sm tracking-wider transition-all shadow-lg active:translate-y-[1px] ${
              saveSuccess
                ? 'bg-emerald-800 border-emerald-400 text-white'
                : 'bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-[#828282] border-l-[#828282] border-b-[#1e1e1e] border-r-[#1e1e1e] text-white'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span className="text-emerald-200">
                  {isCloudSignedIn ? '已同步至雲端！' : '本機存檔已保存！'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-neutral-300" />
                <span>{isCloudSignedIn ? '保存並同步雲端' : '保存世界存檔'}</span>
              </>
            )}
          </button>

          <button
            id="pause-btn-help-guide"
            onClick={() => handleAction(onOpenHelp)}
            className="w-full min-h-[46px] py-3 px-2 flex items-center justify-center gap-1.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-mono font-bold text-xs sm:text-sm tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
          >
            <HelpCircle className="h-4 w-4 text-neutral-300" />
            <span>操作指南</span>
          </button>
        </div>

        {/* Row 6: Mailbox & Account Cloud Sync */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {onOpenMailbox && (
            <button
              id="pause-btn-mailbox"
              onClick={() => handleAction(onOpenMailbox)}
              className="w-full min-h-[46px] py-3 px-3 flex items-center justify-center gap-2 bg-[#233d5c] hover:bg-[#2d4e75] border-t-2 border-l-2 border-sky-400/80 border-b-2 border-r-2 border-black text-sky-100 font-mono font-bold text-xs tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
            >
              <Mail className="h-4 w-4 text-sky-300 shrink-0" />
              <span className="truncate">信箱與意見箱</span>
              {mailboxUnreadCount > 0 && (
                <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white tabular-nums">
                  {mailboxUnreadCount}
                </span>
              )}
            </button>
          )}

          {onOpenGoogleAccount && (
            <button
              id="pause-btn-google-account"
              onClick={() => handleAction(onOpenGoogleAccount)}
              className={`w-full min-h-[46px] py-3 px-3 flex items-center justify-center gap-1.5 border-t-2 border-l-2 border-b-2 border-r-2 border-black font-mono font-bold text-xs tracking-wider transition-colors shadow-lg active:translate-y-[1px] ${
                isCloudSignedIn
                  ? 'bg-emerald-950/90 hover:bg-emerald-900 border-t-emerald-400 border-l-emerald-400 text-emerald-200'
                  : 'bg-blue-950/90 hover:bg-blue-900 border-t-blue-400 border-l-blue-400 text-blue-200'
              }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {isCloudSignedIn ? 'Google 帳號安全中心' : '登入 Google 同步雲端'}
              </span>
            </button>
          )}
        </div>

        {/* Row 7: Save & Quit to Title / Exit World */}
        <button
          id="pause-btn-quit"
          onClick={handleQuit}
          className="w-full min-h-[48px] py-3.5 px-4 mt-1 bg-[#8B2500] hover:bg-[#A03000] active:bg-[#681800] border-t-2 border-l-2 border-[#CD5555] border-b-2 border-r-2 border-[#4A0E0E] text-white font-mono font-bold text-base tracking-wider transition-colors shadow-lg active:translate-y-[1px]"
        >
          儲存並退出世界
        </button>
      </div>

      {/* World info footer */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-neutral-300 font-mono tracking-wider bg-black/40 px-4 py-2 rounded-xl border border-white/10">
        <span>世界: <b className="text-amber-300">{worldName}</b></span>
        <span>•</span>
        <span>種子碼: <b className="text-emerald-300">{seed}</b></span>
        {playerPos && (
          <>
            <span>•</span>
            <span>座標: <b className="text-sky-300">{Math.floor(playerPos.x)}, {Math.floor(playerPos.y)}, {Math.floor(playerPos.z)}</b></span>
          </>
        )}
        <span>•</span>
        <span>維度: <b className="text-amber-200">{currentDimension === 'heaven' ? '天堂世界 (Aether)' : '主世界 (Overworld)'}</b></span>
      </div>

      {/* Subtext info */}
      <div className="mt-3 text-neutral-400 text-xs font-mono tracking-widest drop-shadow text-center">
        按 [ESC] 鍵可隨時暫停或返回遊戲
      </div>
    </div>
  );
};

