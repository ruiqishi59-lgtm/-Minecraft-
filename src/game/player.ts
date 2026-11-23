import * as THREE from 'three';
import { InventoryItem, PlayerStats, BlockType } from '../types';
import { VoxelWorld } from './world';
import { MobManager } from './mobs';
import { soundManager } from './audio';
import { ITEM_DEFINITIONS } from './crafting';
import { getSkinById, buildPlayerModel } from './skins';
import { textureManager } from './textures';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = false;
  public isFlying: boolean = false;
  public isSneaking: boolean = false;
  public isSprinting: boolean = false;
  public isInWater: boolean = false;
  private lastWPressTime: number = 0;

  // View angles & Perspective
  public yaw: number = 0;
  public pitch: number = 0;
  public viewMode: 'first_person' | 'third_person_back' | 'third_person_front' = 'first_person';
  public thirdPersonMesh: THREE.Group | null = null;

  // Inventory & Stats
  public stats: PlayerStats = {
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    score: 0,
    activeHotbarIndex: 0,
    gameMode: 'survival'
  };

  // 9 Hotbar slots + 27 Main Inventory slots = 36 slots
  public inventory: (InventoryItem | null)[] = new Array(36).fill(null);

  // Keyboard state
  private keys: Record<string, boolean> = {};

  // Touch / Mobile / Tablet virtual joystick & button inputs
  public touchMoveVector: { x: number; y: number } = { x: 0, y: 0 };
  public touchJumpActive: boolean = false;
  public touchFlyUpActive: boolean = false;
  public touchFlyDownActive: boolean = false;
  public touchSprintActive: boolean = false;
  public touchSneakActive: boolean = false;

  // Hand swing & action animations
  public isSwinging: boolean = false;
  public swingProgress: number = 0;
  public placeRecoilTimer: number = 0;
  public eatAnimationTimer: number = 0;
  public idleTimer: number = 0;

  // Hurt & Death animation
  public hurtTimer: number = 0;
  public spawnProtectionTimer: number = 0; // seconds of invulnerability after spawning/entering world
  public isDead: boolean = false;
  public deathReason: string = '';
  public deathTilt: number = 0;

  // Settings & Visuals
  public mouseSensitivityMultiplier: number = 1.0;
  public viewBobbing: boolean = true;
  public isPaused: boolean = false;
  private walkDistance: number = 0;

  // Survival timers
  private hungerTimer: number = 0;
  private regenTimer: number = 0;
  private starveTimer: number = 0;

  // Mouse drag tracking (for when pointer lock is not active)
  private isMouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Held item 3D mesh attached to camera
  public heldItemAnchor: THREE.Group;
  public handLight: THREE.PointLight;
  private heldItemMesh: THREE.Object3D | null = null;
  public isBackgroundMode: boolean = true; // In main menu or background scenic view, hand and handLight are hidden

  constructor(
    public domElement: HTMLElement,
    private world: VoxelWorld,
    private mobManager: MobManager
  ) {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 500);
    this.position = this.world.getSpawnPosition();
    this.camera.position.copy(this.position);

    // Setup held item anchor and hand lighting
    this.heldItemAnchor = new THREE.Group();
    this.heldItemAnchor.position.set(0.38, -0.32, -0.6);
    this.camera.add(this.heldItemAnchor);

    // Soft point light ensuring hand and held items are always illuminated and visible
    this.handLight = new THREE.PointLight(0xffeedd, 0.9, 6);
    this.handLight.position.set(0.25, 0.15, -0.35);
    this.camera.add(this.handLight);

    // Initial background mode hides hand and hand light
    this.heldItemAnchor.visible = !this.isBackgroundMode;
    this.handLight.visible = !this.isBackgroundMode;

    // CRITICAL: Three.js requires camera to be added to the scene graph to render its children (hand/held item)
    this.world.scene.add(this.camera);

    // Setup 3D Third-person character model
    const skinId = (typeof window !== 'undefined' && localStorage.getItem('minecraft_player_skin')) || 'steve';
    const skin = getSkinById(skinId);
    this.thirdPersonMesh = buildPlayerModel(skin);
    this.thirdPersonMesh.visible = false;
    this.world.scene.add(this.thirdPersonMesh);

    this.initInventoryForMode('survival');
    this.bindEvents();
    this.updateHeldItemMesh();
  }

  private lastSpacePressTime: number = 0;

  public initInventoryForMode(mode: 'survival' | 'creative') {
    this.stats.gameMode = mode;
    this.inventory = new Array(36).fill(null);

    if (mode === 'survival') {
      // Pure authentic survival start: 100% clean inventory!
      // No free cheat tools, weapons, blocks, or torches. Punch trees to survive!
      this.isFlying = false;
      this.velocity.set(0, 0, 0);
    } else {
      // In creative mode: populate hotbar with popular builder materials
      this.inventory[0] = { ...ITEM_DEFINITIONS['grass'], count: 64 };
      this.inventory[1] = { ...ITEM_DEFINITIONS['stone'], count: 64 };
      this.inventory[2] = { ...ITEM_DEFINITIONS['wood'], count: 64 };
      this.inventory[3] = { ...ITEM_DEFINITIONS['planks'], count: 64 };
      this.inventory[4] = { ...ITEM_DEFINITIONS['glass'], count: 64 };
      this.inventory[5] = { ...ITEM_DEFINITIONS['brick'], count: 64 };
      this.inventory[6] = { ...ITEM_DEFINITIONS['torch'], count: 64 };
      this.inventory[7] = { ...ITEM_DEFINITIONS['iron_sword'], count: 1 };
      this.inventory[8] = { ...ITEM_DEFINITIONS['apple'], count: 64 };
    }
    this.updateHeldItemMesh();
  }

  public setGameMode(mode: 'survival' | 'creative') {
    this.stats.gameMode = mode;
    if (mode === 'survival') {
      this.isFlying = false;
      this.velocity.set(0, 0, 0);
      this.stats.health = Math.min(this.stats.health, this.stats.maxHealth);
    } else {
      this.stats.health = this.stats.maxHealth;
      this.stats.hunger = this.stats.maxHunger;
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Sprint: Control keys OR double-tap 'W'
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        this.isSprinting = true;
      }
      if (e.code === 'KeyW') {
        const now = performance.now();
        if (now - this.lastWPressTime < 280) {
          this.isSprinting = true;
        }
        this.lastWPressTime = now;
      }

      // Sneak (Crouch): Shift keys or KeyC
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') {
        this.isSneaking = true;
        this.isSprinting = false;
      }

      // Number keys 1-9 for hotbar selection
      if (e.key >= '1' && e.key <= '9') {
        this.stats.activeHotbarIndex = parseInt(e.key) - 1;
        this.updateHeldItemMesh();
      }

      // 'F' key: Toggle flight (Creative mode only!)
      if (e.code === 'KeyF') {
        if (this.stats.gameMode === 'creative') {
          this.isFlying = !this.isFlying;
          this.velocity.set(0, 0, 0);
        }
      }

      // F5 key: Toggle perspective (1st Person -> 3rd Person Back -> 3rd Person Front)
      if (e.code === 'F5') {
        e.preventDefault();
        this.cycleViewMode();
      }

      // Double-space detection to toggle creative flight
      if (e.code === 'Space' && this.stats.gameMode === 'creative') {
        const now = performance.now();
        if (now - this.lastSpacePressTime < 300) {
          this.isFlying = !this.isFlying;
          this.velocity.set(0, 0, 0);
        }
        this.lastSpacePressTime = now;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;

      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        this.isSprinting = this.touchSprintActive;
      }
      if (e.code === 'KeyW' && !this.keys['ControlLeft'] && !this.keys['ControlRight']) {
        this.isSprinting = this.touchSprintActive;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') {
        this.isSneaking = this.touchSneakActive;
      }
    });

    window.addEventListener('wheel', (e) => {
      if (document.pointerLockElement === this.domElement) {
        if (e.deltaY > 0) {
          this.stats.activeHotbarIndex = (this.stats.activeHotbarIndex + 1) % 9;
        } else {
          this.stats.activeHotbarIndex = (this.stats.activeHotbarIndex - 1 + 9) % 9;
        }
        this.updateHeldItemMesh();
      }
    });

    this.domElement.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.domElement) {
        const sensitivity = 0.0024 * this.mouseSensitivityMultiplier;
        this.yaw -= e.movementX * sensitivity;
        this.pitch -= e.movementY * sensitivity;
      } else if (this.isMouseDown) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        const sensitivity = 0.0035 * this.mouseSensitivityMultiplier;
        this.yaw -= dx * sensitivity;
        this.pitch -= dy * sensitivity;
      }

      // Clamp pitch to avoid neck break
      const maxPitch = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });
  }

  public getActiveItem(): InventoryItem | null {
    return this.inventory[this.stats.activeHotbarIndex] || null;
  }

  public cycleViewMode(): 'first_person' | 'third_person_back' | 'third_person_front' {
    if (this.viewMode === 'first_person') {
      this.viewMode = 'third_person_back';
    } else if (this.viewMode === 'third_person_back') {
      this.viewMode = 'third_person_front';
    } else {
      this.viewMode = 'first_person';
    }
    soundManager.playButtonClick();
    return this.viewMode;
  }

  public triggerPlaceRecoil() {
    this.placeRecoilTimer = 0.12;
  }

  public triggerEatAnimation() {
    this.eatAnimationTimer = 0.45;
  }

  public updateHeldItemMesh() {
    // Clear previous
    if (this.heldItemMesh) {
      this.heldItemAnchor.remove(this.heldItemMesh);
      this.heldItemMesh = null;
    }

    const skinId = (typeof window !== 'undefined' && localStorage.getItem('minecraft_player_skin')) || 'steve';
    const skin = getSkinById(skinId);
    const activeItem = this.getActiveItem();

    // 1. Right arm base group
    const armGroup = new THREE.Group();
    const sleeveMat = new THREE.MeshLambertMaterial({ color: skin.shirtColor });
    const skinMat = new THREE.MeshLambertMaterial({ color: skin.skinColor });

    // Upper arm sleeve (comes from lower right towards screen)
    const sleeveGeom = new THREE.BoxGeometry(0.14, 0.17, 0.32);
    const sleeve = new THREE.Mesh(sleeveGeom, sleeveMat);
    sleeve.position.set(0.06, -0.06, 0.12);
    armGroup.add(sleeve);

    // Forearm
    const forearmGeom = new THREE.BoxGeometry(0.12, 0.13, 0.26);
    const forearm = new THREE.Mesh(forearmGeom, skinMat);
    forearm.position.set(0.06, -0.05, -0.10);
    armGroup.add(forearm);

    // Hand & Fist
    const handGeom = new THREE.BoxGeometry(0.11, 0.11, 0.12);
    const hand = new THREE.Mesh(handGeom, skinMat);
    hand.position.set(0.06, -0.05, -0.26);
    armGroup.add(hand);

    // 2. Attach held item into the hand
    if (!activeItem) {
      // Bare fist ready to punch
      armGroup.rotation.set(0.18, -0.25, 0.08);
    } else if (activeItem.type === 'block' && activeItem.blockType) {
      // Authentic 3D textured voxel block resting in palm
      const blockGeom = new THREE.BoxGeometry(0.28, 0.28, 0.28);
      const blockMat = textureManager.getMaterial(activeItem.blockType);
      const blockMesh = new THREE.Mesh(blockGeom, blockMat);
      blockMesh.position.set(-0.04, 0.10, -0.26);
      blockMesh.rotation.set(0.35, 0.65, -0.15);
      armGroup.add(blockMesh);
      armGroup.rotation.set(0.20, -0.22, 0.08);
    } else if (activeItem.type === 'tool') {
      // 3D Voxel Tool held in the hand's grip
      const toolGroup = new THREE.Group();
      const handleMat = new THREE.MeshLambertMaterial({ color: 0x79553a });
      const handleGeom = new THREE.BoxGeometry(0.038, 0.44, 0.038);
      const handle = new THREE.Mesh(handleGeom, handleMat);
      toolGroup.add(handle);

      const tierColor = activeItem.iconColor || '#e0e0e0';
      const isObsidianTier = activeItem.toolTier === 'obsidian' || activeItem.id.includes('obsidian');
      const isDiamondTier = activeItem.toolTier === 'diamond' || activeItem.id.includes('diamond');
      const headMat = isObsidianTier
        ? new THREE.MeshStandardMaterial({
            color: 0x3b1f5e,
            emissive: 0x9c27b0,
            emissiveIntensity: 0.55,
            roughness: 0.25,
            metalness: 0.75
          })
        : isDiamondTier
        ? new THREE.MeshStandardMaterial({
            color: tierColor,
            emissive: 0x00838f,
            emissiveIntensity: 0.25,
            roughness: 0.2,
            metalness: 0.5
          })
        : new THREE.MeshLambertMaterial({ color: tierColor });

      const isPick = activeItem.id.includes('pickaxe');
      const isAxe = activeItem.id.includes('axe') && !isPick;
      const isSword = activeItem.id.includes('sword');
      const isShovel = activeItem.id.includes('shovel');
      const isBow = activeItem.id.includes('bow');

      if (isPick) {
        // Pickaxe curved double-sided head
        const pickCross = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.36), headMat);
        pickCross.position.set(0, 0.20, 0);
        toolGroup.add(pickCross);
        const pickTip1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.08), headMat);
        pickTip1.position.set(0, 0.16, 0.19);
        toolGroup.add(pickTip1);
        const pickTip2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.08), headMat);
        pickTip2.position.set(0, 0.16, -0.19);
        toolGroup.add(pickTip2);
      } else if (isAxe) {
        // Broad Axe blade
        const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.16), headMat);
        axeBlade.position.set(0, 0.16, 0.07);
        toolGroup.add(axeBlade);
      } else if (isSword) {
        // Crossguard + long blade
        const guard = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.04, 0.06),
          new THREE.MeshLambertMaterial({ color: isObsidianTier ? 0xffca28 : 0x424242 })
        );
        guard.position.y = 0.05;
        toolGroup.add(guard);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 0.09), headMat);
        blade.position.y = 0.31;
        toolGroup.add(blade);
        const pommel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), headMat);
        pommel.position.y = -0.22;
        toolGroup.add(pommel);
      } else if (isShovel) {
        const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.15), headMat);
        scoop.position.y = 0.22;
        toolGroup.add(scoop);
      } else if (isBow) {
        const bowLimb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.12), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
        bowLimb.position.y = 0.1;
        toolGroup.add(bowLimb);
      } else {
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.08), headMat);
        head.position.y = 0.18;
        toolGroup.add(head);
      }

      toolGroup.position.set(0.06, 0.04, -0.28);
      toolGroup.rotation.set(0.4, 0.15, -0.35);
      armGroup.add(toolGroup);
      armGroup.rotation.set(0.15, -0.20, 0.08);
    } else if (activeItem.id === 'torch') {
      // 3D Torch with flaming ember held in hand
      const torchGroup = new THREE.Group();
      const torchShaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.04), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
      const torchHead = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.065), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      torchHead.position.y = 0.18;
      torchGroup.add(torchShaft);
      torchGroup.add(torchHead);
      torchGroup.position.set(0.06, 0.05, -0.26);
      torchGroup.rotation.set(0.2, 0.1, -0.1);
      armGroup.add(torchGroup);
      armGroup.rotation.set(0.18, -0.22, 0.08);
    } else if (activeItem.type === 'spawn_egg') {
      // 3D Voxel Mob Spawn Egg with spots held in hand
      const eggGroup = new THREE.Group();
      const baseMat = new THREE.MeshLambertMaterial({ color: activeItem.iconColor });
      const spotMat = new THREE.MeshLambertMaterial({ color: activeItem.eggSecondaryColor || '#ffffff' });

      const eggBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), baseMat);
      const eggTop = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.11), baseMat);
      eggTop.position.y = 0.125;
      const eggBot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.12), baseMat);
      eggBot.position.y = -0.115;

      const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.065, 0.02), spotMat);
      spot1.position.set(-0.03, 0.03, 0.08);
      const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.02), spotMat);
      spot2.position.set(0.04, -0.04, 0.08);
      const spot3 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.055), spotMat);
      spot3.position.set(-0.08, 0.01, -0.02);

      eggGroup.add(eggBody, eggTop, eggBot, spot1, spot2, spot3);
      eggGroup.position.set(0.04, 0.05, -0.26);
      eggGroup.rotation.set(0.15, 0.45, 0.08);
      armGroup.add(eggGroup);
      armGroup.rotation.set(0.20, -0.22, 0.08);
    } else {
      // Food or item held in hand
      const itemMat = new THREE.MeshLambertMaterial({ color: activeItem.iconColor });
      const itemMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), itemMat);
      itemMesh.position.set(0.04, 0.04, -0.26);
      itemMesh.rotation.set(0.2, 0.4, 0.1);
      armGroup.add(itemMesh);
      armGroup.rotation.set(0.20, -0.22, 0.08);
    }

    this.heldItemAnchor.add(armGroup);
    this.heldItemMesh = armGroup;

    if (this.isBackgroundMode) {
      this.heldItemAnchor.visible = false;
      if (this.handLight) this.handLight.visible = false;
    }
  }

  public triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
    soundManager.playArmSwing();
  }

  public takeDamage(amount: number, reason: string = '被骷髏擊敗了') {
    if (this.isPaused || this.stats.gameMode === 'creative' || this.isDead || this.spawnProtectionTimer > 0) return;
    this.stats.health = Math.max(0, this.stats.health - amount);
    this.hurtTimer = 0.4;
    soundManager.playPlayerHurt();

    if (this.stats.health <= 0) {
      this.isDead = true;
      this.deathReason = reason;
      this.velocity.set(0, 0, 0);
      this.touchMoveVector = { x: 0, y: 0 };
    }
  }

  public respawn() {
    this.isDead = false;
    this.deathTilt = 0;
    this.camera.rotation.z = 0;
    this.position = this.world.getSpawnPosition();
    this.velocity.set(0, 0, 0);
    this.stats.health = this.stats.maxHealth;
    this.stats.hunger = this.stats.maxHunger;
    this.touchMoveVector = { x: 0, y: 0 };
    this.touchJumpActive = false;
    this.spawnProtectionTimer = 5.0; // 5 seconds of spawn invulnerability
    soundManager.playCraftSuccess();
  }

  public eatFood(item: InventoryItem) {
    if (this.stats.health < this.stats.maxHealth || this.stats.hunger < this.stats.maxHunger || item.id === 'golden_apple') {
      const healMap: Record<string, { hp: number; hunger: number }> = {
        apple: { hp: 4, hunger: 5 },
        bread: { hp: 5, hunger: 6 },
        porkchop: { hp: 6, hunger: 8 },
        steak: { hp: 8, hunger: 10 },
        golden_apple: { hp: 20, hunger: 20 }
      };
      const gain = healMap[item.id] || { hp: 4, hunger: 5 };
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + gain.hp);
      this.stats.hunger = Math.min(this.stats.maxHunger, this.stats.hunger + gain.hunger);
      this.triggerEatAnimation();
      soundManager.playEating();

      // Deduct 1 item in survival mode only (infinite in creative)
      if (this.stats.gameMode === 'survival') {
        item.count -= 1;
        if (item.count <= 0) {
          this.inventory[this.stats.activeHotbarIndex] = null;
        }
      }
      this.updateHeldItemMesh();
    }
  }

  public addItemToInventory(itemId: string, count: number = 1): boolean {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return false;

    let remaining = count;

    // 1. Stack into existing
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      if (slot && slot.id === itemId && slot.count < slot.maxStack) {
        const space = slot.maxStack - slot.count;
        const add = Math.min(space, remaining);
        slot.count += add;
        remaining -= add;
        if (remaining <= 0) break;
      }
    }

    // 2. Put in first empty slot
    if (remaining > 0) {
      for (let i = 0; i < this.inventory.length; i++) {
        if (!this.inventory[i]) {
          this.inventory[i] = {
            ...def,
            count: remaining
          };
          remaining = 0;
          break;
        }
      }
    }

    this.updateHeldItemMesh();
    return remaining === 0;
  }

  public deductActiveItem(count: number = 1) {
    if (this.stats.gameMode === 'creative') return;
    const active = this.getActiveItem();
    if (!active) return;
    active.count -= count;
    if (active.count <= 0) {
      this.inventory[this.stats.activeHotbarIndex] = null;
    }
    this.updateHeldItemMesh();
  }

  public rotateLook(deltaX: number, deltaY: number, sensitivity: number = 0.0035) {
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;
    const maxPitch = Math.PI / 2 - 0.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public update(delta: number) {
    if (this.isPaused) {
      this.velocity.set(0, 0, 0);
      this.touchMoveVector = { x: 0, y: 0 };
      this.camera.position.set(this.position.x, this.position.y + 1.62, this.position.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;

      // Ensure hand visibility is correctly synced even when paused
      if (this.isBackgroundMode) {
        this.heldItemAnchor.visible = false;
        if (this.handLight) this.handLight.visible = false;
        if (this.thirdPersonMesh) this.thirdPersonMesh.visible = false;
      }
      return;
    }

    // Death state animation
    if (this.isDead) {
      this.deathTilt = Math.min(Math.PI / 3, this.deathTilt + delta * 2.5);
      this.velocity.x = 0;
      this.velocity.z = 0;
      if (!this.isGrounded && this.position.y > -18) {
        this.velocity.y -= 22 * delta;
        this.applyPlayerCollision(delta);
      } else {
        this.velocity.y = 0;
      }

      this.camera.position.set(this.position.x, this.position.y + 0.35, this.position.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      this.camera.rotation.z = this.deathTilt;
      return;
    }

    // Hurt timer countdown
    if (this.hurtTimer > 0) {
      this.hurtTimer -= delta;
    }

    // Spawn protection timer countdown
    if (this.spawnProtectionTimer > 0) {
      this.spawnProtectionTimer = Math.max(0, this.spawnProtectionTimer - delta);
    }

    // Creative mode: stats always maxed out, no hunger or damage
    if (this.stats.gameMode === 'creative') {
      this.stats.health = this.stats.maxHealth;
      this.stats.hunger = this.stats.maxHunger;
    } else {
      // Survival mode: natural hunger & regeneration
      this.hungerTimer += delta;
      if (this.hungerTimer >= 25) {
        this.hungerTimer = 0;
        this.stats.hunger = Math.max(0, this.stats.hunger - 1);
      }

      // Natural regeneration when well fed (hunger >= 18)
      if (this.stats.hunger >= 18 && this.stats.health < this.stats.maxHealth) {
        this.regenTimer += delta;
        if (this.regenTimer >= 4) {
          this.regenTimer = 0;
          this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 1);
        }
      } else {
        this.regenTimer = 0;
      }

      // Starvation damage when hunger is 0
      if (this.stats.hunger === 0) {
        this.starveTimer += delta;
        if (this.starveTimer >= 4) {
          this.starveTimer = 0;
          this.takeDamage(1, '飢餓過度體力透支');
        }
      } else {
        this.starveTimer = 0;
      }
    }

    // Calculate movement vector based on camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(forward);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(right);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(right);

    // Add mobile touch virtual joystick vector
    if (this.touchMoveVector.y !== 0) {
      moveDir.addScaledVector(forward, this.touchMoveVector.y);
    }
    if (this.touchMoveVector.x !== 0) {
      moveDir.addScaledVector(right, this.touchMoveVector.x);
    }

    if (moveDir.lengthSq() > 1) {
      moveDir.normalize();
    }

    // Check water immersion
    const footBlockType = this.world.getBlock(this.position.x, this.position.y + 0.2, this.position.z);
    const waistBlockType = this.world.getBlock(this.position.x, this.position.y + 0.9, this.position.z);
    this.isInWater = footBlockType === 'water' || waistBlockType === 'water';

    const effectiveSneak = this.isSneaking || this.touchSneakActive;
    const effectiveSprint = !effectiveSneak && (this.isSprinting || this.touchSprintActive);
    this.isSneaking = effectiveSneak;
    this.isSprinting = effectiveSprint;

    // Speed calculation
    let baseSpeed = 4.5;
    if (this.isFlying) {
      baseSpeed = 12.0;
    } else if (this.isInWater) {
      baseSpeed = 2.6;
    } else if (effectiveSneak) {
      baseSpeed = 1.35;
    } else if (effectiveSprint && moveDir.lengthSq() > 0.1) {
      baseSpeed = 6.2;
    }

    // Dynamic Camera FOV boost during sprint (classic warp effect)
    const targetFov = (effectiveSprint && moveDir.lengthSq() > 0.1 && !this.isFlying) ? 84 : 75;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, delta * 10);
      this.camera.updateProjectionMatrix();
    }

    const wantsJump = this.keys['Space'] || this.touchJumpActive;
    const wantsSneak = effectiveSneak || this.touchFlyDownActive;

    if (this.isFlying) {
      // Creative Fly Mode - zero phasing through blocks!
      this.velocity.x = moveDir.x * baseSpeed;
      this.velocity.z = moveDir.z * baseSpeed;
      this.velocity.y = 0;
      if (wantsJump || this.touchFlyUpActive) this.velocity.y = baseSpeed;
      if (wantsSneak) this.velocity.y = -baseSpeed;

      this.applyPlayerCollision(delta);
    } else if (this.isInWater) {
      // Water Physics: Buoyant floating & swimming
      this.velocity.x = moveDir.x * baseSpeed;
      this.velocity.z = moveDir.z * baseSpeed;

      if (wantsJump) {
        this.velocity.y = 4.0; // Swim upward
      } else if (wantsSneak) {
        this.velocity.y = -3.2; // Sink downward
      } else {
        // Slow water sink
        this.velocity.y = Math.max(-1.8, this.velocity.y - 6 * delta);
      }

      this.applyPlayerCollision(delta);
    } else {
      // Survival Gravity & Physics
      this.velocity.x = moveDir.x * baseSpeed;
      this.velocity.z = moveDir.z * baseSpeed;

      // Gravity
      this.velocity.y -= 22 * delta;

      // Jump
      if (wantsJump && this.isGrounded) {
        this.velocity.y = 8.5;
        if (this.isSprinting) {
          // Sprint-jump momentum boost
          this.velocity.addScaledVector(forward, 1.2);
        }
        this.isGrounded = false;
      }

      this.applyPlayerCollision(delta);
    }

    // Arm idle & walk bobbing calculations
    this.idleTimer += delta;
    const isMoving = Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1;
    let bobX = 0;
    let bobY = 0;
    if (this.viewBobbing && this.isGrounded && isMoving) {
      this.walkDistance += delta * 9;
      bobX = Math.cos(this.walkDistance * 0.5) * 0.025;
      bobY = Math.abs(Math.sin(this.walkDistance)) * 0.025;
    }

    const idleY = Math.sin(this.idleTimer * 2.2) * 0.006;
    const baseAnchorX = 0.38;
    const baseAnchorY = -0.32;
    const baseAnchorZ = -0.6;

    let targetAnchorX = baseAnchorX + bobX;
    let targetAnchorY = baseAnchorY + bobY + idleY;
    let targetAnchorZ = baseAnchorZ;

    let rotX = 0;
    let rotY = 0;
    let rotZ = 0;

    // Place Recoil animation
    if (this.placeRecoilTimer > 0) {
      this.placeRecoilTimer -= delta;
      const recoilProg = Math.sin(Math.max(0, this.placeRecoilTimer / 0.12) * Math.PI);
      targetAnchorZ += recoilProg * 0.08;
      rotX += recoilProg * 0.25;
    }

    // Eating animation
    if (this.eatAnimationTimer > 0) {
      this.eatAnimationTimer -= delta;
      const eatProg = 1 - (this.eatAnimationTimer / 0.45);
      const eatSin = Math.sin(eatProg * Math.PI);
      targetAnchorX -= eatSin * 0.14;
      targetAnchorY += eatSin * 0.12 + Math.sin(eatProg * 30) * 0.015;
      targetAnchorZ += eatSin * 0.1;
      rotX -= eatSin * 0.2;
    }

    // Swinging / Mining animation arc
    if (this.isSwinging) {
      this.swingProgress += delta * 7.5;
      const swingSin = Math.sin(this.swingProgress * Math.PI);
      rotX -= swingSin * 0.95;
      rotY -= swingSin * 0.65;
      rotZ += swingSin * 0.35;
      targetAnchorZ += swingSin * 0.15;
      targetAnchorX -= swingSin * 0.08;
      if (this.swingProgress >= 1) {
        this.isSwinging = false;
        this.swingProgress = 0;
      }
    }

    this.heldItemAnchor.position.set(targetAnchorX, targetAnchorY, targetAnchorZ);
    this.heldItemAnchor.rotation.set(rotX, rotY, rotZ);

    // Update Camera Orientation and Position
    const eyeOffset = this.isSneaking ? 1.28 : 1.62;
    let cameraY = this.position.y + eyeOffset;
    if (this.viewBobbing && this.isGrounded && isMoving && !this.isSneaking) {
      cameraY += Math.sin(this.walkDistance) * 0.04;
    }
    const eyePos = new THREE.Vector3(this.position.x, cameraY, this.position.z);

    if (this.viewMode === 'first_person') {
      const showFirstPersonHand = !this.isBackgroundMode;
      this.heldItemAnchor.visible = showFirstPersonHand;
      if (this.handLight) this.handLight.visible = showFirstPersonHand;
      if (this.thirdPersonMesh) this.thirdPersonMesh.visible = false;

      this.camera.position.set(this.position.x, cameraY, this.position.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    } else {
      this.heldItemAnchor.visible = false;
      if (this.handLight) this.handLight.visible = false;
      if (this.thirdPersonMesh) {
        this.thirdPersonMesh.visible = !this.isBackgroundMode;
        this.thirdPersonMesh.position.copy(this.position);
        this.thirdPersonMesh.rotation.y = this.yaw;

        const head = this.thirdPersonMesh.getObjectByName('player_head');
        if (head) head.rotation.x = this.pitch;

        const armL = this.thirdPersonMesh.getObjectByName('arm_l');
        const armR = this.thirdPersonMesh.getObjectByName('arm_r');
        const legL = this.thirdPersonMesh.getObjectByName('leg_l');
        const legR = this.thirdPersonMesh.getObjectByName('leg_r');

        const legSwing = isMoving ? Math.sin(this.walkDistance) * 0.65 : 0;
        if (legL) legL.rotation.x = legSwing;
        if (legR) legR.rotation.x = -legSwing;
        if (armL) armL.rotation.x = -legSwing;
        if (armR) armR.rotation.x = this.isSwinging ? -Math.sin(this.swingProgress * Math.PI) * 1.3 : legSwing;
      }

      // Camera third person positioning
      const cosPitch = Math.cos(this.pitch);
      const lookDir = new THREE.Vector3(
        -Math.sin(this.yaw) * cosPitch,
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * cosPitch
      ).normalize();

      if (this.viewMode === 'third_person_back') {
        const targetDist = 3.6;
        let actualDist = targetDist;
        for (let d = 0.5; d <= targetDist; d += 0.4) {
          const checkPos = eyePos.clone().addScaledVector(lookDir, -d);
          const block = this.world.getBlock(checkPos.x, checkPos.y, checkPos.z);
          if (block !== 'air') {
            actualDist = Math.max(0.6, d - 0.4);
            break;
          }
        }
        this.camera.position.copy(eyePos).addScaledVector(lookDir, -actualDist);
        this.camera.lookAt(eyePos);
      } else {
        // third_person_front
        const frontPos = eyePos.clone().addScaledVector(lookDir, 2.8);
        this.camera.position.copy(frontPos);
        this.camera.lookAt(eyePos);
      }
    }
  }

  private isSolidBlock(x: number, y: number, z: number): boolean {
    const b = this.world.getBlock(x, y, z);
    return b !== 'air' && b !== 'water';
  }

  // Check if an AABB intersects any solid voxel in the world
  private intersectsSolidVoxel(
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number
  ): boolean {
    const x0 = Math.floor(minX);
    const x1 = Math.floor(maxX - 0.0001);
    const y0 = Math.floor(minY);
    const y1 = Math.floor(maxY - 0.0001);
    const z0 = Math.floor(minZ);
    const z1 = Math.floor(maxZ - 0.0001);

    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          if (this.isSolidBlock(x, y, z)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private hasGroundUnderfoot(px: number, pz: number, py: number): boolean {
    const checkY = Math.floor(py - 0.05);
    const r = 0.28;
    return (
      this.isSolidBlock(px, checkY, pz) ||
      this.isSolidBlock(px - r, checkY, pz - r) ||
      this.isSolidBlock(px + r, checkY, pz - r) ||
      this.isSolidBlock(px - r, checkY, pz + r) ||
      this.isSolidBlock(px + r, checkY, pz + r)
    );
  }

  private applyPlayerCollision(delta: number) {
    const r = 0.3; // player collision half-width (0.6x0.6 horizontal footprint)
    const h = this.isSneaking ? 1.5 : 1.8;

    // Void abyss damage
    if (this.position.y < -25) {
      if (!this.isDead) {
        this.takeDamage(100, '掉入了虛空之中');
      }
      this.velocity.set(0, 0, 0);
      this.position.y = -25;
      return;
    }

    // Anti-stuck safeguard: if player is ever embedded inside solid blocks, gently resolve to nearest air space
    if (this.intersectsSolidVoxel(this.position.x - r, this.position.x + r, this.position.y + 0.05, this.position.y + h - 0.05, this.position.z - r, this.position.z + r)) {
      const candidates = [
        [0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 2, 0]
      ];
      for (const [ox, oy, oz] of candidates) {
        const testX = this.position.x + ox * 0.6;
        const testY = this.position.y + oy * 0.6;
        const testZ = this.position.z + oz * 0.6;
        if (!this.intersectsSolidVoxel(testX - r, testX + r, testY, testY + h, testZ - r, testZ + r)) {
          this.position.set(testX, testY, testZ);
          this.velocity.set(0, 0, 0);
          break;
        }
      }
    }

    // Sub-stepping to completely prevent tunneling through walls at any speed (sprinting, flying, falling)
    const maxSpeed = Math.max(Math.abs(this.velocity.x), Math.abs(this.velocity.y), Math.abs(this.velocity.z));
    const maxDisp = maxSpeed * delta;
    const subSteps = Math.max(1, Math.min(6, Math.ceil(maxDisp / 0.12)));
    const subDelta = delta / subSteps;

    for (let step = 0; step < subSteps; step++) {
      this.resolveSingleSubStep(subDelta, r, h);
    }
  }

  private resolveSingleSubStep(subDelta: number, r: number, h: number) {
    const EPSILON = 0.001;

    // 1. Vertical Movement (Y-axis)
    const dy = this.velocity.y * subDelta;
    if (dy !== 0) {
      const targetY = this.position.y + dy;
      if (dy < 0) {
        // Falling down
        if (this.intersectsSolidVoxel(this.position.x - r, this.position.x + r, targetY, targetY + h, this.position.z - r, this.position.z + r)) {
          // Find the highest solid block top that collided
          let highestTop = Math.floor(targetY) + 1.0;
          const x0 = Math.floor(this.position.x - r);
          const x1 = Math.floor(this.position.x + r - 0.0001);
          const z0 = Math.floor(this.position.z - r);
          const z1 = Math.floor(this.position.z + r - 0.0001);
          const checkY = Math.floor(targetY);
          for (let x = x0; x <= x1; x++) {
            for (let z = z0; z <= z1; z++) {
              if (this.isSolidBlock(x, checkY, z)) {
                highestTop = Math.max(highestTop, checkY + 1.0);
              }
            }
          }
          this.position.y = highestTop;
          this.velocity.y = 0;
          this.isGrounded = true;
        } else {
          this.position.y = targetY;
          this.isGrounded = false;
        }
      } else {
        // Jumping / Flying up (Ceiling check)
        if (this.intersectsSolidVoxel(this.position.x - r, this.position.x + r, targetY, targetY + h, this.position.z - r, this.position.z + r)) {
          const ceilingY = Math.floor(targetY + h);
          this.position.y = ceilingY - h - EPSILON;
          this.velocity.y = 0;
        } else {
          this.position.y = targetY;
        }
      }
    } else {
      // Check if still grounded
      this.isGrounded = this.hasGroundUnderfoot(this.position.x, this.position.z, this.position.y);
    }

    // 2. Sneaking Ledge Safety Check (Cannot fall off edges while crouching)
    let moveX = this.velocity.x * subDelta;
    let moveZ = this.velocity.z * subDelta;

    if (this.isSneaking && this.isGrounded && !this.isInWater && !this.isFlying) {
      if (!this.hasGroundUnderfoot(this.position.x + moveX, this.position.z, this.position.y)) {
        moveX = 0;
        this.velocity.x = 0;
      }
      if (!this.hasGroundUnderfoot(this.position.x, this.position.z + moveZ, this.position.y)) {
        moveZ = 0;
        this.velocity.z = 0;
      }
    }

    // 3. Horizontal Movement (X-axis) - flush clamping against solid blocks
    if (moveX !== 0) {
      const targetX = this.position.x + moveX;
      // Slight vertical inset (0.05 to h - 0.05) to avoid floor/ceiling grazing issues
      if (!this.intersectsSolidVoxel(targetX - r, targetX + r, this.position.y + 0.05, this.position.y + h - 0.05, this.position.z - r, this.position.z + r)) {
        this.position.x = targetX;
      } else {
        // Collided with wall on X
        if (moveX > 0) {
          const wallBlockX = Math.floor(targetX + r);
          this.position.x = wallBlockX - r - EPSILON;
        } else {
          const wallBlockX = Math.floor(targetX - r);
          this.position.x = wallBlockX + 1.0 + r + EPSILON;
        }
        this.velocity.x = 0;
      }
    }

    // 4. Horizontal Movement (Z-axis) - flush clamping against solid blocks
    if (moveZ !== 0) {
      const targetZ = this.position.z + moveZ;
      if (!this.intersectsSolidVoxel(this.position.x - r, this.position.x + r, this.position.y + 0.05, this.position.y + h - 0.05, targetZ - r, targetZ + r)) {
        this.position.z = targetZ;
      } else {
        // Collided with wall on Z
        if (moveZ > 0) {
          const wallBlockZ = Math.floor(targetZ + r);
          this.position.z = wallBlockZ - r - EPSILON;
        } else {
          const wallBlockZ = Math.floor(targetZ - r);
          this.position.z = wallBlockZ + 1.0 + r + EPSILON;
        }
        this.velocity.z = 0;
      }
    }
  }

  public getLookDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }

  public getEyePosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }
}
