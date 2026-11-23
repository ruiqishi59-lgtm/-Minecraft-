import React, { useState } from 'react';
import { BlockType, WorldSaveData } from '../types';
import { Cloud, Download, Upload, Save, CheckCircle2, HardDrive, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { auth, isVerifiedGoogleUser, saveWorldToCloud } from '../firebase';
import { getDeviceCategory } from '../utils/device';

interface DriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWorld: () => WorldSaveData;
  onLoadWorld: (data: WorldSaveData) => void;
  onOpenGoogleAccount?: () => void;
}

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_WORLD_TYPES = new Set(['default', 'flat', 'mountains', 'heaven', 'fusion']);
const ALLOWED_GAME_MODES = new Set(['survival', 'creative']);
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeImportedWorldSave(raw: unknown): WorldSaveData | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  const worldType = typeof obj.worldType === 'string' && ALLOWED_WORLD_TYPES.has(obj.worldType)
    ? (obj.worldType as WorldSaveData['worldType'])
    : null;
  const gameMode = typeof obj.gameMode === 'string' && ALLOWED_GAME_MODES.has(obj.gameMode)
    ? (obj.gameMode as WorldSaveData['gameMode'])
    : null;

  if (!worldType || !gameMode || typeof obj.seed !== 'number' || !Number.isFinite(obj.seed)) {
    return null;
  }

  const playerObj = obj.player as Record<string, unknown> | undefined;
  if (!playerObj || typeof playerObj !== 'object' || Array.isArray(playerObj)) {
    return null;
  }

  const safeModifiedBlocks: Record<string, BlockType> = {};
  if (obj.modifiedBlocks && typeof obj.modifiedBlocks === 'object' && !Array.isArray(obj.modifiedBlocks)) {
    const entries = Object.entries(obj.modifiedBlocks as Record<string, unknown>);
    if (entries.length > 100000) return null;
    for (const [key, val] of entries) {
      if (FORBIDDEN_KEYS.has(key)) continue;
      if (/^-?\d+,-?\d+,-?\d+$/.test(key) && typeof val === 'string' && val.length <= 32) {
        safeModifiedBlocks[key] = val as BlockType;
      }
    }
  }

  const safeId =
    typeof obj.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(obj.id)
      ? obj.id
      : `world_${Date.now()}`;
  const safeName =
    typeof obj.name === 'string' && obj.name.trim()
      ? obj.name.trim().slice(0, 64)
      : '匯入的冒險世界';

  return {
    id: safeId,
    version: 1,
    name: safeName,
    gameMode,
    worldType,
    seed: Math.floor(obj.seed),
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt.slice(0, 64) : new Date().toLocaleString(),
    savedAt: typeof obj.savedAt === 'string' ? obj.savedAt.slice(0, 64) : new Date().toLocaleString(),
    timeOfDay: typeof obj.timeOfDay === 'number' && Number.isFinite(obj.timeOfDay) ? obj.timeOfDay : 12,
    weather:
      obj.weather === 'rain' || obj.weather === 'thunder' || obj.weather === 'clear'
        ? obj.weather
        : 'clear',
    player: {
      x: typeof playerObj.x === 'number' && Number.isFinite(playerObj.x) ? playerObj.x : 0,
      y: typeof playerObj.y === 'number' && Number.isFinite(playerObj.y) ? playerObj.y : 14,
      z: typeof playerObj.z === 'number' && Number.isFinite(playerObj.z) ? playerObj.z : 0,
      yaw: typeof playerObj.yaw === 'number' && Number.isFinite(playerObj.yaw) ? playerObj.yaw : 0,
      pitch: typeof playerObj.pitch === 'number' && Number.isFinite(playerObj.pitch) ? playerObj.pitch : 0,
      health: typeof playerObj.health === 'number' && Number.isFinite(playerObj.health) ? Math.max(1, Math.min(20, playerObj.health)) : 20,
      hunger: typeof playerObj.hunger === 'number' && Number.isFinite(playerObj.hunger) ? Math.max(0, Math.min(20, playerObj.hunger)) : 20,
      inventory: Array.isArray(playerObj.inventory) ? playerObj.inventory.slice(0, 36) : new Array(36).fill(null),
      gameMode
    },
    modifiedBlocks: safeModifiedBlocks
  };
}

