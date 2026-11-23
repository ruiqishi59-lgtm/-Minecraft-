import * as THREE from 'three';
import { BlockType, WorldType, BiomeType } from '../types';
import { textureManager } from './textures';
import { soundManager } from './audio';

export interface BreakParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Mesh;
  life: number;
}

export class VoxelWorld {
  public blocks: Map<string, BlockType> = new Map();
  public playerModifications: Map<string, BlockType> = new Map();
  public generatedChunks: Set<string> = new Set();
  public chunkBlocks: Map<string, Set<string>> = new Map();

  public readonly chunkSize: number = 16;
  public renderRadius: number = 3; // 7x7 chunks = 112x112 blocks expanse around player
  public worldHeight: number = 36;
  public seaLevel: number = 6;

  public currentSeed: number = 88888;
  public currentWorldType: WorldType = 'default';
  public centerChunkX: number = 0;
  public centerChunkZ: number = 0;
  public villageLocations: { x: number; y: number; z: number }[] = [];

  private instancedMeshes: Map<BlockType, THREE.InstancedMesh> = new Map();
  private maxInstances: Map<BlockType, number> = new Map();
  private dummy = new THREE.Object3D();
  private dirty: boolean = true;

  // Visual particles for broken blocks
  private particles: BreakParticle[] = [];
  private particleGeom = new THREE.BoxGeometry(0.18, 0.18, 0.18);

  // Outline helper for highlighted block
  public selectionBox: THREE.LineSegments;

