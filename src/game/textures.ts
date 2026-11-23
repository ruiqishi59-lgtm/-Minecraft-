import * as THREE from 'three';
import { BlockType } from '../types';

export class TextureManager {
  private textures: Map<string, THREE.CanvasTexture> = new Map();
  private materials: Map<BlockType, THREE.Material | THREE.Material[]> = new Map();

  constructor() {
    this.generateAllTextures();
    this.generateMaterials();
  }

  private createCanvas(draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    draw(ctx);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  private generateAllTextures() {
    // 1. Dirt
    this.textures.set('dirt', this.createCanvas((ctx) => {
      const colors = ['#866043', '#79553a', '#6f4e34', '#5c3e27', '#936949'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }));

    // 2. Grass Top
    this.textures.set('grass_top', this.createCanvas((ctx) => {
      const colors = ['#5b8f32', '#4e8226', '#689d3a', '#43731d', '#55872d'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }));

    // 3. Grass Side (Dirt with grass hanging down)
    this.textures.set('grass_side', this.createCanvas((ctx) => {
      const dirtColors = ['#866043', '#79553a', '#6f4e34', '#5c3e27'];
      const grassColors = ['#5b8f32', '#4e8226', '#689d3a', '#43731d'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = dirtColors[Math.floor(Math.random() * dirtColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Top 3-5 pixels grass drips
      for (let x = 0; x < 16; x++) {
        const depth = 3 + Math.floor(Math.sin(x * 1.5) * 1.5 + (x % 3));
        for (let y = 0; y < depth; y++) {
          ctx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }));

    // 4. Stone
    this.textures.set('stone', this.createCanvas((ctx) => {
      const colors = ['#7c7c7c', '#6d6d6d', '#858585', '#636363', '#919191'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }));

    // 5. Cobblestone
    this.textures.set('cobblestone', this.createCanvas((ctx) => {
      ctx.fillStyle = '#656565';
      ctx.fillRect(0, 0, 16, 16);
      const stoneLight = '#9a9a9a';
      const stoneDark = '#3d3d3d';
      const stoneMid = '#787878';

      // Draw pebble outlines
      const rocks = [
        [1, 1, 6, 5], [8, 1, 7, 4],
        [1, 7, 5, 4], [7, 6, 8, 5],
        [2, 12, 6, 3], [9, 12, 6, 3]
      ];
      rocks.forEach(([rx, ry, rw, rh]) => {
        ctx.fillStyle = stoneMid;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.fillStyle = stoneLight;
        ctx.fillRect(rx, ry, rw - 1, 1);
        ctx.fillRect(rx, ry, 1, rh - 1);
        ctx.fillStyle = stoneDark;
        ctx.fillRect(rx + rw - 1, ry, 1, rh);
        ctx.fillRect(rx, ry + rh - 1, rw, 1);
      });
    }));

    // 6. Wood Side (Bark)
    this.textures.set('wood_side', this.createCanvas((ctx) => {
      const barkColors = ['#675231', '#544225', '#735c38', '#45351c'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const colIndex = Math.floor(Math.random() * barkColors.length);
          ctx.fillStyle = barkColors[colIndex];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Vertical bark streaks
      ctx.fillStyle = '#3a2d17';
      ctx.fillRect(3, 0, 1, 16);
      ctx.fillRect(8, 0, 1, 16);
      ctx.fillRect(13, 0, 1, 16);
    }));

    // 7. Wood Top (Log Rings)
    this.textures.set('wood_top', this.createCanvas((ctx) => {
      ctx.fillStyle = '#544225'; // bark ring
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#a6895b'; // wood inner
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#8f7348';
      ctx.fillRect(4, 4, 8, 8);
      ctx.fillStyle = '#a6895b';
      ctx.fillRect(6, 6, 4, 4);
      ctx.fillStyle = '#785f38';
      ctx.fillRect(7, 7, 2, 2);
    }));

    // 8. Planks
    this.textures.set('planks', this.createCanvas((ctx) => {
      const colors = ['#b8945f', '#a98552', '#c6a26c', '#9c7946'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Horizontal slats
      ctx.fillStyle = '#614923';
      ctx.fillRect(0, 4, 16, 1);
      ctx.fillRect(0, 8, 16, 1);
      ctx.fillRect(0, 12, 16, 1);
      // Nail specks
      ctx.fillStyle = '#403016';
      ctx.fillRect(1, 2, 1, 1);
      ctx.fillRect(14, 6, 1, 1);
      ctx.fillRect(2, 10, 1, 1);
      ctx.fillRect(13, 14, 1, 1);
    }));

    // 9. Leaves
    this.textures.set('leaves', this.createCanvas((ctx) => {
      ctx.clearRect(0, 0, 16, 16);
      const leafColors = ['#38761d', '#274e13', '#458b24', '#2d6018'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (Math.random() > 0.18) {
            ctx.fillStyle = leafColors[Math.floor(Math.random() * leafColors.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }));

    // 10. Sand
    this.textures.set('sand', this.createCanvas((ctx) => {
      const colors = ['#dfd59e', '#d8cc8e', '#e6ddae', '#cfc280'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }));

    // 11. Coal Ore
    this.textures.set('coal_ore', this.createCanvas((ctx) => {
      const stoneColors = ['#7c7c7c', '#6d6d6d', '#858585', '#636363'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#1c1c1c';
      const coalSpots = [[3, 3], [4, 3], [4, 4], [8, 7], [9, 7], [9, 8], [10, 8], [3, 11], [4, 11], [11, 3], [12, 4]];
      coalSpots.forEach(([x, y]) => ctx.fillRect(x, y, 2, 2));
    }));

    // 12. Iron Ore
    this.textures.set('iron_ore', this.createCanvas((ctx) => {
      const stoneColors = ['#7c7c7c', '#6d6d6d', '#858585', '#636363'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#d8af93';
      const ironSpots = [[3, 4], [4, 4], [8, 6], [9, 6], [4, 10], [5, 10], [11, 11], [12, 11]];
      ironSpots.forEach(([x, y]) => {
        ctx.fillRect(x, y, 2, 2);
        ctx.fillStyle = '#b78b6f';
        ctx.fillRect(x + 1, y + 1, 1, 1);
        ctx.fillStyle = '#d8af93';
      });
    }));

    // 13. Brick
    this.textures.set('brick', this.createCanvas((ctx) => {
      ctx.fillStyle = '#cfcfcf'; // mortar
      ctx.fillRect(0, 0, 16, 16);
      const brickColors = ['#9c4939', '#8f3f31', '#b05442'];
      // row 1
      ctx.fillStyle = brickColors[0];
      ctx.fillRect(0, 1, 7, 3);
      ctx.fillStyle = brickColors[1];
      ctx.fillRect(8, 1, 8, 3);
      // row 2
      ctx.fillStyle = brickColors[2];
      ctx.fillRect(0, 5, 3, 3);
      ctx.fillStyle = brickColors[0];
      ctx.fillRect(4, 5, 7, 3);
      ctx.fillStyle = brickColors[1];
      ctx.fillRect(12, 5, 4, 3);
      // row 3
      ctx.fillStyle = brickColors[1];
      ctx.fillRect(0, 9, 7, 3);
      ctx.fillStyle = brickColors[2];
      ctx.fillRect(8, 9, 8, 3);
      // row 4
      ctx.fillStyle = brickColors[0];
      ctx.fillRect(0, 13, 4, 3);
      ctx.fillStyle = brickColors[1];
      ctx.fillRect(5, 13, 7, 3);
      ctx.fillStyle = brickColors[2];
      ctx.fillRect(13, 13, 3, 3);
    }));

    // 14. Glass
    this.textures.set('glass', this.createCanvas((ctx) => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(230, 245, 255, 0.4)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 15, 15);
      // Glass sheen diagonal stripes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(2, 2, 2, 1);
      ctx.fillRect(3, 3, 3, 1);
      ctx.fillRect(5, 4, 2, 1);
      ctx.fillRect(9, 10, 3, 1);
      ctx.fillRect(11, 11, 3, 1);
    }));

    // 15. Torch
    this.textures.set('torch', this.createCanvas((ctx) => {
      ctx.clearRect(0, 0, 16, 16);
      // Stick
      ctx.fillStyle = '#614923';
      ctx.fillRect(7, 5, 2, 9);
      // Fire top
      ctx.fillStyle = '#ff9900';
      ctx.fillRect(6, 2, 4, 4);
      ctx.fillStyle = '#ffee33';
      ctx.fillRect(7, 3, 2, 2);
    }));

    // 16. Glowstone (Luminous golden crystal block)
    this.textures.set('glowstone', this.createCanvas((ctx) => {
      const colors = ['#f5bc42', '#ffd966', '#d49b28', '#fff2b2', '#ba8318'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#ffffff';
      const sparkles = [[2, 3], [7, 8], [12, 4], [4, 12], [11, 11]];
      sparkles.forEach(([sx, sy]) => {
        ctx.fillRect(sx, sy, 1, 1);
      });
    }));

    // 17. Hay Block (Wheat bundle with red ties)
    this.textures.set('hay_block_side', this.createCanvas((ctx) => {
      const hayColors = ['#d4af37', '#e6c855', '#c29d2b', '#b38b1f'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = hayColors[Math.floor(Math.random() * hayColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Red string bands
      ctx.fillStyle = '#b71c1c';
      ctx.fillRect(0, 4, 16, 1);
      ctx.fillRect(0, 11, 16, 1);
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(0, 5, 16, 1);
      ctx.fillRect(0, 12, 16, 1);
    }));

    this.textures.set('hay_block_top', this.createCanvas((ctx) => {
      ctx.fillStyle = '#b38b1f';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#e6c855';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#b71c1c';
      ctx.strokeRect(3.5, 3.5, 9, 9);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(5, 5, 6, 6);
    }));

    // 18. Bookshelf
    this.textures.set('bookshelf', this.createCanvas((ctx) => {
      // Oak wood background
      ctx.fillStyle = '#a6804a';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#543d22';
      ctx.fillRect(0, 7, 16, 2);
      ctx.strokeRect(0.5, 0.5, 15, 15);
      // Row 1 Books
      const bookColors = ['#b71c1c', '#1565c0', '#2e7d32', '#6a1b9a', '#d84315', '#00838f'];
      let bx = 1;
      while (bx < 15) {
        const w = 1 + (bx % 2);
        ctx.fillStyle = bookColors[(bx * 3) % bookColors.length];
        ctx.fillRect(bx, 2, w, 5);
        ctx.fillStyle = '#fff9c4'; // pages
        ctx.fillRect(bx, 1, w, 1);
        bx += w + 1;
      }
      // Row 2 Books
      bx = 1;
      while (bx < 15) {
        const w = 1 + ((bx + 1) % 2);
        ctx.fillStyle = bookColors[(bx * 5) % bookColors.length];
        ctx.fillRect(bx, 10, w, 5);
        ctx.fillStyle = '#fff9c4';
        ctx.fillRect(bx, 9, w, 1);
        bx += w + 1;
      }
    }));

    // 19. Farmland
    this.textures.set('farmland_top', this.createCanvas((ctx) => {
      ctx.fillStyle = '#4a2f16';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y += 2) {
        ctx.fillStyle = '#3a220e';
        ctx.fillRect(0, y, 16, 1);
      }
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = '#5c3e21';
        ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
      }
    }));

    // 20. Wheat Crop
    this.textures.set('wheat_crop', this.createCanvas((ctx) => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = '#fbc02d';
      for (let x = 2; x < 15; x += 3) {
        ctx.fillRect(x, 4, 2, 12);
        ctx.fillStyle = '#fff59d';
        ctx.fillRect(x - 1, 3, 3, 4);
        ctx.fillStyle = '#7cb342';
        ctx.fillRect(x, 10, 1, 6);
        ctx.fillStyle = '#fbc02d';
      }
    }));

    // 21. Aether Grass (Cyan celestial grass)
    this.textures.set('aether_grass_top', this.createCanvas((ctx) => {
      const colors = ['#26c6da', '#00b4d8', '#80deea', '#0096c7', '#ade8f4'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 4, 1, 1);
      ctx.fillRect(10, 11, 1, 1);
      ctx.fillRect(8, 2, 1, 1);
    }));

    this.textures.set('aether_grass_side', this.createCanvas((ctx) => {
      const dirtColors = ['#5e548e', '#4d4375', '#6f5e9c', '#3c3559'];
      const grassColors = ['#26c6da', '#00b4d8', '#80deea', '#ade8f4'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = dirtColors[Math.floor(Math.random() * dirtColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      for (let x = 0; x < 16; x++) {
        const depth = 3 + Math.floor(Math.sin(x * 1.3) * 1.5 + (x % 3));
        for (let y = 0; y < depth; y++) {
          ctx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }));

    // 22. Aether Dirt
    this.textures.set('aether_dirt', this.createCanvas((ctx) => {
      const colors = ['#5e548e', '#4d4375', '#6f5e9c', '#3c3559', '#7b68a6'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }));

    // 23. Aether Wood
    this.textures.set('aether_wood_side', this.createCanvas((ctx) => {
      const colors = ['#cfd8dc', '#b0bec5', '#eceff1', '#90a4ae'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#78909c';
      ctx.fillRect(4, 0, 1, 16);
      ctx.fillRect(11, 0, 1, 16);
    }));

    this.textures.set('aether_wood_top', this.createCanvas((ctx) => {
      ctx.fillStyle = '#90a4ae';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(4, 4, 8, 8);
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(6, 6, 4, 4);
    }));

    // 24. Golden Leaves (Shimmering celestial foliage)
    this.textures.set('golden_leaves', this.createCanvas((ctx) => {
      const colors = ['#ffc107', '#ffb300', '#ffa000', '#ffd54f', '#ffe082'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if ((x + y) % 5 === 0) {
            ctx.clearRect(x, y, 1, 1);
          } else {
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 3, 1, 1);
      ctx.fillRect(9, 12, 1, 1);
    }));

    // 25. Cloud Block (Volumetric walkable cloud)
    this.textures.set('cloud_block', this.createCanvas((ctx) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(230, 240, 255, 0.9)';
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 2, 8, 4);
      ctx.fillRect(6, 8, 7, 5);
    }));

    // 26. Emerald Block
    this.textures.set('emerald_block', this.createCanvas((ctx) => {
      ctx.fillStyle = '#00c853';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#69f0ae';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#00b248';
      ctx.strokeRect(1.5, 1.5, 13, 13);
      ctx.fillStyle = '#b9f6ca';
      ctx.fillRect(3, 3, 5, 5);
      ctx.fillStyle = '#00701a';
      ctx.fillRect(8, 8, 5, 5);
    }));

    // 27. Diamond Ore
    this.textures.set('diamond_ore', this.createCanvas((ctx) => {
      const stoneColors = ['#7c7c7c', '#6d6d6d', '#858585', '#636363'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Sparkling diamond flecks
      const gems = [[3, 3], [4, 4], [9, 2], [10, 3], [5, 10], [6, 11], [11, 9], [12, 10], [2, 12]];
      gems.forEach(([gx, gy]) => {
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(gx, gy, 2, 2);
        ctx.fillStyle = '#e0f7fa';
        ctx.fillRect(gx, gy, 1, 1);
        ctx.fillStyle = '#0097a7';
        ctx.fillRect(gx + 1, gy + 1, 1, 1);
      });
    }));

    // 28. Diamond Block
    this.textures.set('diamond_block', this.createCanvas((ctx) => {
      ctx.fillStyle = '#00bcd4';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#80deea';
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillStyle = '#00acc1';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#e0f7fa';
      ctx.fillRect(3, 3, 4, 4);
      ctx.fillStyle = '#26c6da';
      ctx.fillRect(7, 7, 7, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 2, 2);
      ctx.fillRect(12, 12, 1, 1);
    }));

    // 29. Redstone Ore
    this.textures.set('redstone_ore', this.createCanvas((ctx) => {
      const stoneColors = ['#7c7c7c', '#6d6d6d', '#858585', '#636363'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      const flecks = [[4, 3], [9, 4], [3, 9], [8, 10], [12, 6], [11, 12]];
      flecks.forEach(([fx, fy]) => {
        ctx.fillStyle = '#d50000';
        ctx.fillRect(fx, fy, 2, 2);
        ctx.fillStyle = '#ff5252';
        ctx.fillRect(fx, fy, 1, 1);
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(fx + 1, fy + 1, 1, 1);
      });
    }));

    // 30. Redstone Block
    this.textures.set('redstone_block', this.createCanvas((ctx) => {
      ctx.fillStyle = '#b71c1c';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#d50000';
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(3, 3, 10, 10);
      ctx.fillStyle = '#ff5252';
      ctx.fillRect(4, 4, 4, 4);
      ctx.fillStyle = '#ff8a80';
      ctx.fillRect(5, 5, 2, 2);
    }));

    // 31. Obsidian
    this.textures.set('obsidian', this.createCanvas((ctx) => {
      ctx.fillStyle = '#100a1c';
      ctx.fillRect(0, 0, 16, 16);
      const purples = ['#1e1430', '#2a1a45', '#3d2563', '#160d26', '#4a287a'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (Math.random() > 0.45) {
            ctx.fillStyle = purples[Math.floor(Math.random() * purples.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.fillStyle = '#7b1fa2';
      ctx.fillRect(3, 4, 2, 1);
      ctx.fillRect(10, 9, 2, 1);
      ctx.fillRect(6, 13, 1, 1);
    }));

    // 32. TNT Side
    this.textures.set('tnt_side', this.createCanvas((ctx) => {
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(0, 0, 16, 16);
      // Top & bottom dynamite stick segments
      for (let x = 0; x < 16; x += 4) {
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(x, 0, 1, 16);
      }
      // Middle white label
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 5, 16, 6);
      // TNT Text in pixels
      ctx.fillStyle = '#111111';
      // T
      ctx.fillRect(1, 6, 4, 1);
      ctx.fillRect(2, 7, 2, 3);
      // N
      ctx.fillRect(6, 6, 1, 4);
      ctx.fillRect(7, 7, 1, 1);
      ctx.fillRect(8, 8, 1, 1);
      ctx.fillRect(9, 6, 1, 4);
      // T
      ctx.fillRect(11, 6, 4, 1);
      ctx.fillRect(12, 7, 2, 3);
    }));

    // 33. TNT Top
    this.textures.set('tnt_top', this.createCanvas((ctx) => {
      ctx.fillStyle = '#c62828';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(4, 4, 8, 8);
      // Fuse
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(7, 7, 2, 2);
      ctx.fillStyle = '#212121';
      ctx.fillRect(8, 7, 1, 1);
    }));

    // 34. TNT Bottom
    this.textures.set('tnt_bottom', this.createCanvas((ctx) => {
      ctx.fillStyle = '#c62828';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(2, 2, 12, 12);
    }));

    // 35. Crafting Table Top
    this.textures.set('crafting_table_top', this.createCanvas((ctx) => {
      ctx.fillStyle = '#9c6f3b';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#b8864b';
      ctx.fillRect(1, 1, 14, 14);
      // 3x3 crafting grid
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(3, 3, 10, 10);
      ctx.fillStyle = '#7a4e29';
      for (let gx = 0; gx < 3; gx++) {
        for (let gy = 0; gy < 3; gy++) {
          ctx.fillRect(4 + gx * 3, 4 + gy * 3, 2, 2);
        }
      }
    }));

    // 36. Crafting Table Side
    this.textures.set('crafting_table_side', this.createCanvas((ctx) => {
      ctx.fillStyle = '#8d6338';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#b3824b';
      ctx.fillRect(1, 1, 14, 14);
      // Hanging tools
      ctx.fillStyle = '#424242';
      ctx.fillRect(3, 4, 3, 8);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(4, 8, 1, 5);
      ctx.fillStyle = '#616161';
      ctx.fillRect(10, 4, 3, 6);
    }));

    // 37. Furnace Front
    this.textures.set('furnace_front', this.createCanvas((ctx) => {
      ctx.fillStyle = '#757575';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#424242';
      ctx.strokeRect(1, 1, 14, 14);
      // Upper door slit
      ctx.fillStyle = '#212121';
      ctx.fillRect(3, 3, 10, 2);
      // Firebox opening
      ctx.fillStyle = '#1b1b1b';
      ctx.fillRect(3, 7, 10, 7);
      // Glowing embers
      ctx.fillStyle = '#ff6d00';
      ctx.fillRect(5, 9, 6, 4);
      ctx.fillStyle = '#ffab00';
      ctx.fillRect(6, 10, 4, 2);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(7, 11, 2, 1);
    }));

    // 38. Furnace Side
    this.textures.set('furnace_side', this.createCanvas((ctx) => {
      ctx.fillStyle = '#757575';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#616161';
      ctx.strokeRect(1, 1, 14, 14);
      for (let i = 0; i < 15; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#9e9e9e' : '#424242';
        ctx.fillRect(Math.floor(Math.random() * 14) + 1, Math.floor(Math.random() * 14) + 1, 2, 2);
      }
    }));

    // 39. Water (Animated-style azure stream)
    this.textures.set('water', this.createCanvas((ctx) => {
      ctx.fillStyle = '#1976d2';
      ctx.fillRect(0, 0, 16, 16);
      const waterCols = ['#2196f3', '#42a5f5', '#1e88e5', '#64b5f6'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if ((x + y) % 3 === 0) {
            ctx.fillStyle = waterCols[Math.floor(Math.random() * waterCols.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }));

    // 40. Lava (Molten magma)
    this.textures.set('lava', this.createCanvas((ctx) => {
      ctx.fillStyle = '#e65100';
      ctx.fillRect(0, 0, 16, 16);
      const lavaCols = ['#f57c00', '#ff9800', '#ffb74d', '#ff5722', '#d84315'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = lavaCols[Math.floor(Math.random() * lavaCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(4, 4, 3, 2);
      ctx.fillRect(10, 9, 3, 2);
    }));

    // 33. Snow Block
    this.textures.set('snow_block', this.createCanvas((ctx) => {
      const snowCols = ['#ffffff', '#fafdff', '#f3f8fd', '#e9f1f8', '#deecf7'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = snowCols[Math.floor(Math.random() * snowCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Subtle crystalline highlights
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 4, 1, 1);
      ctx.fillRect(11, 8, 1, 1);
      ctx.fillRect(7, 13, 1, 1);
    }));

    // 34. Cactus Side
    this.textures.set('cactus_side', this.createCanvas((ctx) => {
      const cactusCols = ['#457c26', '#3b6c1f', '#4f8a2c', '#335e19'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cactusCols[Math.floor(Math.random() * cactusCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Vertical ridges
      ctx.fillStyle = '#2b5015';
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillRect(4, 0, 1, 16);
      ctx.fillRect(8, 0, 1, 16);
      ctx.fillRect(12, 0, 1, 16);
      ctx.fillRect(15, 0, 1, 16);
      // Sharp thorns / spines
      ctx.fillStyle = '#1c340d';
      const thorns = [[2, 3], [6, 7], [10, 2], [14, 8], [2, 11], [7, 13], [11, 12], [13, 15]];
      thorns.forEach(([tx, ty]) => ctx.fillRect(tx, ty, 1, 1));
    }));

    // 35. Cactus Top
    this.textures.set('cactus_top', this.createCanvas((ctx) => {
      ctx.fillStyle = '#3f7223';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#315a1b';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#264714';
      ctx.fillRect(4, 4, 8, 8);
      ctx.fillStyle = '#4c862b';
      ctx.fillRect(6, 6, 4, 4);
    }));

    // 36. Sandstone Side
    this.textures.set('sandstone_side', this.createCanvas((ctx) => {
      const stoneCols = ['#dfd6a3', '#d6cb96', '#cac089', '#e5dcac'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = stoneCols[Math.floor(Math.random() * stoneCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Horizontal sediment strata lines
      ctx.fillStyle = '#bead71';
      ctx.fillRect(0, 4, 16, 1);
      ctx.fillRect(0, 10, 16, 1);
      ctx.fillStyle = '#a8985c';
      ctx.fillRect(0, 15, 16, 1);
    }));

    // 37. Sandstone Top
    this.textures.set('sandstone_top', this.createCanvas((ctx) => {
      const stoneCols = ['#dfd6a3', '#d8ce98', '#cebf86', '#e5dcb0'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = stoneCols[Math.floor(Math.random() * stoneCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#c5b47a';
      ctx.strokeRect(1.5, 1.5, 13, 13);
    }));

    // 38. Mud (Swamp)
    this.textures.set('mud', this.createCanvas((ctx) => {
      const mudCols = ['#3e2f20', '#342618', '#493726', '#2b1e12', '#413020'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = mudCols[Math.floor(Math.random() * mudCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Moist wetland damp sheen spots
      ctx.fillStyle = '#22160d';
      ctx.fillRect(3, 5, 2, 2);
      ctx.fillRect(10, 8, 3, 2);
      ctx.fillRect(5, 12, 2, 2);
    }));

    // 39. Stone Bricks (裝飾石磚)
    this.textures.set('stone_bricks', this.createCanvas((ctx) => {
      const stoneCols = ['#7e7e7e', '#747474', '#868686', '#6b6b6b'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = stoneCols[Math.floor(Math.random() * stoneCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Mortar seams
      ctx.fillStyle = '#474747';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 8, 16, 1);
      ctx.fillRect(0, 0, 1, 8);
      ctx.fillRect(8, 0, 1, 8);
      ctx.fillRect(4, 8, 1, 8);
      ctx.fillRect(12, 8, 1, 8);
      // Subtle bevel highlights
      ctx.fillStyle = '#9b9b9b';
      ctx.fillRect(1, 1, 7, 1);
      ctx.fillRect(9, 1, 7, 1);
      ctx.fillRect(5, 9, 7, 1);
    }));

    // 40. Chiseled Stone Bricks (浮雕石磚)
    this.textures.set('chiseled_stone', this.createCanvas((ctx) => {
      ctx.fillStyle = '#757575';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#484848';
      ctx.strokeRect(0.5, 0.5, 15, 15);
      ctx.strokeRect(3.5, 3.5, 9, 9);
      ctx.fillStyle = '#999999';
      ctx.fillRect(2, 2, 12, 1);
      ctx.fillRect(2, 2, 1, 12);
      ctx.fillStyle = '#555555';
      ctx.fillRect(5, 5, 6, 6);
      ctx.fillStyle = '#a3a3a3';
      ctx.fillRect(6, 6, 4, 4);
      ctx.fillStyle = '#3c3c3c';
      ctx.fillRect(7, 7, 2, 2);
    }));

    // 41. Lantern Block (照明燈籠)
    this.textures.set('lantern', this.createCanvas((ctx) => {
      ctx.fillStyle = '#2c313a';
      ctx.fillRect(0, 0, 16, 16);
      // Iron frame bars
      ctx.fillStyle = '#454e59';
      ctx.fillRect(1, 1, 14, 2);
      ctx.fillRect(1, 13, 14, 2);
      // Warm glowing paper/glass core
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(3, 3, 10, 10);
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(4, 4, 8, 8);
      ctx.fillStyle = '#fff8e1';
      ctx.fillRect(6, 5, 4, 6);
      // Center cross iron lattice
      ctx.fillStyle = '#262b33';
      ctx.fillRect(7, 3, 2, 10);
      ctx.fillRect(3, 7, 10, 2);
    }));

    // 42. Quartz Block (平滑石英塊)
    this.textures.set('quartz_block', this.createCanvas((ctx) => {
      const qCols = ['#f4f0e8', '#eee9df', '#faf7f2', '#e7e1d5'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = qCols[Math.floor(Math.random() * qCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#d5cec0';
      ctx.strokeRect(0.5, 0.5, 15, 15);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, 1, 14, 1);
      ctx.fillRect(1, 1, 1, 14);
    }));

    // 43. Terracotta (紅陶磚瓦)
    this.textures.set('terracotta', this.createCanvas((ctx) => {
      const terraCols = ['#9e5138', '#934931', '#aa5a40', '#87422c'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = terraCols[Math.floor(Math.random() * terraCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Subtle geometric ceramic glaze pattern
      ctx.fillStyle = '#b9694f';
      ctx.fillRect(2, 2, 12, 1);
      ctx.fillRect(2, 13, 12, 1);
      ctx.fillStyle = '#733421';
      ctx.fillRect(4, 5, 8, 6);
      ctx.fillStyle = '#c47b60';
      ctx.fillRect(5, 6, 6, 4);
    }));

    // 44. Oak Pillar (雕紋木柱)
    this.textures.set('oak_pillar_side', this.createCanvas((ctx) => {
      const woodCols = ['#9c7846', '#8d6a3a', '#aa8450', '#7e5d32'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = woodCols[Math.floor(Math.random() * woodCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Vertical fluted grooves
      ctx.fillStyle = '#5c411f';
      ctx.fillRect(2, 0, 1, 16);
      ctx.fillRect(7, 0, 2, 16);
      ctx.fillRect(13, 0, 1, 16);
      // Golden decorative trim top & bottom
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(0, 1, 16, 1);
      ctx.fillRect(0, 14, 16, 1);
    }));

    // 45. Tinted / Stained Glass (彩繪玻璃)
    this.textures.set('tinted_glass', this.createCanvas((ctx) => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(20, 184, 166, 0.45)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 15, 15);
      // Diamond stained glass leadwork
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fillRect(7, 2, 2, 2);
      ctx.fillRect(5, 4, 2, 2);
      ctx.fillRect(9, 4, 2, 2);
      ctx.fillRect(3, 6, 2, 4);
      ctx.fillRect(11, 6, 2, 4);
      ctx.fillRect(5, 10, 2, 2);
      ctx.fillRect(9, 10, 2, 2);
      ctx.fillRect(7, 12, 2, 2);
    }));
  }

  public currentTexturePack: string = 'classic';

  public setTexturePack(packId: string) {
    this.currentTexturePack = packId;
    this.generateAllTextures();
    this.generateMaterials();
  }

  private generateMaterials() {
    const dirtTex = this.textures.get('dirt')!;
    const grassTopTex = this.textures.get('grass_top')!;
    const grassSideTex = this.textures.get('grass_side')!;
    const stoneTex = this.textures.get('stone')!;
    const cobbleTex = this.textures.get('cobblestone')!;
    const woodSideTex = this.textures.get('wood_side')!;
    const woodTopTex = this.textures.get('wood_top')!;
    const planksTex = this.textures.get('planks')!;
    const leavesTex = this.textures.get('leaves')!;
    const sandTex = this.textures.get('sand')!;
    const coalTex = this.textures.get('coal_ore')!;
    const ironTex = this.textures.get('iron_ore')!;
    const brickTex = this.textures.get('brick')!;
    const glassTex = this.textures.get('glass')!;
    const torchTex = this.textures.get('torch')!;

    const createSolidMat = (tex: THREE.CanvasTexture) =>
      new THREE.MeshLambertMaterial({
        map: tex,
        transparent: false,
        depthWrite: true,
        depthTest: true
      });

    // Grass block has multi-material: [px, nx, py, ny, pz, nz]
    // py = top (grass), ny = bottom (dirt), sides = grass_side
    const sideMat = createSolidMat(grassSideTex);
    const topMat = createSolidMat(grassTopTex);
    const bottomMat = createSolidMat(dirtTex);
    this.materials.set('grass', [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat]);

    // Wood log: top & bottom are rings, sides are bark
    const logSide = createSolidMat(woodSideTex);
    const logTop = createSolidMat(woodTopTex);
    this.materials.set('wood', [logSide, logSide, logTop, logTop, logSide, logSide]);

    // Uniform blocks
    this.materials.set('dirt', createSolidMat(dirtTex));
    this.materials.set('stone', createSolidMat(stoneTex));
    this.materials.set('cobblestone', createSolidMat(cobbleTex));
    this.materials.set('planks', createSolidMat(planksTex));
    this.materials.set('leaves', new THREE.MeshLambertMaterial({
      map: leavesTex,
      transparent: true,
      alphaTest: 0.25,
      depthWrite: true,
      depthTest: true
    }));
    this.materials.set('sand', createSolidMat(sandTex));
    this.materials.set('coal_ore', createSolidMat(coalTex));
    this.materials.set('iron_ore', createSolidMat(ironTex));
    this.materials.set('brick', createSolidMat(brickTex));
    this.materials.set('glass', new THREE.MeshLambertMaterial({
      map: glassTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: true,
      depthTest: true
    }));
    this.materials.set('torch', new THREE.MeshBasicMaterial({
      map: torchTex,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: true,
      depthTest: true
    }));

    // New blocks materials
    const glowTex = this.textures.get('glowstone')!;
    this.materials.set('glowstone', new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: false,
      depthWrite: true,
      depthTest: true
    }));

    const haySide = createSolidMat(this.textures.get('hay_block_side')!);
    const hayTop = createSolidMat(this.textures.get('hay_block_top')!);
    this.materials.set('hay_block', [haySide, haySide, hayTop, hayTop, haySide, haySide]);

    this.materials.set('bookshelf', createSolidMat(this.textures.get('bookshelf')!));

    const farmSide = createSolidMat(dirtTex);
    const farmTop = createSolidMat(this.textures.get('farmland_top')!);
    this.materials.set('farmland', [farmSide, farmSide, farmTop, farmSide, farmSide, farmSide]);

    this.materials.set('wheat_crop', new THREE.MeshLambertMaterial({
      map: this.textures.get('wheat_crop')!,
      transparent: true,
      alphaTest: 0.25,
      depthWrite: true,
      depthTest: true
    }));

    // Aether materials
    const aetherGrassTop = createSolidMat(this.textures.get('aether_grass_top')!);
    const aetherGrassSide = createSolidMat(this.textures.get('aether_grass_side')!);
    const aetherDirtMat = createSolidMat(this.textures.get('aether_dirt')!);
    this.materials.set('aether_grass', [aetherGrassSide, aetherGrassSide, aetherGrassTop, aetherDirtMat, aetherGrassSide, aetherGrassSide]);
    this.materials.set('aether_dirt', aetherDirtMat);

    const aetherLogSide = createSolidMat(this.textures.get('aether_wood_side')!);
    const aetherLogTop = createSolidMat(this.textures.get('aether_wood_top')!);
    this.materials.set('aether_wood', [aetherLogSide, aetherLogSide, aetherLogTop, aetherLogTop, aetherLogSide, aetherLogSide]);

    this.materials.set('golden_leaves', new THREE.MeshLambertMaterial({
      map: this.textures.get('golden_leaves')!,
      transparent: true,
      alphaTest: 0.25,
      depthWrite: true,
      depthTest: true
    }));

    this.materials.set('cloud_block', new THREE.MeshLambertMaterial({
      map: this.textures.get('cloud_block')!,
      transparent: true,
      opacity: 0.9,
      depthWrite: true,
      depthTest: true
    }));

    this.materials.set('emerald_block', createSolidMat(this.textures.get('emerald_block')!));

    // Diamond Ore & Block
    this.materials.set('diamond_ore', createSolidMat(this.textures.get('diamond_ore')!));
    this.materials.set('diamond_block', createSolidMat(this.textures.get('diamond_block')!));

    // Redstone Ore & Block
    this.materials.set('redstone_ore', createSolidMat(this.textures.get('redstone_ore')!));
    this.materials.set('redstone_block', createSolidMat(this.textures.get('redstone_block')!));

    // Obsidian
    this.materials.set('obsidian', createSolidMat(this.textures.get('obsidian')!));

    // TNT: [px, nx, py, ny, pz, nz] -> [side, side, top, bottom, side, side]
    const tntSide = createSolidMat(this.textures.get('tnt_side')!);
    const tntTop = createSolidMat(this.textures.get('tnt_top')!);
    const tntBottom = createSolidMat(this.textures.get('tnt_bottom')!);
    this.materials.set('tnt', [tntSide, tntSide, tntTop, tntBottom, tntSide, tntSide]);

    // Crafting Table
    const craftTop = createSolidMat(this.textures.get('crafting_table_top')!);
    const craftSide = createSolidMat(this.textures.get('crafting_table_side')!);
    const craftBottom = createSolidMat(planksTex);
    this.materials.set('crafting_table', [craftSide, craftSide, craftTop, craftBottom, craftSide, craftSide]);

    // Furnace
    const furnaceFront = createSolidMat(this.textures.get('furnace_front')!);
    const furnaceSide = createSolidMat(this.textures.get('furnace_side')!);
    this.materials.set('furnace', [furnaceSide, furnaceSide, furnaceSide, furnaceSide, furnaceFront, furnaceSide]);

    // Water & Lava
    this.materials.set('water', new THREE.MeshLambertMaterial({
      map: this.textures.get('water')!,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      depthTest: true
    }));

    this.materials.set('lava', new THREE.MeshBasicMaterial({
      map: this.textures.get('lava')!,
      transparent: false,
      depthWrite: true,
      depthTest: true
    }));

    // Biome Materials: Snow, Cactus, Sandstone, Mud
    this.materials.set('snow_block', createSolidMat(this.textures.get('snow_block')!));

    const cactusSide = createSolidMat(this.textures.get('cactus_side')!);
    const cactusTop = createSolidMat(this.textures.get('cactus_top')!);
    this.materials.set('cactus', [cactusSide, cactusSide, cactusTop, cactusTop, cactusSide, cactusSide]);

    const sandstoneSide = createSolidMat(this.textures.get('sandstone_side')!);
    const sandstoneTop = createSolidMat(this.textures.get('sandstone_top')!);
    this.materials.set('sandstone', [sandstoneSide, sandstoneSide, sandstoneTop, sandstoneSide, sandstoneSide, sandstoneSide]);

    this.materials.set('mud', createSolidMat(this.textures.get('mud')!));

    // Decorative Crafting Blocks
    this.materials.set('stone_bricks', createSolidMat(this.textures.get('stone_bricks')!));
    this.materials.set('chiseled_stone', createSolidMat(this.textures.get('chiseled_stone')!));
    this.materials.set('lantern', new THREE.MeshBasicMaterial({
      map: this.textures.get('lantern')!,
      transparent: false,
      depthWrite: true,
      depthTest: true
    }));
    this.materials.set('quartz_block', createSolidMat(this.textures.get('quartz_block')!));
    this.materials.set('terracotta', createSolidMat(this.textures.get('terracotta')!));
    const pillarSide = createSolidMat(this.textures.get('oak_pillar_side')!);
    this.materials.set('oak_pillar', [pillarSide, pillarSide, logTop, logTop, pillarSide, pillarSide]);
    this.materials.set('tinted_glass', new THREE.MeshLambertMaterial({
      map: this.textures.get('tinted_glass')!,
      transparent: true,
      opacity: 0.88,
      depthWrite: true,
      depthTest: true
    }));
  }

  public getMaterial(type: BlockType): THREE.Material | THREE.Material[] {
    return this.materials.get(type) || this.materials.get('dirt')!;
  }

  public getTexture(name: string): THREE.CanvasTexture | undefined {
    return this.textures.get(name);
  }
}

export const textureManager = new TextureManager();
