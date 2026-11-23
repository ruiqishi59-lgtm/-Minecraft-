import React, { useState, useEffect } from 'react';
import { soundManager } from '../game/audio';
import { Character3DPreview } from './Character3DPreview';

interface MainMenuProps {
  onOpenWorldSelect: () => void;
  onOpenSettings: () => void;
  onOpenSkins: () => void;
  onOpenMarket: () => void;
  onOpenMailbox?: () => void;
  mailboxUnreadCount?: number;
  skinId?: string;
}

const SPLASH_TEXTS = [
  '正宗 盜版Rickie -2015 經典方塊風格！',
  '全新信箱與意見箱上線：直達作者信箱！',
  '全面適配 iPad 與各類平板觸控操作！',
  '全新生物與生怪蛋系統上線：蜘蛛、終界使者、鐵魔像！',
  '沙漠、雪地、沼澤多樣生態群系上線！',
  '方塊市集限時登場：造型、世界與會員特權！',
  '支援 3×3 互動工作台合成進階工具與裝飾方塊！',
  '2015 經典懷舊回歸 • 100% WebGL 3D 冒險！'
];

export const MainMenu: React.FC<MainMenuProps> = ({
  onOpenWorldSelect,
  onOpenSettings,
  onOpenSkins,
  onOpenMarket,
  onOpenMailbox,
  mailboxUnreadCount = 0,
  skinId = 'steve'
}) => {
  const [splashIndex, setSplashIndex] = useState(0);

  useEffect(() => {
    setSplashIndex(Math.floor(Math.random() * SPLASH_TEXTS.length));
  }, []);

  const handlePress = (cb?: () => void) => {
    if (!cb) return;
    soundManager.playButtonClick();
    cb();
  };

  return (
    <div
      id="rickie-main-menu"
      className="fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 pt-safe pb-safe bg-gradient-to-b from-black/35 via-black/10 to-black/45 select-none font-mono text-white overflow-y-auto"
    >
      {/* Top Bar: Classic Block Edition Header + Quick Mailbox */}
      <div className="w-full flex items-center justify-between gap-2 text-xs text-stone-200 drop-shadow-[2px_2px_0_rgba(0,0,0,0.9)] px-1 sm:px-2">
        <span className="font-bold tracking-wider text-stone-100">
          盜版Rickie -2015 (體素 3D 版)
        </span>
        {onOpenMailbox && (
          <button
            type="button"
            id="main-menu-btn-mailbox-top"
            onClick={() => handlePress(onOpenMailbox)}
            className="flex min-h-[44px] items-center gap-1.5 rounded-none border-2 border-black bg-[#3b6998] hover:bg-[#497db2] active:bg-[#2d5175] px-3.5 py-1.5 text-xs font-bold text-white shadow-[inset_2px_2px_0_#6ca3db,inset_-2px_-3px_0_#1e3a57,0_3px_0_rgba(0,0,0,0.55)] cursor-pointer"
          >
            <span>📬 信箱・意見箱</span>
            {mailboxUnreadCount > 0 && (
              <span className="bg-rose-600 border border-black px-1.5 py-0.5 text-[10px] font-black text-white tabular-nums">
                {mailboxUnreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main Content: Left = Classic Block Stone Logo + Buttons, Right = 3D Character */}
      <div className="my-auto mx-auto w-full max-w-5xl flex flex-col md:flex-row items-center justify-center md:justify-between gap-6 md:gap-10 px-2 sm:px-6 py-4">
        {/* Left Column: Iconic Stone-Block Logo + Splash + Sharp-Edged Blocky Buttons */}
        <div className="flex flex-col items-center w-full max-w-[390px]">
          {/* Classic Stone-Block Extruded Logo */}
          <div className="relative flex flex-col items-center w-full mb-7 sm:mb-9">
            <div className="relative inline-flex flex-col items-center">
              <div
                className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-wider text-[#e6e6e6] whitespace-nowrap leading-none px-4 py-3 bg-[#4a4a4a]/90 border-t-4 border-l-4 border-[#8e8e8e] border-b-8 border-r-4 border-b-[#1a1a1a] border-r-[#1a1a1a] shadow-[0_10px_0_rgba(0,0,0,0.65)]"
                style={{
                  textShadow:
                    '0 4px 0 #555555, 0 7px 0 #1f1f1f, 3px 3px 0 #1f1f1f'
                }}
              >
                盜版Rickie -2015
              </div>
              <div className="-mt-1.5 bg-[#2d2d2d] border-2 border-black px-3 py-0.5 text-[11px] sm:text-xs font-black tracking-[0.26em] text-[#d0d0d0] shadow-[0_3px_0_rgba(0,0,0,0.8)]">
                VOXEL SANDBOX EDITION
              </div>

              <div className="mt-3 sm:mt-0 sm:absolute sm:-bottom-6 sm:-right-4 z-10 rotate-[-12deg] animate-pulse">
                <span
                  className="inline-block whitespace-nowrap text-xs sm:text-sm font-black text-[#ffff00] tracking-wide"
                  style={{
                    textShadow: '2px 2px 0 #3f3f00'
                  }}
                >
                  {SPLASH_TEXTS[splashIndex]}
                </span>
              </div>
            </div>
          </div>

          {/* Classic Blocky Menu Stack */}
          <div className="flex flex-col gap-2.5 w-full max-w-[350px]">
            <button
              id="main-menu-btn-play"
              onClick={() => handlePress(onOpenWorldSelect)}
              className="w-full min-h-[48px] py-3.5 px-6 rounded-none bg-[#3c8527] hover:bg-[#499e30] active:bg-[#2f6b1e] text-white font-bold text-base sm:text-lg tracking-widest border-2 border-black shadow-[inset_2px_2px_0_#6bc349,inset_-2px_-4px_0_#1e4d12,0_4px_0_rgba(0,0,0,0.55)] active:translate-y-[2px] active:shadow-[inset_2px_2px_0_#2b5d1c,inset_-2px_-2px_0_#6bc349] transition-all cursor-pointer"
              style={{ textShadow: '2px 2px 0 #1b3d11' }}
            >
              開始遊戲
            </button>

            <button
              id="main-menu-btn-market"
              onClick={() => handlePress(onOpenMarket)}
              className="w-full min-h-[48px] py-3 px-6 rounded-none bg-[#b87314] hover:bg-[#cf861f] active:bg-[#8f580d] text-[#fff6cc] font-bold text-base tracking-widest border-2 border-black shadow-[inset_2px_2px_0_#f2b441,inset_-2px_-4px_0_#613806,0_4px_0_rgba(0,0,0,0.55)] active:translate-y-[2px] active:shadow-[inset_2px_2px_0_#613806,inset_-2px_-2px_0_#f2b441] transition-all cursor-pointer"
              style={{ textShadow: '2px 2px 0 #472804' }}
            >
              🛒 方塊市集
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="main-menu-btn-skins"
                onClick={() => handlePress(onOpenSkins)}
                className="w-full min-h-[48px] py-3 px-3 rounded-none bg-[#727272] hover:bg-[#848484] active:bg-[#5c5c5c] text-white font-bold text-sm sm:text-base tracking-wider border-2 border-black shadow-[inset_2px_2px_0_#a8a8a8,inset_-2px_-4px_0_#383838,0_4px_0_rgba(0,0,0,0.55)] active:translate-y-[2px] active:shadow-[inset_2px_2px_0_#383838,inset_-2px_-2px_0_#a8a8a8] transition-all cursor-pointer"
                style={{ textShadow: '2px 2px 0 #2b2b2b' }}
              >
                人物造型
              </button>

              <button
                id="main-menu-btn-settings"
                onClick={() => handlePress(onOpenSettings)}
                className="w-full min-h-[48px] py-3 px-3 rounded-none bg-[#727272] hover:bg-[#848484] active:bg-[#5c5c5c] text-white font-bold text-sm sm:text-base tracking-wider border-2 border-black shadow-[inset_2px_2px_0_#a8a8a8,inset_-2px_-4px_0_#383838,0_4px_0_rgba(0,0,0,0.55)] active:translate-y-[2px] active:shadow-[inset_2px_2px_0_#383838,inset_-2px_-2px_0_#a8a8a8] transition-all cursor-pointer"
                style={{ textShadow: '2px 2px 0 #2b2b2b' }}
              >
                遊戲設定
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Character Display */}
        <div className="flex items-center justify-center md:justify-end w-full md:w-auto shrink-0">
          <Character3DPreview skinId={skinId} />
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="w-full flex flex-col sm:flex-row items-center justify-between text-xs text-stone-200 gap-1 px-1 sm:px-2"
        style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.9)' }}
      >
        <span>盜版Rickie -2015 Web Edition</span>
        <span>體素方塊沙盒世界 • 支援桌機與平板觸控</span>
      </div>
    </div>
  );
};