  constructor(public scene: THREE.Scene) {
    this.createInstancedMeshes();
    this.generateTerrain(88888, 'heaven');

    // Selection wireframe box
    const boxGeom = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const edges = new THREE.EdgesGeometry(boxGeom);
    this.selectionBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);
  }

  public getKey(x: number, y: number, z: number): string {
    return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    const key = this.getKey(x, y, z);
    const existing = this.blocks.get(key);
    if (existing !== undefined) return existing;

    const cx = Math.floor(x / this.chunkSize);
    const cz = Math.floor(z / this.chunkSize);
    const chunkKey = `${cx},${cz}`;
    if (!this.generatedChunks.has(chunkKey)) {
      this.generateChunk(cx, cz);
      return this.blocks.get(key) || 'air';
    }

    return 'air';
  }

  public setBlock(x: number, y: number, z: number, type: BlockType, playSound: boolean = true): boolean {
    const key = this.getKey(x, y, z);
    const prev = this.blocks.get(key);

    const cx = Math.floor(x / this.chunkSize);
    const cz = Math.floor(z / this.chunkSize);
    const chunkKey = `${cx},${cz}`;
    let bSet = this.chunkBlocks.get(chunkKey);
    if (!bSet) {
      bSet = new Set();
      this.chunkBlocks.set(chunkKey, bSet);
    }

    if (type === 'air') {
      if (prev && prev !== 'air') {
        this.blocks.delete(key);
        bSet.delete(key);
        this.playerModifications.set(key, 'air');
        if (playSound) {
          soundManager.playBlockBreak();
          this.spawnBreakParticles(x + 0.5, y + 0.5, z + 0.5, prev);
        }
        this.dirty = true;
        return true;
      }
      return false;
    }

    this.blocks.set(key, type);
    bSet.add(key);
    this.playerModifications.set(key, type);
    if (playSound) {
      soundManager.playBlockPlace();
    }
    this.dirty = true;
    return true;
  }

  public explodeAt(centerX: number, centerY: number, centerZ: number, radius: number = 3.5) {
    soundManager.playExplosion();
    const rInt = Math.ceil(radius);
    for (let dx = -rInt; dx <= rInt; dx++) {
      for (let dy = -rInt; dy <= rInt; dy++) {
        for (let dz = -rInt; dz <= rInt; dz++) {
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq <= radius * radius) {
            const bx = Math.floor(centerX + dx);
            const by = Math.floor(centerY + dy);
            const bz = Math.floor(centerZ + dz);
            const block = this.getBlock(bx, by, bz);
            if (block !== 'air' && block !== 'bedrock' && block !== 'obsidian') {
              this.setBlock(bx, by, bz, 'air', false);
              if (Math.random() < 0.25) {
                this.spawnBreakParticles(bx + 0.5, by + 0.5, bz + 0.5, block);
              }
            }
          }
        }
      }
    }
    this.dirty = true;
  }

  private createInstancedMeshes() {
    const blockTypes: { type: BlockType; max: number }[] = [
      { type: 'grass', max: 65000 },
      { type: 'dirt', max: 50000 },
      { type: 'stone', max: 50000 },
      { type: 'cobblestone', max: 30000 },
      { type: 'wood', max: 20000 },
      { type: 'planks', max: 25000 },
      { type: 'leaves', max: 45000 },
      { type: 'sand', max: 30000 },
      { type: 'coal_ore', max: 10000 },
      { type: 'iron_ore', max: 10000 },
      { type: 'brick', max: 10000 },
      { type: 'glass', max: 15000 },
      { type: 'torch', max: 8000 },
      { type: 'glowstone', max: 15000 },
      { type: 'hay_block', max: 10000 },
      { type: 'bookshelf', max: 10000 },
      { type: 'farmland', max: 12000 },
      { type: 'wheat_crop', max: 15000 },
      { type: 'aether_grass', max: 65000 },
      { type: 'aether_dirt', max: 50000 },
      { type: 'aether_wood', max: 20000 },
      { type: 'golden_leaves', max: 45000 },
      { type: 'cloud_block', max: 30000 },
      { type: 'emerald_block', max: 10000 },
      { type: 'diamond_ore', max: 8000 },
      { type: 'diamond_block', max: 8000 },
      { type: 'redstone_ore', max: 8000 },
      { type: 'redstone_block', max: 8000 },
      { type: 'obsidian', max: 10000 },
      { type: 'tnt', max: 6000 },
      { type: 'crafting_table', max: 6000 },
      { type: 'furnace', max: 6000 },
      { type: 'water', max: 25000 },
      { type: 'lava', max: 10000 },
      { type: 'snow_block', max: 40000 },
      { type: 'cactus', max: 10000 },
      { type: 'sandstone', max: 25000 },
      { type: 'mud', max: 25000 },
      { type: 'stone_bricks', max: 12000 },
      { type: 'chiseled_stone', max: 10000 },
      { type: 'lantern', max: 8000 },
      { type: 'quartz_block', max: 12000 },
      { type: 'terracotta', max: 12000 },
      { type: 'oak_pillar', max: 10000 },
      { type: 'tinted_glass', max: 12000 }
    ];

    const geom = new THREE.BoxGeometry(1, 1, 1);

    for (const { type, max } of blockTypes) {
      const mat = textureManager.getMaterial(type);
      const imesh = new THREE.InstancedMesh(geom, mat, max);
      imesh.count = 0;
      imesh.castShadow = true;
      imesh.receiveShadow = true;
      // CRITICAL FIX: Disable frustum culling on instanced chunk meshes so
      // rotating the camera or spawning in doesn't cause terrain to turn transparent/disappear!
      imesh.frustumCulled = false;
      this.instancedMeshes.set(type, imesh);
      this.maxInstances.set(type, max);
      this.scene.add(imesh);
    }
  }

  // Smooth multi-octave 2D noise
  private hash2d(x: number, z: number, seed: number): number {
    const s = Math.sin(x * 12.9898 + z * 78.233 + (seed % 1000) * 19.123) * 43758.5453;
    return s - Math.floor(s);
  }

  private smoothNoise(x: number, z: number, seed: number): number {
    const iX = Math.floor(x);
    const iZ = Math.floor(z);
    const fX = x - iX;
    const fZ = z - iZ;
    // Cubic Hermite smoothstep
    const u = fX * fX * (3.0 - 2.0 * fX);
    const v = fZ * fZ * (3.0 - 2.0 * fZ);

    const n00 = this.hash2d(iX, iZ, seed);
    const n10 = this.hash2d(iX + 1, iZ, seed);
    const n01 = this.hash2d(iX, iZ + 1, seed);
    const n11 = this.hash2d(iX + 1, iZ + 1, seed);

    const nx0 = n00 * (1.0 - u) + n10 * u;
    const nx1 = n01 * (1.0 - u) + n11 * u;
    return nx0 * (1.0 - v) + nx1 * v;
  }

  private fbmNoise(x: number, z: number, seed: number, octaves: number = 3): number {
    let total = 0;
    let frequency = 0.022;
    let amplitude = 1.0;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.smoothNoise(x * frequency, z * frequency, seed + i * 17) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return total / maxValue;
  }

  public getSurfaceY(x: number, z: number): number {
    for (let y = this.worldHeight; y >= 0; y--) {
      const b = this.getBlock(x, y, z);
      if (b !== 'air') return y;
    }
    return 6;
  }

  public getBiome(x: number, z: number): BiomeType {
    if (this.currentWorldType === 'heaven') {
      return 'heaven';
    }
    if (this.currentWorldType === 'flat') {
      return 'plains';
    }
    if (this.currentWorldType === 'mountains') {
      return 'mountains';
    }

    // Broad macro climate maps with distinct seeds
    // fbmNoise with x*0.35 yields wide spans ~70-150 blocks across
    const temp = this.fbmNoise(x * 0.35, z * 0.35, this.currentSeed + 101, 2);
    const moisture = this.fbmNoise(x * 0.35, z * 0.35, this.currentSeed + 202, 2);
    const elevation = this.fbmNoise(x * 0.65, z * 0.65, this.currentSeed + 505, 3);

    // High altitude mountain peaks
    if (elevation > 0.74) {
      return 'mountains';
    }

    // Snowy Tundra: cold temperature
    if (temp < 0.33) {
      return 'snow';
    }

    // Desert: high temperature, dry/low moisture
    if (temp > 0.63 && moisture < 0.45) {
      return 'desert';
    }

    // Swamp: high moisture, warm/moderate temperature
    if (moisture > 0.64 && temp >= 0.33) {
      return 'swamp';
    }

    // Forest: moderate temp, medium-high moisture
    if (moisture > 0.48) {
      return 'forest';
    }

    // Plains: classic open grasslands
    return 'plains';
  }

  public generateChunk(cx: number, cz: number) {
    const chunkKey = `${cx},${cz}`;
    if (this.generatedChunks.has(chunkKey)) return;
    this.generatedChunks.add(chunkKey);

    let bSet = this.chunkBlocks.get(chunkKey);
    if (!bSet) {
      bSet = new Set();
      this.chunkBlocks.set(chunkKey, bSet);
    }

    const startX = cx * this.chunkSize;
    const startZ = cz * this.chunkSize;
    const endX = startX + this.chunkSize;
    const endZ = startZ + this.chunkSize;
    const seed = this.currentSeed;
    const worldType = this.currentWorldType;

    if (worldType === 'heaven') {
      // Heaven (Aether) Dimension: Floating celestial sky islands drifting above the clouds
      for (let x = startX; x < endX; x++) {
        for (let z = startZ; z < endZ; z++) {
          // Island density noise
          const islandNoise = this.fbmNoise(x * 0.05, z * 0.05, seed + 777, 3);
          const islandHeightOffset = Math.floor(Math.sin(x * 0.04 + z * 0.04) * 4);
          const centerDist = Math.sqrt(x * x + z * z);

          // Always guarantee a generous spawn island at center (0,0)
          const isSpawnIsland = centerDist < 20;

          if (islandNoise > 0.42 || isSpawnIsland) {
            const surfaceY = 16 + islandHeightOffset;
            const depth = isSpawnIsland ? 5 : Math.max(3, Math.floor((islandNoise - 0.42) * 20 + 3));

            for (let dy = 0; dy <= depth; dy++) {
              const y = surfaceY - dy;
              if (y < 1) continue;
              let block: BlockType = 'aether_dirt';
              if (dy === 0) {
                block = 'aether_grass';
              } else if (dy === depth && Math.random() < 0.2) {
                block = 'glowstone'; // Luminous glowing crystals at the bottom of celestial islands
              } else if (dy > 2 && Math.random() < 0.08) {
                block = 'emerald_block'; // Celestial emerald core
              }
              const k = this.getKey(x, y, z);
              this.blocks.set(k, block);
              bSet.add(k);
            }
          } else if (islandNoise > 0.36 && Math.random() < 0.3) {
            // Floating cloud walkways between islands
            const k = this.getKey(x, 14, z);
            this.blocks.set(k, 'cloud_block');
            bSet.add(k);
          }
        }
      }

      // Celestial Trees & Golden Foliage
      const localX = Math.abs(Math.floor(this.hash2d(cx, cz, seed + 333) * 12)) + 2;
      const localZ = Math.abs(Math.floor(this.hash2d(cx, cz, seed + 444) * 12)) + 2;
      const treeX = startX + localX;
      const treeZ = startZ + localZ;
      const treeSurfaceY = this.getSurfaceY(treeX, treeZ);

      if (treeSurfaceY >= 14 && this.getBlock(treeX, treeSurfaceY, treeZ) === 'aether_grass') {
        this.spawnAetherTree(treeX, treeSurfaceY + 1, treeZ, bSet);
      }

      // Guaranteed Celestial Return Portal on Central Spawn Island
      if (cx === 0 && cz === 0) {
        this.spawnHeavenPortal(bSet);
      }
    } else if (worldType === 'fusion') {
      // All-in-One Fusion Realm (多元宇宙萬界融合神域) - VIP Member Exclusive
      // Combines:
      // 1. Superflat expansive plains
      // 2. Default rolling hills, lakes, ores & villages
      // 3. Towering mountain cliffs & peaks
      // 4. Floating celestial Aether sky islands & cloud decks overhead
      for (let x = startX; x < endX; x++) {
        for (let z = startZ; z < endZ; z++) {
          // Macro noise determines terrain blend between flat plains, rolling hills, and steep mountains
          const macro = this.fbmNoise(x * 0.025, z * 0.025, seed + 888, 2);
          let groundY = 6;

          if (macro < -0.22) {
            // Flat Plains: smooth low elevation (Y = 4~5), perfect for building
            groundY = 5;
          } else if (macro > 0.18) {
            // High Mountains: towering cliffs and summits reaching Y = 16~21
            const n = this.fbmNoise(x, z, seed, 4);
            const ridge = 1.0 - Math.abs(n * 2.0 - 1.0);
            groundY = Math.max(5, Math.floor(7 + ridge * 13 + n * 4));
          } else {
            // Default Rolling Hills & Rivers
            const n = this.fbmNoise(x, z, seed, 3);
            groundY = Math.max(4, Math.floor(5 + n * 8));
          }

          // Build Ground column from bedrock (Y=0) up to ground surface
          for (let y = 0; y <= groundY; y++) {
            let block: BlockType = 'stone';

            if (y === groundY) {
              if (groundY <= this.seaLevel) {
                block = 'sand';
              } else if (groundY >= 17) {
                block = 'cobblestone';
              } else {
                block = 'grass';
              }
            } else if (y >= groundY - 3) {
              block = 'dirt';
            } else if (y === 0) {
              block = 'bedrock';
            } else {
              // Mineral ores distribution
              const oreChance = Math.sin(x * 3.1 + y * 7.7 + z * 5.3 + (seed % 1000) * 0.1);
              if (oreChance > 0.82) {
                block = 'coal_ore';
              } else if (oreChance < -0.84 && y < 10) {
                block = 'iron_ore';
              } else if (oreChance > 0.94 && y < 6) {
                block = 'emerald_block';
              } else {
                block = 'stone';
              }
            }

            const k = this.getKey(x, y, z);
            this.blocks.set(k, block);
            bSet.add(k);
          }

          // Overhead Sky Layer: Floating Celestial Aether Sky Islands & Cloud Bridges
          const skyIslandNoise = this.fbmNoise(x * 0.045, z * 0.045, seed + 777, 3);
          const skyHeightOffset = Math.floor(Math.sin(x * 0.04 + z * 0.04) * 3);

          if (skyIslandNoise > 0.44) {
            const islandSurfaceY = 24 + skyHeightOffset;
            const depth = Math.max(3, Math.floor((skyIslandNoise - 0.44) * 16 + 2));

            for (let dy = 0; dy <= depth; dy++) {
              const y = islandSurfaceY - dy;
              // Ensure ample airspace above mountain surface and below world roof
              if (y <= groundY + 2 || y >= this.worldHeight) continue;

              let block: BlockType = 'aether_dirt';
              if (dy === 0) {
                block = 'aether_grass';
              } else if (dy === depth && Math.random() < 0.25) {
                block = 'glowstone'; // Floating underside crystal lanterns
              } else if (dy > 1 && Math.random() < 0.1) {
                block = 'emerald_block'; // Celestial emerald core
              }
              const k = this.getKey(x, y, z);
              this.blocks.set(k, block);
              bSet.add(k);
            }
          } else if (skyIslandNoise > 0.38 && Math.random() < 0.28) {
            // Floating cloud bridges between sky islands
            const cloudY = 23;
            if (cloudY > groundY + 2 && cloudY < this.worldHeight) {
              const k = this.getKey(x, cloudY, z);
              this.blocks.set(k, 'cloud_block');
              bSet.add(k);
            }
          }
        }
      }

      // Village: In chunk (1,1) or (-2,2) on suitable ground
      const isVillageChunk = (cx === 1 && cz === 1) || (cx === -2 && cz === 2);
      if (isVillageChunk) {
        this.spawnVillage(startX, startZ, bSet);
      }

      // Ground Trees (Oak trees)
      if (!isVillageChunk) {
        const localX = Math.abs(Math.floor(this.hash2d(cx, cz, seed + 77) * 12)) + 2;
        const localZ = Math.abs(Math.floor(this.hash2d(cx, cz, seed + 177) * 12)) + 2;
        const treeX = startX + localX;
        const treeZ = startZ + localZ;
        let groundSurfaceY = 0;
        for (let y = 19; y >= 0; y--) {
          if (this.getBlock(treeX, y, treeZ) === 'grass') {
            groundSurfaceY = y;
            break;
          }
        }
        if (groundSurfaceY > this.seaLevel && groundSurfaceY < 17) {
          this.spawnTree(treeX, groundSurfaceY + 1, treeZ, bSet);
        }
      }

      // Celestial Trees on floating Aether islands
      const skyLocalX = Math.abs(Math.floor(this.hash2d(cx, cz, seed + 333) * 12)) + 2;
      const skyLocalZ = Math.abs(Math.floor(this.hash2d(cx, cz, seed + 444) * 12)) + 2;
      const skyTreeX = startX + skyLocalX;
      const skyTreeZ = startZ + skyLocalZ;
      for (let y = this.worldHeight - 1; y >= 22; y--) {
        if (this.getBlock(skyTreeX, y, skyTreeZ) === 'aether_grass' && y + 6 < this.worldHeight) {
          this.spawnAetherTree(skyTreeX, y + 1, skyTreeZ, bSet);
          break;
        }
      }
    } else {
      // Overworld / Mountains / Flat / Biomes
      for (let x = startX; x < endX; x++) {
        for (let z = startZ; z < endZ; z++) {
          const biome = this.getBiome(x, z);
          let surfaceY = 6;
          if (worldType === 'flat') {
            surfaceY = 4;
          } else if (worldType === 'mountains' || biome === 'mountains') {
            const n = this.fbmNoise(x, z, seed, 4);
            const ridge = 1.0 - Math.abs(n * 2.0 - 1.0);
            surfaceY = Math.max(5, Math.floor(7 + ridge * 14 + n * 6));
          } else if (biome === 'desert') {
            // Desert: undulating rolling sand dunes
            const n = this.fbmNoise(x * 0.8, z * 0.8, seed, 2);
            surfaceY = Math.max(4, Math.floor(5 + n * 5));
          } else if (biome === 'swamp') {
            // Swamp: low-lying murky wetlands near sea level
            const n = this.fbmNoise(x * 1.2, z * 1.2, seed, 2);
            surfaceY = Math.max(3, Math.floor(4 + n * 4));
          } else if (biome === 'snow') {
            // Snow: rolling white tundra hills
            const n = this.fbmNoise(x, z, seed, 3);
            surfaceY = Math.max(4, Math.floor(6 + n * 7));
          } else {
            // Default: rolling green hills (plains / forest)
            const n = this.fbmNoise(x, z, seed, 3);
            surfaceY = Math.max(3, Math.floor(5 + n * 9));
          }

          // Generate block column from bedrock up to surface
          for (let y = 0; y <= surfaceY; y++) {
            let block: BlockType = 'stone';

            if (y === surfaceY) {
              if (worldType !== 'flat' && surfaceY <= this.seaLevel) {
                if (biome === 'swamp') {
                  block = 'water';
                } else if (biome === 'snow') {
                  block = 'snow_block';
                } else {
                  block = 'sand';
                }
              } else if (biome === 'snow') {
                block = 'snow_block';
              } else if (biome === 'desert') {
                block = 'sand';
              } else if (biome === 'swamp') {
                block = 'mud';
              } else if ((worldType === 'mountains' || biome === 'mountains') && surfaceY >= 17) {
                block = 'snow_block'; // High snowy mountain peak
              } else if ((worldType === 'mountains' || biome === 'mountains') && surfaceY >= 13) {
                block = 'cobblestone';
              } else {
                block = 'grass';
              }
            } else if (y >= surfaceY - 3) {
              if (biome === 'desert') {
                block = y >= surfaceY - 1 ? 'sand' : 'sandstone';
              } else if (biome === 'swamp') {
                block = y === surfaceY - 1 ? 'mud' : 'dirt';
              } else {
                block = 'dirt';
              }
            } else if (y === 0) {
              block = 'bedrock';
            } else {
              // Mineral Ores distribution
              const oreChance = Math.sin(x * 3.1 + y * 7.7 + z * 5.3 + (seed % 1000) * 0.1);
              if (oreChance > 0.83) {
                block = 'coal_ore';
              } else if (oreChance < -0.86 && y < 10) {
                block = 'iron_ore';
              } else if (oreChance > 0.94 && y <= 4) {
                block = 'diamond_ore';
              } else if (oreChance < -0.92 && y <= 6) {
                block = 'redstone_ore';
              } else {
                block = 'stone';
              }
            }

            const k = this.getKey(x, y, z);
            this.blocks.set(k, block);
            bSet.add(k);
          }
        }
      }

      // Village generation: Guaranteed near spawn in chunk (1, 1) or seeded secondary villages
      const isVillageChunk = (cx === 1 && cz === 1) || (cx === -2 && cz === 2);
      if (worldType !== 'flat' && isVillageChunk) {
        this.spawnVillage(startX, startZ, bSet);
      }

      // Biome-specific vegetation & flora features
      if (worldType !== 'flat' && !isVillageChunk) {
        const localX = Math.abs(Math.floor(this.hash2d(cx, cz, seed + 77) * 12)) + 2;
        const localZ = Math.abs(Math.floor(this.hash2d(cx, cz, seed + 177) * 12)) + 2;
        const featX = startX + localX;
        const featZ = startZ + localZ;
        const featSurfaceY = this.getSurfaceY(featX, featZ);
        const chunkBiome = this.getBiome(featX, featZ);

        if (featSurfaceY >= this.seaLevel && featSurfaceY < 22) {
          if (chunkBiome === 'desert') {
            // Desert: Spiky cactus columns
            const groundBlock = this.getBlock(featX, featSurfaceY, featZ);
            if (groundBlock === 'sand') {
              this.spawnCactus(featX, featSurfaceY + 1, featZ, bSet);
            }
          } else if (chunkBiome === 'snow') {
            // Snow: Conical snow-dusted spruce trees
            this.spawnSpruceTree(featX, featSurfaceY + 1, featZ, bSet);
          } else if (chunkBiome === 'swamp') {
            // Swamp: Broad weeping willow trees with hanging vines
            this.spawnSwampTree(featX, featSurfaceY + 1, featZ, bSet);
          } else if (chunkBiome === 'forest') {
            // Forest: Dense lush oak canopy (2 trees)
            this.spawnTree(featX, featSurfaceY + 1, featZ, bSet);
            const extraX = startX + ((localX + 7) % 12) + 2;
            const extraZ = startZ + ((localZ + 7) % 12) + 2;
            const extraY = this.getSurfaceY(extraX, extraZ);
            if (extraY > this.seaLevel && extraY < 18) {
              this.spawnTree(extraX, extraY + 1, extraZ, bSet);
            }
          } else if (chunkBiome === 'plains') {
            // Plains: Sparse oak trees
            if (this.hash2d(cx, cz, seed + 999) < 0.55) {
              this.spawnTree(featX, featSurfaceY + 1, featZ, bSet);
            }
          } else if (chunkBiome === 'mountains') {
            // Mountains: Occasional alpine spruce
            if (this.hash2d(cx, cz, seed + 888) < 0.45 && featSurfaceY < 18) {
              this.spawnSpruceTree(featX, featSurfaceY + 1, featZ, bSet);
            }
          }
        }
      }
    }

    // Apply player modifications in this chunk
    this.playerModifications.forEach((val, key) => {
      const [mx, , mz] = key.split(',').map(Number);
      if (mx >= startX && mx < endX && mz >= startZ && mz < endZ) {
        if (val === 'air') {
          this.blocks.delete(key);
          bSet?.delete(key);
        } else {
          this.blocks.set(key, val);
          bSet?.add(key);
        }
      }
    });
  }

  private spawnHeavenPortal(bSet: Set<string>) {
    const portalZ = 8;
    const groundY = 16;

    // Platform (5x3 obsidian)
    for (let px = -2; px <= 3; px++) {
      for (let pz = -1; pz <= 1; pz++) {
        const k = this.getKey(px, groundY, portalZ + pz);
        this.blocks.set(k, 'obsidian');
        bSet.add(k);
      }
    }

    // Portal Frame (Obsidian, Glowstone & Emerald)
    for (let y = 1; y <= 5; y++) {
      const leftKey = this.getKey(-1, groundY + y, portalZ);
      const rightKey = this.getKey(2, groundY + y, portalZ);
      this.blocks.set(leftKey, y === 3 ? 'glowstone' : 'obsidian');
      this.blocks.set(rightKey, y === 3 ? 'glowstone' : 'obsidian');
      bSet.add(leftKey);
      bSet.add(rightKey);
    }
    // Top Arch
    for (let x = -1; x <= 2; x++) {
      const topKey = this.getKey(x, groundY + 5, portalZ);
      this.blocks.set(topKey, (x === 0 || x === 1) ? 'emerald_block' : 'obsidian');
      bSet.add(topKey);
    }
    // Cloud portal interior gateway
    for (let x = 0; x <= 1; x++) {
      for (let y = 1; y <= 4; y++) {
        const portalKey = this.getKey(x, groundY + y, portalZ);
        this.blocks.set(portalKey, 'cloud_block');
        bSet.add(portalKey);
      }
    }
  }

  private spawnAetherTree(rootX: number, rootY: number, rootZ: number, bSet: Set<string>) {
    const trunkHeight = 5;
    for (let dy = 0; dy < trunkHeight; dy++) {
      const k = this.getKey(rootX, rootY + dy, rootZ);
      this.blocks.set(k, 'aether_wood');
      bSet.add(k);
    }
    // Celestial golden leaves canopy
    const leafBaseY = rootY + trunkHeight - 2;
    for (let ly = 0; ly <= 3; ly++) {
      const radius = ly >= 2 ? 1 : 2;
      for (let lx = -radius; lx <= radius; lx++) {
        for (let lz = -radius; lz <= radius; lz++) {
          if (ly >= 2 && Math.abs(lx) === 1 && Math.abs(lz) === 1) continue;
          const k = this.getKey(rootX + lx, leafBaseY + ly, rootZ + lz);
          if (!this.blocks.has(k)) {
            // Golden celestial leaves with occasional glowstone fruit
            const leafBlock = (lx === 0 && lz === 1 && ly === 0) ? 'glowstone' : 'golden_leaves';
            this.blocks.set(k, leafBlock);
            bSet.add(k);
          }
        }
      }
    }
  }

  private spawnVillage(chunkStartX: number, chunkStartZ: number, bSet: Set<string>) {
    const baseX = chunkStartX + 2;
    const baseZ = chunkStartZ + 2;
    const groundY = this.getSurfaceY(baseX + 6, baseZ + 6);
    if (groundY <= this.seaLevel || groundY > 20) return;

    // Register village center for entity/villager spawning
    this.villageLocations.push({ x: baseX + 6, y: groundY, z: baseZ + 6 });

    // 1. Cobblestone Pathways & Gravel Streets
    for (let pz = -1; pz <= 13; pz++) {
      const k = this.getKey(baseX + 5, groundY, baseZ + pz);
      this.blocks.set(k, 'cobblestone');
      bSet.add(k);
    }
    for (let px = 0; px <= 12; px++) {
      const k = this.getKey(baseX + px, groundY, baseZ + 5);
      this.blocks.set(k, 'cobblestone');
      bSet.add(k);
    }

    // Street Lamp Posts (Wood fence + Glowstone lantern)
    const lampCoords = [[baseX + 4, baseZ + 4], [baseX + 6, baseZ + 4], [baseX + 4, baseZ + 6]];
    lampCoords.forEach(([lx, lz]) => {
      this.blocks.set(this.getKey(lx, groundY + 1, lz), 'wood');
      this.blocks.set(this.getKey(lx, groundY + 2, lz), 'wood');
      this.blocks.set(this.getKey(lx, groundY + 3, lz), 'glowstone');
      bSet.add(this.getKey(lx, groundY + 1, lz));
      bSet.add(this.getKey(lx, groundY + 2, lz));
      bSet.add(this.getKey(lx, groundY + 3, lz));
    });

    // 2. Villager House / Cottage (5x5 exterior)
    const houseX = baseX;
    const houseZ = baseZ;
    for (let hx = 0; hx < 5; hx++) {
      for (let hz = 0; hz < 5; hz++) {
        // Floor
        const floorKey = this.getKey(houseX + hx, groundY, houseZ + hz);
        this.blocks.set(floorKey, 'cobblestone');
        bSet.add(floorKey);

        // Walls
        for (let hy = 1; hy <= 3; hy++) {
          const isCorner = (hx === 0 || hx === 4) && (hz === 0 || hz === 4);
          const isEdge = hx === 0 || hx === 4 || hz === 0 || hz === 4;
          const isDoor = hx === 2 && hz === 4 && (hy === 1 || hy === 2);
          const isWindow = (hx === 0 || hx === 4) && hz === 2 && hy === 2;

          if (isDoor) continue; // Walkway into house

          const wallKey = this.getKey(houseX + hx, groundY + hy, houseZ + hz);
          if (isCorner) {
            this.blocks.set(wallKey, 'wood');
            bSet.add(wallKey);
          } else if (isWindow) {
            this.blocks.set(wallKey, 'glass');
            bSet.add(wallKey);
          } else if (isEdge) {
            this.blocks.set(wallKey, 'planks');
            bSet.add(wallKey);
          } else {
            // Interior: clear air
            this.blocks.delete(wallKey);
            bSet.delete(wallKey);
          }
        }

        // Cobblestone Roof
        const roofKey = this.getKey(houseX + hx, groundY + 4, houseZ + hz);
        this.blocks.set(roofKey, 'cobblestone');
        bSet.add(roofKey);
      }
    }
    // Interior Bookshelf and Torch in house
    this.blocks.set(this.getKey(houseX + 1, groundY + 1, houseZ + 1), 'bookshelf');
    this.blocks.set(this.getKey(houseX + 1, groundY + 2, houseZ + 1), 'torch');
    bSet.add(this.getKey(houseX + 1, groundY + 1, houseZ + 1));
    bSet.add(this.getKey(houseX + 1, groundY + 2, houseZ + 1));

    // 3. Village Farm Plot (6x5 field with irrigated crops & hay bales)
    const farmX = baseX + 7;
    const farmZ = baseZ;
    for (let fx = 0; fx < 5; fx++) {
      for (let fz = 0; fz < 5; fz++) {
        const isBorder = fx === 0 || fx === 4 || fz === 0 || fz === 4;
        const groundKey = this.getKey(farmX + fx, groundY, farmZ + fz);

        if (isBorder) {
          this.blocks.set(groundKey, 'wood');
          bSet.add(groundKey);
        } else if (fx === 2) {
          // Central irrigation ditch
          this.blocks.set(groundKey, 'cobblestone');
          bSet.add(groundKey);
        } else {
          // Farmland with ripe wheat!
          this.blocks.set(groundKey, 'farmland');
          bSet.add(groundKey);
          const cropKey = this.getKey(farmX + fx, groundY + 1, farmZ + fz);
          this.blocks.set(cropKey, 'wheat_crop');
          bSet.add(cropKey);
        }
      }
    }

    // Stacked Hay Bales next to the farm
    const hayCoords = [
      [farmX + 5, groundY + 1, farmZ + 1],
      [farmX + 5, groundY + 1, farmZ + 2],
      [farmX + 5, groundY + 2, farmZ + 1]
    ];
    hayCoords.forEach(([hx, hy, hz]) => {
      const k = this.getKey(hx, hy, hz);
      this.blocks.set(k, 'hay_block');
      bSet.add(k);
    });

    // 4. Village Well / Fountain in Center
    const wellX = baseX + 5;
    const wellZ = baseZ + 7;
    for (let wx = -1; wx <= 1; wx++) {
      for (let wz = -1; wz <= 1; wz++) {
        const isCenter = wx === 0 && wz === 0;
        const wk = this.getKey(wellX + wx, groundY + 1, wellZ + wz);
        if (!isCenter) {
          this.blocks.set(wk, 'cobblestone');
          bSet.add(wk);
        }
      }
    }
    // Well corner posts and roof
    const wellCorners = [[wellX - 1, wellZ - 1], [wellX + 1, wellZ - 1], [wellX - 1, wellZ + 1], [wellX + 1, wellZ + 1]];
    wellCorners.forEach(([cx, cz]) => {
      this.blocks.set(this.getKey(cx, groundY + 2, cz), 'wood');
      this.blocks.set(this.getKey(cx, groundY + 3, cz), 'wood');
      bSet.add(this.getKey(cx, groundY + 2, cz));
      bSet.add(this.getKey(cx, groundY + 3, cz));
    });
    for (let rx = -1; rx <= 1; rx++) {
      for (let rz = -1; rz <= 1; rz++) {
        const rk = this.getKey(wellX + rx, groundY + 4, wellZ + rz);
        this.blocks.set(rk, 'planks');
        bSet.add(rk);
      }
    }
  }

  private spawnTree(rootX: number, rootY: number, rootZ: number, bSet: Set<string>) {
    const trunkHeight = 4 + Math.floor(Math.random() * 2);

    // Wood trunk
    for (let dy = 0; dy < trunkHeight; dy++) {
      const k = this.getKey(rootX, rootY + dy, rootZ);
      this.blocks.set(k, 'wood');
      bSet.add(k);
    }

    // Leaves canopy
    const leafBaseY = rootY + trunkHeight - 2;
    for (let ly = 0; ly <= 3; ly++) {
      const radius = ly >= 2 ? 1 : 2;
      for (let lx = -radius; lx <= radius; lx++) {
        for (let lz = -radius; lz <= radius; lz++) {
          if (ly >= 2 && Math.abs(lx) === 1 && Math.abs(lz) === 1) continue;
          const k = this.getKey(rootX + lx, leafBaseY + ly, rootZ + lz);
          if (!this.blocks.has(k)) {
            this.blocks.set(k, 'leaves');
            bSet.add(k);
          }
        }
      }
    }
  }

  private spawnCactus(rootX: number, rootY: number, rootZ: number, bSet: Set<string>) {
    const height = 2 + Math.floor(Math.random() * 2); // 2 or 3 blocks tall
    for (let dy = 0; dy < height; dy++) {
      const k = this.getKey(rootX, rootY + dy, rootZ);
      this.blocks.set(k, 'cactus');
      bSet.add(k);
    }
  }

  private spawnSpruceTree(rootX: number, rootY: number, rootZ: number, bSet: Set<string>) {
    const trunkHeight = 6 + Math.floor(Math.random() * 2);
    // Straight tall wood trunk
    for (let dy = 0; dy < trunkHeight; dy++) {
      const k = this.getKey(rootX, rootY + dy, rootZ);
      this.blocks.set(k, 'wood');
      bSet.add(k);
    }

    // Top spike
    const topKey = this.getKey(rootX, rootY + trunkHeight, rootZ);
    this.blocks.set(topKey, 'leaves');
    bSet.add(topKey);
    const snowTopKey = this.getKey(rootX, rootY + trunkHeight + 1, rootZ);
    this.blocks.set(snowTopKey, 'snow_block');
    bSet.add(snowTopKey);

    // Tiered conical branches
    const tiers = [
      { yOffset: trunkHeight - 1, radius: 1 },
      { yOffset: trunkHeight - 2, radius: 2 },
      { yOffset: trunkHeight - 3, radius: 1 },
      { yOffset: trunkHeight - 4, radius: 2 },
      { yOffset: trunkHeight - 5, radius: 1 }
    ];

    for (const tier of tiers) {
      const ly = rootY + tier.yOffset;
      const r = tier.radius;
      for (let lx = -r; lx <= r; lx++) {
        for (let lz = -r; lz <= r; lz++) {
          if (r === 2 && Math.abs(lx) === 2 && Math.abs(lz) === 2) continue;
          const k = this.getKey(rootX + lx, ly, rootZ + lz);
          if (!this.blocks.has(k)) {
            this.blocks.set(k, 'leaves');
            bSet.add(k);
          }
        }
      }
    }
  }

  private spawnSwampTree(rootX: number, rootY: number, rootZ: number, bSet: Set<string>) {
    const trunkHeight = 4 + Math.floor(Math.random() * 2);
    // Gnarled wood trunk
    for (let dy = 0; dy < trunkHeight; dy++) {
      const k = this.getKey(rootX, rootY + dy, rootZ);
      this.blocks.set(k, 'wood');
      bSet.add(k);
    }

    // Broad drooping swamp canopy
    const leafBaseY = rootY + trunkHeight - 1;
    for (let ly = -1; ly <= 2; ly++) {
      const radius = ly === 2 ? 1 : 3;
      for (let lx = -radius; lx <= radius; lx++) {
        for (let lz = -radius; lz <= radius; lz++) {
          if (radius === 3 && (Math.abs(lx) + Math.abs(lz) > 4)) continue;
          const k = this.getKey(rootX + lx, leafBaseY + ly, rootZ + lz);
          if (!this.blocks.has(k)) {
            this.blocks.set(k, 'leaves');
            bSet.add(k);
          }
        }
      }
    }

    // Drooping hanging leaf vines around perimeter
    const vineOffsets = [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -1], [2, 1]];
    for (const [vx, vz] of vineOffsets) {
      const vk = this.getKey(rootX + vx, leafBaseY - 2, rootZ + vz);
      if (!this.blocks.has(vk)) {
        this.blocks.set(vk, 'leaves');
        bSet.add(vk);
      }
    }
  }

  // Dynamic chunk loading when player moves
  public updateActiveChunks(centerCx: number, centerCz: number): boolean {
    let newlyGenerated = false;
    const r = this.renderRadius;

    for (let cx = centerCx - r; cx <= centerCx + r; cx++) {
      for (let cz = centerCz - r; cz <= centerCz + r; cz++) {
        const key = `${cx},${cz}`;
        if (!this.generatedChunks.has(key)) {
          this.generateChunk(cx, cz);
          newlyGenerated = true;
        }
      }
    }

    if (centerCx !== this.centerChunkX || centerCz !== this.centerChunkZ || newlyGenerated) {
      this.centerChunkX = centerCx;
      this.centerChunkZ = centerCz;
      this.dirty = true;
      return true;
    }
    return false;
  }

  public setRenderRadius(radius: number, playerPos?: THREE.Vector3) {
    this.renderRadius = Math.max(2, Math.min(4, radius));
    if (playerPos) {
      this.update(0, playerPos);
    }
  }

  public generateTerrain(seed: number = 88888, worldType: WorldType = 'default') {
    this.currentSeed = seed;
    this.currentWorldType = worldType;
    this.blocks.clear();
    this.generatedChunks.clear();
    this.chunkBlocks.clear();
    this.playerModifications.clear();
    this.villageLocations = [];
    this.centerChunkX = 0;
    this.centerChunkZ = 0;

    const r = this.renderRadius;
    for (let cx = -r; cx <= r; cx++) {
      for (let cz = -r; cz <= r; cz++) {
        this.generateChunk(cx, cz);
      }
    }

    this.rebuildMeshes();
  }

  public loadWorld(data: import('../types').WorldSaveData) {
    this.currentSeed = data.seed ?? 88888;
    this.currentWorldType = data.worldType ?? 'default';
    this.blocks.clear();
    this.generatedChunks.clear();
    this.chunkBlocks.clear();
    this.playerModifications.clear();
    this.villageLocations = [];

    if (data.modifiedBlocks) {
      Object.entries(data.modifiedBlocks).forEach(([k, val]) => {
        this.playerModifications.set(k, val);
      });
    }

    const playerX = data.player?.x ?? 0;
    const playerZ = data.player?.z ?? 0;
    const pcX = Math.floor(playerX / this.chunkSize);
    const pcZ = Math.floor(playerZ / this.chunkSize);
    this.centerChunkX = pcX;
    this.centerChunkZ = pcZ;

    const r = this.renderRadius;
    for (let cx = pcX - r; cx <= pcX + r; cx++) {
      for (let cz = pcZ - r; cz <= pcZ + r; cz++) {
        this.generateChunk(cx, cz);
      }
    }

    this.rebuildMeshes();
  }

  private isOpaque(type: BlockType): boolean {
    return (
      type !== 'air' &&
      type !== 'leaves' &&
      type !== 'golden_leaves' &&
      type !== 'glass' &&
      type !== 'torch' &&
      type !== 'wheat_crop' &&
      type !== 'cloud_block' &&
      type !== 'water'
    );
  }

  // Fast direct block lookup without re-triggering recursive chunk generation during rebuildMeshes
  public getBlockDirect(x: number, y: number, z: number): BlockType {
    const key = this.getKey(x, y, z);
    return this.blocks.get(key) || 'air';
  }

  private isExposed(x: number, y: number, z: number, currentType: BlockType): boolean {
    if (
      currentType === 'torch' ||
      currentType === 'glass' ||
      currentType === 'leaves' ||
      currentType === 'golden_leaves' ||
      currentType === 'wheat_crop' ||
      currentType === 'cloud_block' ||
      currentType === 'water'
    ) return true;

    // Use direct lookup so we never cause re-entrant chunk generation
    const neighbors = [
      this.getBlockDirect(x + 1, y, z),
      this.getBlockDirect(x - 1, y, z),
      this.getBlockDirect(x, y + 1, z),
      this.getBlockDirect(x, y - 1, z),
      this.getBlockDirect(x, y, z + 1),
      this.getBlockDirect(x, y, z - 1)
    ];

    return neighbors.some((n) => !this.isOpaque(n));
  }

  public rebuildMeshes() {
    const counts: Map<BlockType, number> = new Map();
    this.instancedMeshes.forEach((_, type) => counts.set(type, 0));

    const r = this.renderRadius;
    const minCx = this.centerChunkX - r;
    const maxCx = this.centerChunkX + r;
    const minCz = this.centerChunkZ - r;
    const maxCz = this.centerChunkZ + r;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const chunkKey = `${cx},${cz}`;
        const bSet = this.chunkBlocks.get(chunkKey);
        if (!bSet) continue;

        bSet.forEach((key) => {
          const type = this.blocks.get(key);
          if (!type || type === 'air') return;

          const imesh = this.instancedMeshes.get(type);
          if (!imesh) return;

          const [x, y, z] = key.split(',').map(Number);
          if (!this.isExposed(x, y, z, type)) return;

          const idx = counts.get(type) || 0;
          const max = this.maxInstances.get(type) || 10000;
          if (idx < max) {
            if (type === 'torch') {
              this.dummy.position.set(x + 0.5, y + 0.3, z + 0.5);
              this.dummy.scale.set(0.18, 0.6, 0.18);
            } else if (type === 'wheat_crop') {
              this.dummy.position.set(x + 0.5, y + 0.45, z + 0.5);
              this.dummy.scale.set(0.9, 0.9, 0.9);
            } else {
              this.dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
              this.dummy.scale.set(1, 1, 1);
            }
            this.dummy.updateMatrix();
            imesh.setMatrixAt(idx, this.dummy.matrix);
            counts.set(type, idx + 1);
          }
        });
      }
    }

    // Update instance counts and upload to GPU
    this.instancedMeshes.forEach((imesh, type) => {
      const c = counts.get(type) || 0;
      imesh.count = c;
      if (imesh.instanceMatrix) {
        imesh.instanceMatrix.needsUpdate = true;
      }
      if (c > 0) {
        imesh.computeBoundingSphere();
        imesh.computeBoundingBox();
      }
    });

    this.dirty = false;
  }

  public update(delta: number, playerPos?: THREE.Vector3) {
    if (playerPos) {
      const cx = Math.floor(playerPos.x / this.chunkSize);
      const cz = Math.floor(playerPos.z / this.chunkSize);
      this.updateActiveChunks(cx, cz);
    }

    if (this.dirty) {
      this.rebuildMeshes();
    }

    // Update break particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.velocity.y -= 14 * delta; // gravity
      p.position.addScaledVector(p.velocity, delta);
      p.mesh.position.copy(p.position);
      p.mesh.scale.setScalar(Math.max(0.01, p.life * 2));
    }
  }

  private spawnBreakParticles(cx: number, cy: number, cz: number, blockType: BlockType) {
    const mat = textureManager.getMaterial(blockType);
    const particleMat = Array.isArray(mat) ? mat[0] : mat;

    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(this.particleGeom, particleMat);
      const pos = new THREE.Vector3(
        cx + (Math.random() - 0.5) * 0.6,
        cy + (Math.random() - 0.5) * 0.6,
        cz + (Math.random() - 0.5) * 0.6
      );
      mesh.position.copy(pos);
      this.scene.add(mesh);

      this.particles.push({
        position: pos,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 4
        ),
        mesh,
        life: 0.5 + Math.random() * 0.3
      });
    }
  }

  // Fast DDA Raycast for Minecraft Voxel Grids
  public raycastVoxel(
    rayOrigin: THREE.Vector3,
    rayDir: THREE.Vector3,
    maxDistance: number = 6
  ): {
    hit: boolean;
    blockPos: { x: number; y: number; z: number };
    faceNormal: { x: number; y: number; z: number };
    blockType: BlockType;
  } | null {
    let px = Math.floor(rayOrigin.x);
    let py = Math.floor(rayOrigin.y);
    let pz = Math.floor(rayOrigin.z);

    const stepX = rayDir.x > 0 ? 1 : -1;
    const stepY = rayDir.y > 0 ? 1 : -1;
    const stepZ = rayDir.z > 0 ? 1 : -1;

    const deltaDistX = Math.abs(1 / (rayDir.x || 1e-6));
    const deltaDistY = Math.abs(1 / (rayDir.y || 1e-6));
    const deltaDistZ = Math.abs(1 / (rayDir.z || 1e-6));

    let sideDistX = (stepX > 0 ? px + 1 - rayOrigin.x : rayOrigin.x - px) * deltaDistX;
    let sideDistY = (stepY > 0 ? py + 1 - rayOrigin.y : rayOrigin.y - py) * deltaDistY;
    let sideDistZ = (stepZ > 0 ? pz + 1 - rayOrigin.z : rayOrigin.z - pz) * deltaDistZ;

    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;
    let dist = 0;

    while (dist < maxDistance) {
      const block = this.getBlock(px, py, pz);
      if (block !== 'air') {
        return {
          hit: true,
          blockPos: { x: px, y: py, z: pz },
          faceNormal: { x: normalX, y: normalY, z: normalZ },
          blockType: block
        };
      }

      if (sideDistX < sideDistY) {
        if (sideDistX < sideDistZ) {
          dist = sideDistX;
          sideDistX += deltaDistX;
          px += stepX;
          normalX = -stepX;
          normalY = 0;
          normalZ = 0;
        } else {
          dist = sideDistZ;
          sideDistZ += deltaDistZ;
          pz += stepZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      } else {
        if (sideDistY < sideDistZ) {
          dist = sideDistY;
          sideDistY += deltaDistY;
          py += stepY;
          normalX = 0;
          normalY = -stepY;
          normalZ = 0;
        } else {
          dist = sideDistZ;
          sideDistZ += deltaDistZ;
          pz += stepZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      }
    }

    return null;
  }

  public getSpawnPosition(): THREE.Vector3 {
    // Find highest solid block around center
    for (let y = this.worldHeight; y >= 0; y--) {
      const block = this.getBlock(0, y, 0);
      if (block !== 'air') {
        return new THREE.Vector3(0.5, y + 2.6, 0.5);
      }
    }
    return new THREE.Vector3(0.5, 12, 0.5);
  }
}
