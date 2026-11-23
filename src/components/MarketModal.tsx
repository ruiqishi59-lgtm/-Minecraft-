import React, { useState, useEffect } from 'react';
import {
  Coins,
  Crown,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
  Gift,
  X,
  Lock,
  ArrowRight,
  UserCheck,
  Check,
  Smartphone,
  Search,
  Star,
  Download,
  Palette,
  Globe,
  Tag,
  Package,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../game/audio';
import {
  getActivePoints,
  addPoints,
  spendPoints,
  getStoredUser,
  GoogleUserProfile,
  getVipStatus,
  subscribeVip,
  cancelVip,
  isVipActive,
  VipSubscriptionInfo,
  getUnlockedSkins,
  unlockSkin
} from '../utils/googleAuth';
import { CHARACTER_SKINS } from '../game/skins';
import { PlayerController } from '../game/player';
import { MARKETPLACE_ITEMS, TEXTURE_PACKS } from '../game/marketplaceCatalog';
import { MarketplaceItem, MarketplaceCategory, WorldType } from '../types';

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: PlayerController | null;
  onOpenGoogleAccount: () => void;
  activeSkinId?: string;
  onSelectSkin?: (skinId: string) => void;
  initialTab?: 'marketplace' | 'vip' | 'deluxe_skins' | 'buy_points' | 'textures';
  onLoadAdventureWorld?: (worldType: WorldType, seed: number, name: string, gameMode: 'survival' | 'creative') => void;
  onApplyTexturePack?: (packId: string) => void;
  activeTexturePackId?: string;
}

interface PointTier {
  id: string;
  points: number;
  bonus: number;
  priceNT: number;
  label: string;
  badge?: string;
  isPopular?: boolean;
}

// Strictly 100 to 10,000 points, NT$ 100 to NT$ 400
const POINT_TIERS: PointTier[] = [
  {
    id: 'tier_100',
    points: 100,
    bonus: 0,
    priceNT: 100,
    label: '新手試玩包',
    badge: '入門首選'
  },
  {
    id: 'tier_500',
    points: 500,
    bonus: 50,
    priceNT: 150,
    label: '冒險者特惠包',
    badge: '超值推薦'
  },
  {
    id: 'tier_1500',
    points: 1500,
    bonus: 200,
    priceNT: 200,
    label: '勇者探險包',
    isPopular: true,
    badge: '人氣最高 🔥'
  },
  {
    id: 'tier_3500',
    points: 3500,
    bonus: 500,
    priceNT: 280,
    label: '建築大師包',
    badge: '工匠必備'
  },
  {
    id: 'tier_6000',
    points: 6000,
    bonus: 1000,
    priceNT: 340,
    label: '以太天神包',
    badge: '尊榮特權'
  },
  {
    id: 'tier_10000',
    points: 10000,
    bonus: 2500,
    priceNT: 400,
    label: '終極傳奇包',
    badge: '最高性價比 👑'
  }
];