export const DriveModal: React.FC<DriveModalProps> = ({
  isOpen,
  onClose,
  onSaveWorld,
  onLoadWorld,
  onOpenGoogleAccount
}) => {
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  if (!isOpen) return null;

  const fbUser = auth.currentUser;
  const isCloudVerified = isVerifiedGoogleUser(fbUser);

  const handleSaveToCloudAndLocal = async () => {
    setErrorStatus(null);
    const data = onSaveWorld();
    try {
      localStorage.setItem('minecraft_world_save', JSON.stringify(data));
    } catch {
      // ignore local storage quota warning if cloud works
    }

    if (fbUser && isCloudVerified) {
      setIsSyncingCloud(true);
      try {
        await saveWorldToCloud(fbUser, data, getDeviceCategory());
        setSaveStatus('☁️ 已安全儲存並同步至 Firebase 雲端存檔！');
        confetti({ particleCount: 35, spread: 60 });
        setTimeout(() => setSaveStatus(null), 3500);
      } catch (err) {
        setErrorStatus(err instanceof Error ? err.message : '雲端存檔失敗，請稍後再試。');
      } finally {
        setIsSyncingCloud(false);
      }
    } else {
      setSaveStatus('已保存至本機存檔槽！（登入 Google 帳號可開啟雲端同步）');
      confetti({ particleCount: 25, spread: 50 });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleLoadFromLocalStorage = () => {
    setErrorStatus(null);
    const saved = localStorage.getItem('minecraft_world_save');
    if (!saved) {
      setSaveStatus('未找到本機存檔！');
      return;
    }
    try {
      const parsed = sanitizeImportedWorldSave(JSON.parse(saved));
      if (!parsed) {
        setErrorStatus('存檔格式驗證失敗');
        return;
      }
      onLoadWorld(parsed);
      setSaveStatus('世界存檔已成功載入！');
      setTimeout(() => {
        setSaveStatus(null);
        onClose();
      }, 1200);
    } catch {
      setErrorStatus('存檔解析錯誤');
    }
  };

  const handleExportJSON = () => {
    const data = onSaveWorld();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minecraft-world-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaveStatus('已匯出世界存檔 JSON 檔案！');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      setErrorStatus('存檔檔案過大（上限 5MB）');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = sanitizeImportedWorldSave(JSON.parse(event.target?.result as string));
        if (!parsed) {
          setErrorStatus('無效或不完整的世界存檔格式');
          return;
        }
        onLoadWorld(parsed);
        setSaveStatus('世界檔案成功載入！');
        setTimeout(() => {
          setSaveStatus(null);
          onClose();
        }, 1200);
      } catch {
        setErrorStatus('無效的世界存檔格式');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm font-mono">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-stone-600 bg-stone-900 text-stone-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-700 bg-stone-950 px-6 py-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-blue-300">Firebase 雲端存檔 & 世界備份中心</h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          {saveStatus && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-950/80 border border-emerald-700 p-3 text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{saveStatus}</span>
            </div>
          )}

          {errorStatus && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-950/80 border border-rose-700 p-3 text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorStatus}</span>
            </div>
          )}

          {/* Cloud sync card */}
          <div className="rounded-xl border border-blue-800/40 bg-blue-950/30 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <Cloud className="h-4 w-4" />
                <span>Firebase 個人雲端世界存檔</span>
              </div>
              {isCloudVerified ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  Google 已驗證
                </span>
              ) : (
                <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  未登入（僅本機）
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">
              {isCloudVerified
                ? '您的建築工程、背包物品與地貌改造將安全保存至個人加密 Firestore 雲端空間，跨裝置登入即可讀取。'
                : '目前為訪客模式，存檔僅保留在此瀏覽器。登入 Google 帳號後即可安全同步世界至雲端。'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={isSyncingCloud}
                onClick={handleSaveToCloudAndLocal}
                className="flex flex-1 min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                <span>
                  {isSyncingCloud
                    ? '雲端同步中...'
                    : isCloudVerified
                    ? '立即同步雲端與本機存檔'
                    : '保存至本機存檔'}
                </span>
              </button>
              {!isCloudVerified && onOpenGoogleAccount ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenGoogleAccount();
                  }}
                  className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-950/60 px-3 py-2 font-bold text-emerald-300 hover:bg-emerald-900"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>登入 Google 同步</span>
                </button>
              ) : (
                <button
                  onClick={handleLoadFromLocalStorage}
                  className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-blue-600 px-3 py-2 font-bold text-blue-300 hover:bg-blue-900/50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>讀取本機存檔</span>
                </button>
              )}
            </div>
          </div>

          {/* Local export / import card */}
          <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
            <div className="flex items-center gap-2 font-bold text-stone-300">
              <HardDrive className="h-4 w-4 text-amber-400" />
              <span>本機檔案匯出 / 匯入</span>
            </div>
            <p className="mt-1 text-xs text-stone-400">
              可將您的方塊世界以 JSON 備份檔保存至裝置，或安全驗證後匯入。
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleExportJSON}
                className="flex flex-1 min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-xs font-bold text-stone-200 hover:bg-stone-700 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                <span>匯出世界檔 (.json)</span>
              </button>

              <label className="flex flex-1 min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-xs font-bold text-stone-200 hover:bg-stone-700 hover:text-white cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>匯入世界檔</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-800 bg-stone-950 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[40px] rounded-lg bg-stone-800 px-4 py-1.5 text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
