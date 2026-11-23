import React, { useState } from 'react';
import { InventoryItem, Recipe } from '../types';
import { RECIPES, canCraft, craftRecipe, ITEM_DEFINITIONS } from '../game/crafting';
import { soundManager } from '../game/audio';
import { X, Hammer, Palette, Trash2, Plus, Check, Sparkles, ShieldAlert } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: (InventoryItem | null)[];
  onUpdateInventory: (newInv: (InventoryItem | null)[]) => void;
  gameMode: 'survival' | 'creative';
  onOpenCrafting?: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
  gameMode,
  onOpenCrafting
}) => {
  const [selectedRecipeCategory, setSelectedRecipeCategory] = useState<string>('all');
  const [selectedCreativeCategory, setSelectedCreativeCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  if (!isOpen) return null;

  // Recipe filtering
  const filteredRecipes = RECIPES.filter((r) => {
    if (selectedRecipeCategory === 'all') return true;
    if (selectedRecipeCategory === 'tools') return r.category === 'tools';
    if (selectedRecipeCategory === 'decor') return r.category === 'decor';
    if (selectedRecipeCategory === 'blocks') return r.category === 'blocks';
    if (selectedRecipeCategory === 'materials') return r.category === 'materials';
    if (selectedRecipeCategory === 'survival') return r.category === 'survival';
    return true;
  });

  const handleCraft = (recipe: Recipe) => {
    if (!canCraft(recipe, inventory)) return;
    const newInv = craftRecipe(recipe, inventory);
    onUpdateInventory(newInv);
    soundManager.playCraftSuccess();
  };

  // Creative Item catalog items
  const allCreativeItems = Object.values(ITEM_DEFINITIONS);
  const filteredCreativeItems = allCreativeItems.filter((item) => {
    if (selectedCreativeCategory === 'all') return true;
    if (selectedCreativeCategory === 'blocks') return item.type === 'block';
    if (selectedCreativeCategory === 'tools') return item.type === 'tool';
    if (selectedCreativeCategory === 'materials') return item.type === 'material';
    if (selectedCreativeCategory === 'spawn_eggs') return item.type === 'spawn_egg';
    return true;
  });

  // Creative Item Click -> directly give stack
  const handlePickCreativeItem = (itemId: string) => {
    if (gameMode !== 'creative') return;
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return;

    const countToAdd = def.maxStack > 1 ? 64 : 1;
    const newInv = inventory.map((slot) => (slot ? { ...slot } : null));

    // First try to find existing stack of same item that is not full
    let added = false;
    for (let i = 0; i < newInv.length; i++) {
      const slot = newInv[i];
      if (slot && slot.id === itemId && slot.count < slot.maxStack) {
        slot.count = Math.min(slot.maxStack, slot.count + countToAdd);
        added = true;
        break;
      }
    }

    // Otherwise find first empty slot
    if (!added) {
      for (let i = 0; i < newInv.length; i++) {
        if (!newInv[i]) {
          newInv[i] = {
            ...def,
            count: countToAdd
          };
          added = true;
          break;
        }
      }
    }

    if (added) {
      onUpdateInventory(newInv);
      soundManager.playCraftSuccess();
    }
  };

  // Clear all inventory slots (creative mode only)
  const handleClearInventory = () => {
    if (gameMode !== 'creative') return;
    const emptyInv = new Array(36).fill(null);
    onUpdateInventory(emptyInv);
    soundManager.playCraftSuccess();
    setSelectedItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 pt-safe pb-safe backdrop-blur-sm font-mono select-none">
      <div className="relative flex h-[90dvh] w-full max-w-4xl flex-col rounded-2xl border-2 border-stone-600 bg-stone-900 text-stone-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-700 bg-stone-950 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {gameMode === 'creative' ? (
              /* In Creative mode: Infinite catalog, no crafting needed as all items are unlimited */
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-amber-400" />
                <h2 className="text-base sm:text-lg font-bold text-amber-300">
                  創造模式無限物品庫 <span className="text-xs text-amber-400 font-normal">[無限資源 • 免合成]</span>
                </h2>
              </div>
            ) : (
              /* In Survival mode: STRICTLY pure survival crafting table only, no creative options! */
              <div className="flex items-center gap-2">
                <Hammer className="h-5 w-5 text-amber-400" />
                <h2 className="text-base sm:text-lg font-bold text-amber-300">
                  合成工作台 & 背包庫存 <span className="text-xs text-emerald-400 font-normal">[生存模式]</span>
                </h2>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenCrafting && (
              <button
                onClick={onOpenCrafting}
                title="切換至互動式 3×3 高級合成工作台 GUI [R 鍵]"
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/60 bg-amber-950/70 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-600 hover:text-black transition-all whitespace-nowrap shrink-0"
              >
                <Hammer className="h-3.5 w-3.5" />
                <span>開啟 3×3 合成台 [R]</span>
              </button>
            )}

            {gameMode === 'creative' && (
              <button
                onClick={handleClearInventory}
                title="清空背包所有物品"
                className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-950/60 px-2.5 py-1 text-xs text-red-300 hover:bg-red-800 hover:text-white transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">清空背包</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-12 overflow-y-auto md:overflow-hidden">
          {/* Left Column: either Creative Palette OR Survival Crafting Recipes */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-stone-800 p-3 sm:p-4 md:col-span-7 min-h-[260px] md:min-h-0 md:overflow-hidden">
            {/* 1. CREATIVE MODE PALETTE (In creative mode, all items are infinite and free to take) */}
            {gameMode === 'creative' ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    點選任意物品直接獲取 (方塊/物資 x64，工具 x1)
                  </span>
                </div>

                {/* Subcategory Filter Pills */}
                <div className="mb-3 flex flex-wrap gap-1.5 border-b border-stone-800 pb-2.5">
                  {[
                    { id: 'all', label: '全部物品' },
                    { id: 'blocks', label: '🧱 建築方塊' },
                    { id: 'tools', label: '⚔️ 工具與裝備' },
                    { id: 'materials', label: '🍎 資源與食物' },
                    { id: 'spawn_eggs', label: '🥚 生怪蛋' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCreativeCategory(cat.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        selectedCreativeCategory === cat.id
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Creative Item Grid */}
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {filteredCreativeItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handlePickCreativeItem(item.id)}
                        className="group flex flex-col items-center justify-center p-2 rounded-xl border border-stone-700 bg-stone-800/80 hover:border-amber-400 hover:bg-stone-700/90 active:scale-95 transition-all text-center"
                        title={`點擊獲取 ${item.name} (${item.maxStack > 1 ? '64個' : '1把'})`}
                      >
                        {item.type === 'spawn_egg' ? (
                          <div
                            className="relative flex h-8 w-7 items-center justify-center rounded-full border-2 border-black/50 shadow-inner group-hover:scale-110 transition-transform"
                            style={{
                              background: `radial-gradient(circle at 35% 30%, ${item.eggSecondaryColor || '#ffffff'} 0%, ${item.iconColor} 65%)`
                            }}
                          >
                            <span className="text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                              {item.iconSymbol || '🥚'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform">
                            {item.iconSymbol || '📦'}
                          </span>
                        )}
                        <span className="mt-1 text-[11px] font-bold text-stone-200 line-clamp-1">
                          {item.name}
                        </span>
                        <span className="text-[9px] text-amber-400/80">
                          {item.maxStack > 1 ? '+64' : '+1'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* 2. SURVIVAL CRAFTING RECIPE BOOK */
              <div className="flex flex-col h-full overflow-hidden">
                {/* Survival Header Tip */}
                {gameMode === 'survival' && (
                  <div className="mb-2 text-[11px] text-stone-400 flex items-center gap-1">
                    <span>收集材料即可在此工作台合成裝備與建築方塊</span>
                  </div>
                )}

                {/* Category Pills */}
                <div className="mb-3 flex flex-wrap gap-1.5 border-b border-stone-800 pb-2.5">
                  {[
                    { id: 'all', label: '全部配方' },
                    { id: 'tools', label: '⚔️ 工具與武器' },
                    { id: 'decor', label: '🏛️ 裝飾方塊' },
                    { id: 'blocks', label: '🧱 建築材料' },
                    { id: 'materials', label: '🪵 基礎物資' },
                    { id: 'survival', label: '🔥 生存道具' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedRecipeCategory(cat.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        selectedRecipeCategory === cat.id
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Recipe List */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {filteredRecipes.map((recipe) => {
                    const craftable = canCraft(recipe, inventory);
                    const resultDef = ITEM_DEFINITIONS[recipe.result.id];

                    return (
                      <div
                        key={recipe.id}
                        className={`flex items-center justify-between rounded-xl border p-2.5 transition-all ${
                          craftable
                            ? 'border-stone-600 bg-stone-800/90 shadow-md'
                            : 'border-stone-800 bg-stone-900/40 opacity-75'
                        }`}
                      >
                        {/* Recipe Info */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-700 bg-stone-950 text-xl shadow-inner">
                            {resultDef?.iconSymbol || '📦'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-stone-100">
                                {recipe.name}
                              </span>
                              {craftable && (
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/40">
                                  可製作
                                </span>
                              )}
                            </div>

                            {/* Required Ingredients */}
                            <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
                              {recipe.ingredients.map((ing) => {
                                const ingDef = ITEM_DEFINITIONS[ing.id];
                                let have = 0;
                                for (const slot of inventory) {
                                  if (slot && slot.id === ing.id) have += slot.count;
                                }
                                const enough = have >= ing.count;

                                return (
                                  <span
                                    key={ing.id}
                                    className={`rounded px-1.5 py-0.5 border ${
                                      enough
                                        ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300'
                                        : 'border-red-800/60 bg-red-950/40 text-red-400'
                                    }`}
                                  >
                                    {ingDef?.name || ing.id}: {have}/{ing.count}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Craft Button */}
                        <button
                          disabled={!craftable}
                          onClick={() => handleCraft(recipe)}
                          className={`ml-2 flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                            craftable
                              ? 'bg-amber-500 text-black shadow-lg hover:bg-amber-400 active:scale-95'
                              : 'cursor-not-allowed bg-stone-800 text-stone-500'
                          }`}
                        >
                          <Hammer className="h-3.5 w-3.5" />
                          <span>製作</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Player 36-slot Inventory */}
          <div className="flex flex-col bg-stone-950/50 p-3 sm:p-4 md:col-span-5 md:overflow-hidden">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                玩家背包庫存 (36 格)
              </span>
              <span className="text-[11px] text-stone-500">前 9 格為快捷欄</span>
            </div>

            {/* Main 36 Slots Grid (6x6) */}
            <div className="grid grid-cols-6 gap-1.5 overflow-y-auto p-1">
              {inventory.map((item, idx) => {
                const isHotbar = idx < 9;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedItem(item)}
                    className={`relative flex aspect-square items-center justify-center rounded-lg border transition-all cursor-pointer ${
                      isHotbar
                        ? 'border-amber-600/70 bg-stone-900 shadow-sm hover:border-amber-400'
                        : 'border-stone-700 bg-stone-900/60 hover:border-stone-500'
                    } ${selectedItem === item && item ? 'ring-2 ring-white' : ''}`}
                  >
                    {isHotbar && (
                      <span className="absolute top-0.5 left-1 text-[8px] font-bold text-amber-500/80">
                        {idx + 1}
                      </span>
                    )}

                    {item ? (
                      <div className="flex flex-col items-center justify-center">
                        {item.type === 'spawn_egg' ? (
                          <div
                            className="flex h-7 w-6 items-center justify-center rounded-full border border-black/60 shadow-inner"
                            style={{
                              background: `radial-gradient(circle at 35% 30%, ${item.eggSecondaryColor || '#ffffff'} 0%, ${item.iconColor} 65%)`
                            }}
                          >
                            <span className="text-sm select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                              {item.iconSymbol || '🥚'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl select-none">{item.iconSymbol || '📦'}</span>
                        )}
                        {item.count > 1 && (
                          <span className="absolute right-1 bottom-0.5 text-[9px] font-black text-white drop-shadow-[0_1px_2px_black]">
                            {item.count}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-stone-800" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Item Inspector footer */}
            <div className="mt-auto border-t border-stone-800 pt-3">
              {selectedItem ? (
                <div className="rounded-lg border border-stone-700 bg-stone-900 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{selectedItem.name}</span>
                    <span className="text-[10px] text-stone-400">數量: {selectedItem.count}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">
                    類型:{' '}
                    {selectedItem.type === 'tool'
                      ? '工具/武器'
                      : selectedItem.type === 'block'
                      ? '放置方塊'
                      : selectedItem.type === 'spawn_egg'
                      ? '生物生怪蛋 (對準地面右鍵召喚)'
                      : '物資材料'}
                    {selectedItem.damage ? ` (傷害: ${selectedItem.damage})` : ''}
                  </p>
                </div>
              ) : (
                <p className="text-center text-xs text-stone-500">點擊背包物品查看詳情</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