export const MarketModal: React.FC<MarketModalProps> = ({
  isOpen,
  onClose,
  player,
  onOpenGoogleAccount,
  activeSkinId,
  onSelectSkin,
  initialTab = 'marketplace',
  onLoadAdventureWorld,
  onApplyTexturePack,
  activeTexturePackId = 'classic'
}) => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'vip' | 'deluxe_skins' | 'buy_points' | 'textures'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [points, setPoints] = useState<number>(100);
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  const [vipInfo, setVipInfo] = useState<VipSubscriptionInfo>(getVipStatus());
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(getUnlockedSkins());
  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('minecraft_unlocked_marketplace_items');
      return saved ? JSON.parse(saved) : ['world_skyblock', 'skin_kawaii_neko'];
    } catch {
      return ['world_skyblock', 'skin_kawaii_neko'];
    }
  });

  // Selected item for detail view modal
  const [detailItem, setDetailItem] = useState<MarketplaceItem | null>(null);

  // Daily gift state
  const [claimedDailyGift, setClaimedDailyGift] = useState<boolean>(() => {
    const today = new Date().toDateString();
    return localStorage.getItem('minecraft_daily_gift_date') === today;
  });

  // Points checkout modal state
  const [selectedTier, setSelectedTier] = useState<PointTier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'linepay' | 'gpay' | 'telecom'>('gpay');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  // VIP direct checkout state
  const [vipPaymentMethod, setVipPaymentMethod] = useState<'credit' | 'linepay' | 'gpay' | 'telecom'>('credit');
  const [isVipProcessing, setIsVipProcessing] = useState<boolean>(false);

  // Sync state
  useEffect(() => {
    const update = () => {
      setPoints(getActivePoints());
      setGoogleUser(getStoredUser());
      setVipInfo(getVipStatus());
      setUnlockedSkins(getUnlockedSkins());
    };
    update();
    window.addEventListener('google_user_updated', update);
    window.addEventListener('vip_status_updated', update);
    window.addEventListener('skins_updated', update);
    return () => {
      window.removeEventListener('google_user_updated', update);
      window.removeEventListener('vip_status_updated', update);
      window.removeEventListener('skins_updated', update);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const saveUnlockedItems = (items: string[]) => {
    setUnlockedItems(items);
    localStorage.setItem('minecraft_unlocked_marketplace_items', JSON.stringify(items));
  };

  // Handle Points Purchase
  const handleConfirmPurchase = () => {
    if (!selectedTier) return;
    setIsProcessing(true);

    setTimeout(() => {
      const totalPointsAdded = selectedTier.points + selectedTier.bonus;
      const newBalance = addPoints(totalPointsAdded);
      setPoints(newBalance);
      setIsProcessing(false);
      setSelectedTier(null);

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });
      soundManager.playCraftSuccess();

      setPurchaseSuccessMessage(`🎉 成功購買 ${totalPointsAdded} Minecoins 🪙！目前餘額：${newBalance} 點`);
      setTimeout(() => setPurchaseSuccessMessage(null), 4000);
    }, 900);
  };

  // Handle VIP Subscription (10 NT / Month)
  const handleSubscribeVipInMarket = () => {
    setIsVipProcessing(true);
    soundManager.playButtonClick();

    setTimeout(() => {
      const res = subscribeVip(vipPaymentMethod);
      if (res.success) {
        setVipInfo(getVipStatus());
        setPoints(getActivePoints());
        setIsVipProcessing(false);
        soundManager.playCraftSuccess();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
        setPurchaseSuccessMessage('👑 恭喜成為創世 VIP 會員！已解鎖「萬界融合新地形」、「全新世界動態」並領取 500 點積分！');
        setTimeout(() => setPurchaseSuccessMessage(null), 5000);
      }
    }, 1000);
  };

  // Handle Claiming Daily Free Gift
  const handleClaimDailyGift = () => {
    if (claimedDailyGift) return;
    const bonus = 200;
    const newBalance = addPoints(bonus);
    setPoints(newBalance);
    setClaimedDailyGift(true);
    localStorage.setItem('minecraft_daily_gift_date', new Date().toDateString());

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    soundManager.playCraftSuccess();
    setPurchaseSuccessMessage(`🎁 恭喜領取今日免費市集好禮！獲得 200 Minecoins 🪙！`);
    setTimeout(() => setPurchaseSuccessMessage(null), 4000);
  };

  // Handle Buying or Applying Marketplace Item
  const handleItemAction = (item: MarketplaceItem) => {
    const isOwned = unlockedItems.includes(item.id) || item.isFree;

    if (!isOwned) {
      if (points < item.priceMinecoins) {
        alert(`Minecoins 餘額不足！購買【${item.title}】需要 ${item.priceMinecoins} 點，您目前有 ${points} 點。請前往儲值檔位！`);
        setActiveTab('buy_points');
        return;
      }

      const success = spendPoints(item.priceMinecoins, item.id);
      if (success) {
        const next = [...unlockedItems, item.id];
        saveUnlockedItems(next);
        setPoints(getActivePoints());
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
        soundManager.playCraftSuccess();
        setPurchaseSuccessMessage(`🎉 成功購買【${item.title}】！`);
        setTimeout(() => setPurchaseSuccessMessage(null), 4000);
      }
      return;
    }

    // Already owned: execute item type action!
    if (item.category === 'worlds' || item.worldType) {
      if (onLoadAdventureWorld) {
        onClose();
        onLoadAdventureWorld(item.worldType || 'default', item.worldSeed || 88888, item.title, item.gameMode || 'survival');
      }
    } else if (item.category === 'skins' || item.skinId) {
      if (onSelectSkin && item.skinId) {
        onSelectSkin(item.skinId);
        soundManager.playButtonClick();
        setPurchaseSuccessMessage(`✨ 已切換造型為【${item.title}】！`);
        setTimeout(() => setPurchaseSuccessMessage(null), 3000);
      }
    } else if (item.category === 'textures' || item.texturePackId) {
      if (onApplyTexturePack && item.texturePackId) {
        onApplyTexturePack(item.texturePackId);
        soundManager.playButtonClick();
        setPurchaseSuccessMessage(`🎨 已套用材質包【${item.title}】！遊戲畫面即刻生效！`);
        setTimeout(() => setPurchaseSuccessMessage(null), 3000);
      }
    } else if (item.category === 'perks') {
      if (player) {
        if (item.id === 'perk_celestial_pickaxe') {
          player.addItemToInventory('diamond_pickaxe', 1);
        } else if (item.id === 'perk_angel_wings') {
          player.isFlying = true;
          player.addItemToInventory('cloud_block', 32);
        } else if (item.id === 'perk_ultimate_vault') {
          player.addItemToInventory('diamond_block', 64);
          player.addItemToInventory('gold_ore', 64);
          player.addItemToInventory('emerald_block', 64);
          player.addItemToInventory('obsidian', 64);
        }
        soundManager.playCraftSuccess();
        setPurchaseSuccessMessage(`📦 已將【${item.title}】神級道具發放至您的背包中！`);
        setTimeout(() => setPurchaseSuccessMessage(null), 3000);
      }
    }
  };

  // Filter items
  const filteredItems = MARKETPLACE_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase()) || item.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 pt-safe pb-safe bg-black/85 backdrop-blur-md select-none font-mono animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[92dvh] max-h-[760px] rounded-2xl bg-[#1e1e1e] border-2 border-stone-600 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-white overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#2b2b2b] border-b-2 border-stone-700 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl shadow-lg border border-amber-300/40">
              🛒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  盜版Rickie -2015 市集 (MARKETPLACE)
                </h2>
                <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/40">
                  全功能已開通
                </span>
                {vipInfo.isActive && (
                  <span className="rounded bg-gradient-to-r from-amber-400 to-amber-600 px-2 py-0.5 text-[10px] font-black text-stone-950 flex items-center gap-1 shadow-sm">
                    <Crown className="h-3 w-3 fill-stone-950" />
                    創世 VIP
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                世界與地圖 • 造型包 • 8-Bit/以太材質包 • 混搭組合包 • Minecoins 代幣
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Daily Gift Button */}
            <button
              onClick={handleClaimDailyGift}
              disabled={claimedDailyGift}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                claimedDailyGift
                  ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500 text-stone-950 hover:brightness-110 animate-bounce'
              }`}
            >
              <Gift className="h-4 w-4" />
              <span>{claimedDailyGift ? '今日好禮已領取' : '🎁 領取今日免費好禮'}</span>
            </button>

            {/* Minecoins Balance Badge */}
            <div
              onClick={() => setActiveTab('buy_points')}
              className="flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-950/60 hover:bg-amber-900/60 cursor-pointer px-3 py-1.5 text-xs font-black text-amber-300 shadow-inner transition-all"
              title="點擊儲值 Minecoins"
            >
              <Coins className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>{points.toLocaleString()} Minecoins</span>
              <span className="ml-1 text-[10px] text-emerald-400 font-mono">+儲值</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dynamic World & Google Account Sub-header */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-800 bg-[#252525] px-5 py-2 text-xs gap-2">
          <div className="flex items-center gap-3">
            {googleUser ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <img
                  src={googleUser.avatar}
                  alt={googleUser.name}
                  className="h-5 w-5 rounded-full border border-emerald-400 object-cover"
                />
                <span className="font-bold text-stone-200">{googleUser.name}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">(雲端存檔同步中)</span>
              </div>
            ) : (
              <button
                onClick={onOpenGoogleAccount}
                className="flex items-center gap-1.5 text-[11px] text-amber-300 hover:text-amber-200 transition-colors"
              >
                <UserCheck className="h-4 w-4 text-amber-400" />
                <span>登入帳號以跨裝置永久保存市集購買記錄</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] pl-2 border-l border-stone-700 text-stone-400">
              <Palette className="h-3.5 w-3.5 text-sky-400" />
              <span>當前材質包: <strong className="text-white">{TEXTURE_PACKS.find((p) => p.id === activeTexturePackId)?.name || '原版經典'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!vipInfo.isActive ? (
              <button
                onClick={() => setActiveTab('vip')}
                className="flex items-center gap-1 rounded bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[11px] font-black text-stone-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-sm"
              >
                <Crown className="h-3 w-3 fill-stone-950" />
                <span>開通 VIP (每月 10NT)</span>
              </button>
            ) : (
              <span className="text-[11px] text-amber-400 font-bold">
                VIP 剩餘 {vipInfo.daysRemaining} 天
              </span>
            )}
          </div>
        </div>

        {/* Success toast notification */}
        {purchaseSuccessMessage && (
          <div className="flex items-center gap-2 bg-emerald-950/95 border-b border-emerald-500 px-5 py-2.5 text-xs font-bold text-emerald-200 animate-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{purchaseSuccessMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-[#1c1c1c] px-3 sm:px-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'marketplace'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>🌟 市集商城首頁</span>
          </button>

          <button
            onClick={() => setActiveTab('textures')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'textures'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Palette className="h-4 w-4 text-sky-400" />
            <span>材質包與資源包</span>
          </button>

          <button
            onClick={() => setActiveTab('deluxe_skins')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'deluxe_skins'
                ? 'border-purple-400 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>👤 人物造型衣櫥</span>
          </button>

          <button
            onClick={() => setActiveTab('buy_points')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'buy_points'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Coins className="h-4 w-4 text-emerald-400" />
            <span>儲值 Minecoins (NT$ 100~400)</span>
          </button>

          <button
            onClick={() => setActiveTab('vip')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'vip'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Crown className="h-4 w-4 text-amber-400" />
            <span>創世 VIP (NT$ 10/月)</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: MAIN MARKETPLACE EXPLORER (Full Marketplace Catalog)    */}
        {/* ============================================================== */}
        {activeTab === 'marketplace' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#181818]">
            {/* Search and Category Filter Toolbar */}
            <div className="p-4 bg-[#202020] border-b border-stone-800 flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {[
                  { id: 'all', label: '全部商品', icon: '🌟' },
                  { id: 'worlds', label: '世界地圖', icon: '🗺️' },
                  { id: 'skins', label: '外觀造型', icon: '👤' },
                  { id: 'textures', label: '材質包', icon: '🎨' },
                  { id: 'mashups', label: '混搭包', icon: '📦' },
                  { id: 'perks', label: '神級特權', icon: '⚡' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋世界、造型、材質包..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 p-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const isOwned = unlockedItems.includes(item.id) || item.isFree;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setDetailItem(item)}
                      className="group relative flex flex-col rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-400/80 transition-all shadow-md overflow-hidden cursor-pointer"
                    >
                      {/* Image Thumbnail with Badges */}
                      <div className="relative h-36 w-full overflow-hidden bg-stone-800">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {item.badge && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black shadow-md">
                            {item.badge}
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-amber-300 font-bold">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{item.rating}</span>
                          <span className="text-stone-400 font-normal">({item.downloadCount})</span>
                        </div>
                      </div>

                      {/* Content Card Body */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-stone-400">
                            創作者：{item.creator}
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mt-0.5 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Card Bottom: Price and Action Button */}
                        <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between">
                          <div>
                            {item.isFree ? (
                              <span className="text-xs font-black text-emerald-400">免費領取</span>
                            ) : (
                              <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                                <Coins className="h-3.5 w-3.5 text-amber-400" />
                                <span>{item.priceMinecoins} 點</span>
                                {item.originalPrice && (
                                  <span className="text-[10px] text-stone-500 line-through">
                                    {item.originalPrice}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemAction(item);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                              isOwned
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-black'
                            }`}
                          >
                            {isOwned
                              ? item.category === 'worlds'
                                ? '立即遊玩 🚀'
                                : item.category === 'textures'
                                ? '套用材質 🎨'
                                : '立即裝備 ✨'
                              : '獲取項目'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TEXTURE PACKS (Material & Resource Packs)                */}
        {/* ============================================================== */}
        {activeTab === 'textures' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#181818]">
            <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/40 text-xs text-sky-200">
              <span className="font-bold text-sky-300">🎨 原版即時材質替換：</span>
              市集材質包能為所有方塊賦予全新視覺！點擊「立即套用」即可在當前世界中立即換上復古 8-Bit 像素或高彩以太光澤，無需重啟！
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEXTURE_PACKS.map((pack) => {
                const isActive = activeTexturePackId === pack.id;

                return (
                  <div
                    key={pack.id}
                    className={`flex flex-col justify-between p-5 rounded-xl border-2 transition-all shadow-lg ${
                      isActive
                        ? 'border-sky-400 bg-sky-950/50 shadow-sky-500/10'
                        : 'border-stone-700 bg-stone-900/90 hover:border-stone-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{pack.icon}</span>
                          <div>
                            <h3 className="text-base font-black text-white">{pack.name}</h3>
                            <span className="text-[10px] text-stone-400 font-bold">作者：{pack.creator}</span>
                          </div>
                        </div>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-400 text-stone-950">
                            正在使用中
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-300 mt-3 leading-relaxed">
                        {pack.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-stone-800 flex justify-end">
                      <button
                        onClick={() => {
                          if (onApplyTexturePack) {
                            onApplyTexturePack(pack.id);
                            soundManager.playButtonClick();
                            setPurchaseSuccessMessage(`🎨 已成功切換為【${pack.name}】！`);
                            setTimeout(() => setPurchaseSuccessMessage(null), 3000);
                          }
                        }}
                        disabled={isActive}
                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                          isActive
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            : 'bg-sky-500 hover:bg-sky-400 text-stone-950 font-black active:scale-95'
                        }`}
                      >
                        {isActive ? '目前套用中' : '套用此材質包'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: DELUXE SKINS WARDROBE (Skins)                           */}
        {/* ============================================================== */}
        {activeTab === 'deluxe_skins' && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#181818]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {CHARACTER_SKINS.map((skin) => {
                const isOwned = unlockedSkins.includes(skin.id) || !skin.isDeluxe;
                const isCurrent = activeSkinId === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`flex flex-col justify-between p-4 rounded-xl border-2 transition-all bg-stone-900/90 ${
                      isCurrent
                        ? 'border-purple-400 shadow-purple-500/10'
                        : 'border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">{skin.name}</h3>
                        {skin.badge && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {skin.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                        {skin.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        {skin.isDeluxe ? '1000 Minecoins' : '經典造型 (免費)'}
                      </span>
                      <button
                        onClick={() => {
                          if (isOwned) {
                            if (onSelectSkin) onSelectSkin(skin.id);
                            soundManager.playButtonClick();
                          } else {
                            if (points < 1000) {
                              alert(`Minecoins 餘額不足！購買【${skin.name}】需要 1000 點。請先至儲值分頁儲值！`);
                              setActiveTab('buy_points');
                              return;
                            }
                            spendPoints(1000, `skin_${skin.id}`);
                            unlockSkin(skin.id);
                            setPoints(getActivePoints());
                            setUnlockedSkins(getUnlockedSkins());
                            if (onSelectSkin) onSelectSkin(skin.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow ${
                          isCurrent
                            ? 'bg-purple-600 text-white cursor-default'
                            : isOwned
                            ? 'bg-stone-700 hover:bg-stone-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-black font-black'
                        }`}
                      >
                        {isCurrent ? '目前裝備' : isOwned ? '換穿造型' : '1000點 解鎖'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: BUY MINECOINS (NT$ 100 ~ 400 for 100 ~ 10,000 points)    */}
        {/* ============================================================== */}
        {activeTab === 'buy_points' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#181818]">
            <div className="text-center max-w-lg mx-auto">
              <h3 className="text-lg font-black text-amber-300">
                🪙 Minecoins 儲值專區
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                嚴格支援 100 ～ 10,000 點，價格 NT$ 100 ～ NT$ 400。購買後立即到帳，跨世界通用！
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {POINT_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`relative flex flex-col justify-between p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    tier.isPopular
                      ? 'border-amber-400 bg-amber-950/40 shadow-xl'
                      : 'border-stone-700 bg-stone-900/90 hover:border-stone-500'
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black shadow">
                      {tier.badge}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-white">{tier.label}</h4>
                    <div className="flex items-baseline gap-1 mt-2 text-2xl font-black text-amber-400">
                      <span>{tier.points.toLocaleString()}</span>
                      <span className="text-xs font-bold text-amber-200">Minecoins</span>
                    </div>
                    {tier.bonus > 0 && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-emerald-400">
                        + 額外贈送 {tier.bonus.toLocaleString()} 點！
                      </span>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between">
                    <span className="text-base font-black text-white">NT$ {tier.priceNT}</span>
                    <button className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs">
                      前往結帳
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: VIP CLUB (NT$ 10/month)                                  */}
        {/* ============================================================== */}
        {activeTab === 'vip' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#181818] max-w-2xl mx-auto">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/80 via-purple-950/60 to-stone-900 border-2 border-amber-400 shadow-2xl text-center">
              <Crown className="w-12 h-12 mx-auto text-amber-400 mb-2 fill-amber-400/20" />
              <h3 className="text-xl font-black text-amber-300">創世 VIP 尊榮會員</h3>
              <p className="text-xs text-stone-300 mt-1">每月只要 NT$ 10 • 享受全方位遊戲頂級特權</p>

              <div className="grid grid-cols-2 gap-3 text-left my-5 p-4 rounded-xl bg-black/40 border border-amber-400/30 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>解鎖「萬界融合神域」超大地貌</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>全新世界動態系統 (樹葉微風擺動)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>每月贈送 500 點 Minecoins</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>多人伺服器專屬金冠尊榮名稱</span>
                </div>
              </div>

              <button
                onClick={handleSubscribeVipInMarket}
                disabled={isVipProcessing || vipInfo.isActive}
                className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wider shadow-xl transition-all ${
                  vipInfo.isActive
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black active:scale-95'
                }`}
              >
                {vipInfo.isActive
                  ? '👑 您已是尊貴的創世 VIP 會員'
                  : isVipProcessing
                  ? '正在處理中...'
                  : '立即開通 VIP (每月只要 NT$ 10)'}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ITEM DETAIL MODAL (Inspect world, skin, texture details)        */}
        {/* ============================================================== */}
        {detailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-2xl bg-stone-900 border-2 border-amber-400 shadow-2xl p-6 text-white space-y-4">
              <button
                onClick={() => setDetailItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="h-48 w-full rounded-xl overflow-hidden bg-stone-800 border border-stone-700">
                <img
                  src={detailItem.thumbnail}
                  alt={detailItem.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white">{detailItem.title}</h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400" />
                    <span>{detailItem.rating}</span>
                  </div>
                </div>
                <span className="text-xs text-stone-400">創作者：{detailItem.creator} • {detailItem.downloadCount} 次下載</span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                {detailItem.description}
              </p>

              {detailItem.features && (
                <div className="p-3 rounded-lg bg-stone-800 text-xs space-y-1">
                  <span className="font-bold text-amber-300">特色內容：</span>
                  {detailItem.features.map((f, i) => (
                    <div key={i} className="text-stone-300 flex items-center gap-1.5">
                      <span className="text-emerald-400">✔</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                <div className="text-sm font-black text-amber-300">
                  {detailItem.isFree ? '完全免費' : `${detailItem.priceMinecoins} Minecoins`}
                </div>
                <button
                  onClick={() => {
                    handleItemAction(detailItem);
                    setDetailItem(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs tracking-wider shadow-lg active:scale-95"
                >
                  {unlockedItems.includes(detailItem.id) || detailItem.isFree
                    ? detailItem.category === 'worlds'
                      ? '立即生成並進入世界 🚀'
                      : detailItem.category === 'textures'
                      ? '立即套用此材質包 🎨'
                      : '立即裝備此造型 ✨'
                    : '確認兌換'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* POINTS CHECKOUT MODAL                                           */}
        {/* ============================================================== */}
        {selectedTier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-md rounded-2xl bg-stone-900 border-2 border-amber-400 shadow-2xl p-6 text-white space-y-4">
              <button
                onClick={() => setSelectedTier(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-black text-white">確認儲值 Minecoins</h3>

              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-400/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400">{selectedTier.label}</span>
                  <div className="text-xl font-black text-amber-300">{selectedTier.points.toLocaleString()} 點</div>
                </div>
                <div className="text-lg font-black text-white">NT$ {selectedTier.priceNT}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-2">選擇支付方式：</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['gpay', 'linepay', 'credit', 'telecom'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m as any)}
                      className={`p-2.5 rounded-lg border font-bold text-center transition-all ${
                        paymentMethod === m
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-stone-700 bg-stone-800 text-stone-400'
                      }`}
                    >
                      {m === 'gpay' ? 'Google Pay' : m === 'linepay' ? 'LINE Pay' : m === 'credit' ? '信用卡' : '電信帳單代收'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950 font-black text-sm hover:from-amber-300 hover:to-amber-500 transition-all shadow-lg active:scale-98"
              >
                {isProcessing ? '正在處理安全交易...' : `確認支付 NT$ ${selectedTier.priceNT}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
