import { BlockType, InventoryItem } from '../types';

export interface MiningCalculation {
  breakTime: number; // in seconds
  canHarvest: boolean; // whether the block drops item / resource
  dropItemId: string | null;
  dropCount: number;
  harvestNotice?: string;
}

/**
 * Calculates breaking time and harvestability based on Minecraft rules.
 * Hand mining vs Tool mining (pickaxe, axe, shovel, etc.)
 */
export function getBlockDisplayName(blockType: BlockType): string {
  const map: Record<string, string> = {
    grass: '草地方塊',
    dirt: '泥土',
    stone: '石頭',
    cobblestone: '鵝卵石',
    wood: '橡木原木',
    leaves: '樹葉',
    golden_leaves: '黃金樹葉',
    sand: '沙子',
    glass: '玻璃',
    planks: '橡木木板',
    brick: '紅磚塊',
    coal_ore: '煤炭礦石',
    iron_ore: '鐵礦石',
    emerald_block: '綠寶石方塊',
    diamond_ore: '鑽石礦石',
    diamond_block: '鑽石方塊',
    redstone_ore: '紅石礦石',
    redstone_block: '紅石方塊',
    obsidian: '黑曜石',
    tnt: 'TNT 炸藥',
    crafting_table: '工作台',
    furnace: '石質熔爐',
    bedrock: '基岩',
    bookshelf: '書架',
    torch: '火把',
    farmland: '耕地',
    wheat_crop: '小麥農作物',
    hay_block: '乾草捆',
    glowstone: '螢光石',
    cloud_block: '雲朵方塊',
    aether_grass: '天堂草地',
    aether_dirt: '天堂泥土',
    aether_wood: '天堂神木',
    snow_block: '雪方塊',
    cactus: '仙人掌',
    sandstone: '砂岩',
    mud: '泥巴',
    stone_bricks: '裝飾石磚',
    chiseled_stone: '浮雕石磚',
    lantern: '照明燈籠',
    quartz_block: '平滑石英塊',
    terracotta: '紅陶磚瓦',
    oak_pillar: '雕紋木柱',
    tinted_glass: '彩繪玻璃'
  };
  return map[blockType] || '方塊';
}

