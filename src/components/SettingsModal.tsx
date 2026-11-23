import React, { useEffect } from 'react';
import { GameSettings } from '../types';
import { soundManager } from '../game/audio';
import { getSkinById } from '../game/skins';
import {
  Volume2,
  Music,
  Cloud,
  User,
  Smartphone,
  Monitor,
  BookOpen,
  Coins,
  Bot,
  HardDrive,
  Mail
} from 'lucide-react';

interface SettingsModalProps {
  isOpen?: boolean;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
  onOpenSkinModal?: () => void;
  isMobileMode?: boolean;
  onToggleMobileMode?: () => void;
  onOpenHelp?: () => void;
  onOpenDrive?: () => void;
  onOpenMarket?: () => void;
  onOpenAIGuide?: () => void;
  onOpenGoogleAccount?: () => void;
  onOpenMailbox?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
  onOpenSkinModal,
  isMobileMode,
  onToggleMobileMode,
  onOpenHelp,
  onOpenDrive,
  onOpenMarket,
  onOpenAIGuide,
  onOpenGoogleAccount,
  onOpenMailbox
}) => {
  // Listen for Escape to return
  useEffect(() => {
    if (isOpen === false) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        soundManager.playButtonClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (isOpen !== undefined && !isOpen) return null;

  const handleButtonClick = (action: () => void) => {
    soundManager.playButtonClick();
    action();
  };

  const cycleDifficulty = () => {
    const nextDiff =
      settings.difficulty === 'peaceful'
        ? 'easy'
        : settings.difficulty === 'easy'
        ? 'normal'
        : 'peaceful';
    onUpdateSettings({ difficulty: nextDiff });
  };

  const cycleRenderDistance = () => {
    const nextDist = settings.renderDistance === 2 ? 3 : settings.renderDistance === 3 ? 4 : 2;
    onUpdateSettings({ renderDistance: nextDist });
  };

  const difficultyLabels: Record<string, string> = {
    peaceful: '和平 (無怪物)',
    easy: '簡單 (傷害低)',
    normal: '一般 (經典)'
  };

  const currentSkin = getSkinById(settings.skinId || 'steve');

  return (
    <div
      id="minecraft-settings-screen"
      className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center select-none px-4 overflow-y-auto py-6 font-mono"
    >
      <div className="w-full max-w-xl flex flex-col items-center bg-stone-900/95 border-4 border-stone-600 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Title */}
        <h1
          id="settings-title"
          className="text-2xl sm:text-3xl font-black text-amber-300 tracking-widest mb-4 drop-shadow-[0_3px_4px_rgba(0,0,0,0.9)] text-center"
        >
          ⚙️ 遊戲設定 (Options)
        </h1>

        {/* Options Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 text-xs">
          {/* Master Volume Slider */}
          <div className="flex flex-col justify-center px-4 py-2.5 bg-[#3a3a3a] border-t-2 border-l-2 border-[#606060] border-b-2 border-r-2 border-[#1a1a1a] rounded">
            <div className="flex justify-between items-center text-neutral-200 mb-1.5 font-bold">
              <span className="flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                <span>主音效音量</span>
              </span>
              <span className="text-amber-300">
                {settings.masterVolume === 0 ? '靜音' : `${settings.masterVolume}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.masterVolume}
              onChange={(e) => {
                const vol = Number(e.target.value);
                onUpdateSettings({ masterVolume: vol });
                soundManager.setMasterVolume(vol);
              }}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-700 rounded"
            />
          </div>

          {/* Background Music Volume Slider */}
          <div className="flex flex-col justify-center px-4 py-2.5 bg-[#3a3a3a] border-t-2 border-l-2 border-[#606060] border-b-2 border-r-2 border-[#1a1a1a] rounded">
            <div className="flex justify-between items-center text-neutral-200 mb-1.5 font-bold">
              <span className="flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-sky-400" />
                <span>背景音樂 (BGM)</span>
              </span>
              <span className="text-amber-300">
                {!settings.musicEnabled || settings.musicVolume === 0
                  ? '關閉'
                  : `${settings.musicVolume}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.musicEnabled ? settings.musicVolume : 0}
              onChange={(e) => {
                const vol = Number(e.target.value);
                const enabled = vol > 0;
                onUpdateSettings({ musicVolume: vol, musicEnabled: enabled });
                soundManager.setMusicVolume(vol);
                soundManager.setMusicEnabled(enabled);
              }}
              className="w-full accent-sky-400 cursor-pointer h-1.5 bg-neutral-700 rounded"
            />
          </div>

          {/* Music Toggle Button */}
          <button
            id="setting-btn-music-toggle"
            onClick={() =>
              handleButtonClick(() => {
                const nextState = !settings.musicEnabled;
                onUpdateSettings({ musicEnabled: nextState });
                soundManager.setMusicEnabled(nextState);
              })
            }
            className="w-full py-2.5 px-3.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-bold tracking-wider transition-colors shadow flex items-center justify-between rounded"
          >
            <span className="text-neutral-300 flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-sky-400" />
              <span>背景音樂播放:</span>
            </span>
            <span className={settings.musicEnabled ? 'text-emerald-400' : 'text-neutral-400'}>
              {settings.musicEnabled ? '開啟 (ON)' : '關閉 (OFF)'}
            </span>
          </button>

          {/* 3D Clouds Toggle */}
          <button
            id="setting-btn-clouds"
            onClick={() =>
              handleButtonClick(() =>
                onUpdateSettings({ showClouds: !settings.showClouds })
              )
            }
            className="w-full py-2.5 px-3.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-bold tracking-wider transition-colors shadow flex items-center justify-between rounded"
          >
            <span className="text-neutral-300 flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5 text-amber-300" />
              <span>天空與 3D 雲層:</span>
            </span>
            <span className={settings.showClouds ? 'text-emerald-400' : 'text-neutral-400'}>
              {settings.showClouds ? '開啟 (立體浮雲)' : '關閉 (效能優化)'}
            </span>
          </button>

          {/* Character Skin Selector Button */}
          <button
            id="setting-btn-skin"
            onClick={() =>
              handleButtonClick(() => {
                if (onOpenSkinModal) {
                  onOpenSkinModal();
                }
              })
            }
            className="w-full py-2.5 px-3.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-bold tracking-wider transition-colors shadow flex items-center justify-between rounded"
          >
            <span className="text-neutral-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-400" />
              <span>人物外觀造型:</span>
            </span>
            <span className="text-amber-300 flex items-center gap-1">
              <span>{currentSkin.name.split(' ')[0]}</span>
              <span className="text-[10px] text-stone-400">[更換]</span>
            </span>
          </button>

          {/* Controls Mode Toggle (PC vs Mobile Touch) */}
          {onToggleMobileMode && (
            <button
              id="setting-btn-controls-mode"
              onClick={() => handleButtonClick(onToggleMobileMode)}
              className="w-full py-2.5 px-3.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-bold tracking-wider transition-colors shadow flex items-center justify-between rounded"
            >
              <span className="text-neutral-300 flex items-center gap-1.5">
                {isMobileMode ? (
                  <Smartphone className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Monitor className="h-3.5 w-3.5 text-sky-400" />
                )}
                <span>操作模式:</span>
              </span>
              <span className={isMobileMode ? 'text-amber-300' : 'text-sky-300'}>
                {isMobileMode ? '平板/手機觸控' : '電腦鍵鼠'}
              </span>
            </button>
          )}

          {/* Render Distance Cycle */}
          <button
            id="setting-btn-render-distance"
            onClick={() => handleButtonClick(cycleRenderDistance)}
            className="w-full py-2.5 px-3.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-bold tracking-wider transition-colors shadow flex items-center justify-between rounded"
          >
            <span className="text-neutral-300">視野渲染距離:</span>
            <span className="text-amber-300">
              {settings.renderDistance} 區塊 {settings.renderDistance === 3 ? '(標準)' : settings.renderDistance === 2 ? '(流暢 60FPS)' : '(遠景)'}
            </span>
          </button>

          {/* Difficulty Cycle */}
          <button
            id="setting-btn-difficulty"
            onClick={() => handleButtonClick(cycleDifficulty)}
            className="w-full py-2.5 px-3.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-bold tracking-wider transition-colors shadow flex items-center justify-between rounded"
          >
            <span className="text-neutral-300">遊戲難度:</span>
            <span className="text-amber-300">{difficultyLabels[settings.difficulty] || '一般'}</span>
          </button>

          {/* FOV Slider */}
          <div className="flex flex-col justify-center px-4 py-2.5 bg-[#3a3a3a] border-t-2 border-l-2 border-[#606060] border-b-2 border-r-2 border-[#1a1a1a] rounded">
            <div className="flex justify-between items-center text-neutral-200 mb-1.5 font-bold">
              <span>視角 (FOV)</span>
              <span className="text-amber-300">
                {settings.fov === 75 ? '標準 (75°)' : settings.fov >= 100 ? '極限 (' + settings.fov + '°)' : settings.fov + '°'}
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="105"
              step="1"
              value={settings.fov}
              onChange={(e) => onUpdateSettings({ fov: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-700 rounded"
            />
          </div>

          {/* Mouse Sensitivity Slider */}
          <div className="flex flex-col justify-center px-4 py-2.5 bg-[#3a3a3a] border-t-2 border-l-2 border-[#606060] border-b-2 border-r-2 border-[#1a1a1a] rounded">
            <div className="flex justify-between items-center text-neutral-200 mb-1.5 font-bold">
              <span>滑鼠旋轉靈敏度</span>
              <span className="text-amber-300">{settings.mouseSensitivity}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={settings.mouseSensitivity}
              onChange={(e) => onUpdateSettings({ mouseSensitivity: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-700 rounded"
            />
          </div>

          {/* Show Coordinates Toggle */}
          <button
            id="setting-btn-show-coords"
            onClick={() =>
              handleButtonClick(() =>
                onUpdateSettings({ showCoordinates: !settings.showCoordinates })
              )
            }
            className="w-full sm:col-span-2 py-2.5 px-3.5 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-bold tracking-wider transition-colors shadow flex items-center justify-between rounded"
          >
            <span className="text-neutral-300">顯示座標 (F3):</span>
            <span className={settings.showCoordinates ? 'text-emerald-400' : 'text-neutral-400'}>
              {settings.showCoordinates ? '開啟' : '關閉'}
            </span>
          </button>
        </div>

        {/* Extra Tools & Features moved from Main Menu */}
        {(onOpenMarket || onOpenAIGuide || onOpenGoogleAccount || onOpenDrive || onOpenHelp || onOpenMailbox) && (
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-[11px]">
            {onOpenMailbox && (
              <button
                onClick={() => handleButtonClick(() => { onClose(); onOpenMailbox(); })}
                className="flex min-h-[44px] items-center justify-center gap-1.5 py-2 px-2.5 rounded bg-[#1d2e4a] hover:bg-[#253b5e] border-t-2 border-l-2 border-sky-400/70 border-b-2 border-r-2 border-black text-sky-200 font-bold cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5 text-sky-300" />
                <span>信箱・意見箱</span>
              </button>
            )}
            {onOpenMarket && (
              <button
                onClick={() => handleButtonClick(() => { onClose(); onOpenMarket(); })}
                className="flex min-h-[44px] items-center justify-center gap-1.5 py-2 px-2.5 rounded bg-[#423315] hover:bg-[#52401b] border-t-2 border-l-2 border-amber-400/70 border-b-2 border-r-2 border-black text-amber-300 font-bold cursor-pointer"
              >
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                <span>方塊市集</span>
              </button>
            )}
            {onOpenAIGuide && (
              <button
                onClick={() => handleButtonClick(() => { onClose(); onOpenAIGuide(); })}
                className="flex min-h-[44px] items-center justify-center gap-1.5 py-2 px-2.5 rounded bg-[#133827] hover:bg-[#194a34] border-t-2 border-l-2 border-emerald-400/70 border-b-2 border-r-2 border-black text-emerald-300 font-bold cursor-pointer"
              >
                <Bot className="h-3.5 w-3.5 text-emerald-400" />
                <span>玩法 AI 導覽</span>
              </button>
            )}
            {onOpenGoogleAccount && (
              <button
                onClick={() => handleButtonClick(() => { onClose(); onOpenGoogleAccount(); })}
                className="flex min-h-[44px] items-center justify-center gap-1.5 py-2 px-2.5 rounded bg-[#1d2e4a] hover:bg-[#253b5e] border-t-2 border-l-2 border-blue-400/70 border-b-2 border-r-2 border-black text-blue-200 font-bold cursor-pointer"
              >
                <User className="h-3.5 w-3.5 text-blue-300" />
                <span>Google 帳號</span>
              </button>
            )}
            {onOpenDrive && (
              <button
                onClick={() => handleButtonClick(() => { onClose(); onOpenDrive(); })}
                className="flex min-h-[44px] items-center justify-center gap-1.5 py-2 px-2.5 rounded bg-[#383838] hover:bg-[#484848] border-t-2 border-l-2 border-stone-500 border-b-2 border-r-2 border-black text-stone-200 font-bold cursor-pointer"
              >
                <HardDrive className="h-3.5 w-3.5 text-sky-400" />
                <span>世界備份</span>
              </button>
            )}
            {onOpenHelp && (
              <button
                onClick={() => handleButtonClick(() => { onClose(); onOpenHelp(); })}
                className="flex min-h-[44px] items-center justify-center gap-1.5 py-2 px-2.5 rounded bg-[#383838] hover:bg-[#484848] border-t-2 border-l-2 border-stone-500 border-b-2 border-r-2 border-black text-stone-200 font-bold cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-300" />
                <span>遊戲手冊</span>
              </button>
            )}
          </div>
        )}

        {/* Done Button */}
        <button
          id="settings-btn-done"
          onClick={() => handleButtonClick(onClose)}
          className="w-full max-w-xs py-3 px-6 bg-[#4a4a4a] hover:bg-[#5e5e5e] active:bg-[#383838] border-t-2 border-l-2 border-[#828282] border-b-2 border-r-2 border-[#1e1e1e] text-white font-bold text-sm tracking-wider transition-colors shadow-lg active:translate-y-[1px] rounded"
        >
          完成 (Done)
        </button>
      </div>
    </div>
  );
};
