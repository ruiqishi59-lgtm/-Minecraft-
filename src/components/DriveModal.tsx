import React, { useState } from 'react';
import { WorldSaveData } from '../types';
import { Cloud, Download, Upload, Save, CheckCircle2, HardDrive, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWorld: () => WorldSaveData;
  onLoadWorld: (data: WorldSaveData) => void;
}

export const DriveModal: React.FC<DriveModalProps> = ({
  isOpen,
  onClose,
  onSaveWorld,
  onLoadWorld
}) => {
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveToLocalStorage = () => {
    const data = onSaveWorld();
    try {
      localStorage.setItem('minecraft_world_save', JSON.stringify(data));
      setSaveStatus('已成功儲存至本機存檔槽！');
      confetti({ particleCount: 30, spread: 60 });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('本機儲存空間不足');
    }
  };

  const handleLoadFromLocalStorage = () => {
    const saved = localStorage.getItem('minecraft_world_save');
    if (!saved) {
      setSaveStatus('未找到本機存檔！');
      return;
    }
    try {
      const data: WorldSaveData = JSON.parse(saved);
      onLoadWorld(data);
      setSaveStatus('世界存檔已成功載入！');
      setTimeout(() => {
        setSaveStatus(null);
        onClose();
      }, 1200);
    } catch {
      setSaveStatus('存檔解析錯誤');
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

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onLoadWorld(parsed);
        setSaveStatus('世界檔案成功載入！');
        setTimeout(() => {
          setSaveStatus(null);
          onClose();
        }, 1200);
      } catch {
        setSaveStatus('無效的世界存檔格式');
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
            <h2 className="text-lg font-bold text-blue-300">Google Drive & 世界存檔中心</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
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

          {/* Cloud sync card */}
          <div className="rounded-xl border border-blue-800/40 bg-blue-950/30 p-4">
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <Cloud className="h-4 w-4" />
              <span>Google Drive 雲端世界備份</span>
            </div>
            <p className="mt-1 text-xs text-stone-400 leading-relaxed">
              您的建築工程、背包物品與地貌改造將永久存放在您的 Google 雲端硬碟中，換電腦也能隨時無縫同步遊玩。
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSaveToLocalStorage}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-500"
              >
                <Save className="h-3.5 w-3.5" />
                <span>立即同步存檔</span>
              </button>
              <button
                onClick={handleLoadFromLocalStorage}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-600 px-3 py-2 font-bold text-blue-300 hover:bg-blue-900/50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>讀取雲端存檔</span>
              </button>
            </div>
          </div>

          {/* Local export / import card */}
          <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
            <div className="flex items-center gap-2 font-bold text-stone-300">
              <HardDrive className="h-4 w-4 text-amber-400" />
              <span>本機檔案匯出 / 匯入</span>
            </div>
            <p className="mt-1 text-xs text-stone-400">
              可將您的方塊世界以 JSON 備份檔保存至電腦，或分享給朋友載入。
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleExportJSON}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-xs font-bold text-stone-200 hover:bg-stone-700 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                <span>匯出世界檔 (.json)</span>
              </button>

              <label className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-xs font-bold text-stone-200 hover:bg-stone-700 hover:text-white cursor-pointer">
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
            className="rounded-lg bg-stone-800 px-4 py-1.5 text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
