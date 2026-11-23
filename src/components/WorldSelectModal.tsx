import React, { useState, useEffect } from 'react';
import { WorldSaveData, WorldType } from '../types';
import { worldStorage } from '../game/worldStorage';
import { Play, Plus, Trash2, Edit3, TreePine, Mountain, Layers, ArrowLeft, Check, Sparkles, Shield, AlertTriangle, Crown } from 'lucide-react';
import { VipModal } from './VipModal';
import { isVipActive } from '../utils/googleAuth';

interface WorldSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorld: (world: WorldSaveData) => void;
}

export const WorldSelectModal: React.FC<WorldSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectWorld
}) => {
  const [worlds, setWorlds] = useState<WorldSaveData[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameInput, setRenameInput] = useState<string>('');

  // Create World Form States
  const [newWorldName, setNewWorldName] = useState<string>('新的世界');
  const [newGameMode, setNewGameMode] = useState<'survival' | 'creative'>('survival');
  const [newWorldType, setNewWorldType] = useState<WorldType>('default');
  const [newSeed, setNewSeed] = useState<string>('');

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isVipModalOpen, setIsVipModalOpen] = useState<boolean>(false);

  // Load worlds
  const refreshWorlds = () => {
    const list = worldStorage.listWorlds();
    setWorlds(list);
    const lastActive = worldStorage.getLastActiveWorldId();
    if (lastActive && list.some((w) => w.id === lastActive)) {
      setSelectedWorldId(lastActive);
    } else if (list.length > 0) {
      setSelectedWorldId(list[0].id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshWorlds();
      setIsCreating(false);
      setIsRenaming(false);
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedWorld = worlds.find((w) => w.id === selectedWorldId) || null;

  // Handle Create World
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorldType === 'fusion' && !isVipActive()) {
      setIsVipModalOpen(true);
      return;
    }

    const created = worldStorage.createWorld({
      name: newWorldName,
      gameMode: newGameMode,
      worldType: newWorldType,
      seed: newSeed
    });
    refreshWorlds();
    setSelectedWorldId(created.id);
    setIsCreating(false);
    // Enter world right away
    onSelectWorld(created);
  };

  // Handle Play
  const handlePlaySelected = () => {
    if (selectedWorld) {
      if (selectedWorld.worldType === 'fusion' && !isVipActive()) {
        setIsVipModalOpen(true);
        return;
      }
      onSelectWorld(selectedWorld);
    }
  };

  // Handle Delete
  const handleDeleteWorld = (id: string) => {
    worldStorage.deleteWorld(id);
    setConfirmDeleteId(null);
    refreshWorlds();
  };

  // Handle Rename
  const handleStartRename = () => {
    if (!selectedWorld) return;
    setRenameInput(selectedWorld.name);
    setIsRenaming(true);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorld && renameInput.trim()) {
      worldStorage.renameWorld(selectedWorld.id, renameInput);
      setIsRenaming(false);
      refreshWorlds();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md font-mono select-none text-white animate-in fade-in duration-200">
      <div className="relative flex flex-col h-full max-h-[640px] w-full max-w-2xl rounded-2xl border-4 border-stone-600 bg-stone-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-700 bg-stone-950 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-amber-400">
              {isCreating ? '⛏️ 建立新世界' : isRenaming ? '✏️ 重新命名世界' : '🌍 選擇世界'}
            </span>
          </div>

          <button
            onClick={isCreating || isRenaming ? () => { setIsCreating(false); setIsRenaming(false); } : onClose}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-white px-2 py-1 rounded bg-stone-800 border border-stone-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>返回</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* VIEW 1: CREATE NEW WORLD FORM */}
          {isCreating ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-lg mx-auto">
              {/* World Name */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  世界名稱 (World Name)
                </label>
                <input
                  type="text"
                  required
                  value={newWorldName}
                  onChange={(e) => setNewWorldName(e.target.value)}
                  placeholder="例如：我的盜版生存世界"
                  className="w-full rounded-lg border-2 border-stone-600 bg-stone-950 px-3.5 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Game Mode */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1.5">
                  遊戲模式 (Game Mode)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGameMode('survival')}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                      newGameMode === 'survival'
                        ? 'border-emerald-400 bg-emerald-950/80 text-white shadow-lg'
                        : 'border-stone-700 bg-stone-950/60 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full font-bold text-sm text-emerald-300">
                      <span>⚔️ 生存模式</span>
                      {newGameMode === 'survival' && <span className="text-xs text-emerald-400 font-black">✓</span>}
                    </div>
                    <span className="mt-1 text-[11px] text-stone-300 leading-relaxed">
                      無作弊物品，赤手空拳砍樹、探索挖礦與合成，有生命飢餓與夜間骷髏。
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewGameMode('creative')}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                      newGameMode === 'creative'
                        ? 'border-amber-400 bg-amber-950/80 text-white shadow-lg'
                        : 'border-stone-700 bg-stone-950/60 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full font-bold text-sm text-amber-300">
                      <span>🎨 創造模式</span>
                      {newGameMode === 'creative' && <span className="text-xs text-amber-400 font-black">✓</span>}
                    </div>
                    <span className="mt-1 text-[11px] text-stone-300 leading-relaxed">
                      全物品庫調色盤、無限方塊放置、秒破方塊、自由飛行與無敵之身。
                    </span>
                  </button>
                </div>
              </div>

              {/* World Type */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1.5">
                  世界類型 (World Type)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewWorldType('default')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-center transition-all ${
                      newWorldType === 'default'
                        ? 'border-sky-400 bg-sky-950/70 text-white shadow-md'
                        : 'border-stone-700 bg-stone-950/60 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    <TreePine className="h-5 w-5 text-emerald-400 mb-1" />
                    <span className="font-bold text-xs">🌲 預設地貌</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">丘陵與村莊</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewWorldType('heaven')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-center transition-all ${
                      newWorldType === 'heaven'
                        ? 'border-amber-400 bg-amber-950/70 text-white shadow-md'
                        : 'border-stone-700 bg-stone-950/60 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    <Sparkles className="h-5 w-5 text-amber-300 mb-1" />
                    <span className="font-bold text-xs">☁️ 天堂世界</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">浮空以太天島</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewWorldType('flat')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-center transition-all ${
                      newWorldType === 'flat'
                        ? 'border-sky-400 bg-sky-950/70 text-white shadow-md'
                        : 'border-stone-700 bg-stone-950/60 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    <Layers className="h-5 w-5 text-amber-400 mb-1" />
                    <span className="font-bold text-xs">🟩 超平坦</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">無盡平原建築</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewWorldType('mountains')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-center transition-all ${
                      newWorldType === 'mountains'
                        ? 'border-sky-400 bg-sky-950/70 text-white shadow-md'
                        : 'border-stone-700 bg-stone-950/60 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    <Mountain className="h-5 w-5 text-stone-300 mb-1" />
                    <span className="font-bold text-xs">🏔️ 高聳山脈</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">險峻高峰峭壁</span>
                  </button>

                  {/* Fusion World (VIP Exclusive) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isVipActive()) {
                        setIsVipModalOpen(true);
                      } else {
                        setNewWorldType('fusion');
                      }
                    }}
                    className={`col-span-2 sm:col-span-4 flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                      newWorldType === 'fusion'
                        ? 'border-amber-400 bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-sky-950/90 text-white shadow-lg'
                        : 'border-amber-500/40 bg-stone-950/80 text-stone-300 hover:border-amber-400 hover:bg-stone-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Crown className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs sm:text-sm text-amber-300">
                            🌌 萬界融合新地形 (Fusion World)
                          </span>
                          <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-stone-950 uppercase tracking-wider">
                            VIP 專屬
                          </span>
                          {isVipActive() && (
                            <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold">
                              ✓ 已解鎖特權
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-stone-400 block mt-0.5">
                          將所有世界地形（平原丘陵、高聳山脈、超平坦與浮空以太天島）融合為一體的宏偉世界！
                        </span>
                      </div>
                    </div>
                    <div className="text-right pl-2 shrink-0">
                      <span className="text-xs font-black text-amber-400 block">每月 NT$ 10</span>
                      <span className="text-[10px] text-stone-400">
                        {isVipActive() ? '點擊選擇' : '點擊解鎖會員'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Seed */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  世界種子碼 (Seed - 留空將自動隨機產生)
                </label>
                <input
                  type="text"
                  value={newSeed}
                  onChange={(e) => setNewSeed(e.target.value)}
                  placeholder="例如：88888, diamond, 或任意文字"
                  className="w-full rounded-lg border-2 border-stone-600 bg-stone-950 px-3.5 py-2 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Create Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 text-xs font-bold"
                >
                  取消
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-sm tracking-wider border-t-2 border-l-2 border-emerald-400 border-b-4 border-r-4 border-emerald-950 hover:bg-emerald-500 active:translate-y-0.5 shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  <span>建立新世界</span>
                </button>
              </div>
            </form>
          ) : isRenaming ? (
            /* VIEW 2: RENAME WORLD */
            <form onSubmit={handleRenameSubmit} className="space-y-4 max-w-sm mx-auto my-8 text-center">
              <h3 className="text-sm font-bold text-stone-300">修改世界名稱</h3>
              <input
                type="text"
                required
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full rounded-lg border-2 border-stone-600 bg-stone-950 px-3.5 py-2.5 text-sm text-stone-100 focus:border-amber-400 focus:outline-none text-center"
              />
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 text-xs font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs"
                >
                  儲存名稱
                </button>
              </div>
            </form>
          ) : (
            /* VIEW 3: WORLD LIST */
            <div className="space-y-2">
              {worlds.map((w) => {
                const isSelected = w.id === selectedWorldId;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorldId(w.id)}
                    className={`relative flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-white bg-white/15 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                        : 'border-stone-700 bg-stone-950/70 hover:border-stone-500 hover:bg-stone-950'
                    }`}
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-600 bg-stone-800 text-2xl shadow-inner">
                        {w.worldType === 'fusion'
                          ? '🌌'
                          : w.worldType === 'heaven'
                          ? '☁️'
                          : w.worldType === 'mountains'
                          ? '🏔️'
                          : w.worldType === 'flat'
                          ? '🟩'
                          : '🌲'}
                      </div>

                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-stone-100">
                            {w.name}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                              w.gameMode === 'creative'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                            }`}
                          >
                            {w.gameMode === 'creative' ? '🎨 創造' : '⚔️ 生存'}
                          </span>
                          {w.worldType === 'fusion' && (
                            <span className="rounded bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-1.5 py-0.2 text-[9px] font-black shadow-sm">
                              👑 VIP 專屬
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-400 mt-1">
                          <span>
                            類型:{' '}
                            {w.worldType === 'fusion'
                              ? '🌌 萬界融合 (VIP特權)'
                              : w.worldType === 'heaven'
                              ? '☁️ 天堂世界'
                              : w.worldType === 'mountains'
                              ? '高聳山脈'
                              : w.worldType === 'flat'
                              ? '超平坦'
                              : '預設地貌'}
                          </span>
                          <span>•</span>
                          <span>種子: {w.seed}</span>
                          <span>•</span>
                          <span className="text-stone-300">{w.savedAt || w.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Play or Selected Tick */}
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <Check className="h-4 w-4" />
                          <span>已選中</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {worlds.length === 0 && (
                <div className="p-8 text-center text-stone-400">
                  <p>尚無儲存的世界，立即點擊下方「建立新世界」！</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (Only on World List) */}
        {!isCreating && !isRenaming && (
          <div className="border-t-2 border-stone-700 bg-stone-950 p-3 sm:p-4">
            {confirmDeleteId ? (
              /* Delete confirmation banner */
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-950/80 border border-red-700 text-xs">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span>確定要刪除「{worlds.find((w) => w.id === confirmDeleteId)?.name}」嗎？無法復原！</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2.5 py-1 rounded bg-stone-800 text-stone-300 hover:bg-stone-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleDeleteWorld(confirmDeleteId)}
                    className="px-3 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-500"
                  >
                    確認刪除
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                {/* Left group: Create New World */}
                <button
                  onClick={() => {
                    setNewWorldName(`新的世界 (${worlds.length + 1})`);
                    setNewSeed('');
                    setIsCreating(true);
                  }}
                  className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#3d3d3d] text-amber-300 font-bold text-xs sm:text-sm tracking-wider border-t-2 border-l-2 border-stone-400 border-b-4 border-r-4 border-black hover:bg-[#4d4d4d] active:translate-y-0.5 transition-all shadow-md"
                >
                  <Plus className="h-4 w-4 text-amber-400" />
                  <span>建立新世界 (Create World)</span>
                </button>

                {/* Center / Right group: Edit, Delete, Play */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Rename */}
                  <button
                    disabled={!selectedWorld}
                    onClick={handleStartRename}
                    className="p-2.5 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none"
                    title="修改世界名稱"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    disabled={!selectedWorld}
                    onClick={() => selectedWorld && setConfirmDeleteId(selectedWorld.id)}
                    className="p-2.5 rounded-lg bg-stone-800 text-rose-400 border border-stone-700 hover:bg-rose-950 disabled:opacity-30 disabled:pointer-events-none"
                    title="刪除世界"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Play Selected World (Primary Minecraft Button) */}
                  <button
                    disabled={!selectedWorld}
                    onClick={handlePlaySelected}
                    className="flex items-center justify-center gap-2 flex-1 sm:flex-initial px-6 py-2.5 rounded-lg bg-emerald-700 text-white font-bold text-xs sm:text-sm tracking-wider border-t-2 border-l-2 border-emerald-400 border-b-4 border-r-4 border-emerald-950 hover:bg-emerald-600 active:translate-y-0.5 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-lg"
                  >
                    <Play className="h-4 w-4 text-white fill-white" />
                    <span>進入選定世界</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIP Modal for World Creation/Access Restriction */}
      <VipModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        requiredForWorld={true}
        onSuccess={() => {
          setIsVipModalOpen(false);
          setNewWorldType('fusion');
        }}
      />
    </div>
  );
};
