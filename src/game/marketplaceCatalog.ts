import { MarketplaceItem, TexturePackDefinition } from '../types';

export const TEXTURE_PACKS: TexturePackDefinition[] = [
  {
    id: 'classic',
    name: '原版經典 (Classic Default)',
    description: '原汁原味的 盜版Rickie -2015 經典體素像素風格。',
    creator: 'Mojang Studios Style',
    icon: '🟩',
    style: 'classic'
  },
  {
    id: 'retro8bit',
    name: '復古 8-Bit (Retro 8-Bit Arcade)',
    description: '懷舊街機風格，鮮明的對比度與純淨的像素幾何。',
    creator: 'PixelCraft Studio',
    icon: '🕹️',
    style: 'retro8bit'
  },
  {
    id: 'celestial',
    name: '以太仙境光澤 (Celestial Glow HD)',
    description: '專為天堂以太世界設計，發光水晶、閃耀金葉與高彩雲海。',
    creator: 'Aether Team',
    icon: '✨',
    style: 'celestial'
  },
  {
    id: 'gothic',
    name: '暗黑中世紀 (Dark Gothic Medieval)',
    description: '沈穩厚重的黑石、厚重鵝卵石與神秘符文質感。',
    creator: 'Norse Craft Works',
    icon: '🛡️',
    style: 'gothic'
  }
];

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  // ==========================================
  // 1. Worlds & Adventure Maps (世界與冒險地圖)
  // ==========================================
  {
    id: 'world_skyblock',
    title: '🏝️ 空島極限生存 (Skyblock Pro)',
    category: 'worlds',
    priceMinecoins: 0,
    isFree: true,
    creator: 'Skyblock Masters',
    rating: 4.9,
    downloadCount: '3.8M',
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    badge: '限時免費 🔥',
    description: '經典空島開局！你將出生在懸浮於萬米高空的小孤島上，只有一棵橡木、一桶岩漿與一塊冰。運用你的智慧建立刷石機與無限水源，擴張你的空島帝國！',
    features: [
      '經典 L 型浮空初始小島',
      '一桶岩漿 + 冰塊自製無限刷石機',
      '沙島與下界傳送門迷你浮島',
      '無盡虛空掉落挑戰'
    ],
    worldType: 'flat',
    worldSeed: 10101,
    gameMode: 'survival'
  },
  {
    id: 'world_medieval_citadel',
    title: '🏰 中世紀王國城堡 (Medieval Citadel)',
    category: 'worlds',
    priceMinecoins: 350,
    originalPrice: 600,
    creator: 'Crown Stone Studios',
    rating: 4.8,
    downloadCount: '1.2M',
    thumbnail: 'https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=600&auto=format&fit=crop&q=80',
    badge: '熱門精選 ⭐',
    description: '雄偉壯觀的石造巨型要塞王國！包含護城河、皇家演武場、宏偉王座大廳、防禦箭塔與繁榮的村民市集大街。',
    features: [
      '佔地超過 100x100 方塊的巨大石磚城牆',
      '完整村莊商業街與友善村民 NPC',
      '高聳國王觀景天台，俯瞰千里江山',
      '地下金庫藏匿寶箱與防身武器'
    ],
    worldType: 'default',
    worldSeed: 554433,
    gameMode: 'survival'
  },
  {
    id: 'world_modern_mansion',
    title: '🏙️ 現代紅石豪華別墅 (Modern Villa)',
    category: 'worlds',
    priceMinecoins: 450,
    creator: 'Architect Labs',
    rating: 4.9,
    downloadCount: '890k',
    thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80',
    badge: '建築大師 🏆',
    description: '極致現代主義海濱豪宅！落地玻璃大窗、雙層露天泳池、自動感應紅石門與室內奢華裝潢，創造模式享受頂級生活！',
    features: [
      '純白石英與黑曜石現代極簡外觀',
      '室外恆溫無邊際泳池與休閒日光浴躺椅',
      '室內圖書館、視聽影院與私人車庫',
      '直接進入創造模式自由擴建'
    ],
    worldType: 'flat',
    worldSeed: 777123,
    gameMode: 'creative'
  },
  {
    id: 'world_aether_temple',
    title: '☁️ 天堂以太失落神廟 (Aether Temple)',
    category: 'worlds',
    priceMinecoins: 500,
    originalPrice: 800,
    creator: 'Celestial Forge',
    rating: 5.0,
    downloadCount: '1.5M',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    badge: '天神傳奇 👑',
    description: '漂浮在金色雲海最上層的神聖浮島遺址！探索發光的水晶迴廊、天使聖殿與蘊藏神級以太裝備的隱秘祭壇。',
    features: [
      '全浮空神聖群島連鎖跳島地貌',
      '純淨水晶泉眼與發光金色灌木',
      '神廟頂端附贈專屬飛行羽翼',
      '壯麗金色晨曦 360 度無死角視野'
    ],
    worldType: 'heaven',
    worldSeed: 88888,
    gameMode: 'survival'
  },
  {
    id: 'world_parkour_spiral',
    title: '🌀 3D 極限螺旋跑酷塔 (Parkour Spiral)',
    category: 'worlds',
    priceMinecoins: 300,
    creator: 'SpeedJump Studio',
    rating: 4.7,
    downloadCount: '620k',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    badge: '跑酷挑戰 ⚡',
    description: '從地底深處一路跳躍直衝雲霄的旋轉天梯！考驗你的身法極限，每層關卡皆有不同方塊主題與陷阱！',
    features: [
      '高達 100 格的螺旋立體跑酷塔',
      '每 10 層設有存檔復活檢查點',
      '計時器與計分板系統',
      '登頂解鎖榮譽煙火慶祝'
    ],
    worldType: 'flat',
    worldSeed: 909090,
    gameMode: 'survival'
  },

  // ==========================================
  // 2. Skins & Skin Packs (人物造型包)
  // ==========================================
  {
    id: 'skin_celestial_knight',
    title: '🛡️ 創世天神聖騎士 (Celestial Paladin)',
    category: 'skins',
    priceMinecoins: 1000,
    creator: 'Mythic Skins',
    rating: 4.9,
    downloadCount: '950k',
    thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    badge: '官方認證 🌟',
    description: '身披以太白銀神聖鎧甲，背負聖光披風與黃金王冠的天界統治者。',
    features: ['黃金皇冠 3D 配件', '神聖以太披風', '專屬微光粒子', '精細 128x 披風質感'],
    skinId: 'cyber_ninja'
  },
  {
    id: 'skin_cyber_ninja',
    title: '🥷 賽博龐克霓虹忍者 (Cyber Shinobi)',
    category: 'skins',
    priceMinecoins: 1000,
    creator: 'Future Craft',
    rating: 4.8,
    downloadCount: '810k',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    badge: '極致酷炫 🕶️',
    description: '穿梭於未來暗夜的黑科技隱形刺客，配備青色霓虹面罩與機械護肩。',
    features: ['發光青色夜視鏡面罩', '碳纖維戰鬥護肩', '高科技戰術服', '暗影迷彩塗裝'],
    skinId: 'cyber_ninja'
  },
  {
    id: 'skin_hellfire_demon',
    title: '🔥 熾焰地獄龍魔 (Hellfire Dragon Lord)',
    category: 'skins',
    priceMinecoins: 1000,
    creator: 'Inferno Forge',
    rating: 5.0,
    downloadCount: '1.1M',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    badge: '狂暴霸氣 🌋',
    description: '自深淵熔岩中甦醒的霸主，頭生雙角、身披烈焰熔岩戰甲，震撼全場！',
    features: ['惡魔龍角 3D 模型', '熔岩流動胸甲質感', '深紅烈焰披風', '戰士威壓氣場'],
    skinId: 'lava_demon'
  },
  {
    id: 'skin_kawaii_neko',
    title: '🐱 萌系像素小貓女 (Kawaii Neko Adventure)',
    category: 'skins',
    priceMinecoins: 0,
    isFree: true,
    creator: 'Anime Craft',
    rating: 4.9,
    downloadCount: '2.4M',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    badge: '本日免費 🎁',
    description: '超萌日系女高中生冒險家！粉白配色的水手制服與可愛貓耳，萌翻所有冒險家！',
    features: ['超萌貓耳 3D 造型', '櫻花粉色水手冒險服', '專屬粉紅蝴蝶結', '新手登入即送免費外觀'],
    skinId: 'miku'
  },

  // ==========================================
  // 3. Texture Packs (材質包 / 資源包)
  // ==========================================
  {
    id: 'tex_retro_8bit',
    title: '🕹️ 復古 8-Bit 像素街機包 (Retro 8-Bit)',
    category: 'textures',
    priceMinecoins: 400,
    creator: 'PixelCraft Studio',
    rating: 4.8,
    downloadCount: '780k',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    badge: '復古懷舊 👾',
    description: '將全世界方塊化為紅白機時代的點陣像素風格，高對比、鮮明原色，極致復古視覺！',
    features: ['8-Bit 高對比方塊像素', '極速載入、超高 FPS 幀率', '一鍵切換，全地圖即時套用'],
    texturePackId: 'retro8bit'
  },
  {
    id: 'tex_celestial_glow',
    title: '✨ 以太仙境光澤 HD (Celestial Glow HD)',
    category: 'textures',
    priceMinecoins: 550,
    originalPrice: 850,
    creator: 'Aether Team',
    rating: 4.9,
    downloadCount: '1.3M',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    badge: '仙境極致 🌟',
    description: '為鑽石、水晶、發光石與天堂草地注入純淨寶石折射感，夜晚如同星海般璀璨！',
    features: ['水晶寶石折射高彩質感', '草地樹葉微風晨曦光澤', '通透水質與天空天穹優化'],
    texturePackId: 'celestial'
  },
  {
    id: 'tex_dark_gothic',
    title: '🛡️ 暗黑中世紀哥德風 (Dark Gothic)',
    category: 'textures',
    priceMinecoins: 450,
    creator: 'Norse Craft Works',
    rating: 4.7,
    downloadCount: '590k',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    badge: '硬派寫實 ⚔️',
    description: '厚重沈穩的黑曜石紋路、磨損石頭與生鐵鉚釘，營造黑暗史詩的地下城與要塞氛圍。',
    features: ['寫實黑石與鵝卵石青苔紋理', '鍛造鐵器重金屬光澤', '深邃暗夜火把燃燒質感'],
    texturePackId: 'gothic'
  },

  // ==========================================
  // 4. Mash-up Packs (大型混搭整合包)
  // ==========================================
  {
    id: 'mashup_aether_divine',
    title: '🌌 以太天神傳奇混搭包 (Aether Divine Mashup)',
    category: 'mashups',
    priceMinecoins: 850,
    originalPrice: 1500,
    creator: 'Aether Studios & Mojang Fanclub',
    rating: 5.0,
    downloadCount: '2.1M',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    badge: '終極超值混搭 👑',
    description: '全方位旗艦組合包！內含【天堂以太失落神廟】專屬世界 + 【創世天神聖騎士】專屬外觀 + 【以太仙境光澤 HD】專屬材質包，一鍵打包全部擁有！',
    features: [
      '包含專屬天堂浮島神廟冒險地圖',
      '解鎖創世天神金色王冠與披風外觀',
      '全面套用以太仙境高畫質發光材質',
      '額外贈送 300 點市集 Minecoins'
    ],
    worldType: 'heaven',
    worldSeed: 88888,
    skinId: 'cyber_ninja',
    texturePackId: 'celestial'
  },
  {
    id: 'mashup_medieval_empire',
    title: '⚔️ 中世紀王國史詩混搭包 (Medieval Empire Mashup)',
    category: 'mashups',
    priceMinecoins: 750,
    originalPrice: 1300,
    creator: 'Crown Stone Studios',
    rating: 4.8,
    downloadCount: '1.4M',
    thumbnail: 'https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=600&auto=format&fit=crop&q=80',
    badge: '騎士史詩 🏰',
    description: '化身中世紀領主！內含【中世紀王國城堡】大型世界 + 【皇家騎士外觀】 + 【暗黑中世紀哥德材質包】！',
    features: [
      '一鍵生成擁有百名村民的石造巨大城池',
      '解鎖全套騎士盔甲與龍紋披風',
      '全方塊替換為中世紀寫實城堡風格',
      '內建騎士演武場與城下集市'
    ],
    worldType: 'default',
    worldSeed: 554433,
    texturePackId: 'gothic'
  },

  // ==========================================
  // 5. Perks & Boosters (神級道具與特權)
  // ==========================================
  {
    id: 'perk_celestial_pickaxe',
    title: '⛏️ 天堂水晶神鎬 (Celestial Pickaxe)',
    category: 'perks',
    priceMinecoins: 300,
    creator: 'God Tools Lab',
    rating: 4.9,
    downloadCount: '3.1M',
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    badge: '挖礦神器 ⚡',
    description: '注入以太聖光的永不磨損神鎬！挖掘速度倍增，開採石頭如削泥，挖礦探險必備神器。',
    features: ['挖掘速度大幅提升 +200%', '可直接開採黑曜石與鑽石礦', '購買後永久放進背包'],
  },
  {
    id: 'perk_angel_wings',
    title: '🪽 天使以太羽翼 (Angel Wings)',
    category: 'perks',
    priceMinecoins: 800,
    creator: 'Celestial Forge',
    rating: 5.0,
    downloadCount: '2.8M',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    badge: '飛行神技 🕊️',
    description: '突破生存模式限制！在任意生存世界中享有如同創造模式般的無限制天際自由翱翔飛行！',
    features: ['生存模式雙擊空格切換飛行', '高空墜落免摔傷判定', '自由探索空島與高山'],
  },
  {
    id: 'perk_ultimate_vault',
    title: '💎 終極建造資源箱 (Ultimate Vault)',
    category: 'perks',
    priceMinecoins: 600,
    creator: 'Bank of MineClone',
    rating: 4.8,
    downloadCount: '1.9M',
    thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80',
    badge: '資源拉滿 💰',
    description: '滿滿的頂級礦產與建築建材！內含鑽石x64、綠寶石x64、黃金x64、黑曜石x64與發光石x64！',
    features: ['鑽石、黃金、綠寶石各 64 顆', '黑曜石 64 塊可直接組建地獄門', '免去數小時辛苦挖礦時間'],
  }
];
