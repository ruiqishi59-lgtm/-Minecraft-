import React from 'react';
import { RotateCcw, Home, Skull } from 'lucide-react';

interface DeathScreenProps {
  score: number;
  deathReason?: string;
  onRespawn: () => void;
  onReturnToMainMenu: () => void;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({
  score,
  deathReason = '你未能挺過黑夜中的怪物攻擊',
  onRespawn,
  onReturnToMainMenu
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-xs select-none font-mono animate-in fade-in duration-300">
      {/* Dark blood red vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(69,10,10,0.95)_100%)]" />

      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-4 max-w-md w-full">
        {/* Skull Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/60 border-2 border-red-500/60 text-red-400 shadow-2xl">
          <Skull className="h-10 w-10 animate-pulse" />
        </div>

        {/* You Died title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-widest text-white drop-shadow-[0_4px_10px_rgba(0,0,0,1)] text-red-100">
          你死了！
        </h1>

        {/* Death reason */}
        <p className="text-sm sm:text-base text-red-200/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-xs">
          {deathReason}
        </p>

        {/* Score */}
        <div className="rounded-lg bg-black/50 px-4 py-1.5 border border-red-500/30 text-amber-300 font-bold text-sm shadow-md">
          分數: <span className="text-white ml-1">{score}</span>
        </div>

        {/* Action Buttons styled like Minecraft stone buttons */}
        <div className="mt-4 flex flex-col gap-3 w-full max-w-xs">
          {/* Respawn Button */}
          <button
            onClick={onRespawn}
            className="group flex items-center justify-center gap-2 w-full py-3 px-6 rounded-md bg-[#4a4a4a] text-white font-bold text-base tracking-wider border-t-2 border-l-2 border-stone-300 border-b-4 border-r-4 border-black hover:bg-[#5a5a5a] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2 active:translate-y-0.5 shadow-xl transition-all"
          >
            <RotateCcw className="h-5 w-5 text-emerald-400 group-hover:rotate-45 transition-transform" />
            <span>重生</span>
          </button>

          {/* Return to Main Menu */}
          <button
            onClick={onReturnToMainMenu}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-md bg-[#3a3a3a] text-stone-200 font-bold text-base tracking-wider border-t-2 border-l-2 border-stone-400 border-b-4 border-r-4 border-black hover:bg-[#4a4a4a] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2 active:translate-y-0.5 shadow-xl transition-all"
          >
            <Home className="h-5 w-5 text-amber-400" />
            <span>返回主選單</span>
          </button>
        </div>
      </div>
    </div>
  );
};
