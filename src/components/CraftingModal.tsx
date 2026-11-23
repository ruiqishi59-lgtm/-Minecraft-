import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { InventoryItem, Recipe } from '../types';
import {
  RECIPES,
  ITEM_DEFINITIONS,
  canCraft,
  craftRecipe,
  matchCraftingGrid,
  getRecipeGridTemplate,
  getAvailableCount,
  getMaxCraftableFromInventory,
  addItemToInventoryArray
} from '../game/crafting';
import { soundManager } from '../game/audio';
import {
  X,
  Hammer,
  Search,
  ArrowRight,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Backpack
} from 'lucide-react';

interface CraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: (InventoryItem | null)[];
  onUpdateInventory: (newInv: (InventoryItem | null)[]) => void;
  openedViaTable?: boolean;
  onSwitchToInventory?: () => void;
  gameMode: 'survival' | 'creative';
}

const CATEGORY_TABS = [
  { id: 'all', label: '全部配方' },
  { id: 'tools', label: '⚔️ 工具與武器' },
  { id: 'decor', label: '🏛️ 裝飾方塊' },
  { id: 'blocks', label: '🧱 建築方塊' },
  { id: 'materials', label: '🪵 基礎材料' },
  { id: 'survival', label: '🔥 生存與生怪蛋' }
] as const;

