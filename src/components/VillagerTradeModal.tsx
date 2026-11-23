import React, { useEffect, useState } from 'react';
import { MobEntity, InventoryItem } from '../types';
import { soundManager } from '../game/audio';
import { ArrowRight, Check, X, Shield, BookOpen, Hammer, Sparkles } from 'lucide-react';

interface VillagerTradeModalProps {
  villager: MobEntity | null;
  isOpen: boolean;
  onClose: () => void;
  playerInventory: (InventoryItem | null)[];
  onExecuteTrade: (tradeId: string, costItem: string, costCount: number, giveItem: string, giveCount: number) => boolean;
}

export const VillagerTradeModal: React.FC<VillagerTradeModalProps> = ({
  villager,
  isOpen,
  onClose,
  playerInventory,
  onExecuteTrade
}) => {
  const [selectedTradeIndex, setSelectedTradeIndex] = useState(0);
  const [tradeMessage, setTradeMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTradeIndex(0);
      setTradeMessage(null);
      soundManager.playVillagerHrmm();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === 'Escape' || e.code === 'KeyE') {
        e.preventDefault();
        soundManager.playButtonClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !villager) return null;

  const profession = villager.profession || 'farmer';
  const trades = villager.trades || [];

  const professionInfo: Record<string, { title: string; color: string; icon: string }> = {
    farmer: { title: '🌾 村莊農夫 (Farmer)', color: 'text-amber-400', icon: '🌾' },
    librarian: { title: '📚 圖書管理員 (Librarian)', color: 'text-rose-400', icon: '📚' },
    weaponsmith: { title: '⚔️ 武器鐵匠 (Weaponsmith)', color: 'text-sky-400', icon: '⚔️' },
    cleric: { title: '🧪 村莊牧師 (Cleric)', color: 'text-purple-400', icon: '🧪' }
  };

  const itemNames: Record<string, string> = {
    wheat_crop: '小麥',
    bread: '麵包',
    emerald: '綠寶石',
    iron_ingot: '鐵錠',
    iron_pickaxe: '鐵鎬',
    diamond_sword: '鑽石劍',
    golden_apple: '金蘋果',
    glowstone: '螢石',
    bookshelf: '書架',
    apple: '紅蘋果'
  };

  const currentTrade = trades[selectedTradeIndex];

  // Check how many of the required costItem player has
  const playerHasCount = (itemId: string): number => {
    return playerInventory
      .filter((slot): slot is InventoryItem => slot !== null && slot.id === itemId)
      .reduce((sum, slot) => sum + slot.count, 0);
  };

  const canAfford = currentTrade
    ? playerHasCount(currentTrade.inputItem) >= currentTrade.inputCount
    : false;

  const handleTrade = () => {
    if (!currentTrade) return;

    if (!canAfford) {
      soundManager.playVillagerNo();
      setTradeMessage({
        text: `物品不足！需要 ${currentTrade.inputCount} 個 ${itemNames[currentTrade.inputItem] || currentTrade.inputItem}`,
        isError: true
      });
      return;
    }

    const success = onExecuteTrade(
      currentTrade.id,
      currentTrade.inputItem,
      currentTrade.inputCount,
      currentTrade.outputItem,
      currentTrade.outputCount
    );

    if (success) {
      soundManager.playVillagerYes();
      setTradeMessage({
        text: `交易成功！獲得 ${currentTrade.outputCount} 個 ${itemNames[currentTrade.outputItem] || currentTrade.outputItem}`,
        isError: false
      });
    } else {
      soundManager.playVillagerNo();
      setTradeMessage({ text: '背包空間不足！', isError: true });
    }
  };

  return (
    <div
      id="villager-trade-screen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm font-mono select-none text-white animate-in fade-in duration-150"
    >
      <div className="relative flex flex-col w-full max-w-lg rounded-xl border-4 border-[#373737] bg-[#c6c6c6] text-black shadow-2xl overflow-hidden">
        {/* Header (Classic Minecraft GUI Gray) */}
        <div className="flex items-center justify-between border-b-2 border-[#555555] bg-[#8b8b8b] px-4 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black">{professionInfo[profession]?.icon}</span>
            <span className="font-bold text-sm sm:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {professionInfo[profession]?.title || '村民交易'}
            </span>
          </div>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="flex items-center justify-center w-6 h-6 rounded bg-[#a0a0a0] hover:bg-[#b0b0b0] border border-[#555] text-stone-900 font-black text-xs"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3.5">
          {/* Villager Profession Description */}
          <div className="bg-[#8b8b8b]/30 p-2.5 rounded border border-[#a0a0a0] flex items-center justify-between text-xs">
            <span className="font-bold text-stone-800">
              村民好感度：<span className="text-emerald-700 font-black">友好 (可無限兌換)</span>
            </span>
            <span className="text-[11px] text-stone-600">按 E 或 ESC 關閉</span>
          </div>

          {/* Trade Options List */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-stone-700">可兌換項目清單：</div>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {trades.map((trade, idx) => {
                const isSelected = idx === selectedTradeIndex;
                const haveCost = playerHasCount(trade.inputItem) >= trade.inputCount;

                return (
                  <button
                    key={trade.id}
                    onClick={() => {
                      soundManager.playButtonClick();
                      setSelectedTradeIndex(idx);
                      setTradeMessage(null);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded border-2 transition-all text-xs ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-100/90 shadow-md font-bold'
                        : 'border-[#a0a0a0] bg-[#dbdbdb] hover:bg-[#e6e6e6]'
                    }`}
                  >
                    {/* Input */}
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-black/10 font-black text-emerald-900">
                        {trade.inputCount}x
                      </span>
                      <span className="text-stone-900 font-bold">
                        {itemNames[trade.inputItem] || trade.inputItem}
                      </span>
                    </div>

                    <ArrowRight className="h-4 w-4 text-stone-500 mx-2" />

                    {/* Output */}
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-amber-200/80 font-black text-amber-900">
                        {trade.outputCount}x
                      </span>
                      <span className="text-emerald-800 font-black">
                        {itemNames[trade.outputItem] || trade.outputItem}
                      </span>
                    </div>

                    {/* Affordability Badge */}
                    <div className="ml-3">
                      {haveCost ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                          可兌換
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-400 text-stone-800">
                          缺少素材
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Trade Workbench Box */}
          {currentTrade && (
            <div className="mt-1 p-3 rounded bg-[#8b8b8b]/25 border-2 border-[#a0a0a0] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700">當前交易內容：</span>
                <span className="text-[11px] text-stone-600">
                  背包擁有：{playerHasCount(currentTrade.inputItem)} 個 {itemNames[currentTrade.inputItem] || currentTrade.inputItem}
                </span>
              </div>

              <div className="flex items-center justify-around py-2 bg-white/60 rounded border border-[#a0a0a0]">
                {/* Cost */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded bg-[#8b8b8b] border-2 border-stone-600 flex items-center justify-center text-lg font-black text-white shadow-inner">
                    {currentTrade.inputItem === 'emerald' ? '💎' : currentTrade.inputItem === 'wheat_crop' ? '🌾' : '📦'}
                  </div>
                  <span className="mt-1 text-xs font-bold text-stone-800">
                    {currentTrade.inputCount}x {itemNames[currentTrade.inputItem] || currentTrade.inputItem}
                  </span>
                </div>

                <div className="text-xl font-black text-stone-400">➔</div>

                {/* Give */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded bg-emerald-700 border-2 border-emerald-900 flex items-center justify-center text-lg font-black text-white shadow-inner">
                    {currentTrade.outputItem === 'emerald' ? '💎' : currentTrade.outputItem === 'bread' ? '🍞' : '⚔️'}
                  </div>
                  <span className="mt-1 text-xs font-black text-emerald-800">
                    {currentTrade.outputCount}x {itemNames[currentTrade.outputItem] || currentTrade.outputItem}
                  </span>
                </div>
              </div>

              {/* Status feedback message */}
              {tradeMessage && (
                <div
                  className={`text-xs text-center py-1 rounded font-bold ${
                    tradeMessage.isError ? 'bg-red-200 text-red-700' : 'bg-emerald-200 text-emerald-800'
                  }`}
                >
                  {tradeMessage.text}
                </div>
              )}

              {/* Trade Action Button */}
              <button
                id="villager-confirm-trade-btn"
                onClick={handleTrade}
                className={`w-full py-3 px-4 rounded text-white font-bold text-sm tracking-wider shadow-lg transition-all border-t-2 border-l-2 border-white/40 border-b-4 border-r-4 border-black active:translate-y-0.5 ${
                  canAfford
                    ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                    : 'bg-stone-500 hover:bg-stone-600 cursor-not-allowed opacity-80'
                }`}
              >
                {canAfford ? '確認兌換 (Trade)' : '物品不足 (Not Enough Items)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
