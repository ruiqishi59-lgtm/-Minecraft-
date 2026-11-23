import React, { useRef, useState, useEffect } from 'react';
import { PlayerController } from '../game/player';
import { VoxelWorld } from '../game/world';
import { MobManager } from '../game/mobs';
import { ArrowUp, ArrowDown, Feather, Eye, Hammer, Backpack, Zap, Shield } from 'lucide-react';

interface MobileControlsProps {
  player: PlayerController | null;
  world: VoxelWorld | null;
  mobManager: MobManager | null;
  onMineOrAttack: () => void;
  onStartMining?: () => void;
  onStopMining?: () => void;
  onPlaceOrUse: () => void;
  isFlying: boolean;
  onToggleFly: () => void;
  onOpenCrafting?: () => void;
  onOpenInventory?: () => void;
  onTogglePerspective?: () => void;
  gameMode?: 'survival' | 'creative';
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  player,
  onMineOrAttack,
  onStartMining,
  onStopMining,
  onPlaceOrUse,
  isFlying,
  onToggleFly,
  onOpenCrafting,
  onOpenInventory,
  onTogglePerspective,
  gameMode = 'survival'
}) => {
  // Joystick states
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const joystickTouchIdRef = useRef<number | null>(null);

  // Sprint & Sneak toggle states (tablet-friendly toggles)
  const [sprintToggle, setSprintToggle] = useState(false);
  const [sneakToggle, setSneakToggle] = useState(false);

  // Responsive check to lift controls above bottom hotbar on portrait tablets / phones
  const [isNarrowLayout, setIsNarrowLayout] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 960 : false
  );

  useEffect(() => {
    const onResize = () => {
      setIsNarrowLayout(window.innerWidth < 960);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Look touch drag states
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Continuous mine & place intervals
  const mineIntervalRef = useRef<number | null>(null);
  const placeIntervalRef = useRef<number | null>(null);

  // Clean up intervals and touch states when unmounted (e.g. opening modal)
  useEffect(() => {
    return () => {
      if (mineIntervalRef.current !== null) {
        clearInterval(mineIntervalRef.current);
        mineIntervalRef.current = null;
      }
      if (placeIntervalRef.current !== null) {
        clearInterval(placeIntervalRef.current);
        placeIntervalRef.current = null;
      }
      if (onStopMining) onStopMining();
      if (player) {
        player.touchMoveVector = { x: 0, y: 0 };
        player.touchJumpActive = false;
        player.touchFlyUpActive = false;
        player.touchFlyDownActive = false;
      }
    };
  }, [player, onStopMining]);

  // --- 1. Touch Look & Drag Rotation Area Handlers ---
  const handleLookTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('[data-touch-control="true"]')) return;
    if (lookTouchIdRef.current !== null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) continue;

      lookTouchIdRef.current = touch.identifier;
      lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartTimeRef.current = Date.now();
      break;
    }
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current === null || !lastLookPosRef.current || !player) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const deltaX = touch.clientX - lastLookPosRef.current.x;
        const deltaY = touch.clientY - lastLookPosRef.current.y;

        // Smooth calibrated sensitivity for tablet & phone touchscreens
        const sensitivity = window.innerWidth >= 768 ? 0.0036 : 0.0044;
        player.rotateLook(deltaX, deltaY, sensitivity);

        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const duration = Date.now() - touchStartTimeRef.current;
        if (touchStartPosRef.current) {
          const dist = Math.hypot(
            touch.clientX - touchStartPosRef.current.x,
            touch.clientY - touchStartPosRef.current.y
          );
          if (duration < 220 && dist < 14) {
            onMineOrAttack();
          }
        }

        lookTouchIdRef.current = null;
        lastLookPosRef.current = null;
        touchStartPosRef.current = null;
        break;
      }
    }
  };

  // --- 2. Virtual Joystick Handlers ---
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    setJoystickActive(true);
    updateJoystickPos(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickActive(false);
        setStickPos({ x: 0, y: 0 });
        if (player) {
          player.touchMoveVector = { x: 0, y: 0 };
        }
        break;
      }
    }
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current || !player) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setStickPos({ x: dx, y: dy });

    // Small deadzone for clean resting stability on tablets
    if (dist < 6) {
      player.touchMoveVector = { x: 0, y: 0 };
      return;
    }

    const nx = dx / maxRadius;
    const ny = dy / maxRadius;
    player.touchMoveVector = { x: nx, y: -ny };
  };

  // --- 3. Continuous Mine & Place on Hold ---
  const startMining = () => {
    if (onStartMining) {
      onStartMining();
    } else {
      onMineOrAttack();
      if (mineIntervalRef.current === null) {
        mineIntervalRef.current = window.setInterval(() => {
          onMineOrAttack();
        }, 240);
      }
    }
  };

  const stopMining = () => {
    if (onStopMining) {
      onStopMining();
    }
    if (mineIntervalRef.current !== null) {
      clearInterval(mineIntervalRef.current);
      mineIntervalRef.current = null;
    }
  };

  const startPlacing = () => {
    onPlaceOrUse();
    if (placeIntervalRef.current === null) {
      placeIntervalRef.current = window.setInterval(() => {
        onPlaceOrUse();
      }, 210);
    }
  };

  const stopPlacing = () => {
    if (placeIntervalRef.current !== null) {
      clearInterval(placeIntervalRef.current);
      placeIntervalRef.current = null;
    }
  };

  const handleToggleSprint = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    const next = !sprintToggle;
    setSprintToggle(next);
    if (next && sneakToggle) {
      setSneakToggle(false);
      if (player) player.touchSneakActive = false;
    }
    if (player) {
      player.touchSprintActive = next;
    }
  };

  const handleToggleSneak = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    const next = !sneakToggle;
    setSneakToggle(next);
    if (next && sprintToggle) {
      setSprintToggle(false);
      if (player) player.touchSprintActive = false;
    }
    if (player) {
      player.touchSneakActive = next;
    }
  };

  const bottomOffsetClass = isNarrowLayout
    ? 'bottom-28 sm:bottom-32'
    : 'bottom-6 lg:bottom-8';

  return (
    <div className="absolute inset-0 z-30 select-none overflow-hidden touch-none pointer-events-none">
      {/* 1. Full Screen Touch Surface for Camera Look / Rotation */}
      <div
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        onTouchCancel={handleLookTouchEnd}
        className="pointer-events-auto absolute inset-0 z-0 touch-none"
      />

      {/* 2. Left Virtual Movement Cluster (Sprint/Sneak toggles + Ergonomic Joystick) */}
      <div
        data-touch-control="true"
        className={`pointer-events-auto absolute left-4 md:left-7 z-20 flex flex-col items-start gap-2.5 pb-safe ${bottomOffsetClass}`}
      >
        {/* Sprint & Sneak Toggle Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onTouchStart={handleToggleSprint}
            onClick={handleToggleSprint}
            className={`flex h-11 min-w-[68px] items-center justify-center gap-1 rounded-xl border px-2.5 text-xs font-black shadow-lg backdrop-blur-md active:scale-95 transition-all ${
              sprintToggle
                ? 'border-amber-300 bg-amber-500 text-stone-950'
                : 'border-white/30 bg-black/55 text-white'
            }`}
            title="切換疾跑"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>疾跑</span>
          </button>

          <button
            type="button"
            onTouchStart={handleToggleSneak}
            onClick={handleToggleSneak}
            className={`flex h-11 min-w-[68px] items-center justify-center gap-1 rounded-xl border px-2.5 text-xs font-black shadow-lg backdrop-blur-md active:scale-95 transition-all ${
              sneakToggle
                ? 'border-sky-300 bg-sky-500 text-stone-950'
                : 'border-white/30 bg-black/55 text-white'
            }`}
            title="切換潛行蹲下（防邊緣掉落）"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>潛行</span>
          </button>
        </div>

        {/* Analog Movement Joystick */}
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className={`relative flex h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 items-center justify-center rounded-full border-2 shadow-2xl backdrop-blur-md transition-colors ${
            joystickActive
              ? 'border-amber-400 bg-black/55'
              : 'border-white/40 bg-black/45'
          }`}
        >
          <div className="h-5 w-5 rounded-full border border-white/25 bg-white/15" />

          <div
            className="absolute h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full border-2 border-amber-300 bg-amber-500/85 shadow-lg backdrop-blur-md transition-transform duration-75"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`
            }}
          />
        </div>
      </div>

      {/* 3. Right Action Cluster (Quick Utilities + Jump, Mine, Place, Fly) */}
      <div
        data-touch-control="true"
        className={`pointer-events-auto absolute right-4 md:right-7 z-20 flex flex-col items-end gap-2.5 pb-safe ${bottomOffsetClass}`}
      >
        {/* Tablet Quick Reach Bar: Perspective + Crafting + Inventory */}
        <div className="flex items-center gap-2">
          {onTogglePerspective && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onTogglePerspective();
              }}
              className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl border border-purple-400/60 bg-purple-950/80 text-purple-200 shadow-lg backdrop-blur-md active:scale-95"
              title="切換視角"
            >
              <Eye className="h-5 w-5" />
            </button>
          )}
          {onOpenCrafting && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onOpenCrafting();
              }}
              className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl border border-emerald-400/70 bg-emerald-950/85 text-emerald-200 shadow-lg backdrop-blur-md active:scale-95"
              title="開啟 3×3 合成台"
            >
              <Hammer className="h-5 w-5" />
            </button>
          )}
          {onOpenInventory && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onOpenInventory();
              }}
              className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl border border-amber-400/70 bg-amber-950/85 text-amber-200 shadow-lg backdrop-blur-md active:scale-95"
              title="開啟背包"
            >
              <Backpack className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Middle Row: Fly Toggle (Creative only) + Place/Use */}
        <div className="flex items-center gap-2.5">
          {gameMode === 'creative' && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onToggleFly();
              }}
              className={`flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl border text-sm font-black shadow-lg backdrop-blur-md active:scale-95 ${
                isFlying
                  ? 'border-amber-300 bg-amber-500 text-black'
                  : 'border-white/30 bg-black/55 text-white'
              }`}
              title="創造模式飛行開關"
            >
              <Feather className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          )}

          {/* Place Block / Eat Food / Trade Button (Hold supported) */}
          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              startPlacing();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              stopPlacing();
            }}
            onTouchCancel={(e) => {
              e.stopPropagation();
              stopPlacing();
            }}
            className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl border-2 border-blue-400/80 bg-blue-900/85 text-2xl font-black text-white shadow-xl backdrop-blur-md active:scale-95 active:bg-blue-600"
            title="放置方塊 / 互動 / 使用道具"
          >
            🧱
          </button>
        </div>

        {/* Bottom Row: Mine/Attack + Jump */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              startMining();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              stopMining();
            }}
            onTouchCancel={(e) => {
              e.stopPropagation();
              stopMining();
            }}
            className="flex h-16 w-16 md:h-[70px] md:w-[70px] items-center justify-center rounded-2xl border-2 border-rose-500/80 bg-rose-900/85 text-2xl md:text-3xl font-black text-white shadow-2xl backdrop-blur-md active:scale-95 active:bg-rose-600"
            title="破壞方塊 / 攻擊怪物"
          >
            ⛏️
          </button>

          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              if (player) player.touchJumpActive = true;
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (player) player.touchJumpActive = false;
            }}
            onTouchCancel={(e) => {
              e.stopPropagation();
              if (player) player.touchJumpActive = false;
            }}
            className="flex h-16 w-16 md:h-[70px] md:w-[70px] items-center justify-center rounded-full border-2 border-emerald-400/80 bg-emerald-700/85 text-xl md:text-2xl font-black text-white shadow-2xl backdrop-blur-md active:scale-95 active:bg-emerald-500"
            title="跳躍"
          >
            {isFlying ? '⬆️' : '🚀'}
          </button>
        </div>

        {/* Extra Flight Ascend / Descend buttons when flying */}
        {isFlying && (
          <div className="flex gap-2.5">
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                if (player) player.touchFlyUpActive = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (player) player.touchFlyUpActive = false;
              }}
              onTouchCancel={(e) => {
                e.stopPropagation();
                if (player) player.touchFlyUpActive = false;
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-300/60 bg-amber-600/90 text-white shadow-lg active:scale-90"
              title="上升"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                if (player) player.touchFlyDownActive = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (player) player.touchFlyDownActive = false;
              }}
              onTouchCancel={(e) => {
                e.stopPropagation();
                if (player) player.touchFlyDownActive = false;
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-300/60 bg-amber-600/90 text-white shadow-lg active:scale-90"
              title="下降"
            >
              <ArrowDown className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