export const CraftingModal: React.FC<CraftingModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
  openedViaTable = false,
  onSwitchToInventory,
  gameMode
}) => {
  const [grid, setGrid] = useState<(InventoryItem | null)[]>(() => new Array(9).fill(null));
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyCraftable, setOnlyCraftable] = useState<boolean>(false);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Combined view of player's resources (backpack + items temporarily placed on the 3x3 crafting grid)
  const combinedInventory = useMemo(() => {
    return [...inventory, ...grid];
  }, [inventory, grid]);

  // Matched recipe from current 3x3 grid items
  const matchedRecipe = useMemo(() => matchCraftingGrid(grid), [grid]);

  // Ghost pattern preview when user clicks a recipe they can't completely fill or wants to inspect
  const ghostTemplate = useMemo(() => {
    if (!previewRecipe) return new Array(9).fill(null) as (string | null)[];
    return getRecipeGridTemplate(previewRecipe);
  }, [previewRecipe]);

  // Return all items in 3x3 grid safely to inventory
  const returnGridToInventory = useCallback(
    (currentGrid: (InventoryItem | null)[], currentInv: (InventoryItem | null)[]) => {
      let nextInv = currentInv.map((s) => (s ? { ...s } : null));
      for (let i = 0; i < currentGrid.length; i++) {
        const gItem = currentGrid[i];
        if (gItem && gItem.count > 0) {
          const added = addItemToInventoryArray(nextInv, gItem.id, gItem.count);
          if (added.success) {
            nextInv = added.inventory;
          }
        }
      }
      return nextInv;
    },
    []
  );

  // Clean close handler ensuring grid items return to backpack
  const handleSafeClose = useCallback(() => {
    const hasGridItems = grid.some((s) => s !== null && s.count > 0);
    if (hasGridItems) {
      const restored = returnGridToInventory(grid, inventory);
      onUpdateInventory(restored);
      setGrid(new Array(9).fill(null));
    }
    setSelectedSlotIdx(null);
    onClose();
  }, [grid, inventory, onUpdateInventory, onClose, returnGridToInventory]);

  // Reset cursor selection if modal closes externally & bind Escape/KeyR safe close
  useEffect(() => {
    if (!isOpen) {
      setSelectedSlotIdx(null);
      setFeedbackMsg(null);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || (e.code === 'KeyR' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        e.stopPropagation();
        soundManager.playButtonClick();
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, handleSafeClose]);

  // Clear temporary feedback toast
  useEffect(() => {
    if (!feedbackMsg) return;
    const t = setTimeout(() => setFeedbackMsg(null), 2400);
    return () => clearTimeout(t);
  }, [feedbackMsg]);

  const handleClearGrid = () => {
    const hasGridItems = grid.some((s) => s !== null && s.count > 0);
    if (!hasGridItems) return;
    const restored = returnGridToInventory(grid, inventory);
    onUpdateInventory(restored);
    setGrid(new Array(9).fill(null));
    setSelectedSlotIdx(null);
    soundManager.playButtonClick();
  };

  // Click a backpack slot to select/deselect it as active material cursor
  const handleSelectBackpackSlot = (idx: number) => {
    const item = inventory[idx];
    if (!item) {
      setSelectedSlotIdx(null);
      return;
    }
    setSelectedSlotIdx((prev) => (prev === idx ? null : idx));
    soundManager.playButtonClick();
  };

  // Place 1 item from selected backpack slot into grid slot, or return grid slot item to backpack
  const handleGridSlotLeftClick = (gridIdx: number) => {
    const existingGridItem = grid[gridIdx];

    if (selectedSlotIdx !== null) {
      const invItem = inventory[selectedSlotIdx];
      if (!invItem) {
        setSelectedSlotIdx(null);
        return;
      }

      // If grid slot is empty or holds the same item under stack cap, move 1 unit into grid
      if (
        !existingGridItem ||
        (existingGridItem.id === invItem.id && existingGridItem.count < existingGridItem.maxStack)
      ) {
        const nextInv = inventory.map((s) => (s ? { ...s } : null));
        const src = nextInv[selectedSlotIdx]!;
        src.count -= 1;
        if (src.count <= 0) {
          nextInv[selectedSlotIdx] = null;
          setSelectedSlotIdx(null);
        }

        const nextGrid = grid.map((s) => (s ? { ...s } : null));
        if (existingGridItem) {
          nextGrid[gridIdx]!.count += 1;
        } else {
          const def = ITEM_DEFINITIONS[invItem.id];
          nextGrid[gridIdx] = { ...(def || invItem), count: 1 };
        }

        setGrid(nextGrid);
        onUpdateInventory(nextInv);
        soundManager.playButtonClick();
        return;
      }
    }

    // Otherwise if grid slot has an item, return 1 (or whole stack if full) back to inventory
    if (existingGridItem) {
      const added = addItemToInventoryArray(inventory, existingGridItem.id, 1);
      if (!added.success) {
        setFeedbackMsg('背包已滿，無法退回物品');
        return;
      }
      const nextGrid = grid.map((s) => (s ? { ...s } : null));
      nextGrid[gridIdx]!.count -= 1;
      if (nextGrid[gridIdx]!.count <= 0) {
        nextGrid[gridIdx] = null;
      }
      setGrid(nextGrid);
      onUpdateInventory(added.inventory);
      soundManager.playButtonClick();
    }
  };

  // Right-click a grid slot to return the entire stack in that cell back to backpack
  const handleGridSlotRightClick = (e: React.MouseEvent, gridIdx: number) => {
    e.preventDefault();
    const existingGridItem = grid[gridIdx];
    if (!existingGridItem) return;
    const added = addItemToInventoryArray(inventory, existingGridItem.id, existingGridItem.count);
    if (!added.success) {
      setFeedbackMsg('背包已滿，無法退回整組物品');
      return;
    }
    const nextGrid = grid.map((s) => (s ? { ...s } : null));
    nextGrid[gridIdx] = null;
    setGrid(nextGrid);
    onUpdateInventory(added.inventory);
    soundManager.playButtonClick();
  };

  // Execute crafting from the current 3x3 grid (1x or max batch)
  const handleCraftFromGrid = (craftAll: boolean = false) => {
    if (!matchedRecipe) return;

    let iterations = 1;
    if (craftAll) {
      if (matchedRecipe.pattern) {
        let minGridCount = Infinity;
        for (const slot of grid) {
          if (slot && slot.count > 0) {
            minGridCount = Math.min(minGridCount, slot.count);
          }
        }
        iterations = minGridCount === Infinity ? 0 : minGridCount;
      } else {
        // Shapeless recipe: check how many times grid counts can satisfy recipe ingredients
        const gridTotals: Record<string, number> = {};
        for (const slot of grid) {
          if (slot && slot.count > 0) {
            gridTotals[slot.id] = (gridTotals[slot.id] || 0) + slot.count;
          }
        }
        let maxBatch = Infinity;
        for (const ing of matchedRecipe.ingredients) {
          maxBatch = Math.min(maxBatch, Math.floor((gridTotals[ing.id] || 0) / ing.count));
        }
        iterations = maxBatch === Infinity ? 0 : maxBatch;
      }
    }

    if (iterations <= 0) return;

    const totalYield = matchedRecipe.result.count * iterations;
    const addedResult = addItemToInventoryArray(inventory, matchedRecipe.result.id, totalYield);
    if (!addedResult.success) {
      setFeedbackMsg('背包空間不足，請先整理背包空位');
      return;
    }

    const nextGrid = grid.map((s) => (s ? { ...s } : null));
    if (matchedRecipe.pattern) {
      for (let i = 0; i < 9; i++) {
        if (nextGrid[i]) {
          nextGrid[i]!.count -= iterations;
          if (nextGrid[i]!.count <= 0) {
            nextGrid[i] = null;
          }
        }
      }
    } else {
      for (const ing of matchedRecipe.ingredients) {
        let need = ing.count * iterations;
        for (let i = 0; i < 9 && need > 0; i++) {
          const slot = nextGrid[i];
          if (slot && slot.id === ing.id) {
            const take = Math.min(slot.count, need);
            slot.count -= take;
            need -= take;
            if (slot.count <= 0) nextGrid[i] = null;
          }
        }
      }
    }

    setGrid(nextGrid);
    onUpdateInventory(addedResult.inventory);
    soundManager.playCraftSuccess();
    setFeedbackMsg(`成功合成 ${matchedRecipe.name.replace(/\s*\(x\d+\)/, '')} x${totalYield}`);
  };

  // Auto-fill the 3x3 crafting grid with a recipe from the Recipe Book
  const handleSelectRecipe = (recipe: Recipe) => {
    setPreviewRecipe(recipe);

    // Return any existing grid items to inventory first so resources combine cleanly
    let workingInv = returnGridToInventory(grid, inventory);
    const nextGrid: (InventoryItem | null)[] = new Array(9).fill(null);

    if (!canCraft(recipe, workingInv)) {
      // Clear grid and show ghost guide if player doesn't have enough ingredients
      setGrid(nextGrid);
      onUpdateInventory(workingInv);
      setSelectedSlotIdx(null);
      soundManager.playButtonClick();
      return;
    }

    if (recipe.pattern && recipe.key) {
      const template = getRecipeGridTemplate(recipe);
      for (let i = 0; i < 9; i++) {
        const reqId = template[i];
        if (!reqId) continue;
        for (let s = 0; s < workingInv.length; s++) {
          const invSlot = workingInv[s];
          if (invSlot && invSlot.id === reqId && invSlot.count > 0) {
            invSlot.count -= 1;
            if (invSlot.count <= 0) workingInv[s] = null;
            const def = ITEM_DEFINITIONS[reqId];
            nextGrid[i] = { ...def, count: 1 };
            break;
          }
        }
      }
    } else {
      // Shapeless recipe: put each ingredient count in consecutive slots
      let slotPtr = 0;
      for (const ing of recipe.ingredients) {
        let remaining = ing.count;
        const def = ITEM_DEFINITIONS[ing.id];
        if (!def || slotPtr >= 9) continue;
        while (remaining > 0) {
          for (let s = 0; s < workingInv.length && remaining > 0; s++) {
            const invSlot = workingInv[s];
            if (invSlot && invSlot.id === ing.id && invSlot.count > 0) {
              const take = Math.min(invSlot.count, remaining);
              invSlot.count -= take;
              remaining -= take;
              if (invSlot.count <= 0) workingInv[s] = null;
              if (nextGrid[slotPtr]) {
                nextGrid[slotPtr]!.count += take;
              } else {
                nextGrid[slotPtr] = { ...def, count: take };
              }
            }
          }
          if (remaining > 0) break;
        }
        slotPtr++;
      }
    }

    setGrid(nextGrid);
    onUpdateInventory(workingInv);
    setSelectedSlotIdx(null);
    soundManager.playButtonClick();
  };

  // Direct quick-craft 1x from Recipe Book when player clicks the quick craft button on a recipe card
  const handleQuickCraftRecipe = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    const workingInv = returnGridToInventory(grid, inventory);
    if (!canCraft(recipe, workingInv)) return;
    const nextInv = craftRecipe(recipe, workingInv);
    setGrid(new Array(9).fill(null));
    onUpdateInventory(nextInv);
    setPreviewRecipe(recipe);
    soundManager.playCraftSuccess();
    setFeedbackMsg(`快速合成 ${recipe.name}`);
  };

  // Filtered recipe list
  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return RECIPES.filter((r) => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
      if (onlyCraftable && !canCraft(r, combinedInventory)) return false;
      if (q) {
        const matchName = r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
        const matchIng = r.ingredients.some((ing) =>
          (ITEM_DEFINITIONS[ing.id]?.name || ing.id).toLowerCase().includes(q)
        );
        if (!matchName && !matchIng) return false;
      }
      return true;
    });
  }, [selectedCategory, onlyCraftable, searchQuery, combinedInventory]);

  if (!isOpen) return null;

  const renderItemBadge = (item: Omit<InventoryItem, 'count'> & { count?: number }, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses =
      size === 'lg'
        ? 'h-9 w-8 text-lg'
        : size === 'sm'
        ? 'h-5 w-4 text-[11px]'
        : 'h-7 w-6 text-sm';
    const symbolClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl';

    if (item.type === 'spawn_egg') {
      return (
        <div
          className={`flex items-center justify-center rounded-full border border-black/60 shadow-inner ${sizeClasses}`}
          style={{
            background: `radial-gradient(circle at 35% 30%, ${item.eggSecondaryColor || '#ffffff'} 0%, ${item.iconColor} 65%)`
          }}
        >
          <span className="select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
            {item.iconSymbol || '🥚'}
          </span>
        </div>
      );
    }

    return <span className={`select-none ${symbolClass}`}>{item.iconSymbol || '📦'}</span>;
  };

  // Rearrange 36 inventory slots in classic Minecraft order: main 27 (9..35) on top, hotbar 9 (0..8) on bottom!
  const mainSlots = inventory.slice(9, 36).map((item, offset) => ({ item, actualIdx: 9 + offset }));
  const hotbarSlots = inventory.slice(0, 9).map((item, offset) => ({ item, actualIdx: offset }));

  const activeResultDef = matchedRecipe
    ? ITEM_DEFINITIONS[matchedRecipe.result.id]
    : previewRecipe
    ? ITEM_DEFINITIONS[previewRecipe.result.id]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 pt-safe pb-safe backdrop-blur-sm font-mono select-none">
      <div className="relative flex h-[92dvh] w-full max-w-6xl flex-col border-2 border-stone-500 bg-[#232323] text-stone-100 shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-700 bg-[#181818] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-amber-500/60 bg-amber-950/60 text-amber-300">
              <Hammer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-amber-300">
                高級合成工作台
              </h2>
              <p className="text-[11px] text-stone-400">
                {openedViaTable ? '3×3 工坊工作台' : '3×3 隨身進階合成台'} · 點擊配方自動填入，或手動擺放材料
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToInventory && (
              <button
                onClick={() => {
                  const hasGridItems = grid.some((s) => s !== null && s.count > 0);
                  if (hasGridItems) {
                    const restored = returnGridToInventory(grid, inventory);
                    onUpdateInventory(restored);
                    setGrid(new Array(9).fill(null));
                  }
                  onSwitchToInventory();
                }}
                className="flex items-center gap-1.5 border border-stone-600 bg-stone-800 px-3 py-1.5 text-xs font-bold text-stone-200 hover:bg-stone-700 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Backpack className="h-3.5 w-3.5 text-amber-400" />
                <span>{gameMode === 'creative' ? '切換創造物品庫 [E]' : '切換背包面板 [E]'}</span>
              </button>
            )}

            <button
              onClick={handleSafeClose}
              aria-label="關閉合成介面"
              className="border border-stone-600 bg-stone-800 p-1.5 text-stone-300 hover:bg-rose-700 hover:border-rose-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* LEFT PANEL: Recipe Book */}
          <div className="flex flex-col border-b-2 lg:border-b-0 lg:border-r-2 border-stone-700 bg-[#1d1d1d] p-3 sm:p-4 lg:col-span-5 min-h-[280px] lg:min-h-0 lg:overflow-hidden">
            {/* Search & Craftable Filter */}
            <div className="mb-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋工具、裝飾方塊或材料..."
                  className="w-full border border-stone-600 bg-stone-950 py-1.5 pr-3 pl-8 text-xs text-stone-100 placeholder:text-stone-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setOnlyCraftable((prev) => !prev)}
                className={`flex items-center gap-1 border px-2.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  onlyCraftable
                    ? 'border-emerald-400 bg-emerald-700 text-white'
                    : 'border-stone-600 bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                <span>只顯示可合成</span>
              </button>
            </div>

            {/* Category Tabs */}
            <div className="mb-3 flex flex-wrap gap-1.5 border-b border-stone-700 pb-2.5">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`border px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === tab.id
                      ? 'border-amber-400 bg-amber-500 text-stone-950'
                      : 'border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Recipe List */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredRecipes.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center border border-dashed border-stone-700 bg-stone-900/40 p-4 text-center text-xs text-stone-400">
                  <AlertCircle className="mb-2 h-6 w-6 text-stone-500" />
                  <p>找不到符合條件的合成配方</p>
                  {onlyCraftable && (
                    <button
                      onClick={() => setOnlyCraftable(false)}
                      className="mt-2 border border-stone-600 bg-stone-800 px-3 py-1 text-amber-300 hover:bg-stone-700"
                    >
                      顯示全部配方
                    </button>
                  )}
                </div>
              ) : (
                filteredRecipes.map((recipe) => {
                  const craftable = canCraft(recipe, combinedInventory);
                  const maxCraftable = getMaxCraftableFromInventory(recipe, combinedInventory);
                  const resDef = ITEM_DEFINITIONS[recipe.result.id];
                  const isSelected = previewRecipe?.id === recipe.id;

                  return (
                    <div
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe)}
                      className={`group flex cursor-pointer items-center justify-between border p-2.5 transition-colors ${
                        isSelected
                          ? 'border-amber-400 bg-stone-800'
                          : craftable
                          ? 'border-stone-600 bg-stone-800/75 hover:border-amber-400/70 hover:bg-stone-800'
                          : 'border-stone-800 bg-stone-900/50 opacity-80 hover:border-stone-600'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-stone-600 bg-stone-950 shadow-inner">
                          {resDef ? renderItemBadge(resDef, 'md') : <span>📦</span>}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs sm:text-sm font-bold text-stone-100">
                              {recipe.name}
                            </span>
                            {craftable && (
                              <span className="text-[10px] font-bold text-emerald-400 tabular-nums shrink-0">
                                ✓ 可做 {maxCraftable} 次
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] tabular-nums">
                            {recipe.ingredients.map((ing) => {
                              const ingDef = ITEM_DEFINITIONS[ing.id];
                              const have = getAvailableCount(ing.id, combinedInventory);
                              const ok = have >= ing.count;
                              return (
                                <span
                                  key={ing.id}
                                  className={`border px-1.5 py-0.5 ${
                                    ok
                                      ? 'border-emerald-700/70 bg-emerald-950/50 text-emerald-300'
                                      : 'border-rose-800/70 bg-rose-950/40 text-rose-300'
                                  }`}
                                >
                                  {ingDef?.name || ing.id} {have}/{ing.count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleQuickCraftRecipe(e, recipe)}
                        disabled={!craftable}
                        title={craftable ? '立即消耗資源快速合成' : '資源不足，點擊卡片可查看 3×3 擺法'}
                        className={`ml-2 flex shrink-0 items-center gap-1 border px-2.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                          craftable
                            ? 'border-amber-400 bg-amber-500 text-stone-950 hover:bg-amber-400 active:scale-95'
                            : 'cursor-not-allowed border-stone-700 bg-stone-800 text-stone-500'
                        }`}
                      >
                        <Hammer className="h-3.5 w-3.5" />
                        <span>合成</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: 3x3 Crafting Table Grid + Result + 36-Slot Inventory */}
          <div className="flex flex-col bg-[#272727] p-3 sm:p-5 lg:col-span-7 lg:overflow-y-auto">
            {/* Feedback Banner */}
            {feedbackMsg && (
              <div className="mb-3 flex items-center justify-between border border-emerald-500/60 bg-emerald-950/70 px-3 py-1.5 text-xs font-bold text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  {feedbackMsg}
                </span>
                <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* 3x3 Crafting Workbench Section */}
            <div className="mb-4 border-2 border-stone-600 bg-[#323232] p-3 sm:p-4 shadow-inner">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-300">
                  3×3 合成格 · {selectedSlotIdx !== null && inventory[selectedSlotIdx]
                    ? `已拿起：${inventory[selectedSlotIdx]!.name}（點擊空格放置 1 個）`
                    : '點擊下方背包物品選取材料，或點擊左側配方自動填入'}
                </span>
                <button
                  onClick={handleClearGrid}
                  disabled={!grid.some((s) => s !== null)}
                  className="flex items-center gap-1 border border-stone-500 bg-stone-700 px-2.5 py-1 text-[11px] font-bold text-stone-200 hover:bg-stone-600 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>退回全部材料</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                {/* 3x3 Matrix */}
                <div className="grid grid-cols-3 gap-1.5 border-2 border-stone-800 bg-[#1e1e1e] p-2">
                  {grid.map((slot, idx) => {
                    const ghostId = !matchedRecipe ? ghostTemplate[idx] : null;
                    const ghostDef = ghostId ? ITEM_DEFINITIONS[ghostId] : null;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleGridSlotLeftClick(idx)}
                        onContextMenu={(e) => handleGridSlotRightClick(e, idx)}
                        title={
                          slot
                            ? `${slot.name} x${slot.count}（左鍵退回 1 個，右鍵退回整組）`
                            : ghostDef
                            ? `配方提示：此格需放置「${ghostDef.name}」`
                            : '空合成格（左鍵放入 1 個選取材料）'
                        }
                        className={`relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center border-2 transition-colors ${
                          slot
                            ? 'border-amber-500/80 bg-[#3a3a3a] hover:border-amber-300'
                            : selectedSlotIdx !== null
                            ? 'border-stone-500 bg-[#2b2b2b] hover:border-amber-400 hover:bg-[#383838]'
                            : 'border-stone-700 bg-[#262626] hover:border-stone-500'
                        }`}
                      >
                        {slot ? (
                          <div className="flex flex-col items-center justify-center">
                            {renderItemBadge(slot, 'md')}
                            {slot.count > 1 && (
                              <span className="absolute right-1 bottom-0.5 text-[10px] font-black text-white tabular-nums drop-shadow-[0_1px_2px_black]">
                                {slot.count}
                              </span>
                            )}
                          </div>
                        ) : ghostDef ? (
                          <div className="flex flex-col items-center justify-center opacity-35">
                            {renderItemBadge(ghostDef, 'md')}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-1 text-stone-300">
                  <ArrowRight className="h-7 w-7 rotate-90 sm:rotate-0 text-amber-400" />
                  <span className="text-[10px] text-stone-400">產出</span>
                </div>

                {/* Output Result Slot & Craft Controls */}
                <div className="flex flex-col items-center gap-2 min-w-[180px]">
                  <button
                    type="button"
                    disabled={!matchedRecipe}
                    onClick={() => handleCraftFromGrid(false)}
                    className={`relative flex h-20 w-20 items-center justify-center border-2 transition-all ${
                      matchedRecipe
                        ? 'border-amber-400 bg-amber-950/50 hover:bg-amber-900/60 active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.25)] cursor-pointer'
                        : 'border-stone-700 bg-[#1e1e1e] cursor-default'
                    }`}
                    title={matchedRecipe ? `點擊合成 ${matchedRecipe.name}` : '尚未匹配完整配方'}
                  >
                    {matchedRecipe && activeResultDef ? (
                      <>
                        {renderItemBadge(activeResultDef, 'lg')}
                        <span className="absolute right-1.5 bottom-1 text-xs font-black text-amber-300 tabular-nums drop-shadow-[0_1px_2px_black]">
                          x{matchedRecipe.result.count}
                        </span>
                      </>
                    ) : previewRecipe && activeResultDef ? (
                      <div className="opacity-35 flex flex-col items-center">
                        {renderItemBadge(activeResultDef, 'lg')}
                      </div>
                    ) : (
                      <span className="text-xs text-stone-600">空</span>
                    )}
                  </button>

                  {matchedRecipe ? (
                    <div className="text-center">
                      <p className="text-xs font-black text-amber-300">{matchedRecipe.name}</p>
                      <p className="mt-0.5 text-[10px] text-stone-300 max-w-[210px] leading-snug">
                        {matchedRecipe.description}
                      </p>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleCraftFromGrid(false)}
                          className="border border-amber-400 bg-amber-500 px-3 py-1.5 text-xs font-black text-stone-950 hover:bg-amber-400 active:scale-95 whitespace-nowrap"
                        >
                          合成 1 次
                        </button>
                        <button
                          onClick={() => handleCraftFromGrid(true)}
                          className="border border-emerald-400 bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-500 active:scale-95 whitespace-nowrap"
                        >
                          全部合成
                        </button>
                      </div>
                    </div>
                  ) : previewRecipe ? (
                    <div className="text-center">
                      <p className="text-xs font-bold text-stone-300">{previewRecipe.name}</p>
                      <p className="mt-0.5 text-[10px] text-rose-300">
                        材料尚未齊全（虛影顯示擺放位置）
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-400 text-center">
                      在 3×3 格放置材料或點擊配方
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Player 36-Slot Backpack (Classic 9x4 Minecraft Grid: 27 Storage + 9 Hotbar) */}
            <div className="border-2 border-stone-700 bg-[#1b1b1b] p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold text-stone-200">
                  隨身背包庫存 (36 格)
                </span>
                <span className="text-[11px] text-stone-400">
                  點擊物品格拿取 · 下方金色框為 1~9 快捷欄
                </span>
              </div>

              {/* Main 27 Inventory Slots (3 rows x 9 cols) */}
              <div className="grid grid-cols-9 gap-1 mb-2">
                {mainSlots.map(({ item, actualIdx }) => {
                  const isSelected = selectedSlotIdx === actualIdx;
                  return (
                    <button
                      key={actualIdx}
                      type="button"
                      onClick={() => handleSelectBackpackSlot(actualIdx)}
                      title={item ? `${item.name} x${item.count}` : '空格'}
                      className={`relative flex aspect-square items-center justify-center border transition-colors ${
                        isSelected
                          ? 'border-2 border-amber-300 bg-amber-900/50'
                          : item
                          ? 'border-stone-600 bg-stone-800/80 hover:border-stone-400'
                          : 'border-stone-800 bg-stone-900/60'
                      }`}
                    >
                      {item && (
                        <>
                          {renderItemBadge(item, 'sm')}
                          {item.count > 1 && (
                            <span className="absolute right-0.5 bottom-0 text-[9px] font-black text-white tabular-nums drop-shadow-[0_1px_2px_black]">
                              {item.count}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Hotbar 9 Slots */}
              <div className="grid grid-cols-9 gap-1 border-t border-stone-700 pt-2">
                {hotbarSlots.map(({ item, actualIdx }) => {
                  const isSelected = selectedSlotIdx === actualIdx;
                  return (
                    <button
                      key={actualIdx}
                      type="button"
                      onClick={() => handleSelectBackpackSlot(actualIdx)}
                      title={item ? `快捷欄 ${actualIdx + 1}: ${item.name} x${item.count}` : `快捷欄 ${actualIdx + 1}`}
                      className={`relative flex aspect-square items-center justify-center border transition-colors ${
                        isSelected
                          ? 'border-2 border-amber-300 bg-amber-900/60'
                          : 'border-amber-700/60 bg-stone-800 hover:border-amber-400'
                      }`}
                    >
                      <span className="absolute top-0.5 left-1 text-[8px] font-bold text-amber-400/80 tabular-nums">
                        {actualIdx + 1}
                      </span>
                      {item && (
                        <>
                          {renderItemBadge(item, 'sm')}
                          {item.count > 1 && (
                            <span className="absolute right-0.5 bottom-0 text-[9px] font-black text-white tabular-nums drop-shadow-[0_1px_2px_black]">
                              {item.count}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
