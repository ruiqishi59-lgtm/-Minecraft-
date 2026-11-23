import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { VoxelWorld } from '../game/world';
import { WeatherManager } from '../game/weather';
import { MobManager } from '../game/mobs';
import { PlayerController } from '../game/player';
import { soundManager } from '../game/audio';
import { HUD } from './HUD';
import { MobileControls } from './MobileControls';
import { InventoryModal } from './InventoryModal';
import { CraftingModal } from './CraftingModal';
import { ControlsModal } from './ControlsModal';
import { DriveModal } from './DriveModal';
import { MainMenu } from './MainMenu';
import { DeathScreen } from './DeathScreen';
import { WorldSelectModal } from './WorldSelectModal';
import { PauseMenu } from './PauseMenu';
import { SettingsModal } from './SettingsModal';
import { SkinSelectModal } from './SkinSelectModal';
import { VillagerTradeModal } from './VillagerTradeModal';
import { TerrainLoadingScreen } from './TerrainLoadingScreen';
import { MarketModal } from './MarketModal';
import { VipModal } from './VipModal';
import { AIGuideModal } from './AIGuideModal';
import { GoogleAccountModal } from './GoogleAccountModal';
import { MailboxModal } from './MailboxModal';
import { worldStorage } from '../game/worldStorage';
import { WeatherType, WorldSaveData, PlayerStats, GameSettings, MobEntity, BiomeType } from '../types';
import { calculateBlockMining, getBlockDisplayName } from '../game/mining';
import { DynamicWorldFXManager } from '../game/dynamicWorldFX';
import { isVipActive, loginWithGoogleAccount } from '../utils/googleAuth';
import { detectTouchOrTabletDevice } from '../utils/device';
import { subscribeAuthState } from '../firebase';
import { Play, Smartphone, Monitor } from 'lucide-react';

