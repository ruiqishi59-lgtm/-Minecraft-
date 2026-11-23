export type BlockType =
  | 'air'
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'cobblestone'
  | 'wood'
  | 'planks'
  | 'leaves'
  | 'sand'
  | 'coal_ore'
  | 'iron_ore'
  | 'diamond_ore'
  | 'diamond_block'
  | 'redstone_ore'
  | 'redstone_block'
  | 'obsidian'
  | 'tnt'
  | 'crafting_table'
  | 'furnace'
  | 'water'
  | 'lava'
  | 'brick'
  | 'glass'
  | 'torch'
  | 'glowstone'
  | 'hay_block'
  | 'bookshelf'
  | 'farmland'
  | 'wheat_crop'
  | 'aether_grass'
  | 'aether_dirt'
  | 'aether_wood'
  | 'golden_leaves'
  | 'cloud_block'
  | 'emerald_block'
  | 'snow_block'
  | 'cactus'
  | 'sandstone'
  | 'mud'
  | 'stone_bricks'
  | 'chiseled_stone'
  | 'lantern'
  | 'quartz_block'
  | 'terracotta'
  | 'oak_pillar'
  | 'tinted_glass'
  | 'bedrock';

export type BiomeType = 'plains' | 'forest' | 'desert' | 'snow' | 'swamp' | 'mountains' | 'heaven';

export interface BlockDefinition {
  id: BlockType;
  name: string;
  hardness: number;
  transparent?: boolean;
  emissive?: boolean;
  dropItem: string;
  dropCount: number;
}

export type MobType =
  | 'skeleton'
  | 'rabbit'
  | 'villager'
  | 'creeper'
  | 'zombie'
  | 'cow'
  | 'pig'
  | 'sheep'
  | 'chicken'
  | 'wolf'
  | 'spider'
  | 'enderman'
  | 'iron_golem'
  | 'seraphim';

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  maxStack: number;
  type: 'block' | 'tool' | 'material' | 'spawn_egg';
  blockType?: BlockType;
  toolType?: 'pickaxe' | 'axe' | 'sword' | 'shovel';
  toolTier?: 'wood' | 'stone' | 'iron' | 'diamond' | 'obsidian';
  damage?: number;
  spawnMobType?: MobType;
  eggSecondaryColor?: string;
  iconColor: string;
  iconSymbol?: string;
}

export interface Recipe {
  id: string;
  name: string;
  result: {
    id: string;
    count: number;
  };
  ingredients: {
    id: string;
    count: number;
  }[];
  pattern?: string[];
  key?: Record<string, string>;
  requiresTable?: boolean;
  category: 'tools' | 'decor' | 'blocks' | 'materials' | 'survival';
  description: string;
}

export type WeatherType = 'clear' | 'rain' | 'thunder';

export interface WeatherState {
  current: WeatherType;
  durationLeft: number;
  rainIntensity: number; // 0 to 1
  isLightning: boolean;
}

export interface MobEntity {
  id: string;
  type: MobType;
  profession?: 'farmer' | 'librarian' | 'weaponsmith' | 'cleric';
  trades?: {
    id: string;
    inputItem: string;
    inputCount: number;
    outputItem: string;
    outputCount: number;
  }[];
  position: { x: number; y: number; z: number };
  rotationY: number;
  velocity: { x: number; y: number; z: number };
  health: number;
  maxHealth: number;
  state: 'idle' | 'wander' | 'chase' | 'flee' | 'attack' | 'hurt';
  stateTimer: number;
  target?: { x: number; y: number; z: number };
  attackCooldown: number;
  hurtCooldown: number;
  isGrounded: boolean;
  bossTitle?: string;
  bossPhase?: number;
  bossAttackTimer?: number;
  bossAuraAngle?: number;
}

export interface VillagerTrade {
  id: string;
  costItem: string;
  costCount: number;
  giveItem: string;
  giveCount: number;
  description: string;
}

