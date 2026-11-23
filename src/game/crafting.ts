import { Recipe, InventoryItem } from '../types';

export const RECIPES: Recipe[] = [
  // ==========================================
  // 基礎材料 (Materials)
  // ==========================================
  {
    id: 'craft_planks',
    name: '橡木木板 (x4)',
    category: 'materials',
    description: '基礎建材，可用於製作工具與各類建築。',
    pattern: ['W'],
    key: { W: 'wood' },
    ingredients: [{ id: 'wood', count: 1 }],
    result: { id: 'planks', count: 4 }
  },
  {
    id: 'craft_sticks',
    name: '木棍 (x4)',
    category: 'materials',
    description: '製作各類工具與火把的握柄。',
    pattern: ['P', 'P'],
    key: { P: 'planks' },
    ingredients: [{ id: 'planks', count: 2 }],
    result: { id: 'stick', count: 4 }
  },
  {
    id: 'craft_crafting_table',
    name: '工作台',
    category: 'blocks',
    description: '核心 3×3 合成工作台，放置於地面後右鍵即可開啟高級合成介面！',
    pattern: ['PP', 'PP'],
    key: { P: 'planks' },
    ingredients: [{ id: 'planks', count: 4 }],
    result: { id: 'crafting_table', count: 1 }
  },
  {
    id: 'craft_furnace',
    name: '石質熔爐',
    category: 'blocks',
    description: '以鵝卵石砌成的耐火熔爐，適合基地佈置與工坊裝飾。',
    pattern: ['CCC', 'C C', 'CCC'],
    key: { C: 'cobblestone' },
    requiresTable: true,
    ingredients: [{ id: 'cobblestone', count: 8 }],
    result: { id: 'furnace', count: 1 }
  },

  // ==========================================
  // 工具與高級武器 (Tools & Advanced Gear)
  // ==========================================
  {
    id: 'craft_wood_pickaxe',
    name: '木鎬',
    category: 'tools',
    description: '挖掘石頭與煤炭礦石的基礎工具。',
    pattern: ['PPP', ' S ', ' S '],
    key: { P: 'planks', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'planks', count: 3 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'wood_pickaxe', count: 1 }
  },
  {
    id: 'craft_wood_axe',
    name: '木斧',
    category: 'tools',
    description: '加速砍伐樹木與木質方塊。',
    pattern: ['PP', 'PS', ' S'],
    key: { P: 'planks', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'planks', count: 3 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'wood_axe', count: 1 }
  },
  {
    id: 'craft_wood_shovel',
    name: '木鏟',
    category: 'tools',
    description: '快速挖掘泥土、沙子、雪塊與沼澤泥巴。',
    pattern: ['P', 'S', 'S'],
    key: { P: 'planks', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'planks', count: 1 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'wood_shovel', count: 1 }
  },
  {
    id: 'craft_wood_sword',
    name: '木劍',
    category: 'tools',
    description: '對抗夜間骷髏與野獸的防身武器 (傷害: 4)。',
    pattern: ['P', 'P', 'S'],
    key: { P: 'planks', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'planks', count: 2 },
      { id: 'stick', count: 1 }
    ],
    result: { id: 'wood_sword', count: 1 }
  },
  {
    id: 'craft_stone_pickaxe',
    name: '石鎬',
    category: 'tools',
    description: '更堅硬耐用的鎬，能高效採集鐵礦石與岩石。',
    pattern: ['CCC', ' S ', ' S '],
    key: { C: 'cobblestone', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'cobblestone', count: 3 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'stone_pickaxe', count: 1 }
  },
  {
    id: 'craft_stone_axe',
    name: '石斧',
    category: 'tools',
    description: '鋒利的石製斧頭，砍樹速度大幅提升。',
    pattern: ['CC', 'CS', ' S'],
    key: { C: 'cobblestone', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'cobblestone', count: 3 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'stone_axe', count: 1 }
  },
  {
    id: 'craft_stone_shovel',
    name: '石鏟',
    category: 'tools',
    description: '耐用的石製工兵鏟，迅速整地開墾。',
    pattern: ['C', 'S', 'S'],
    key: { C: 'cobblestone', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'cobblestone', count: 1 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'stone_shovel', count: 1 }
  },
  {
    id: 'craft_stone_sword',
    name: '石劍',
    category: 'tools',
    description: '強力的石製長劍，有效擊退追擊的怪物 (傷害: 6)。',
    pattern: ['C', 'C', 'S'],
    key: { C: 'cobblestone', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'cobblestone', count: 2 },
      { id: 'stick', count: 1 }
    ],
    result: { id: 'stone_sword', count: 1 }
  },
  {
    id: 'craft_iron_pickaxe',
    name: '精煉鐵鎬',
    category: 'tools',
    description: '堅硬的鐵鎬，可挖掘鑽石礦石、紅石礦石與綠寶石塊。',
    pattern: ['III', ' S ', ' S '],
    key: { I: 'iron_ore', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'iron_ore', count: 3 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'iron_pickaxe', count: 1 }
  },
  {
    id: 'craft_iron_axe',
    name: '精煉鐵斧',
    category: 'tools',
    description: '高強度鐵製戰斧，極速劈砍木頭與書架 (傷害: 7)。',
    pattern: ['II', 'IS', ' S'],
    key: { I: 'iron_ore', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'iron_ore', count: 3 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'iron_axe', count: 1 }
  },
  {
    id: 'craft_iron_shovel',
    name: '精煉鐵鏟',
    category: 'tools',
    description: '高效率開鑿砂岩、泥巴與沙地的高級工具。',
    pattern: ['I', 'S', 'S'],
    key: { I: 'iron_ore', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'iron_ore', count: 1 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'iron_shovel', count: 1 }
  },
  {
    id: 'craft_iron_sword',
    name: '鐵劍',
    category: 'tools',
    description: '精製鐵劍，一擊重創敵人 (傷害: 9)。',
    pattern: ['I', 'I', 'S'],
    key: { I: 'iron_ore', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'iron_ore', count: 2 },
      { id: 'stick', count: 1 }
    ],
    result: { id: 'iron_sword', count: 1 }
  },
  {
    id: 'craft_diamond_pickaxe',
    name: '鑽石鎬',
    category: 'tools',
    description: '傳奇挖掘工具！具備高採掘速度，能開採堅硬的黑曜石。',
    pattern: ['DDD', ' S ', ' S '],
    key: { D: 'diamond', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'diamond', count: 3 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'diamond_pickaxe', count: 1 }
  },
  {
    id: 'craft_diamond_axe',
    name: '鑽石斧',
    category: 'tools',
    description: '極致鋒利的鑽石巨斧，光速伐木或劈擊敵人 (傷害: 10)。',
    pattern: ['DD', 'DS', ' S'],
    key: { D: 'diamond', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'diamond', count: 3 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'diamond_axe', count: 1 }
  },
  {
    id: 'craft_diamond_shovel',
    name: '鑽石鏟',
    category: 'tools',
    description: '瞬間挖穿泥土、雪地與砂礫的頂級工兵鏟。',
    pattern: ['D', 'S', 'S'],
    key: { D: 'diamond', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'diamond', count: 1 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'diamond_shovel', count: 1 }
  },
  {
    id: 'craft_diamond_sword',
    name: '鑽石長劍',
    category: 'tools',
    description: '以璀璨翡翠寶石鍛造的高階利刃 (傷害: 12)。',
    pattern: ['E', 'E', 'S'],
    key: { E: 'emerald', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'emerald', count: 2 },
      { id: 'stick', count: 1 }
    ],
    result: { id: 'diamond_sword', count: 1 }
  },
  {
    id: 'craft_obsidian_pickaxe',
    name: '黑曜石神鎬',
    category: 'tools',
    description: '融合黑曜石與鑽石鍛造的終極神鎬，採礦速度提升至 12 倍！',
    pattern: ['ODO', ' S ', ' S '],
    key: { O: 'obsidian', D: 'diamond', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'obsidian', count: 2 },
      { id: 'diamond', count: 1 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'obsidian_pickaxe', count: 1 }
  },
  {
    id: 'craft_obsidian_axe',
    name: '黑曜石戰斧',
    category: 'tools',
    description: '蘊含紫晶能量的重型神斧，斬木如泥並具高爆發傷害 (傷害: 12)。',
    pattern: ['OD', 'OS', ' S'],
    key: { O: 'obsidian', D: 'diamond', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'obsidian', count: 2 },
      { id: 'diamond', count: 1 },
      { id: 'stick', count: 2 }
    ],
    result: { id: 'obsidian_axe', count: 1 }
  },
  {
    id: 'craft_obsidian_sword',
    name: '黑曜石魔劍',
    category: 'tools',
    description: '終極紫晶鍛造神劍，對抗天界熾天使與終界使者的最強武器 (傷害: 16)！',
    pattern: ['O', 'D', 'S'],
    key: { O: 'obsidian', D: 'diamond', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'obsidian', count: 1 },
      { id: 'diamond', count: 1 },
      { id: 'stick', count: 1 }
    ],
    result: { id: 'obsidian_sword', count: 1 }
  },
  {
    id: 'craft_bow',
    name: '探險長弓',
    category: 'tools',
    description: '遠距離精準射擊武器，對抗怪物安全又致命。',
    pattern: [' SW', 'S W', ' SW'],
    key: { S: 'stick', W: 'wheat' },
    requiresTable: true,
    ingredients: [
      { id: 'stick', count: 3 },
      { id: 'wheat', count: 3 }
    ],
    result: { id: 'bow', count: 1 }
  },

  // ==========================================
  // 裝飾方塊 (Decorative Blocks)
  // ==========================================
  {
    id: 'craft_stone_bricks',
    name: '裝飾石磚 (x4)',
    category: 'decor',
    description: '精密雕琢的灰色石磚，適合打造城堡、神殿與石造莊園。',
    pattern: ['CC', 'CC'],
    key: { C: 'cobblestone' },
    ingredients: [{ id: 'cobblestone', count: 4 }],
    result: { id: 'stone_bricks', count: 4 }
  },
  {
    id: 'craft_chiseled_stone',
    name: '浮雕石磚 (x2)',
    category: 'decor',
    description: '雕刻精美同心紋理的遺跡浮雕石磚，用於柱頭與祭壇裝飾。',
    pattern: ['B', 'C'],
    key: { B: 'stone_bricks', C: 'cobblestone' },
    ingredients: [
      { id: 'stone_bricks', count: 1 },
      { id: 'cobblestone', count: 1 }
    ],
    result: { id: 'chiseled_stone', count: 2 }
  },
  {
    id: 'craft_lantern',
    name: '照明燈籠 (x2)',
    category: 'decor',
    description: '精緻鐵框包覆暖光玻璃的懸掛式裝飾燈籠，建築照明首選！',
    pattern: [' I ', 'ITI', ' I '],
    key: { I: 'iron_ore', T: 'torch' },
    requiresTable: true,
    ingredients: [
      { id: 'iron_ore', count: 4 },
      { id: 'torch', count: 1 }
    ],
    result: { id: 'lantern', count: 2 }
  },
  {
    id: 'craft_quartz_block',
    name: '平滑石英塊 (x4)',
    category: 'decor',
    description: '純白細膩的建築大理石石英磚，現代別墅與神聖殿堂必備建材。',
    pattern: ['SS', 'SD'],
    key: { S: 'sand', D: 'diamond' },
    ingredients: [
      { id: 'sand', count: 3 },
      { id: 'diamond', count: 1 }
    ],
    result: { id: 'quartz_block', count: 4 }
  },
  {
    id: 'craft_terracotta',
    name: '紅陶磚瓦 (x4)',
    category: 'decor',
    description: '窯燒赤陶釉面裝飾磚，呈現溫暖典雅的地中海建築質感。',
    pattern: ['MB', 'BM'],
    key: { M: 'mud', B: 'brick' },
    ingredients: [
      { id: 'mud', count: 2 },
      { id: 'brick', count: 2 }
    ],
    result: { id: 'terracotta', count: 4 }
  },
  {
    id: 'craft_oak_pillar',
    name: '雕紋木柱 (x4)',
    category: 'decor',
    description: '帶有金邊裝飾條紋與直槽木紋的古典建築立柱。',
    pattern: ['W', 'P', 'W'],
    key: { W: 'wood', P: 'planks' },
    requiresTable: true,
    ingredients: [
      { id: 'wood', count: 2 },
      { id: 'planks', count: 1 }
    ],
    result: { id: 'oak_pillar', count: 4 }
  },
  {
    id: 'craft_tinted_glass',
    name: '彩繪玻璃 (x4)',
    category: 'decor',
    description: '鑲嵌金邊與翡翠菱格花紋的半透明彩繪玻璃窗（拆下可完整回收）。',
    pattern: [' G ', 'GEG', ' G '],
    key: { G: 'glass', E: 'emerald' },
    requiresTable: true,
    ingredients: [
      { id: 'glass', count: 4 },
      { id: 'emerald', count: 1 }
    ],
    result: { id: 'tinted_glass', count: 4 }
  },
  {
    id: 'craft_bookshelf',
    name: '書架方塊',
    category: 'decor',
    description: '裝飾典雅的學者書架，散發濃厚的智慧氣息。',
    pattern: ['PPP', 'WWW', 'PPP'],
    key: { P: 'planks', W: 'wheat' },
    requiresTable: true,
    ingredients: [
      { id: 'planks', count: 6 },
      { id: 'wheat', count: 3 }
    ],
    result: { id: 'bookshelf', count: 1 }
  },
  {
    id: 'craft_glowstone',
    name: '螢光石 (x2)',
    category: 'decor',
    description: '高亮度發光晶體裝飾方塊，打造夢幻燈光天花板與水下照明。',
    pattern: ['GR', 'RT'],
    key: { G: 'glass', R: 'redstone', T: 'torch' },
    ingredients: [
      { id: 'glass', count: 1 },
      { id: 'redstone', count: 2 },
      { id: 'torch', count: 1 }
    ],
    result: { id: 'glowstone', count: 2 }
  },
  {
    id: 'craft_diamond_block',
    name: '鑽石塊',
    category: 'decor',
    description: '純粹由 9 顆璀璨鑽石凝聚壓縮的奢華紀念方塊。',
    pattern: ['DDD', 'DDD', 'DDD'],
    key: { D: 'diamond' },
    requiresTable: true,
    ingredients: [{ id: 'diamond', count: 9 }],
    result: { id: 'diamond_block', count: 1 }
  },
  {
    id: 'craft_emerald_block',
    name: '綠寶石方塊',
    category: 'decor',
    description: '以 9 顆閃耀綠寶石壓鑄的寶庫裝飾方塊。',
    pattern: ['EEE', 'EEE', 'EEE'],
    key: { E: 'emerald' },
    requiresTable: true,
    ingredients: [{ id: 'emerald', count: 9 }],
    result: { id: 'emerald_block', count: 1 }
  },
  {
    id: 'craft_redstone_block',
    name: '紅石塊',
    category: 'decor',
    description: '充沛蘊藏能量的紅石方塊，持續散發深邃紅芒。',
    pattern: ['RRR', 'RRR', 'RRR'],
    key: { R: 'redstone' },
    requiresTable: true,
    ingredients: [{ id: 'redstone', count: 9 }],
    result: { id: 'redstone_block', count: 1 }
  },

  // ==========================================
  // 建築方塊 (Building Blocks)
  // ==========================================
  {
    id: 'craft_brick',
    name: '紅磚方塊 (x4)',
    category: 'blocks',
    description: '堅固優雅的房屋建築材料，防禦風雨。',
    pattern: ['DS', 'SD'],
    key: { D: 'dirt', S: 'sand' },
    ingredients: [
      { id: 'dirt', count: 2 },
      { id: 'sand', count: 2 }
    ],
    result: { id: 'brick', count: 4 }
  },
  {
    id: 'craft_glass',
    name: '玻璃方塊 (x2)',
    category: 'blocks',
    description: '透明採光建材，適合製作房屋窗戶與溫室。',
    pattern: ['SS', 'C '],
    key: { S: 'sand', C: 'coal_ore' },
    ingredients: [
      { id: 'sand', count: 2 },
      { id: 'coal_ore', count: 1 }
    ],
    result: { id: 'glass', count: 2 }
  },
  {
    id: 'craft_hay_block',
    name: '乾草捆 (x1)',
    category: 'blocks',
    description: '打包小麥儲存的農家乾草捆，村莊重要物資。',
    pattern: ['WWW', 'WWW', 'WWW'],
    key: { W: 'wheat' },
    requiresTable: true,
    ingredients: [{ id: 'wheat', count: 9 }],
    result: { id: 'hay_block', count: 1 }
  },
  {
    id: 'unpack_hay_block',
    name: '拆解乾草捆 (小麥 x9)',
    category: 'materials',
    description: '將乾草捆還原為 9 捆新鮮小麥。',
    pattern: ['H'],
    key: { H: 'hay_block' },
    ingredients: [{ id: 'hay_block', count: 1 }],
    result: { id: 'wheat', count: 9 }
  },

  // ==========================================
  // 生存道具與生怪蛋 (Survival & Spawn Eggs)
  // ==========================================
  {
    id: 'craft_torch',
    name: '火把 (x4)',
    category: 'survival',
    description: '照亮周圍黑暗，防止夜間怪物在附近生成。',
    pattern: ['C', 'S'],
    key: { C: 'coal_ore', S: 'stick' },
    ingredients: [
      { id: 'coal_ore', count: 1 },
      { id: 'stick', count: 1 }
    ],
    result: { id: 'torch', count: 4 }
  },
  {
    id: 'craft_arrow',
    name: '羽箭 (x4)',
    category: 'survival',
    description: '長弓專用箭矢，射程遠且具擊退穿透力。',
    pattern: ['C', 'S', 'S'],
    key: { C: 'coal_ore', S: 'stick' },
    requiresTable: true,
    ingredients: [
      { id: 'stick', count: 2 },
      { id: 'coal_ore', count: 1 }
    ],
    result: { id: 'arrow', count: 4 }
  },
  {
    id: 'craft_tnt',
    name: 'TNT 炸藥 (x2)',
    category: 'survival',
    description: '高爆炸性方塊！適合大範圍開山破石採礦。',
    pattern: ['CSC', 'SCS', 'CSC'],
    key: { S: 'sand', C: 'coal_ore' },
    requiresTable: true,
    ingredients: [
      { id: 'sand', count: 4 },
      { id: 'coal_ore', count: 4 }
    ],
    result: { id: 'tnt', count: 2 }
  },
  {
    id: 'craft_apple_snack',
    name: '採集野果乾糧',
    category: 'survival',
    description: '食用可恢復 4 點生命值與 5 點飽食度。',
    pattern: ['LL', 'LL'],
    key: { L: 'leaves' },
    ingredients: [{ id: 'leaves', count: 4 }],
    result: { id: 'apple', count: 1 }
  },
  {
    id: 'craft_bread',
    name: '手工烘焙麵包 (x1)',
    category: 'survival',
    description: '利用收割的小麥烘焙香噴噴的麵包，恢復 6 點飽食度與 5 點生命。',
    pattern: ['WWW'],
    key: { W: 'wheat' },
    requiresTable: true,
    ingredients: [{ id: 'wheat', count: 3 }],
    result: { id: 'bread', count: 1 }
  },
  {
    id: 'craft_golden_apple',
    name: '神聖金蘋果',
    category: 'survival',
    description: '包裹金屬聖光的奇蹟蘋果，食用立即補滿全部生命值與飽食度！',
    pattern: ['III', 'IAI', 'III'],
    key: { I: 'iron_ore', A: 'apple' },
    requiresTable: true,
    ingredients: [
      { id: 'apple', count: 1 },
      { id: 'iron_ore', count: 8 }
    ],
    result: { id: 'golden_apple', count: 1 }
  },
  {
    id: 'craft_spawn_egg_pig',
    name: '豬生怪蛋',
    category: 'survival',
    description: '召喚一隻可愛的小豬，右鍵點擊地面使用。',
    ingredients: [
      { id: 'wheat', count: 4 },
      { id: 'apple', count: 2 }
    ],
    result: { id: 'spawn_egg_pig', count: 1 }
  },
  {
    id: 'craft_spawn_egg_sheep',
    name: '綿羊生怪蛋',
    category: 'survival',
    description: '召喚一隻蓬鬆綿羊，右鍵點擊地面使用。',
    ingredients: [
      { id: 'wheat', count: 6 },
      { id: 'bone', count: 1 }
    ],
    result: { id: 'spawn_egg_sheep', count: 1 }
  },
  {
    id: 'craft_spawn_egg_wolf',
    name: '狼生怪蛋',
    category: 'survival',
    description: '召喚一隻森林狼，右鍵點擊地面使用。',
    ingredients: [
      { id: 'bone', count: 4 },
      { id: 'porkchop', count: 1 }
    ],
    result: { id: 'spawn_egg_wolf', count: 1 }
  },
  {
    id: 'craft_spawn_egg_iron_golem',
    name: '鐵魔像生怪蛋',
    category: 'survival',
    description: '召喚強大的鐵魔像守護者，會自動擊退周圍怪物！',
    ingredients: [
      { id: 'iron_ore', count: 6 },
      { id: 'redstone', count: 1 }
    ],
    result: { id: 'spawn_egg_iron_golem', count: 1 }
  }
];