export function calculateBlockMining(
  blockType: BlockType,
  heldItem: InventoryItem | null,
  gameMode: 'survival' | 'creative'
): MiningCalculation {
  // Creative mode: instant break, no drops
  if (gameMode === 'creative') {
    return {
      breakTime: 0,
      canHarvest: false,
      dropItemId: null,
      dropCount: 0
    };
  }

  const toolType = heldItem?.toolType;
  const toolTier = heldItem?.toolTier || 'wood';
  const toolId = heldItem?.id || '';

  // Multipliers based on tool tier
  const tierSpeedMultiplier =
    toolTier === 'obsidian' || toolId.includes('obsidian')
      ? 12.0
      : toolTier === 'diamond' || toolId.includes('diamond')
      ? 8.0
      : toolTier === 'iron' || toolId.includes('iron')
      ? 6.0
      : toolTier === 'stone' || toolId.includes('stone')
      ? 4.0
      : 2.0;

  switch (blockType) {
    // 1. Instantly/rapidly hand-breakable blocks
    case 'leaves':
    case 'golden_leaves':
      return {
        breakTime: 0.25,
        canHarvest: true,
        dropItemId: Math.random() < 0.2 ? 'apple' : 'leaves',
        dropCount: 1
      };

    case 'wheat_crop':
      return {
        breakTime: 0.1,
        canHarvest: true,
        dropItemId: 'wheat',
        dropCount: Math.floor(Math.random() * 2) + 1
      };

    case 'torch':
      return {
        breakTime: 0.05,
        canHarvest: true,
        dropItemId: 'torch',
        dropCount: 1
      };

    case 'cloud_block':
      return {
        breakTime: 0.35,
        canHarvest: true,
        dropItemId: 'cloud_block',
        dropCount: 1
      };

    // 2. Soft blocks (Dirt, Grass, Sand, Farmland)
    // Hand can mine easily (~0.75s). Shovel speeds it up (~0.15s - 0.35s).
    case 'dirt':
    case 'grass':
    case 'sand':
    case 'farmland':
    case 'aether_dirt':
    case 'aether_grass':
    case 'snow_block':
    case 'cactus':
    case 'sandstone':
    case 'mud': {
      const isShovel = toolType === 'shovel' || toolId.includes('shovel');
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      let breakTime = 0.75;
      if (blockType === 'snow_block') {
        breakTime = isShovel ? 0.1 : 0.35;
      } else if (blockType === 'cactus') {
        breakTime = 0.25;
      } else if (blockType === 'sandstone') {
        breakTime = isPickaxe ? Math.max(0.2, 1.6 / tierSpeedMultiplier) : 2.5;
      } else {
        breakTime = isShovel ? Math.max(0.12, 0.75 / tierSpeedMultiplier) : 0.75;
      }
      let dropId: string = blockType;
      if (blockType === 'grass') dropId = 'dirt';
      if (blockType === 'aether_grass') dropId = 'aether_dirt';
      if (blockType === 'farmland') dropId = 'dirt';

      return {
        breakTime,
        canHarvest: true,
        dropItemId: dropId,
        dropCount: 1
      };
    }

    // 3. Wooden blocks (Logs, Planks, Crafting, Bookshelves)
    // Hand can mine (~2.6s). Axe speeds it up (~0.4s - 1.2s).
    case 'wood':
    case 'aether_wood':
    case 'planks':
    case 'bookshelf':
    case 'oak_pillar': {
      const isAxe = toolType === 'axe' || toolId.includes('axe');
      const breakTime = isAxe ? Math.max(0.28, 2.6 / tierSpeedMultiplier) : 2.6;
      let dropId: string = blockType;
      if (blockType === 'bookshelf' && !isAxe) dropId = 'planks';

      return {
        breakTime,
        canHarvest: true,
        dropItemId: dropId,
        dropCount: 1
      };
    }

    case 'hay_block': {
      const isAxe = toolType === 'axe' || toolId.includes('axe');
      return {
        breakTime: isAxe ? 0.4 : 1.2,
        canHarvest: true,
        dropItemId: 'hay_block',
        dropCount: 1
      };
    }

    case 'glass':
      return {
        breakTime: 0.35,
        canHarvest: false, // Glass breaks into shards without drop in Minecraft
        dropItemId: null,
        dropCount: 0
      };

    case 'tinted_glass':
      return {
        breakTime: 0.4,
        canHarvest: true, // Decorative stained glass recovers intact
        dropItemId: 'tinted_glass',
        dropCount: 1
      };

    case 'lantern': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      return {
        breakTime: isPickaxe ? Math.max(0.2, 1.0 / tierSpeedMultiplier) : 0.85,
        canHarvest: true,
        dropItemId: 'lantern',
        dropCount: 1
      };
    }

    // 4. Stone & Decorative Masonry blocks (Stone, Cobblestone, Brick, Stone Bricks, Chiseled Stone, Quartz, Terracotta)
    case 'stone':
    case 'cobblestone':
    case 'brick':
    case 'stone_bricks':
    case 'chiseled_stone':
    case 'quartz_block':
    case 'terracotta': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      if (isPickaxe) {
        const breakTime = Math.max(0.2, 1.5 / tierSpeedMultiplier);
        return {
          breakTime,
          canHarvest: true,
          dropItemId: blockType === 'stone' ? 'cobblestone' : blockType,
          dropCount: 1
        };
      } else {
        // Hand mining stone takes 5.5 seconds and drops nothing!
        return {
          breakTime: 5.5,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: '⚠️ 需使用【鎬子】挖掘才能採集石材裝飾方塊！'
        };
      }
    }

    // 5. Ores (Coal, Iron, Emerald)
    // Coal Ore: requires any Pickaxe (wood+). Hand takes 10s and drops nothing.
    case 'coal_ore': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      if (isPickaxe) {
        const breakTime = Math.max(0.35, 2.0 / tierSpeedMultiplier);
        return {
          breakTime,
          canHarvest: true,
          dropItemId: 'coal_ore',
          dropCount: 1
        };
      } else {
        return {
          breakTime: 8.0,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: '⚠️ 煤炭礦石需使用【木鎬】以上才能開採！'
        };
      }
    }

    // Iron Ore: requires Stone Pickaxe or better in Minecraft!
    // Wood pickaxe takes long and drops nothing.
    case 'iron_ore': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      const isStoneOrBetter =
        isPickaxe &&
        (toolTier === 'stone' ||
          toolTier === 'iron' ||
          toolTier === 'diamond' ||
          toolTier === 'obsidian' ||
          toolId.includes('stone') ||
          toolId.includes('iron') ||
          toolId.includes('diamond') ||
          toolId.includes('obsidian'));

      if (isStoneOrBetter) {
        const breakTime = Math.max(0.3, 2.5 / tierSpeedMultiplier);
        return {
          breakTime,
          canHarvest: true,
          dropItemId: 'iron_ore',
          dropCount: 1
        };
      } else if (isPickaxe) {
        // Wood pickaxe on iron ore
        return {
          breakTime: 3.5,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: '⚠️ 鐵礦石需使用【石鎬】或更高級鎬子開採！'
        };
      } else {
        // Hand
        return {
          breakTime: 10.0,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: '⚠️ 徒手無法開採鐵礦石，需使用【石鎬】！'
        };
      }
    }

    // Diamond Ore: requires Iron, Diamond, or Obsidian Pickaxe
    case 'diamond_ore': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      const isIronOrDiamond =
        isPickaxe &&
        (toolTier === 'iron' ||
          toolTier === 'diamond' ||
          toolTier === 'obsidian' ||
          toolId.includes('iron') ||
          toolId.includes('diamond') ||
          toolId.includes('obsidian'));

      if (isIronOrDiamond) {
        return {
          breakTime: Math.max(0.3, 3.0 / tierSpeedMultiplier),
          canHarvest: true,
          dropItemId: 'diamond',
          dropCount: 1
        };
      } else {
        return {
          breakTime: 12.0,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: '⚠️ 鑽石礦石需使用【鐵鎬】或更高級鎬子才能開採！'
        };
      }
    }

    case 'diamond_block': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      const isIronOrDiamond =
        isPickaxe &&
        (toolTier === 'iron' ||
          toolTier === 'diamond' ||
          toolTier === 'obsidian' ||
          toolId.includes('iron') ||
          toolId.includes('diamond') ||
          toolId.includes('obsidian'));

      if (isIronOrDiamond) {
        return {
          breakTime: Math.max(0.35, 3.5 / tierSpeedMultiplier),
          canHarvest: true,
          dropItemId: 'diamond_block',
          dropCount: 1
        };
      } else {
        return {
          breakTime: 15.0,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: '⚠️ 鑽石方塊需使用【鐵鎬/鑽石鎬】開採！'
        };
      }
    }

    // Redstone Ore
    case 'redstone_ore': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      const isIronOrDiamond =
        isPickaxe &&
        (toolTier === 'iron' ||
          toolTier === 'diamond' ||
          toolTier === 'obsidian' ||
          toolId.includes('iron') ||
          toolId.includes('diamond') ||
          toolId.includes('obsidian'));

      if (isIronOrDiamond) {
        return {
          breakTime: Math.max(0.3, 2.8 / tierSpeedMultiplier),
          canHarvest: true,
          dropItemId: 'redstone',
          dropCount: Math.floor(Math.random() * 2) + 4
        };
      } else {
        return {
          breakTime: 10.0,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: '⚠️ 紅石礦石需使用【鐵鎬】或更高才能採集紅石粉！'
        };
      }
    }

    case 'redstone_block': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      return {
        breakTime: isPickaxe ? Math.max(0.3, 1.2 / tierSpeedMultiplier) : 3.0,
        canHarvest: isPickaxe,
        dropItemId: isPickaxe ? 'redstone_block' : null,
        dropCount: 1
      };
    }

    // Obsidian: takes long and STRICTLY requires Diamond or Obsidian Pickaxe!
    case 'obsidian': {
      const isDiamondOrObsidianPickaxe =
        (toolType === 'pickaxe' || toolId.includes('pickaxe')) &&
        (toolTier === 'diamond' ||
          toolTier === 'obsidian' ||
          toolId.includes('diamond') ||
          toolId.includes('obsidian'));

      if (isDiamondOrObsidianPickaxe) {
        const isObsidianTier = toolTier === 'obsidian' || toolId.includes('obsidian');
        return {
          breakTime: isObsidianTier ? 2.2 : 4.5,
          canHarvest: true,
          dropItemId: 'obsidian',
          dropCount: 1
        };
      } else {
        return {
          breakTime: 25.0,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: '⚠️ 黑曜石無比堅硬，唯有【鑽石鎬】或【黑曜石神鎬】才能挖掘！'
        };
      }
    }

    // TNT: fast break by hand or tool
    case 'tnt': {
      return {
        breakTime: 0.1,
        canHarvest: true,
        dropItemId: 'tnt',
        dropCount: 1
      };
    }

    case 'crafting_table': {
      const isAxe = toolType === 'axe' || toolId.includes('axe');
      return {
        breakTime: isAxe ? 0.4 : 1.2,
        canHarvest: true,
        dropItemId: 'crafting_table',
        dropCount: 1
      };
    }

    case 'furnace': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      return {
        breakTime: isPickaxe ? 0.8 : 3.5,
        canHarvest: isPickaxe,
        dropItemId: isPickaxe ? 'furnace' : null,
        dropCount: 1,
        harvestNotice: isPickaxe ? undefined : '⚠️ 熔爐需使用鎬子開採！'
      };
    }

    // Emerald Block / Glowstone
    case 'emerald_block': {
      const isIronOrDiamond =
        (toolType === 'pickaxe' || toolId.includes('pickaxe')) &&
        (toolTier === 'iron' ||
          toolTier === 'diamond' ||
          toolTier === 'obsidian' ||
          toolId.includes('iron') ||
          toolId.includes('diamond') ||
          toolId.includes('obsidian'));

      if (isIronOrDiamond) {
        return {
          breakTime: Math.max(0.3, 2.0 / tierSpeedMultiplier),
          canHarvest: true,
          dropItemId: 'emerald',
          dropCount: 1
        };
      } else {
        return {
          breakTime: 12.0,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: '⚠️ 綠寶石方塊需使用【鐵鎬/鑽石鎬】開採！'
        };
      }
    }

    case 'glowstone': {
      const isPickaxe = toolType === 'pickaxe' || toolId.includes('pickaxe');
      return {
        breakTime: isPickaxe ? 0.35 : 0.8,
        canHarvest: true,
        dropItemId: 'glowstone',
        dropCount: 1
      };
    }

    case 'bedrock':
      // Unbreakable
      return {
        breakTime: Infinity,
        canHarvest: false,
        dropItemId: null,
        dropCount: 0,
        harvestNotice: '🛡️ 基岩是無法被破壞的！'
      };

    default:
      return {
        breakTime: 1.0,
        canHarvest: true,
        dropItemId: blockType,
        dropCount: 1
      };
  }
}