export interface CharacterSkin {
  id: string;
  name: string;
  description: string;
  hairColor: string;
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  shoesColor: string;
  eyeColor: string;
  accentColor?: string;
  isDeluxe?: boolean;
  costPoints?: number;
  badge?: string;
  accessories?: {
    hasCrown?: boolean;
    hasShoulderPads?: boolean;
    hasCape?: boolean;
    hasVisor?: boolean;
    hasHorns?: boolean;
    capeColor?: string;
    shoulderColor?: string;
    visorColor?: string;
    glowColor?: string;
  };
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  score: number;
  activeHotbarIndex: number;
  gameMode: 'survival' | 'creative';
}

export type WorldType = 'default' | 'flat' | 'mountains' | 'heaven' | 'fusion';

export interface WorldSaveData {
  id: string;
  version: number;
  name: string;
  gameMode: 'survival' | 'creative';
  difficulty?: 'peaceful' | 'easy' | 'normal' | 'hard';
  worldType: WorldType;
  seed: number;
  createdAt: string;
  savedAt: string;
  timeOfDay: number; // 0.0 to 1.0 (0=dawn, 0.25=noon, 0.5=dusk, 0.75=midnight)
  weather: WeatherType;
  player: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    health: number;
    hunger?: number;
    inventory: (InventoryItem | null)[];
    gameMode?: 'survival' | 'creative';
  };
  modifiedBlocks: { [coordKey: string]: BlockType };
  cloudSynced?: boolean;
}

export interface GameSettings {
  fov: number; // 60 to 105, default 75
  renderDistance: number; // 2 to 4 chunks, default 3
  masterVolume: number; // 0 to 100, default 80
  musicVolume: number; // 0 to 100, default 60
  musicEnabled: boolean; // default true
  showClouds: boolean; // default true
  skinId: string; // default 'steve'
  texturePackId?: string; // active texture pack
  mouseSensitivity: number; // 50 to 200, default 100
  difficulty: 'peaceful' | 'easy' | 'normal';
  showCoordinates: boolean;
  viewBobbing: boolean;
  isMobileMode: boolean;
  dynamicFXEnabled?: boolean;
  graphicsPreset?: 'fancy' | 'fast';
  shadowsEnabled?: boolean;
  handLightEnabled?: boolean;
  viewMode?: 'first_person' | 'third_person_back' | 'third_person_front';
}

// ==========================================
// Minecraft Marketplace (市集) Types
// ==========================================
export type MarketplaceCategory = 'all' | 'worlds' | 'skins' | 'textures' | 'mashups' | 'perks';

export interface MarketplaceItem {
  id: string;
  title: string;
  category: MarketplaceCategory;
  priceMinecoins: number;
  originalPrice?: number;
  isFree?: boolean;
  creator: string;
  rating: number; // e.g. 4.9
  downloadCount: string; // e.g. '1.2M'
  thumbnail: string;
  badge?: string;
  description: string;
  features: string[];
  worldType?: WorldType;
  worldSeed?: number;
  gameMode?: 'survival' | 'creative';
  skinId?: string;
  texturePackId?: string;
}

export interface TexturePackDefinition {
  id: string;
  name: string;
  description: string;
  creator: string;
  icon: string;
  style: 'classic' | 'retro8bit' | 'celestial' | 'gothic';
}

// ==========================================
// Multiplayer Server Types (伺服器與多人連線)
// ==========================================
export interface GameServerInfo {
  id: string;
  name: string;
  ip: string;
  motd: string;
  worldType: WorldType;
  gameMode: 'survival' | 'creative';
  seed: number;
  maxPlayers: number;
  onlineCount: number;
  ping: number;
  isOfficial?: boolean;
  isPrivate?: boolean;
  roomCode?: string;
  creatorName?: string;
  icon: string;
  tags: string[];
}

export interface RemotePlayer {
  id: string;
  name: string;
  skinId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  health: number;
  isSwinging?: boolean;
  isSneaking?: boolean;
  isFlying?: boolean;
  ping?: number;
  score?: number;
}

export interface ServerChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}