export const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Engine references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldRef = useRef<VoxelWorld | null>(null);
  const weatherRef = useRef<WeatherManager | null>(null);
  const mobManagerRef = useRef<MobManager | null>(null);
  const playerRef = useRef<PlayerController | null>(null);

  // Tablet & Mobile touch mode detection (supports iPadOS, Android tablets, coarse pointers, & narrow screens)
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => detectTouchOrTabletDevice());
  const userToggledTouchRef = useRef(false);

  useEffect(() => {
    const handleFirstTouch = () => {
      if (!userToggledTouchRef.current) {
        setIsMobileMode(true);
      }
    };
    window.addEventListener('touchstart', handleFirstTouch, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', handleFirstTouch);
  }, []);

  // Keep Firebase Google Auth profile synced with local profile store
  useEffect(() => {
    const unsub = subscribeAuthState((fbUser) => {
      if (fbUser && fbUser.email) {
        loginWithGoogleAccount({
          id: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email.split('@')[0] || '冒險家',
          avatar: fbUser.photoURL || undefined
        });
      }
    });
    return unsub;
  }, []);

  // Flow screens: Main Menu & Death Screen
  const [isMainMenu, setIsMainMenu] = useState(true);
  const isMainMenuRef = useRef(true);
  useEffect(() => {
    isMainMenuRef.current = isMainMenu;
  }, [isMainMenu]);

  const [isDead, setIsDead] = useState(false);
  const isDeadRef = useRef(false);
  const [deathReason, setDeathReason] = useState('被骷髏擊敗了');

  // React UI States
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [craftingOpenedViaTable, setCraftingOpenedViaTable] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isWorldSelectOpen, setIsWorldSelectOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSkinSelectOpen, setIsSkinSelectOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isVipOpen, setIsVipOpen] = useState(false);
  const [isAIGuideOpen, setIsAIGuideOpen] = useState(false);
  const [isGoogleAccountOpen, setIsGoogleAccountOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [mailboxUnreadCount, setMailboxUnreadCount] = useState(0);
  const [selectedVillager, setSelectedVillager] = useState<MobEntity | null>(null);
  const [isTerrainLoading, setIsTerrainLoading] = useState(false);
  const [terrainLoadingStage, setTerrainLoadingStage] = useState('building_terrain');
  const [currentDimension, setCurrentDimension] = useState<'default' | 'heaven'>('heaven');
  const currentDimensionRef = useRef<'default' | 'heaven'>('heaven');
  const [currentWorld, setCurrentWorld] = useState<WorldSaveData | null>(null);
  const [spawnProtectionTimer, setSpawnProtectionTimer] = useState(0);

  // Heaven Boss state
  const [isSeraphimDefeated, setIsSeraphimDefeated] = useState(false);
  const [bossInfo, setBossInfo] = useState<{
    id: string;
    title: string;
    health: number;
    maxHealth: number;
    phase?: number;
    avatarUrl?: string;
  } | null>(null);
  const [portalLockedNotice, setPortalLockedNotice] = useState<string | null>(null);
  const portalLockedTimerRef = useRef<number | null>(null);

  // Synchronous refs for game loop state & pause checking
  const isPauseOpenRef = useRef(false);
  const isInventoryOpenRef = useRef(false);
  const isCraftingOpenRef = useRef(false);
  const isHelpOpenRef = useRef(false);
  const isDriveOpenRef = useRef(false);
  const isWorldSelectOpenRef = useRef(false);
  const isSettingsOpenRef = useRef(false);
  const isSkinSelectOpenRef = useRef(false);
  const isTradeOpenRef = useRef(false);
  const isMarketOpenRef = useRef(false);
  const isVipOpenRef = useRef(false);
  const isMailboxOpenRef = useRef(false);
  const isTerrainLoadingRef = useRef(false);
  const isMobileModeRef = useRef(false);
  const isPausedRef = useRef(false);

  // Keep refs and paused flags strictly in sync
  useEffect(() => {
    isPauseOpenRef.current = isPauseOpen;
    isInventoryOpenRef.current = isInventoryOpen;
    isCraftingOpenRef.current = isCraftingOpen;
    isHelpOpenRef.current = isHelpOpen;
    isDriveOpenRef.current = isDriveOpen;
    isWorldSelectOpenRef.current = isWorldSelectOpen;
    isSettingsOpenRef.current = isSettingsOpen;
    isSkinSelectOpenRef.current = isSkinSelectOpen;
    isTradeOpenRef.current = isTradeOpen;
    isMarketOpenRef.current = isMarketOpen;
    isVipOpenRef.current = isVipOpen;
    isMailboxOpenRef.current = isMailboxOpen;
    isTerrainLoadingRef.current = isTerrainLoading;
    isMobileModeRef.current = isMobileMode;
    currentDimensionRef.current = currentDimension;

    const paused =
      isPauseOpen ||
      isCraftingOpen ||
      isSettingsOpen ||
      isSkinSelectOpen ||
      isWorldSelectOpen ||
      isTradeOpen ||
      isHelpOpen ||
      isDriveOpen ||
      isMarketOpen ||
      isVipOpen ||
      isAIGuideOpen ||
      isGoogleAccountOpen ||
      isMailboxOpen ||
      isTerrainLoading;
    isPausedRef.current = paused;

    if (playerRef.current) {
      playerRef.current.isPaused = paused;
    }
    if (mobManagerRef.current) {
      mobManagerRef.current.isPaused = paused;
    }
  }, [
    isPauseOpen,
    isInventoryOpen,
    isCraftingOpen,
    isHelpOpen,
    isDriveOpen,
    isWorldSelectOpen,
    isSettingsOpen,
    isSkinSelectOpen,
    isTradeOpen,
    isMarketOpen,
    isVipOpen,
    isAIGuideOpen,
    isGoogleAccountOpen,
    isMailboxOpen,
    isTerrainLoading,
    isMobileMode
  ]);

  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('minecraft_settings') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      fov: 75,
      renderDistance: 3,
      masterVolume: 80,
      musicVolume: 60,
      musicEnabled: true,
      showClouds: true,
      skinId: (typeof window !== 'undefined' && localStorage.getItem('minecraft_player_skin')) || 'steve',
      mouseSensitivity: 100,
      difficulty: 'normal',
      showCoordinates: false,
      viewBobbing: true,
      isMobileMode: false
    };
  });

  // Sync settings with audio, camera, weather & difficulty
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('minecraft_settings', JSON.stringify(gameSettings));
    }
    soundManager.setMasterVolume(gameSettings.masterVolume);
    soundManager.setMusicVolume(gameSettings.musicVolume);
    soundManager.setMusicEnabled(gameSettings.musicEnabled);
    if (weatherRef.current) {
      weatherRef.current.setCloudsVisible(gameSettings.showClouds);
    }
    if (mobManagerRef.current) {
      mobManagerRef.current.difficulty = gameSettings.difficulty;
    }
    if (worldRef.current) {
      worldRef.current.setRenderRadius(gameSettings.renderDistance, playerRef.current?.camera.position);
    }
    if (playerRef.current) {
      playerRef.current.mouseSensitivityMultiplier = gameSettings.mouseSensitivity;
      playerRef.current.viewBobbing = gameSettings.viewBobbing;
      playerRef.current.camera.fov = gameSettings.fov;
      playerRef.current.camera.updateProjectionMatrix();
      playerRef.current.updateHeldItemMesh();
    }
  }, [gameSettings]);

  // HUD sync states
  const [activeHotbarIndex, setActiveHotbarIndex] = useState(0);
  const [inventoryState, setInventoryState] = useState(playerRef.current?.inventory || []);
  const [timeInfo, setTimeInfo] = useState({ hours: 12, minutes: 0, text: '12:00', icon: '☀️' });
  const [currentWeather, setCurrentWeather] = useState<WeatherType>('clear');
  const [isLightning, setIsLightning] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 10, z: 0 });
  const [currentBiome, setCurrentBiome] = useState<BiomeType>('plains');
  const [isFlying, setIsFlying] = useState(false);
  const [hurtTimer, setHurtTimer] = useState(0);
  const [viewMode, setViewMode] = useState<'first_person' | 'third_person_back' | 'third_person_front'>('first_person');
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    score: 0,
    activeHotbarIndex: 0,
    gameMode: 'survival'
  });

  const handleTogglePerspective = useCallback(() => {
    if (playerRef.current) {
      const nextMode = playerRef.current.cycleViewMode();
      setViewMode(nextMode);
    }
  }, []);

  // Minecraft-style Mining State
  const [miningProgress, setMiningProgress] = useState<number>(0);
  const [miningBlockName, setMiningBlockName] = useState<string>('');
  const [miningNotice, setMiningNotice] = useState<string>('');

  const miningStateRef = useRef<{
    isMining: boolean;
    targetPos: { x: number; y: number; z: number } | null;
    targetBlockType: string | null;
    elapsedTime: number;
    totalBreakTime: number;
    canHarvest: boolean;
    dropItemId: string | null;
    dropCount: number;
    harvestNotice?: string;
    swingTimer: number;
  }>({
    isMining: false,
    targetPos: null,
    targetBlockType: null,
    elapsedTime: 0,
    totalBreakTime: 1.0,
    canHarvest: true,
    dropItemId: null,
    dropCount: 1,
    harvestNotice: undefined,
    swingTimer: 0
  });

  // Minecraft-style Continuous Block Placing State (4-tick continuous placement)
  const placingStateRef = useRef<{
    isPlacing: boolean;
    cooldownTimer: number;
  }>({
    isPlacing: false,
    cooldownTimer: 0
  });

  const handleStopPlacing = useCallback(() => {
    placingStateRef.current.isPlacing = false;
  }, []);

  // Stop mining immediately
  const handleStopMining = useCallback(() => {
    miningStateRef.current.isMining = false;
    miningStateRef.current.targetPos = null;
    miningStateRef.current.elapsedTime = 0;
    setMiningProgress(0);
  }, []);

  // Core action: Mine block or Attack Mob
  const handleStartMiningOrAttack = useCallback(() => {
    if (!playerRef.current || !worldRef.current || !mobManagerRef.current) return;
    const player = playerRef.current;
    if (player.isDead) return;

    const world = worldRef.current;
    const mobManager = mobManagerRef.current;

    const eyePos = player.getEyePosition();
    const lookDir = player.getLookDirection();

    // 1. Check if mob in crosshair -> attack immediately!
    const mobHit = mobManager.checkPlayerAttackRay(eyePos, lookDir, 3.8);
    if (mobHit) {
      player.triggerSwing();
      const activeItem = player.getActiveItem();
      const baseDmg = activeItem?.damage || 2;
      const result = mobManager.damageMob(mobHit.hitMob.id, baseDmg, lookDir);

      if (result.died && result.dropItem) {
        player.addItemToInventory(result.dropItem, result.dropCount || 1);
        player.stats.score += 50;
        setInventoryState([...player.inventory]);
      }
      return;
    }

    // 2. Otherwise start block mining
    const hit = world.raycastVoxel(eyePos, lookDir, 5.5);
    if (hit && hit.hit) {
      // In creative mode: instant break, do not clutter inventory
      if (player.stats.gameMode === 'creative') {
        player.triggerSwing();
        world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, 'air', true);
        soundManager.playBreak();
        miningStateRef.current = {
          isMining: true,
          targetPos: { ...hit.blockPos },
          targetBlockType: hit.blockType,
          elapsedTime: 0,
          totalBreakTime: 0.16,
          canHarvest: false,
          dropItemId: null,
          dropCount: 0,
          harvestNotice: undefined,
          swingTimer: 0
        };
        return;
      }

      // Survival mode: Minecraft tool & breaking mechanics
      const calc = calculateBlockMining(hit.blockType, player.getActiveItem(), 'survival');
      miningStateRef.current = {
        isMining: true,
        targetPos: { ...hit.blockPos },
        targetBlockType: hit.blockType,
        elapsedTime: 0,
        totalBreakTime: calc.breakTime,
        canHarvest: calc.canHarvest,
        dropItemId: calc.dropItemId,
        dropCount: calc.dropCount,
        harvestNotice: calc.harvestNotice,
        swingTimer: 0
      };

      player.triggerSwing();
      soundManager.playDigHit(hit.blockType);
      setMiningBlockName(getBlockDisplayName(hit.blockType));
      setMiningNotice(calc.harvestNotice || '');
      setMiningProgress(0.01);
    } else {
      player.triggerSwing();
    }
  }, []);

  // Backwards compatibility alias for components calling executeMineOrAttack
  const executeMineOrAttack = handleStartMiningOrAttack;

  // Core action: Place block, Eat Food, or Interact with Villager
  const executePlaceOrUse = useCallback(() => {
    if (!playerRef.current || !worldRef.current) return;
    const player = playerRef.current;
    if (player.isDead) return;

    const eyePos = player.getEyePosition();
    const lookDir = player.getLookDirection();

    // 1. Check interaction with Villager first
    if (mobManagerRef.current) {
      const villager = mobManagerRef.current.checkPlayerInteractRay(eyePos, lookDir, 4.2);
      if (villager && villager.trades && villager.trades.length > 0) {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        soundManager.playVillagerTrade();
        setSelectedVillager(villager);
        setIsTradeOpen(true);
        return;
      }
    }

    const world = worldRef.current;

    // 2. Check interaction with placed Crafting Table block in 3D world (unless sneaking to place on top)
    if (!player.isSneaking) {
      const interactHit = world.raycastVoxel(eyePos, lookDir, 5.5);
      if (interactHit && interactHit.hit && interactHit.blockType === 'crafting_table') {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        soundManager.playButtonClick();
        setCraftingOpenedViaTable(true);
        setIsInventoryOpen(false);
        setIsCraftingOpen(true);
        placingStateRef.current.isPlacing = false;
        return;
      }
    }

    const activeItem = player.getActiveItem();
    if (!activeItem) return;

    const foodIds = ['apple', 'bread', 'steak', 'porkchop', 'golden_apple'];
    if (foodIds.includes(activeItem.id)) {
      player.eatFood(activeItem);
      setInventoryState([...player.inventory]);
      return;
    }

    // Spawn Egg usage: Right-click to spawn the mob on target block or right ahead!
    if (activeItem.type === 'spawn_egg' && activeItem.spawnMobType && mobManagerRef.current) {
      const hit = world.raycastVoxel(eyePos, lookDir, 5.5);
      let spawnX: number;
      let spawnY: number;
      let spawnZ: number;

      if (hit && hit.hit) {
        spawnX = hit.blockPos.x + hit.faceNormal.x + 0.5;
        spawnY = hit.blockPos.y + hit.faceNormal.y;
        spawnZ = hit.blockPos.z + hit.faceNormal.z + 0.5;
      } else {
        spawnX = player.position.x + lookDir.x * 2.8;
        spawnZ = player.position.z + lookDir.z * 2.8;
        spawnY = Math.max(player.position.y, 1);
      }

      mobManagerRef.current.createMob(activeItem.spawnMobType, spawnX, spawnY, spawnZ);
      player.triggerPlaceRecoil();
      soundManager.playCraftSuccess();
      if (player.stats.gameMode === 'survival') {
        player.deductActiveItem(1);
        setInventoryState([...player.inventory]);
      }
      placingStateRef.current.isPlacing = false;
      return;
    }

    if (activeItem.type === 'block' && activeItem.blockType) {
      const eyePos = player.getEyePosition();
      const lookDir = player.getLookDirection();
      const hit = world.raycastVoxel(eyePos, lookDir, 5.5);

      if (hit && hit.hit) {
        const placeX = hit.blockPos.x + hit.faceNormal.x;
        const placeY = hit.blockPos.y + hit.faceNormal.y;
        const placeZ = hit.blockPos.z + hit.faceNormal.z;

        // Prevent placing inside player body
        const playerBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(player.position.x, player.position.y + (player.isSneaking ? 0.75 : 0.9), player.position.z),
          new THREE.Vector3(0.65, player.isSneaking ? 1.5 : 1.8, 0.65)
        );
        const blockBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(placeX + 0.5, placeY + 0.5, placeZ + 0.5),
          new THREE.Vector3(0.99, 0.99, 0.99)
        );

        if (!playerBox.intersectsBox(blockBox)) {
          world.setBlock(placeX, placeY, placeZ, activeItem.blockType, true);
          player.triggerPlaceRecoil();
          soundManager.playBlockPlace();
          // In survival mode: consume 1 block
          // In creative mode: infinite block placement without deducting
          if (player.stats.gameMode === 'survival') {
            player.deductActiveItem(1);
            setInventoryState([...player.inventory]);
          }
        }
      }
    }
  }, []);

  // Setup Three.js Engine
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x7ec0ee, 0.015);
    sceneRef.current = scene;

    // 2. High-Performance Enhanced Graphics Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Voxel World
    const world = new VoxelWorld(scene);
    worldRef.current = world;

    // 4. Weather & Day/Night Manager
    const weather = new WeatherManager(scene);
    weatherRef.current = weather;

    // 5. Mob Manager
    const mobManager = new MobManager(scene, world);
    mobManagerRef.current = mobManager;

    // 6. Player Controller
    const player = new PlayerController(renderer.domElement, world, mobManager);
    player.isBackgroundMode = isMainMenuRef.current || isTerrainLoadingRef.current;
    playerRef.current = player;
    setInventoryState([...player.inventory]);

    // 7. VIP Dynamic World FX Manager
    const dynamicWorldFX = new DynamicWorldFXManager(scene, player.camera);

    // 8. Minecraft 3D Block Breaking Crack Mesh (Stages 0 to 9)
    const crackTextures: THREE.CanvasTexture[] = [];
    for (let stage = 0; stage < 10; stage++) {
      const cCanvas = document.createElement('canvas');
      cCanvas.width = 16;
      cCanvas.height = 16;
      const cCtx = cCanvas.getContext('2d')!;
      cCtx.imageSmoothingEnabled = false;
      cCtx.clearRect(0, 0, 16, 16);
      cCtx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      const crackCount = (stage + 1) * 3;
      for (let i = 0; i < crackCount; i++) {
        const cx = Math.floor(Math.abs(Math.sin(i * 12.3 + stage * 2.7)) * 14) + 1;
        const cy = Math.floor(Math.abs(Math.cos(i * 9.1 + stage * 3.4)) * 14) + 1;
        const w = (i % 2 === 0 ? 2 : 1);
        const h = (i % 3 === 0 ? 2 : 1);
        cCtx.fillRect(cx, cy, w, h);
      }
      const cTex = new THREE.CanvasTexture(cCanvas);
      cTex.magFilter = THREE.NearestFilter;
      cTex.minFilter = THREE.NearestFilter;
      crackTextures.push(cTex);
    }

    const crackGeom = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    const crackMat = new THREE.MeshBasicMaterial({
      map: crackTextures[0],
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const crackOverlayMesh = new THREE.Mesh(crackGeom, crackMat);
    crackOverlayMesh.visible = false;
    scene.add(crackOverlayMesh);

    // Pointer lock change listeners
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      setIsPointerLocked(locked);
      // In desktop mode: if pointer lock is lost while in active gameplay, open pause menu!
      if (!locked && !isMainMenuRef.current && !isDeadRef.current && !isMobileModeRef.current) {
        if (
          !isInventoryOpenRef.current &&
          !isCraftingOpenRef.current &&
          !isTradeOpenRef.current &&
          !isSettingsOpenRef.current &&
          !isSkinSelectOpenRef.current &&
          !isHelpOpenRef.current &&
          !isDriveOpenRef.current &&
          !isWorldSelectOpenRef.current &&
          !isMailboxOpenRef.current &&
          !isMarketOpenRef.current &&
          !isTerrainLoadingRef.current
        ) {
          setIsPauseOpen(true);
        }
      }
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Window resize handler
    const handleResize = () => {
      if (!renderer || !player) return;
      player.camera.aspect = window.innerWidth / window.innerHeight;
      player.camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMainMenuRef.current) return;

      if (e.code === 'Escape') {
        e.preventDefault();
        soundManager.playButtonClick();
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }

        // Modal back-navigation stack
        if (isInventoryOpenRef.current) {
          setIsInventoryOpen(false);
          if (!isMobileModeRef.current && rendererRef.current) {
            rendererRef.current.domElement.requestPointerLock();
          }
          return;
        }
        if (isTradeOpenRef.current) {
          setIsTradeOpen(false);
          if (!isMobileModeRef.current && rendererRef.current) {
            rendererRef.current.domElement.requestPointerLock();
          }
          return;
        }
        if (isSettingsOpenRef.current) {
          setIsSettingsOpen(false);
          setIsPauseOpen(true);
          return;
        }
        if (isSkinSelectOpenRef.current) {
          setIsSkinSelectOpen(false);
          setIsPauseOpen(true);
          return;
        }
        if (isHelpOpenRef.current) {
          setIsHelpOpen(false);
          setIsPauseOpen(true);
          return;
        }
        if (isDriveOpenRef.current) {
          setIsDriveOpen(false);
          setIsPauseOpen(true);
          return;
        }
        if (isMailboxOpenRef.current) {
          setIsMailboxOpen(false);
          setIsPauseOpen(true);
          return;
        }

        // Toggle pause menu
        if (isPauseOpenRef.current) {
          setIsPauseOpen(false);
          if (!isMobileModeRef.current && rendererRef.current) {
            rendererRef.current.domElement.requestPointerLock();
          }
          return;
        }

        setIsPauseOpen(true);
        return;
      }

      if (e.code === 'KeyE') {
        if (isCraftingOpenRef.current) return;
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        setIsInventoryOpen((prev) => !prev);
      } else if (e.code === 'KeyR') {
        if (isCraftingOpenRef.current) return;
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        setIsInventoryOpen(false);
        setCraftingOpenedViaTable(false);
        setIsCraftingOpen(true);
      } else if (e.code === 'KeyH') {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        setIsHelpOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Animation loop
    const clock = new THREE.Clock();
    let animId: number;
    let hudSyncCounter = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const isPaused = isPausedRef.current;

      // Sync background view state to player controller:
      // When in Main Menu or Terrain Loading, player is in background panorama mode (hand and player body are hidden)
      // When entering the world and playing, isBackgroundMode is false so the hands and character appear properly
      const isBackgroundView = isMainMenuRef.current || isTerrainLoadingRef.current;
      player.isBackgroundMode = isBackgroundView;

      // In main menu OR during terrain loading: rotate 360 panoramic view showing the selected terrain!
      if (isBackgroundView) {
        player.yaw += delta * 0.18;
      }

      // 1. Weather & Day/Night cycle update with dynamic environmental biome ambient lighting & fog
      const biomeAtPos = world.getBiome(player.position.x, player.position.z);
      const { skyColor, fogColor, fogDensity, isNight, mobSpawnMultiplier } = weather.update(
        isPaused ? 0 : delta,
        player.position,
        biomeAtPos
      );
      scene.background = skyColor;
      if (scene.fog) {
        scene.fog.color.copy(fogColor);
        if ('density' in scene.fog) {
          (scene.fog as THREE.FogExp2).density = fogDensity;
        }
      }

      // 1.1 VIP Dynamic World FX update (Organic wind sway, ripples & particles)
      dynamicWorldFX.update(isPaused ? 0 : delta, player.position, isVipActive());

      // 2. Mob AI & Physics update (only when in active game AND not paused AND not during terrain loading)
      if (!isMainMenuRef.current && !isPaused && !isTerrainLoadingRef.current) {
        mobManager.update(
          delta,
          player.position,
          (dmg) => {
            if (!isPausedRef.current && !isMainMenuRef.current && !isTerrainLoadingRef.current && player.spawnProtectionTimer <= 0) {
              player.takeDamage(dmg, '被骷髏擊敗了');
            }
          },
          mobSpawnMultiplier
        );
      }

      // 3. Player Movement, Camera & Hand Visibility update
      player.update(isPaused ? 0 : delta);

      // 4. Voxel World particles & chunk update (frozen when paused)
      world.update(isPaused ? 0 : delta, player.position);

      // 4.0 Continuous Minecraft-style block placing (4-tick continuous repeat)
      if (placingStateRef.current.isPlacing && !isMainMenuRef.current && !player.isDead && !isPaused && !isTerrainLoadingRef.current) {
        placingStateRef.current.cooldownTimer -= delta;
        if (placingStateRef.current.cooldownTimer <= 0) {
          executePlaceOrUse();
          placingStateRef.current.cooldownTimer = 0.22;
        }
      }

      // 4.1 Continuous Minecraft-style block mining update
      if (miningStateRef.current.isMining && !isMainMenuRef.current && !player.isDead && !isPaused && !isTerrainLoadingRef.current) {
        const eyePos = player.getEyePosition();
        const lookDir = player.getLookDirection();
        const hit = world.raycastVoxel(eyePos, lookDir, 5.5);

        if (hit && hit.hit) {
          if (player.stats.gameMode === 'creative') {
            // Creative rapid continuous breaking
            miningStateRef.current.elapsedTime += delta;
            if (miningStateRef.current.elapsedTime >= 0.16) {
              player.triggerSwing();
              world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, 'air', true);
              soundManager.playBreak();
              miningStateRef.current.elapsedTime = 0;
            }
            crackOverlayMesh.visible = false;
          } else {
            // Survival mining with progressive damage cracks
            const curTarget = miningStateRef.current.targetPos;
            const isSameBlock = curTarget &&
              curTarget.x === hit.blockPos.x &&
              curTarget.y === hit.blockPos.y &&
              curTarget.z === hit.blockPos.z;

            if (!isSameBlock) {
              // Target block changed while holding click/touch
              const calc = calculateBlockMining(hit.blockType, player.getActiveItem(), player.stats.gameMode);
              miningStateRef.current.targetPos = { ...hit.blockPos };
              miningStateRef.current.targetBlockType = hit.blockType;
              miningStateRef.current.elapsedTime = 0;
              miningStateRef.current.totalBreakTime = calc.breakTime;
              miningStateRef.current.canHarvest = calc.canHarvest;
              miningStateRef.current.dropItemId = calc.dropItemId;
              miningStateRef.current.dropCount = calc.dropCount;
              miningStateRef.current.harvestNotice = calc.harvestNotice;
              miningStateRef.current.swingTimer = 0;

              setMiningBlockName(getBlockDisplayName(hit.blockType));
              setMiningNotice(calc.harvestNotice || '');
            }

            if (miningStateRef.current.totalBreakTime === Infinity) {
              // Unbreakable (Bedrock)
              miningStateRef.current.swingTimer += delta;
              if (miningStateRef.current.swingTimer >= 0.25) {
                player.triggerSwing();
                soundManager.playDigHit(hit.blockType);
                miningStateRef.current.swingTimer = 0;
              }
              crackOverlayMesh.visible = false;
              setMiningProgress(0);
              setMiningNotice('🛡️ 基岩是無法被破壞的！');
            } else {
              miningStateRef.current.elapsedTime += delta;
              miningStateRef.current.swingTimer += delta;

              if (miningStateRef.current.swingTimer >= 0.25) {
                player.triggerSwing();
                soundManager.playDigHit(hit.blockType);
                miningStateRef.current.swingTimer = 0;
              }

              const prog = Math.min(1.0, miningStateRef.current.elapsedTime / (miningStateRef.current.totalBreakTime || 1.0));
              setMiningProgress(prog);

              // Update 3D Crack Overlay
              const crackStage = Math.min(9, Math.floor(prog * 10));
              crackMat.map = crackTextures[crackStage];
              crackMat.needsUpdate = true;
              crackOverlayMesh.position.set(hit.blockPos.x + 0.5, hit.blockPos.y + 0.5, hit.blockPos.z + 0.5);
              crackOverlayMesh.visible = true;

              if (prog >= 1.0) {
                // Block successfully broken!
                world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, 'air', true);
                soundManager.playBreak();
                crackOverlayMesh.visible = false;

                if (player.stats.gameMode === 'survival') {
                  if (miningStateRef.current.canHarvest && miningStateRef.current.dropItemId) {
                    player.addItemToInventory(miningStateRef.current.dropItemId, miningStateRef.current.dropCount);
                    player.stats.score += 5;
                    setInventoryState([...player.inventory]);
                  } else if (miningStateRef.current.harvestNotice) {
                    setMiningNotice(miningStateRef.current.harvestNotice);
                  }
                }

                // Reset target pos to allow seamless chaining on hold
                miningStateRef.current.targetPos = null;
                miningStateRef.current.elapsedTime = 0;
                setMiningProgress(0);
              }
            }
          }
        } else {
          // Looking at air
          crackOverlayMesh.visible = false;
          miningStateRef.current.targetPos = null;
          miningStateRef.current.elapsedTime = 0;
          setMiningProgress(0);
        }
      } else {
        crackOverlayMesh.visible = false;
      }

      // 5. Block Highlight Selection Box Raycasting (only in game and when not paused)
      if (!isMainMenuRef.current && !player.isDead && !isPaused && !isTerrainLoadingRef.current) {
        const eyePos = player.getEyePosition();
        const lookDir = player.getLookDirection();
        const rayResult = world.raycastVoxel(eyePos, lookDir, 5.5);

        if (rayResult && rayResult.hit) {
          world.selectionBox.position.set(
            rayResult.blockPos.x + 0.5,
            rayResult.blockPos.y + 0.5,
            rayResult.blockPos.z + 0.5
          );
          world.selectionBox.visible = true;
        } else {
          world.selectionBox.visible = false;
        }
      } else {
        world.selectionBox.visible = false;
      }

      // 5.5 In Heaven dimension: Check if player touches Celestial Return Portal at (0, 16, 8)
      if (currentDimensionRef.current === 'heaven' && !isMainMenuRef.current && !player.isDead && !isPaused && !isTerrainLoadingRef.current) {
        const pDistToPortal = Math.sqrt(player.position.x * player.position.x + (player.position.z - 8) * (player.position.z - 8));
        if (pDistToPortal < 1.9 && Math.abs(player.position.y - 17) < 3.2) {
          const seraphimMob = mobManager.mobs.find((m) => m.type === 'seraphim');
          if (seraphimMob && seraphimMob.health > 0) {
            // Push player gently back from locked barrier
            player.velocity.z -= 4.5;
            player.velocity.y = 2.0;
            triggerPortalLockedNotice('🔒 天界封印未解除！必須在天堂打完 Boss「天界熾天使」才能打開傳送門回主世界！');
          } else {
            // Portal unlocked! Step in to return directly to Overworld
            if (!isTerrainLoadingRef.current) {
              isTerrainLoadingRef.current = true;
              performDimensionSwitch('default');
            }
          }
        }
      }

      // 6. Render
      renderer.render(scene, player.camera);

      // 7. Sync state to React HUD
      hudSyncCounter++;
      if (hudSyncCounter % 4 === 0) {
        setTimeInfo(weather.getTimeDisplay());
        setCurrentWeather(weather.weather.current);
        setIsLightning(weather.weather.isLightning);
        setPlayerPos({ x: player.position.x, y: player.position.y, z: player.position.z });
        setCurrentBiome(biomeAtPos);
        setIsFlying(player.isFlying);
        setHurtTimer(player.hurtTimer);
        setSpawnProtectionTimer(player.spawnProtectionTimer);
        setActiveHotbarIndex(player.stats.activeHotbarIndex);
        setPlayerStats({ ...player.stats });
        setViewMode(player.viewMode);

        // Sync Boss Health Bar
        const seraphim = mobManager.mobs.find((m) => m.type === 'seraphim');
        if (seraphim && seraphim.health > 0) {
          setBossInfo({
            id: seraphim.id,
            title: seraphim.bossTitle || '天界熾天使 · 塞拉芬 (Seraphim)',
            health: seraphim.health,
            maxHealth: seraphim.maxHealth,
            phase: seraphim.bossPhase || 1,
            avatarUrl: '/seraphim_boss.jpg'
          });
        } else {
          setBossInfo(null);
        }

        // Only sync death state when actually in-game (NEVER in main menu or terrain loading!)
        if (!isMainMenuRef.current && !isTerrainLoadingRef.current) {
          if (player.isDead !== isDeadRef.current) {
            isDeadRef.current = player.isDead;
            setIsDead(player.isDead);
            if (player.isDead) {
              setDeathReason(player.deathReason || '被骷髏擊敗了');
              if (document.pointerLockElement) {
                document.exitPointerLock();
              }
            }
          }
        } else {
          isDeadRef.current = false;
        }
      }
    };

    animate();

    // Global window mouseup to release mining or placing hold reliably
    const onWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        miningStateRef.current.isMining = false;
        miningStateRef.current.targetPos = null;
        miningStateRef.current.elapsedTime = 0;
        crackOverlayMesh.visible = false;
        setMiningProgress(0);
      }
      if (e.button === 2) {
        placingStateRef.current.isPlacing = false;
      }
    };
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', onWindowMouseUp);
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      dynamicWorldFX.dispose();
      renderer.dispose();
    };
  }, []);

  // Desktop Mouse Interaction
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // If user clicked any interactive element (buttons, modals, inputs, links), do not capture or lock pointer!
    const target = e.target as HTMLElement;
    if (target && target.closest('button, a, input, select, textarea, [data-interactive], [role="button"]')) {
      return;
    }

    if (isMainMenu || isDead) return;

    // In mobile mode, physical mouse clicks don't force pointer lock
    if (isMobileMode) return;

    if (document.pointerLockElement !== rendererRef.current?.domElement) {
      rendererRef.current?.domElement.requestPointerLock();
      return;
    }

    if (e.button === 0) {
      handleStartMiningOrAttack();
    } else if (e.button === 2) {
      placingStateRef.current.isPlacing = true;
      placingStateRef.current.cooldownTimer = 0.22;
      executePlaceOrUse();
    }
  }, [isMainMenu, isDead, isMobileMode, handleStartMiningOrAttack, executePlaceOrUse]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      handleStopMining();
    } else if (e.button === 2) {
      handleStopPlacing();
    }
  }, [handleStopMining, handleStopPlacing]);

  const handleSelectHotbar = (idx: number) => {
    if (!playerRef.current) return;
    playerRef.current.stats.activeHotbarIndex = idx;
    playerRef.current.updateHeldItemMesh();
    setActiveHotbarIndex(idx);
  };

  const handleUpdateInventory = (newInv: (import('../types').InventoryItem | null)[]) => {
    if (!playerRef.current) return;
    playerRef.current.inventory = newInv;
    playerRef.current.updateHeldItemMesh();
    setInventoryState([...newInv]);
  };

  const handleCycleWeather = () => {
    if (!weatherRef.current) return;
    const current = weatherRef.current.weather.current;
    const next = current === 'clear' ? 'rain' : (current === 'rain' ? 'thunder' : 'clear');
    weatherRef.current.setWeather(next);
    setCurrentWeather(next);
  };

  const handleToggleFly = () => {
    if (!playerRef.current) return;
    // Flight only allowed in creative mode!
    if (playerRef.current.stats.gameMode !== 'creative') return;
    playerRef.current.isFlying = !playerRef.current.isFlying;
    playerRef.current.velocity.set(0, 0, 0);
    setIsFlying(playerRef.current.isFlying);
  };

  const handleToggleGameMode = (newMode?: 'survival' | 'creative') => {
    if (!playerRef.current) return;
    const current = playerRef.current.stats.gameMode;
    const next = newMode || (current === 'survival' ? 'creative' : 'survival');
    playerRef.current.setGameMode(next);
    setPlayerStats({ ...playerRef.current.stats });
    setIsFlying(playerRef.current.isFlying);
  };

  // Respawn & Title screen navigation
  const handleRespawn = () => {
    if (!playerRef.current) return;
    isDeadRef.current = false;
    setIsDead(false);
    setDeathReason('');
    playerRef.current.respawn();
    playerRef.current.spawnProtectionTimer = 5.0; // 5s invulnerability
    if (mobManagerRef.current) {
      mobManagerRef.current.clearAllMobs();
    }
    setPlayerStats({ ...playerRef.current.stats });
    if (!isMobileMode && rendererRef.current) {
      rendererRef.current.domElement.requestPointerLock();
    }
  };

  const handleReturnToMainMenu = () => {
    // Auto-save active world on exiting to main menu if alive
    if (worldRef.current && playerRef.current && weatherRef.current && !isDeadRef.current) {
      handleSaveWorld();
    }
    isDeadRef.current = false;
    setIsDead(false);
    setDeathReason('');

    if (playerRef.current) {
      playerRef.current.isDead = false;
      playerRef.current.stats.health = 20;
      playerRef.current.stats.hunger = 20;
      playerRef.current.spawnProtectionTimer = 60.0;
      playerRef.current.respawn();
    }

    if (mobManagerRef.current) {
      mobManagerRef.current.clearAllMobs();
    }

    // Reset rotating panorama background to Heaven for the Main Menu
    if (worldRef.current && weatherRef.current) {
      worldRef.current.generateTerrain(88888, 'heaven');
      weatherRef.current.isHeaven = true;
      setCurrentDimension('heaven');
    }

    setIsPauseOpen(false);
    setIsSettingsOpen(false);
    setIsSkinSelectOpen(false);
    setIsTradeOpen(false);
    setIsHelpOpen(false);
    setIsDriveOpen(false);
    setIsInventoryOpen(false);
    setIsCraftingOpen(false);
    setIsWorldSelectOpen(false);
    setIsTerrainLoading(false);
    setIsMainMenu(true);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  };

  const handleSelectAndLoadWorld = (worldData: WorldSaveData) => {
    setCurrentWorld(worldData);
    setIsWorldSelectOpen(false);
    setIsPauseOpen(false);
    isDeadRef.current = false;
    setIsDead(false);

    if (!worldRef.current || !playerRef.current || !weatherRef.current) return;
    const world = worldRef.current;
    const player = playerRef.current;
    const weather = weatherRef.current;
    const mobManager = mobManagerRef.current;

    soundManager.startBgm();

    const isHeaven = worldData.worldType === 'heaven';
    setCurrentDimension(isHeaven ? 'heaven' : 'default');

    // Synchronously generate/load world so the 360 rotating panorama shows this exact terrain!
    world.loadWorld(worldData);

    // Weather & lighting
    weather.isHeaven = isHeaven;
    weather.timeOfDay = typeof worldData.timeOfDay === 'number' ? worldData.timeOfDay : 0.25;
    weather.setWeather(worldData.weather || 'clear');
    setCurrentWeather(worldData.weather || 'clear');

    // Clear hostile mobs immediately to guarantee no attack upon entering!
    if (mobManager) {
      mobManager.clearAllMobs();
      if (!isHeaven) {
        mobManager.spawnVillageVillagers(world.villageLocations);
      } else {
        setIsSeraphimDefeated(false);
        mobManager.createMob('seraphim', 0, 22, 10);
        mobManager.onSeraphimDefeated = () => {
          setIsSeraphimDefeated(true);
          soundManager.playPortalUnlock();
          triggerPortalLockedNotice('✨ 熾天使已被擊敗！通往主世界的封印已解除，傳送門現已開啟！');
        };
      }
    }

    // Player stats, inventory, and 6s spawn invulnerability
    player.setGameMode(worldData.gameMode || 'survival');
    player.isDead = false;
    player.stats.health = worldData.player?.health ?? 20;
    player.stats.hunger = worldData.player?.hunger ?? 20;
    player.spawnProtectionTimer = 6.0;

    const hasItems = worldData.player?.inventory && worldData.player.inventory.some((i) => i !== null);
    if (hasItems) {
      player.inventory = [...worldData.player.inventory];
    } else {
      player.initInventoryForMode(worldData.gameMode || 'survival');
    }
    player.updateHeldItemMesh();
    setInventoryState([...player.inventory]);
    setPlayerStats({ ...player.stats });
    setIsFlying(player.isFlying);

    // Spawn coordinate & scenic angle for rotating view
    const spawnY = worldData.player?.y ?? (worldData.worldType === 'flat' ? 6 : (isHeaven ? 18 : 14));
    player.position.set(worldData.player?.x ?? 0, spawnY, worldData.player?.z ?? 0);
    player.yaw = worldData.player?.yaw ?? 0;
    player.pitch = -0.12;
    player.velocity.set(0, 0, 0);

    // Switch out of main menu to begin rotating preview in the chosen terrain
    setIsMainMenu(false);
    setTerrainLoadingStage('loading_world');
    setIsTerrainLoading(true);
  };

  const triggerPortalLockedNotice = useCallback((msg: string) => {
    soundManager.playPortalLocked();
    setPortalLockedNotice(msg);
    if (portalLockedTimerRef.current) window.clearTimeout(portalLockedTimerRef.current);
    portalLockedTimerRef.current = window.setTimeout(() => {
      setPortalLockedNotice(null);
    }, 4000);
  }, []);

  const performDimensionSwitch = useCallback((nextDim: 'default' | 'heaven') => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    soundManager.playPortalAmbient();
    setTerrainLoadingStage(nextDim === 'heaven' ? 'building_terrain' : 'loading_world');
    setIsTerrainLoading(true);

    setTimeout(() => {
      setCurrentDimension(nextDim);
      const world = worldRef.current;
      const weather = weatherRef.current;
      const player = playerRef.current;
      const mobManager = mobManagerRef.current;

      if (world) {
        world.generateTerrain(world.currentSeed || 88888, nextDim);
      }
      if (weather) {
        weather.isHeaven = nextDim === 'heaven';
      }
      if (mobManager && world) {
        mobManager.clearAllMobs();
        if (nextDim === 'heaven') {
          setIsSeraphimDefeated(false);
          mobManager.createMob('seraphim', 0, 22, 10);
          mobManager.onSeraphimDefeated = () => {
            setIsSeraphimDefeated(true);
            soundManager.playPortalUnlock();
            triggerPortalLockedNotice('✨ 熾天使已被擊敗！通往主世界的封印已解除，傳送門現已開啟！');
          };
        } else if (nextDim === 'default') {
          mobManager.spawnVillageVillagers(world.villageLocations);
        }
      }
      if (player) {
        const spawnY = nextDim === 'heaven' ? 18 : 14;
        player.position.set(0, spawnY, 0);
        player.velocity.set(0, 0, 0);
      }
    }, 150);
  }, [triggerPortalLockedNotice]);

  const handleSwitchDimension = useCallback((targetDim?: 'default' | 'heaven') => {
    const nextDim = targetDim || (currentDimension === 'heaven' ? 'default' : 'heaven');

    // If currently in Heaven and trying to go back to Overworld:
    if (currentDimension === 'heaven' && nextDim === 'default') {
      const mobManager = mobManagerRef.current;
      const seraphimMob = mobManager?.mobs.find((m) => m.type === 'seraphim');
      if (seraphimMob && seraphimMob.health > 0) {
        triggerPortalLockedNotice('🔒 天界封印未解除！必須在天堂打完 Boss「天界熾天使」才能打開傳送門回主世界！');
        return;
      }
    }

    performDimensionSwitch(nextDim);
  }, [currentDimension, triggerPortalLockedNotice, performDimensionSwitch]);

  const handleExecuteTrade = (
    tradeId: string,
    costItem: string,
    costCount: number,
    giveItem: string,
    giveCount: number
  ): boolean => {
    const player = playerRef.current;
    if (!player) return false;

    // Check count of costItem in player inventory
    let totalHave = 0;
    for (const slot of player.inventory) {
      if (slot && slot.id === costItem) {
        totalHave += slot.count;
      }
    }
    if (totalHave < costCount) return false;

    // Deduct costItem
    let toDeduct = costCount;
    for (let i = 0; i < player.inventory.length; i++) {
      const slot = player.inventory[i];
      if (slot && slot.id === costItem) {
        if (slot.count > toDeduct) {
          slot.count -= toDeduct;
          toDeduct = 0;
          break;
        } else {
          toDeduct -= slot.count;
          player.inventory[i] = null;
        }
      }
    }

    // Add giveItem
    player.addItemToInventory(giveItem, giveCount);
    player.updateHeldItemMesh();
    setInventoryState([...player.inventory]);
    soundManager.playVillagerTrade();
    return true;
  };

  const handleStartGame = (mode: 'survival' | 'creative' = 'survival') => {
    const list = worldStorage.listWorlds();
    let target = list.find((w) => w.gameMode === mode) || list[0];
    if (!target) {
      target = worldStorage.createWorld({
        name: mode === 'creative' ? '我的創造大作' : '我的生存冒險',
        gameMode: mode,
        worldType: 'default'
      });
    }
    handleSelectAndLoadWorld(target);
  };

  // World Save & Load logic
  const handleSaveWorld = (): WorldSaveData => {
    const world = worldRef.current!;
    const player = playerRef.current!;
    const weather = weatherRef.current!;

    const modifiedBlocks: Record<string, import('../types').BlockType> = {};
    world.playerModifications.forEach((val, key) => {
      modifiedBlocks[key] = val;
    });

    const activeId = currentWorld?.id || `world_${Date.now()}`;
    const activeName = currentWorld?.name || (player.stats.gameMode === 'creative' ? '我的創造世界' : '我的生存世界');
    const activeSeed = currentWorld?.seed ?? world.currentSeed ?? 88888;
    const activeType = currentWorld?.worldType ?? world.currentWorldType ?? 'default';

    const saved: WorldSaveData = {
      id: activeId,
      version: 1,
      name: activeName,
      gameMode: player.stats.gameMode,
      worldType: activeType,
      seed: activeSeed,
      createdAt: currentWorld?.createdAt || new Date().toLocaleString(),
      savedAt: new Date().toLocaleString(),
      timeOfDay: weather.timeOfDay,
      weather: weather.weather.current,
      player: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        yaw: player.yaw,
        pitch: player.pitch,
        health: player.stats.health,
        hunger: player.stats.hunger,
        inventory: player.inventory,
        gameMode: player.stats.gameMode
      },
      modifiedBlocks
    };

    worldStorage.saveWorld(saved);
    setCurrentWorld(saved);
    return saved;
  };

  const handleLoadWorld = (data: WorldSaveData) => {
    handleSelectAndLoadWorld(data);
  };

  const handleTerrainLoadingComplete = useCallback(() => {
    setIsTerrainLoading(false);
    if (!isMobileMode && rendererRef.current && !isPauseOpenRef.current && !isDeadRef.current) {
      rendererRef.current.domElement.requestPointerLock();
    }
  }, [isMobileMode]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      className="relative h-[100dvh] w-screen overflow-hidden bg-black select-none touch-none"
    >
      {/* HUD Layer (visible in-game when not in main menu) */}
      {!isMainMenu && (
        <HUD
          currentBiome={currentBiome}
          worldName={currentWorld?.name || (currentDimension === 'heaven' ? '天堂世界 (Aether)' : '盜版主世界')}
          stats={playerStats}
          inventory={inventoryState}
          activeHotbarIndex={activeHotbarIndex}
          onSelectHotbar={handleSelectHotbar}
          timeInfo={timeInfo}
          weatherType={currentWeather}
          isLightning={isLightning}
          playerPos={playerPos}
          isFlying={isFlying}
          hurtTimer={hurtTimer}
          spawnProtectionTimer={spawnProtectionTimer}
          isPointerLocked={isPointerLocked}
          isMobileMode={isMobileMode}
          onToggleMobileMode={() => {
            userToggledTouchRef.current = true;
            setIsMobileMode((prev) => !prev);
          }}
          viewMode={viewMode}
          onTogglePerspective={handleTogglePerspective}
          miningProgress={miningProgress}
          miningBlockName={miningBlockName}
          miningNotice={miningNotice}
          bossInfo={bossInfo}
          portalLockedNotice={portalLockedNotice}
          onOpenInventory={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsCraftingOpen(false);
            setIsInventoryOpen(true);
          }}
          onOpenCrafting={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsInventoryOpen(false);
            setCraftingOpenedViaTable(false);
            setIsCraftingOpen(true);
          }}
          onOpenHelp={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsHelpOpen(true);
          }}
          onOpenDrive={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsDriveOpen(true);
          }}
          onCycleWeather={handleCycleWeather}
          onOpenMainMenu={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsMainMenu(true);
          }}
          onToggleGameMode={handleToggleGameMode}
          dimension={currentDimension}
          onSwitchDimension={() => handleSwitchDimension()}
          onOpenSettings={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsSettingsOpen(true);
          }}
          onOpenPause={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsPauseOpen(true);
          }}
          onOpenMarket={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsMarketOpen(true);
          }}
          onOpenAIGuide={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsAIGuideOpen(true);
          }}
          onOpenGoogleAccount={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsGoogleAccountOpen(true);
          }}
          onOpenMailbox={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsMailboxOpen(true);
          }}
          mailboxUnreadCount={mailboxUnreadCount}
        />
      )}

      {/* Main Menu (Blocky Title Screen with Marketplace, Mailbox, 3D character on right) */}
      {isMainMenu && (
        <MainMenu
          onOpenWorldSelect={() => setIsWorldSelectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSkins={() => setIsSkinSelectOpen(true)}
          onOpenMarket={() => setIsMarketOpen(true)}
          onOpenMailbox={() => setIsMailboxOpen(true)}
          mailboxUnreadCount={mailboxUnreadCount}
          skinId={gameSettings.skinId}
        />
      )}

      {/* Death Screen - only visible during active game, never on main menu */}
      {!isMainMenu && isDead && (
        <DeathScreen
          score={playerStats.score}
          deathReason={deathReason}
          onRespawn={handleRespawn}
          onReturnToMainMenu={handleReturnToMainMenu}
        />
      )}

      {/* Mobile & Tablet Touch Virtual Joystick & Action Buttons Overlay */}
      {!isMainMenu && !isDead && isMobileMode && !isInventoryOpen && !isCraftingOpen && !isHelpOpen && !isDriveOpen && !isPauseOpen && !isSettingsOpen && !isSkinSelectOpen && !isTradeOpen && !isMarketOpen && !isVipOpen && !isAIGuideOpen && !isGoogleAccountOpen && !isMailboxOpen && !isTerrainLoading && (
        <MobileControls
          player={playerRef.current}
          world={worldRef.current}
          mobManager={mobManagerRef.current}
          onMineOrAttack={executeMineOrAttack}
          onStartMining={handleStartMiningOrAttack}
          onStopMining={handleStopMining}
          onPlaceOrUse={executePlaceOrUse}
          isFlying={isFlying}
          onToggleFly={handleToggleFly}
          onOpenCrafting={() => {
            setIsInventoryOpen(false);
            setCraftingOpenedViaTable(false);
            setIsCraftingOpen(true);
          }}
          onOpenInventory={() => {
            setIsCraftingOpen(false);
            setIsInventoryOpen(true);
          }}
          onTogglePerspective={handleTogglePerspective}
          gameMode={playerStats.gameMode}
        />
      )}

      {/* Start / Resume Click Overlay for Desktop mode when not locked (rendered at z-20 so HUD at z-40 remains clickable) */}
      {!isMainMenu && !isDead && !isMobileMode && !isPointerLocked && !isInventoryOpen && !isCraftingOpen && !isHelpOpen && !isDriveOpen && !isPauseOpen && !isSettingsOpen && !isSkinSelectOpen && !isTradeOpen && !isMarketOpen && !isVipOpen && !isAIGuideOpen && !isGoogleAccountOpen && !isMailboxOpen && !isTerrainLoading && (
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target && target.closest('button, a, input, select, textarea, [data-interactive], [role="button"]')) {
              return;
            }
            rendererRef.current?.domElement.requestPointerLock();
          }}
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center bg-black/60 backdrop-blur-xs font-mono transition-all"
        >
          <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-emerald-500/40 bg-stone-900/95 p-8 text-center shadow-2xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
              <Play className="h-8 w-8 ml-1" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-wider text-emerald-400">
                點擊進入 盜版 3D 世界
              </h1>
              <p className="mt-1 text-sm text-stone-300">
                鎖定滑鼠指針以開啟第一人稱視野
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-stone-400">
              <span className="rounded bg-stone-800 px-2.5 py-1 border border-stone-700">
                WASD 移動
              </span>
              <span className="rounded bg-stone-800 px-2.5 py-1 border border-stone-700">
                左鍵挖掘/攻擊
              </span>
              <span className="rounded bg-stone-800 px-2.5 py-1 border border-stone-700">
                右鍵放置/進食/村民交易
              </span>
              <span className="rounded bg-stone-800 px-2.5 py-1 border border-stone-700">
                E 物品庫 / ESC 暫停選單
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                userToggledTouchRef.current = true;
                setIsMobileMode(true);
              }}
              className="mt-2 flex items-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-950/80 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-800 hover:text-white"
            >
              <Smartphone className="h-4 w-4" />
              <span>切換為平板/手機觸控操作模式</span>
            </button>
          </div>
        </div>
      )}

      {/* Terrain Loading Screen with Live 360 Rotating Panorama */}
      <TerrainLoadingScreen
        isLoading={isTerrainLoading}
        worldName={currentWorld?.name || (currentDimension === 'heaven' ? '天堂以太世界' : '我的世界')}
        worldType={currentWorld?.worldType || (currentDimension === 'heaven' ? 'heaven' : 'default')}
        stage={terrainLoadingStage as any}
        dimension={currentDimension}
        onComplete={handleTerrainLoadingComplete}
      />

      {/* Pause Game Menu (ESC) */}
      <PauseMenu
        isOpen={isPauseOpen && !isMainMenu && !isDead}
        onResume={() => {
          setIsPauseOpen(false);
          if (!isMobileMode && rendererRef.current) {
            rendererRef.current.domElement.requestPointerLock();
          }
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
        }}
        onOpenSkins={() => {
          setIsSkinSelectOpen(true);
        }}
        onOpenHelp={() => {
          setIsHelpOpen(true);
        }}
        onOpenMarket={() => {
          setIsPauseOpen(false);
          setIsMarketOpen(true);
        }}
        onOpenAIGuide={() => {
          setIsPauseOpen(false);
          setIsAIGuideOpen(true);
        }}
        onOpenMailbox={() => {
          setIsPauseOpen(false);
          setIsMailboxOpen(true);
        }}
        mailboxUnreadCount={mailboxUnreadCount}
        onSwitchDimension={() => handleSwitchDimension()}
        currentDimension={currentDimension}
        onToggleGameMode={() => handleToggleGameMode()}
        gameMode={playerStats.gameMode}
        onSaveWorld={() => {
          handleSaveWorld();
        }}
        onQuitToMainMenu={handleReturnToMainMenu}
        worldName={currentWorld?.name || (playerStats.gameMode === 'creative' ? '我的創造世界' : '我的生存世界')}
        seed={currentWorld?.seed ?? worldRef.current?.currentSeed ?? 88888}
        playerPos={playerPos}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          if (!isMainMenu && !isDead) {
            setIsPauseOpen(true);
          }
        }}
        settings={gameSettings}
        onUpdateSettings={(newSettings) => setGameSettings((prev) => ({ ...prev, ...newSettings }))}
        onOpenSkinModal={() => setIsSkinSelectOpen(true)}
        isMobileMode={isMobileMode}
        onToggleMobileMode={() => {
          userToggledTouchRef.current = true;
          setIsMobileMode((prev) => !prev);
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenDrive={() => setIsDriveOpen(true)}
        onOpenMarket={() => setIsMarketOpen(true)}
        onOpenAIGuide={() => setIsAIGuideOpen(true)}
        onOpenGoogleAccount={() => setIsGoogleAccountOpen(true)}
        onOpenMailbox={() => setIsMailboxOpen(true)}
      />

      {/* Skin Select Modal */}
      <SkinSelectModal
        isOpen={isSkinSelectOpen}
        onClose={() => {
          setIsSkinSelectOpen(false);
          if (!isMainMenu && !isDead) {
            setIsPauseOpen(true);
          }
        }}
        activeSkinId={gameSettings.skinId}
        onSelectSkin={(skinId) => {
          setGameSettings((prev) => ({ ...prev, skinId }));
          if (typeof window !== 'undefined') {
            localStorage.setItem('minecraft_player_skin', skinId);
          }
          if (playerRef.current) {
            playerRef.current.updateHeldItemMesh();
          }
        }}
        onOpenMarket={() => {
          setIsSkinSelectOpen(false);
          setIsMarketOpen(true);
        }}
      />

      {/* Villager Trade Modal */}
      {selectedVillager && (
        <VillagerTradeModal
          isOpen={isTradeOpen}
          onClose={() => {
            setIsTradeOpen(false);
            setSelectedVillager(null);
            if (!isMobileMode && rendererRef.current) {
              rendererRef.current.domElement.requestPointerLock();
            }
          }}
          villager={selectedVillager}
          playerInventory={inventoryState}
          onExecuteTrade={handleExecuteTrade}
        />
      )}

      {/* Other Existing Modals */}
      <WorldSelectModal
        isOpen={isWorldSelectOpen}
        onClose={() => setIsWorldSelectOpen(false)}
        onSelectWorld={handleSelectAndLoadWorld}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => {
          setIsInventoryOpen(false);
          if (!isMobileMode && rendererRef.current) {
            rendererRef.current.domElement.requestPointerLock();
          }
        }}
        inventory={inventoryState}
        onUpdateInventory={handleUpdateInventory}
        gameMode={playerStats.gameMode}
        onOpenCrafting={() => {
          setIsInventoryOpen(false);
          setCraftingOpenedViaTable(false);
          setIsCraftingOpen(true);
        }}
      />

      <CraftingModal
        isOpen={isCraftingOpen}
        onClose={() => {
          setIsCraftingOpen(false);
          if (!isMobileMode && rendererRef.current) {
            rendererRef.current.domElement.requestPointerLock();
          }
        }}
        inventory={inventoryState}
        onUpdateInventory={handleUpdateInventory}
        openedViaTable={craftingOpenedViaTable}
        gameMode={playerStats.gameMode}
        onSwitchToInventory={() => {
          setIsCraftingOpen(false);
          setIsInventoryOpen(true);
        }}
      />

      <ControlsModal
        isOpen={isHelpOpen}
        onClose={() => {
          setIsHelpOpen(false);
          if (!isMainMenu && !isDead) {
            setIsPauseOpen(true);
          }
        }}
      />

      <DriveModal
        isOpen={isDriveOpen}
        onClose={() => {
          setIsDriveOpen(false);
          if (!isMainMenu && !isDead) {
            setIsPauseOpen(true);
          }
        }}
        onSaveWorld={handleSaveWorld}
        onLoadWorld={handleLoadWorld}
      />

      {/* 方塊市集 (Marketplace: VIP每月10NT, 精緻造型統一1000點, 儲值100~10000點) */}
      <MarketModal
        isOpen={isMarketOpen}
        onClose={() => {
          setIsMarketOpen(false);
          if (!isMainMenu && !isDead) {
            setIsPauseOpen(true);
          }
        }}
        player={playerRef.current}
        activeSkinId={gameSettings.skinId}
        onSelectSkin={(skinId) => {
          setGameSettings((prev) => ({ ...prev, skinId }));
          if (typeof window !== 'undefined') {
            localStorage.setItem('minecraft_player_skin', skinId);
          }
          if (playerRef.current) {
            playerRef.current.updateHeldItemMesh();
          }
        }}
        onOpenGoogleAccount={() => {
          setIsMarketOpen(false);
          setIsGoogleAccountOpen(true);
        }}
      />

      {/* VIP 會員特權彈窗 */}
      <VipModal
        isOpen={isVipOpen}
        onClose={() => setIsVipOpen(false)}
      />

      {/* 遊戲玩法 AI 導覽 (Gemini 智慧問答與新手教程) */}
      <AIGuideModal
        isOpen={isAIGuideOpen}
        onClose={() => {
          setIsAIGuideOpen(false);
          if (!isMainMenu && !isDead) {
            setIsPauseOpen(true);
          }
        }}
      />

      {/* Google 帳號中心 (帳號雲端綁定與世界備份) */}
      <GoogleAccountModal
        isOpen={isGoogleAccountOpen}
        onClose={() => {
          setIsGoogleAccountOpen(false);
          if (!isMainMenu && !isDead) {
            setIsPauseOpen(true);
          }
        }}
        onOpenMarket={() => {
          setIsGoogleAccountOpen(false);
          setIsMarketOpen(true);
        }}
        onOpenMailbox={() => {
          setIsGoogleAccountOpen(false);
          setIsMailboxOpen(true);
        }}
      />

      {/* 玩家信箱 & 意見箱 (寄送至 ruiqishi59@gmail.com 並授予該管理員發信與回覆權限) */}
      <MailboxModal
        isOpen={isMailboxOpen}
        onClose={() => {
          setIsMailboxOpen(false);
          if (!isMainMenu && !isDead) {
            setIsPauseOpen(true);
          }
        }}
        onUnreadCountChange={setMailboxUnreadCount}
      />
    </div>
  );
};
