import { WorldSaveData, WorldType, BlockType, InventoryItem } from '../types';

const STORAGE_KEY = 'pirate_minecraft_worlds_list_v1';
const LAST_ACTIVE_WORLD_KEY = 'pirate_minecraft_last_active_world_id';

// Hash string or number seed into integer
export function parseSeed(input?: string | number): number {
  if (typeof input === 'number' && !isNaN(input)) {
    return Math.floor(input);
  }
  if (!input || typeof input !== 'string' || input.trim() === '') {
    return Math.floor(Math.random() * 1000000) + 1;
  }
  const str = input.trim();
  const num = parseInt(str, 10);
  if (!isNaN(num)) return num;

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 12345;
}

export const worldStorage = {
  listWorlds(): WorldSaveData[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load worlds from storage', e);
    }

    // Initialize with a default world if none exist
    const defaultWorld: WorldSaveData = {
      id: 'world_default_1',
      version: 1,
      name: '我的盜版生存世界',
      gameMode: 'survival',
      difficulty: 'normal',
      worldType: 'default',
      seed: 88888,
      createdAt: new Date().toLocaleString(),
      savedAt: new Date().toLocaleString(),
      timeOfDay: 0.25,
      weather: 'clear',
      player: {
        x: 0,
        y: 12,
        z: 0,
        yaw: 0,
        pitch: 0,
        health: 20,
        hunger: 20,
        inventory: Array(36).fill(null),
        gameMode: 'survival'
      },
      modifiedBlocks: {}
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultWorld]));
    } catch {
      // ignore quota errors
    }

    return [defaultWorld];
  },

  getWorld(id: string): WorldSaveData | null {
    const list = this.listWorlds();
    return list.find((w) => w.id === id) || null;
  },

  saveWorld(world: WorldSaveData): void {
    try {
      const list = this.listWorlds();
      world.savedAt = new Date().toLocaleString();
      const idx = list.findIndex((w) => w.id === world.id);
      if (idx >= 0) {
        list[idx] = world;
      } else {
        list.unshift(world);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem(LAST_ACTIVE_WORLD_KEY, world.id);
    } catch (e) {
      console.error('Failed to save world to storage', e);
    }
  },

  deleteWorld(id: string): boolean {
    try {
      const list = this.listWorlds();
      const filtered = list.filter((w) => w.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      if (localStorage.getItem(LAST_ACTIVE_WORLD_KEY) === id) {
        localStorage.removeItem(LAST_ACTIVE_WORLD_KEY);
      }
      return true;
    } catch (e) {
      console.error('Failed to delete world', e);
      return false;
    }
  },

  renameWorld(id: string, newName: string): boolean {
    const list = this.listWorlds();
    const target = list.find((w) => w.id === id);
    if (!target) return false;
    target.name = newName.trim() || target.name;
    target.savedAt = new Date().toLocaleString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  createWorld(options: {
    name: string;
    gameMode: 'survival' | 'creative';
    worldType?: WorldType;
    seed?: string | number;
  }): WorldSaveData {
    const id = `world_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const parsedSeed = parseSeed(options.seed);
    const worldType = options.worldType || 'default';
    const name = options.name.trim() || `新的世界 (${this.listWorlds().length + 1})`;

    // Starting inventory:
    // In survival mode: completely empty!
    // In creative mode: starter building palette in hotbar
    const inventory: (InventoryItem | null)[] = Array(36).fill(null);

    const newWorld: WorldSaveData = {
      id,
      version: 1,
      name,
      gameMode: options.gameMode,
      difficulty: 'normal',
      worldType,
      seed: parsedSeed,
      createdAt: new Date().toLocaleString(),
      savedAt: new Date().toLocaleString(),
      timeOfDay: 0.25, // midday
      weather: 'clear',
      player: {
        x: 0,
        y: worldType === 'flat' ? 6 : worldType === 'heaven' ? 18 : 12,
        z: 0,
        yaw: 0,
        pitch: 0,
        health: 20,
        hunger: 20,
        inventory,
        gameMode: options.gameMode
      },
      modifiedBlocks: {}
    };

    this.saveWorld(newWorld);
    return newWorld;
  },

  getLastActiveWorldId(): string | null {
    return localStorage.getItem(LAST_ACTIVE_WORLD_KEY);
  }
};