export const ITEM_DEFINITIONS: Record<string, Omit<InventoryItem, 'count'>> = {
  dirt: { id: 'dirt', name: '泥土', maxStack: 64, type: 'block', blockType: 'dirt', iconColor: '#866043', iconSymbol: '⬛' },
  grass: { id: 'grass', name: '草方塊', maxStack: 64, type: 'block', blockType: 'grass', iconColor: '#5b8f32', iconSymbol: '🟩' },
  stone: { id: 'stone', name: '石頭', maxStack: 64, type: 'block', blockType: 'stone', iconColor: '#7c7c7c', iconSymbol: '⬜' },
  cobblestone: { id: 'cobblestone', name: '鵝卵石', maxStack: 64, type: 'block', blockType: 'cobblestone', iconColor: '#656565', iconSymbol: '🪨' },
  wood: { id: 'wood', name: '原木', maxStack: 64, type: 'block', blockType: 'wood', iconColor: '#675231', iconSymbol: '🪵' },
  planks: { id: 'planks', name: '木板', maxStack: 64, type: 'block', blockType: 'planks', iconColor: '#b8945f', iconSymbol: '📦' },
  leaves: { id: 'leaves', name: '樹葉', maxStack: 64, type: 'block', blockType: 'leaves', iconColor: '#38761d', iconSymbol: '🍃' },
  sand: { id: 'sand', name: '沙子', maxStack: 64, type: 'block', blockType: 'sand', iconColor: '#dfd59e', iconSymbol: '⏳' },
  coal_ore: { id: 'coal_ore', name: '煤炭', maxStack: 64, type: 'material', blockType: 'coal_ore', iconColor: '#2b2b2b', iconSymbol: '⚫' },
  iron_ore: { id: 'iron_ore', name: '鐵礦石', maxStack: 64, type: 'material', blockType: 'iron_ore', iconColor: '#d8af93', iconSymbol: '⚙️' },
  diamond_ore: { id: 'diamond_ore', name: '鑽石礦石', maxStack: 64, type: 'block', blockType: 'diamond_ore', iconColor: '#00e5ff', iconSymbol: '💎' },
  diamond_block: { id: 'diamond_block', name: '鑽石塊', maxStack: 64, type: 'block', blockType: 'diamond_block', iconColor: '#00e5ff', iconSymbol: '🔷' },
  redstone_ore: { id: 'redstone_ore', name: '紅石礦石', maxStack: 64, type: 'block', blockType: 'redstone_ore', iconColor: '#d50000', iconSymbol: '🔴' },
  redstone_block: { id: 'redstone_block', name: '紅石塊', maxStack: 64, type: 'block', blockType: 'redstone_block', iconColor: '#ff1744', iconSymbol: '🟥' },
  obsidian: { id: 'obsidian', name: '黑曜石', maxStack: 64, type: 'block', blockType: 'obsidian', iconColor: '#1e1430', iconSymbol: '🟣' },
  tnt: { id: 'tnt', name: 'TNT 炸藥', maxStack: 64, type: 'block', blockType: 'tnt', iconColor: '#d32f2f', iconSymbol: '🧨' },
  crafting_table: { id: 'crafting_table', name: '工作台', maxStack: 64, type: 'block', blockType: 'crafting_table', iconColor: '#b8864b', iconSymbol: '🛠️' },
  furnace: { id: 'furnace', name: '熔爐', maxStack: 64, type: 'block', blockType: 'furnace', iconColor: '#757575', iconSymbol: '🔥' },
  water: { id: 'water', name: '水方塊', maxStack: 64, type: 'block', blockType: 'water', iconColor: '#2196f3', iconSymbol: '💧' },
  lava: { id: 'lava', name: '岩漿方塊', maxStack: 64, type: 'block', blockType: 'lava', iconColor: '#ff5722', iconSymbol: '🌋' },
  brick: { id: 'brick', name: '紅磚方塊', maxStack: 64, type: 'block', blockType: 'brick', iconColor: '#9c4939', iconSymbol: '🧱' },
  glass: { id: 'glass', name: '玻璃', maxStack: 64, type: 'block', blockType: 'glass', iconColor: '#bce0fd', iconSymbol: '🪟' },
  torch: { id: 'torch', name: '火把', maxStack: 64, type: 'block', blockType: 'torch', iconColor: '#ffaa00', iconSymbol: '🔥' },
  glowstone: { id: 'glowstone', name: '螢石', maxStack: 64, type: 'block', blockType: 'glowstone', iconColor: '#ffd966', iconSymbol: '✨' },
  hay_block: { id: 'hay_block', name: '乾草捆', maxStack: 64, type: 'block', blockType: 'hay_block', iconColor: '#e6c855', iconSymbol: '🌾' },
  bookshelf: { id: 'bookshelf', name: '書架', maxStack: 64, type: 'block', blockType: 'bookshelf', iconColor: '#a6804a', iconSymbol: '📚' },
  farmland: { id: 'farmland', name: '耕地土', maxStack: 64, type: 'block', blockType: 'farmland', iconColor: '#4a2f16', iconSymbol: '🌱' },
  wheat_crop: { id: 'wheat_crop', name: '作物小麥', maxStack: 64, type: 'block', blockType: 'wheat_crop', iconColor: '#fbc02d', iconSymbol: '🌾' },
  aether_grass: { id: 'aether_grass', name: '天堂草方塊', maxStack: 64, type: 'block', blockType: 'aether_grass', iconColor: '#26c6da', iconSymbol: '🪽' },
  aether_dirt: { id: 'aether_dirt', name: '天堂聖土', maxStack: 64, type: 'block', blockType: 'aether_dirt', iconColor: '#5e548e', iconSymbol: '🟣' },
  aether_wood: { id: 'aether_wood', name: '天界金木', maxStack: 64, type: 'block', blockType: 'aether_wood', iconColor: '#b0bec5', iconSymbol: '🪵' },
  golden_leaves: { id: 'golden_leaves', name: '金色聖葉', maxStack: 64, type: 'block', blockType: 'golden_leaves', iconColor: '#ffc107', iconSymbol: '🌟' },
  cloud_block: { id: 'cloud_block', name: '白雲方塊', maxStack: 64, type: 'block', blockType: 'cloud_block', iconColor: '#e3f2fd', iconSymbol: '☁️' },
  emerald_block: { id: 'emerald_block', name: '綠寶石方塊', maxStack: 64, type: 'block', blockType: 'emerald_block', iconColor: '#00c853', iconSymbol: '🟩' },
  stone_bricks: { id: 'stone_bricks', name: '裝飾石磚', maxStack: 64, type: 'block', blockType: 'stone_bricks', iconColor: '#828282', iconSymbol: '🏛️' },
  chiseled_stone: { id: 'chiseled_stone', name: '浮雕石磚', maxStack: 64, type: 'block', blockType: 'chiseled_stone', iconColor: '#909090', iconSymbol: '💠' },
  lantern: { id: 'lantern', name: '照明燈籠', maxStack: 64, type: 'block', blockType: 'lantern', iconColor: '#ffca28', iconSymbol: '🏮' },
  quartz_block: { id: 'quartz_block', name: '平滑石英塊', maxStack: 64, type: 'block', blockType: 'quartz_block', iconColor: '#f4f0e8', iconSymbol: '🤍' },
  terracotta: { id: 'terracotta', name: '紅陶磚瓦', maxStack: 64, type: 'block', blockType: 'terracotta', iconColor: '#9e5138', iconSymbol: '🏺' },
  oak_pillar: { id: 'oak_pillar', name: '雕紋木柱', maxStack: 64, type: 'block', blockType: 'oak_pillar', iconColor: '#9c7846', iconSymbol: '🪵' },
  tinted_glass: { id: 'tinted_glass', name: '彩繪玻璃', maxStack: 64, type: 'block', blockType: 'tinted_glass', iconColor: '#14b8a6', iconSymbol: '💠' },
  stick: { id: 'stick', name: '木棍', maxStack: 64, type: 'material', iconColor: '#7e5835', iconSymbol: '🥢' },
  wheat: { id: 'wheat', name: '農家小麥', maxStack: 64, type: 'material', iconColor: '#fbc02d', iconSymbol: '🌾' },
  bread: { id: 'bread', name: '烘焙麵包', maxStack: 16, type: 'material', iconColor: '#d7a15c', iconSymbol: '🥖' },
  steak: { id: 'steak', name: '熟牛排', maxStack: 16, type: 'material', iconColor: '#8d4925', iconSymbol: '🥩' },
  porkchop: { id: 'porkchop', name: '香烤豬排', maxStack: 16, type: 'material', iconColor: '#e57373', iconSymbol: '🥓' },
  emerald: { id: 'emerald', name: '綠寶石', maxStack: 64, type: 'material', iconColor: '#00e676', iconSymbol: '💎' },
  diamond: { id: 'diamond', name: '鑽石', maxStack: 64, type: 'material', iconColor: '#00e5ff', iconSymbol: '💎' },
  redstone: { id: 'redstone', name: '紅石粉', maxStack: 64, type: 'material', iconColor: '#ff1744', iconSymbol: '🔴' },
  golden_apple: { id: 'golden_apple', name: '神聖金蘋果', maxStack: 16, type: 'material', iconColor: '#ffd700', iconSymbol: '🍏' },
  wood_pickaxe: { id: 'wood_pickaxe', name: '木鎬', maxStack: 1, type: 'tool', toolType: 'pickaxe', toolTier: 'wood', damage: 2, iconColor: '#b8945f', iconSymbol: '⛏️' },
  wood_axe: { id: 'wood_axe', name: '木斧', maxStack: 1, type: 'tool', toolType: 'axe', toolTier: 'wood', damage: 3, iconColor: '#b8945f', iconSymbol: '🪓' },
  wood_shovel: { id: 'wood_shovel', name: '木鏟', maxStack: 1, type: 'tool', toolType: 'shovel', toolTier: 'wood', damage: 2, iconColor: '#b8945f', iconSymbol: '🪏' },
  wood_sword: { id: 'wood_sword', name: '木劍', maxStack: 1, type: 'tool', toolType: 'sword', toolTier: 'wood', damage: 4, iconColor: '#b8945f', iconSymbol: '🗡️' },
  stone_pickaxe: { id: 'stone_pickaxe', name: '石鎬', maxStack: 1, type: 'tool', toolType: 'pickaxe', toolTier: 'stone', damage: 3, iconColor: '#8a8a8a', iconSymbol: '⛏️' },
  stone_axe: { id: 'stone_axe', name: '石斧', maxStack: 1, type: 'tool', toolType: 'axe', toolTier: 'stone', damage: 4, iconColor: '#8a8a8a', iconSymbol: '🪓' },
  stone_shovel: { id: 'stone_shovel', name: '石鏟', maxStack: 1, type: 'tool', toolType: 'shovel', toolTier: 'stone', damage: 3, iconColor: '#8a8a8a', iconSymbol: '🪏' },
  stone_sword: { id: 'stone_sword', name: '石劍', maxStack: 1, type: 'tool', toolType: 'sword', toolTier: 'stone', damage: 6, iconColor: '#8a8a8a', iconSymbol: '🗡️' },
  iron_pickaxe: { id: 'iron_pickaxe', name: '鐵鎬', maxStack: 1, type: 'tool', toolType: 'pickaxe', toolTier: 'iron', damage: 5, iconColor: '#d8af93', iconSymbol: '⛏️' },
  iron_axe: { id: 'iron_axe', name: '鐵斧', maxStack: 1, type: 'tool', toolType: 'axe', toolTier: 'iron', damage: 7, iconColor: '#d8af93', iconSymbol: '🪓' },
  iron_shovel: { id: 'iron_shovel', name: '鐵鏟', maxStack: 1, type: 'tool', toolType: 'shovel', toolTier: 'iron', damage: 4, iconColor: '#d8af93', iconSymbol: '🪏' },
  iron_sword: { id: 'iron_sword', name: '鐵劍', maxStack: 1, type: 'tool', toolType: 'sword', toolTier: 'iron', damage: 9, iconColor: '#e0e0e0', iconSymbol: '⚔️' },
  diamond_sword: { id: 'diamond_sword', name: '鑽石長劍', maxStack: 1, type: 'tool', toolType: 'sword', toolTier: 'diamond', damage: 12, iconColor: '#00e5ff', iconSymbol: '🗡️' },
  diamond_pickaxe: { id: 'diamond_pickaxe', name: '鑽石鎬', maxStack: 1, type: 'tool', toolType: 'pickaxe', toolTier: 'diamond', damage: 8, iconColor: '#00e5ff', iconSymbol: '⛏️' },
  diamond_axe: { id: 'diamond_axe', name: '鑽石斧', maxStack: 1, type: 'tool', toolType: 'axe', toolTier: 'diamond', damage: 10, iconColor: '#00e5ff', iconSymbol: '🪓' },
  diamond_shovel: { id: 'diamond_shovel', name: '鑽石鏟', maxStack: 1, type: 'tool', toolType: 'shovel', toolTier: 'diamond', damage: 6, iconColor: '#00e5ff', iconSymbol: '🪏' },
  obsidian_pickaxe: { id: 'obsidian_pickaxe', name: '黑曜石神鎬', maxStack: 1, type: 'tool', toolType: 'pickaxe', toolTier: 'obsidian', damage: 10, iconColor: '#ab47bc', iconSymbol: '⛏️' },
  obsidian_axe: { id: 'obsidian_axe', name: '黑曜石戰斧', maxStack: 1, type: 'tool', toolType: 'axe', toolTier: 'obsidian', damage: 12, iconColor: '#ab47bc', iconSymbol: '🪓' },
  obsidian_sword: { id: 'obsidian_sword', name: '黑曜石魔劍', maxStack: 1, type: 'tool', toolType: 'sword', toolTier: 'obsidian', damage: 16, iconColor: '#ab47bc', iconSymbol: '⚔️' },
  bow: { id: 'bow', name: '探險長弓', maxStack: 1, type: 'tool', damage: 8, iconColor: '#8d6e63', iconSymbol: '🏹' },
  arrow: { id: 'arrow', name: '羽箭', maxStack: 64, type: 'material', iconColor: '#b0bec5', iconSymbol: '🎯' },
  apple: { id: 'apple', name: '野果糧食', maxStack: 16, type: 'material', iconColor: '#d63031', iconSymbol: '🍎' },
  bone: { id: 'bone', name: '骷髏骨頭', maxStack: 64, type: 'material', iconColor: '#eeeeee', iconSymbol: '🦴' },
  snow_block: { id: 'snow_block', name: '雪方塊', maxStack: 64, type: 'block', blockType: 'snow_block', iconColor: '#ffffff', iconSymbol: '❄️' },
  cactus: { id: 'cactus', name: '仙人掌', maxStack: 64, type: 'block', blockType: 'cactus', iconColor: '#457c26', iconSymbol: '🌵' },
  sandstone: { id: 'sandstone', name: '砂岩', maxStack: 64, type: 'block', blockType: 'sandstone', iconColor: '#dfd6a3', iconSymbol: '🧱' },
  mud: { id: 'mud', name: '泥巴', maxStack: 64, type: 'block', blockType: 'mud', iconColor: '#3e2f20', iconSymbol: '🟤' },
  // Mob Spawn Eggs (生怪蛋)
  spawn_egg_pig: { id: 'spawn_egg_pig', name: '豬生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'pig', iconColor: '#f0a5a2', eggSecondaryColor: '#db635f', iconSymbol: '🐷' },
  spawn_egg_cow: { id: 'spawn_egg_cow', name: '牛生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'cow', iconColor: '#443626', eggSecondaryColor: '#a1a1a1', iconSymbol: '🐮' },
  spawn_egg_sheep: { id: 'spawn_egg_sheep', name: '綿羊生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'sheep', iconColor: '#e7e7e7', eggSecondaryColor: '#ffb5b5', iconSymbol: '🐑' },
  spawn_egg_chicken: { id: 'spawn_egg_chicken', name: '雞生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'chicken', iconColor: '#a1a1a1', eggSecondaryColor: '#ff0000', iconSymbol: '🐔' },
  spawn_egg_rabbit: { id: 'spawn_egg_rabbit', name: '兔子生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'rabbit', iconColor: '#995f40', eggSecondaryColor: '#734831', iconSymbol: '🐰' },
  spawn_egg_wolf: { id: 'spawn_egg_wolf', name: '狼生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'wolf', iconColor: '#d7d3d3', eggSecondaryColor: '#ceaf96', iconSymbol: '🐺' },
  spawn_egg_villager: { id: 'spawn_egg_villager', name: '村民生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'villager', iconColor: '#563c33', eggSecondaryColor: '#bd8b72', iconSymbol: '🧑' },
  spawn_egg_iron_golem: { id: 'spawn_egg_iron_golem', name: '鐵魔像生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'iron_golem', iconColor: '#dbcebe', eggSecondaryColor: '#69945b', iconSymbol: '🗿' },
  spawn_egg_zombie: { id: 'spawn_egg_zombie', name: '殭屍生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'zombie', iconColor: '#00afaf', eggSecondaryColor: '#799c65', iconSymbol: '🧟' },
  spawn_egg_skeleton: { id: 'spawn_egg_skeleton', name: '骷髏生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'skeleton', iconColor: '#c1c1c1', eggSecondaryColor: '#494949', iconSymbol: '💀' },
  spawn_egg_creeper: { id: 'spawn_egg_creeper', name: '苦力怕生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'creeper', iconColor: '#0da70b', eggSecondaryColor: '#000000', iconSymbol: '💣' },
  spawn_egg_spider: { id: 'spawn_egg_spider', name: '蜘蛛生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'spider', iconColor: '#342d27', eggSecondaryColor: '#a80e0e', iconSymbol: '🕷️' },
  spawn_egg_enderman: { id: 'spawn_egg_enderman', name: '終界使者生怪蛋', maxStack: 64, type: 'spawn_egg', spawnMobType: 'enderman', iconColor: '#161616', eggSecondaryColor: '#cc00fa', iconSymbol: '👾' },
  spawn_egg_seraphim: { id: 'spawn_egg_seraphim', name: '熾天使生怪蛋', maxStack: 16, type: 'spawn_egg', spawnMobType: 'seraphim', iconColor: '#ffd700', eggSecondaryColor: '#ff3d00', iconSymbol: '👼' }
};

export function getAvailableCount(itemId: string, inventory: (InventoryItem | null)[]): number {
  let total = 0;
  for (const slot of inventory) {
    if (slot && slot.id === itemId) {
      total += slot.count;
    }
  }
  return total;
}

export function canCraft(recipe: Recipe, inventory: (InventoryItem | null)[]): boolean {
  for (const ing of recipe.ingredients) {
    if (getAvailableCount(ing.id, inventory) < ing.count) {
      return false;
    }
  }
  return true;
}

export function getMaxCraftableFromInventory(recipe: Recipe, inventory: (InventoryItem | null)[]): number {
  let maxCrafts = Infinity;
  for (const ing of recipe.ingredients) {
    const have = getAvailableCount(ing.id, inventory);
    maxCrafts = Math.min(maxCrafts, Math.floor(have / ing.count));
  }
  return maxCrafts === Infinity ? 0 : maxCrafts;
}

export function addItemToInventoryArray(
  inventory: (InventoryItem | null)[],
  itemId: string,
  count: number
): { success: boolean; inventory: (InventoryItem | null)[] } {
  const def = ITEM_DEFINITIONS[itemId];
  if (!def || count <= 0) return { success: false, inventory };

  const newInv = inventory.map((slot) => (slot ? { ...slot } : null));
  let remaining = count;

  // 1. Stack with existing
  for (let i = 0; i < newInv.length; i++) {
    const slot = newInv[i];
    if (slot && slot.id === itemId && slot.count < slot.maxStack) {
      const space = slot.maxStack - slot.count;
      const add = Math.min(space, remaining);
      slot.count += add;
      remaining -= add;
      if (remaining <= 0) break;
    }
  }

  // 2. Fill empty slots (split across multiple stacks if needed)
  while (remaining > 0) {
    const emptyIdx = newInv.findIndex((s) => s === null);
    if (emptyIdx === -1) {
      return { success: false, inventory };
    }
    const put = Math.min(def.maxStack, remaining);
    newInv[emptyIdx] = {
      ...def,
      count: put
    };
    remaining -= put;
  }

  return { success: true, inventory: newInv };
}

export function craftRecipe(
  recipe: Recipe,
  inventory: (InventoryItem | null)[]
): (InventoryItem | null)[] {
  if (!canCraft(recipe, inventory)) return inventory;

  const newInv = inventory.map((slot) => (slot ? { ...slot } : null));

  // Deduct ingredients
  for (const ing of recipe.ingredients) {
    let needed = ing.count;
    for (let i = 0; i < newInv.length; i++) {
      const slot = newInv[i];
      if (slot && slot.id === ing.id) {
        if (slot.count > needed) {
          slot.count -= needed;
          needed = 0;
          break;
        } else {
          needed -= slot.count;
          newInv[i] = null;
          if (needed <= 0) break;
        }
      }
    }
  }

  const added = addItemToInventoryArray(newInv, recipe.result.id, recipe.result.count);
  return added.success ? added.inventory : inventory;
}

// ==========================================
// 3x3 Crafting Grid Pattern Matching Engine
// ==========================================
function trimPattern(pattern: string[]): { rows: string[]; height: number; width: number } {
  let minR = pattern.length;
  let maxR = -1;
  let minC = 99;
  let maxC = -1;

  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] !== ' ') {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }

  if (maxR === -1) return { rows: [], height: 0, width: 0 };

  const rows: string[] = [];
  for (let r = minR; r <= maxR; r++) {
    let rowStr = '';
    for (let c = minC; c <= maxC; c++) {
      rowStr += pattern[r][c] || ' ';
    }
    rows.push(rowStr);
  }
  return { rows, height: maxR - minR + 1, width: maxC - minC + 1 };
}

function matchShapedPattern(
  gridIds: (string | null)[],
  minR: number,
  maxR: number,
  minC: number,
  maxC: number,
  recipe: Recipe
): boolean {
  if (!recipe.pattern || !recipe.key) return false;
  const trimmed = trimPattern(recipe.pattern);
  const gridH = maxR - minR + 1;
  const gridW = maxC - minC + 1;
  if (trimmed.height !== gridH || trimmed.width !== gridW) return false;

  for (let r = 0; r < gridH; r++) {
    for (let c = 0; c < gridW; c++) {
      const symbol = trimmed.rows[r][c];
      const actualId = gridIds[(minR + r) * 3 + (minC + c)];
      if (symbol === ' ') {
        if (actualId !== null) return false;
      } else {
        const expectedId = recipe.key[symbol];
        if (!expectedId || actualId !== expectedId) return false;
      }
    }
  }
  return true;
}

export function matchCraftingGrid(grid: (InventoryItem | null)[]): Recipe | null {
  const gridIds = grid.map((slot) => (slot && slot.count > 0 ? slot.id : null));

  let minR = 3;
  let maxR = -1;
  let minC = 3;
  let maxC = -1;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (gridIds[r * 3 + c] !== null) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }

  if (maxR === -1) return null;

  // 1. Exact shaped pattern match (allows shifting pattern anywhere inside the 3x3 grid)
  for (const recipe of RECIPES) {
    if (recipe.pattern && recipe.key) {
      if (matchShapedPattern(gridIds, minR, maxR, minC, maxC, recipe)) {
        return recipe;
      }
    }
  }

  // 2. Shapeless fallback for recipes without a shaped pattern (e.g. spawn eggs)
  // For shapeless recipes in the 3x3 grid, match summed slot counts >= required ingredients or 1 item per slot
  const slotCounts: Record<string, number> = {};
  let nonEmptyCount = 0;
  for (let i = 0; i < 9; i++) {
    const slot = grid[i];
    if (slot && slot.count > 0) {
      nonEmptyCount++;
      slotCounts[slot.id] = (slotCounts[slot.id] || 0) + slot.count;
    }
  }

  for (const recipe of RECIPES) {
    if (!recipe.pattern) {
      const reqIds = recipe.ingredients.map((i) => i.id);
      const presentIds = Object.keys(slotCounts);
      if (presentIds.length === reqIds.length && nonEmptyCount > 0) {
        const allSatisfied = recipe.ingredients.every((ing) => (slotCounts[ing.id] || 0) >= ing.count);
        if (allSatisfied) {
          return recipe;
        }
      }
    }
  }

  return null;
}

/**
 * Expands a shaped or shapeless Recipe into a 9-slot (3x3) preview array of item IDs.
 */
export function getRecipeGridTemplate(recipe: Recipe): (string | null)[] {
  const slots: (string | null)[] = new Array(9).fill(null);
  if (recipe.pattern && recipe.key) {
    const keyMap = recipe.key;
    for (let r = 0; r < Math.min(3, recipe.pattern.length); r++) {
      const patternRow: string = recipe.pattern[r] || '';
      for (let c = 0; c < Math.min(3, patternRow.length); c++) {
        const ch = patternRow[c];
        if (ch !== ' ' && keyMap[ch]) {
          slots[r * 3 + c] = keyMap[ch];
        }
      }
    }
    return slots;
  }

  // Shapeless: distribute ingredient IDs across first slots
  let idx = 0;
  for (const ing of recipe.ingredients) {
    for (let c = 0; c < ing.count && idx < 9; c++) {
      slots[idx++] = ing.id;
    }
  }
  return slots;
}
