import React, { useEffect, useState } from 'react';

interface TerrainLoadingScreenProps {
  isLoading: boolean;
  worldName?: string;
  worldType?: string;
  stage?: string;
  dimension?: 'default' | 'heaven';
  onFinished?: () => void;
  onComplete?: () => void;
}

const PHASES = [
  { progress: 25, text: '正在準備 3D 全景與區域坐標...' },
  { progress: 55, text: '正在即時編排專屬地形與群系...' },
  { progress: 85, text: '正在載入天空光影與環境生態...' },
  { progress: 100, text: '載入完成！即刻進入世界...' }
];

export const TerrainLoadingScreen: React.FC<TerrainLoadingScreenProps> = ({
  isLoading,
  worldName = '我的世界',
  worldType = 'heaven',
  stage,
  dimension = 'heaven',
  onFinished,
  onComplete
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);

  const effectiveFinish = onComplete || onFinished;
  const effectiveFinishRef = React.useRef(effectiveFinish);
  effectiveFinishRef.current = effectiveFinish;

  // Track progress with a ref that strictly never regresses
  const progressRef = React.useRef(0);
  const wasLoadingRef = React.useRef(false);

  // Resolve world terrain details
  const isFusion = worldType === 'fusion';
  const isHeaven = (worldType === 'heaven' || dimension === 'heaven') && !isFusion;
  const terrainInfo = isFusion
    ? {
        icon: '🌌',
        title: '萬界融合神域 (All-in-One Fusion)',
        detail: '平原村落 • 崇山峻嶺 • 浮空雲島 • VIP會員專屬',
        accentColor: 'border-amber-400/60 bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-stone-900 text-amber-200'
      }
    : isHeaven
    ? {
        icon: '☁️',
        title: '天堂以太世界 (The Aether)',
        detail: '浮空群島 • 水晶雲海 • 聖光天穹',
        accentColor: 'border-amber-400/50 bg-amber-950/60 text-amber-200'
      }
    : worldType === 'mountains'
    ? {
        icon: '🏔️',
        title: '高聳山脈 (High Mountains)',
        detail: '千仞峭壁 • 綠寶石礦 • 崇山峻嶺',
        accentColor: 'border-cyan-400/50 bg-cyan-950/60 text-cyan-200'
      }
    : worldType === 'flat'
    ? {
        icon: '🟩',
        title: '超平坦 (Superflat)',
        detail: '一望無際 • 建造聖地 • 純淨平原',
        accentColor: 'border-emerald-400/50 bg-emerald-950/60 text-emerald-200'
      }
    : {
        icon: '🌲',
        title: '預設森林地貌 (Default Overworld)',
        detail: '茂密林地 • 自然村落 • 豐富資源',
        accentColor: 'border-lime-400/50 bg-stone-900/70 text-lime-200'
      };

  useEffect(() => {
    if (!isLoading) {
      wasLoadingRef.current = false;
      progressRef.current = 0;
      setCurrentProgress(0);
      setPhaseIndex(0);
      return;
    }

    // Only start a fresh loading cycle if transitioning from not loading to loading
    if (!wasLoadingRef.current) {
      wasLoadingRef.current = true;
      progressRef.current = 0;
      setCurrentProgress(0);
      setPhaseIndex(0);
    }

    // Fast snappy strictly-increasing progress bar: ONLY ADDS, NEVER GOES BACKWARDS
    const interval = setInterval(() => {
      const current = progressRef.current;
      if (current >= 100) {
        clearInterval(interval);
        return;
      }

      // Guaranteed strictly positive increments (minimum +10% per tick)
      const step =
        current < 35
          ? Math.floor(Math.random() * 12 + 16) // +16% ~ 27%
          : current < 75
          ? Math.floor(Math.random() * 10 + 14) // +14% ~ 23%
          : Math.floor(Math.random() * 8 + 10);  // +10% ~ 17%

      // Monotonic guarantee: next value can only be >= current and <= 100
      const next = Math.min(100, Math.max(current, current + step));
      progressRef.current = next;

      // Ensure state only goes upwards
      setCurrentProgress((prev) => Math.max(prev, next));

      // Phase text can only advance forward
      const nextPhase = PHASES.findIndex((phase) => next <= phase.progress);
      const resolvedPhase = nextPhase !== -1 ? nextPhase : PHASES.length - 1;
      setPhaseIndex((prev) => Math.max(prev, resolvedPhase));

      if (next >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (effectiveFinishRef.current) {
            effectiveFinishRef.current();
          }
        }, 120);
      }
    }, 42);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  const currentPhaseText = PHASES[phaseIndex]?.text || '正在載入世界...';

  return (
    <div
      id="minecraft-terrain-loading-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-black/40 select-none font-mono text-white animate-in fade-in duration-200 pointer-events-none"
    >
      {/* Top Bar: World & Version */}
      <div className="w-full flex items-center justify-between text-xs text-stone-300 drop-shadow-[0_2px_4px_black] px-2">
        <div className="flex items-center gap-2">
          <span className="font-black text-emerald-400">盜版 3D</span>
          <span className="rounded bg-black/70 px-2 py-0.5 border border-amber-400/30 text-[10px] text-amber-300 font-bold">
            V1.02.1
          </span>
        </div>
        <div className="flex items-center gap-2 text-stone-300 text-xs">
          <span>{worldName}</span>
        </div>
      </div>

      {/* Center: Rotating Panorama Notification & World Preview Badge */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6 text-center my-auto">
        {/* Live Rotating Preview Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-stone-200 text-xs shadow-xl mb-4">
          <span className="inline-block animate-spin text-sm">🔄</span>
          <span className="font-bold tracking-wide">360° 全景旋轉預覽中</span>
        </div>

        {/* Selected Terrain Card */}
        <div className={`w-full p-4 rounded-xl border-2 shadow-2xl bg-stone-900/95 mb-5 ${terrainInfo.accentColor}`}>
          <div className="flex items-center justify-center gap-2 text-2xl font-black mb-1">
            <span>{terrainInfo.icon}</span>
            <span>{terrainInfo.title}</span>
          </div>
          <div className="text-xs text-stone-300">
            {terrainInfo.detail}
          </div>
        </div>

        {/* Phase Text */}
        <div className="text-sm font-bold text-stone-200 drop-shadow-[0_2px_4px_black] mb-3 h-6 flex items-center justify-center">
          {currentPhaseText}
        </div>

        {/* Snappy Segmented Progress Bar */}
        <div className="w-full h-7 bg-[#111111] p-1 border-2 border-stone-600 shadow-2xl relative rounded-sm">
          {/* Inner groove */}
          <div className="w-full h-full bg-[#1e1e1e] relative overflow-hidden">
            {/* Emerald/Lime Fill */}
            <div
              className="h-full bg-gradient-to-r from-[#44bd32] via-[#4cd137] to-[#55ff55] transition-all duration-75 ease-out border-r-2 border-white/80"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Percentage Text Centered */}
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] tracking-widest">
            {currentProgress}%
          </div>
        </div>
      </div>

      {/* Bottom Spawn Protection Guarantee Notice */}
      <div className="w-full max-w-md text-center py-2 px-4 rounded-lg bg-black/70 border border-emerald-500/40 text-[11px] text-emerald-300 drop-shadow-[0_2px_4px_black] flex items-center justify-center gap-2">
        <span className="text-sm">🛡️</span>
        <span>已啟用 5 秒無敵重生保護，進入世界時完全免疫怪物偷襲！</span>
      </div>
    </div>
  );
};
