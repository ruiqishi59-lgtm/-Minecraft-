import * as THREE from 'three';
import { RemotePlayer, ServerChatMessage, BlockType } from '../types';
import { VoxelWorld } from './world';
import { getSkinById, buildPlayerModel } from './skins';
import { soundManager } from './audio';

export interface MultiplayerCallbacks {
  onServerState?: (state: { serverId: string; serverName: string; worldType: string; seed: number; gameMode: string }) => void;
  onPlayersUpdated?: (players: RemotePlayer[]) => void;
  onChatMessage?: (chat: ServerChatMessage) => void;
  onDisconnected?: (reason?: string) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public currentServerId: string | null = null;
  public currentServerName: string = '';
  public myPlayerId: string | null = null;
  public ping: number = 20;

  // Scene & World references
  private scene: THREE.Scene;
  private world: VoxelWorld;

  // Remote player 3D representations
  public remotePlayers: Map<string, {
    info: RemotePlayer;
    mesh: THREE.Group;
    nameTag: THREE.Sprite;
    targetPos: THREE.Vector3;
    targetYaw: number;
    targetPitch: number;
    animTime: number;
  }> = new Map();

  public chatMessages: ServerChatMessage[] = [];
  public callbacks: MultiplayerCallbacks = {};

  private lastMoveSendTime: number = 0;
  private pingInterval: any = null;
  private pingStartTime: number = 0;

  constructor(scene: THREE.Scene, world: VoxelWorld) {
    this.scene = scene;
    this.world = world;
  }

  public connect(
    serverId: string,
    playerInfo: {
      id?: string;
      name: string;
      skinId: string;
      x: number;
      y: number;
      z: number;
      yaw: number;
      pitch: number;
      health: number;
      gameMode: 'survival' | 'creative';
    },
    callbacks: MultiplayerCallbacks = {}
  ): Promise<boolean> {
    this.disconnect();
    this.callbacks = callbacks;
    this.currentServerId = serverId;

    return new Promise((resolve) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const socket = new WebSocket(wsUrl);
        this.ws = socket;

        socket.onopen = () => {
          this.isConnected = true;
          // Send join packet
          socket.send(JSON.stringify({
            type: 'join_server',
            serverId,
            playerId: playerInfo.id,
            playerName: playerInfo.name,
            skinId: playerInfo.skinId,
            playerPos: {
              x: playerInfo.x,
              y: playerInfo.y,
              z: playerInfo.z,
              yaw: playerInfo.yaw,
              pitch: playerInfo.pitch
            },
            playerStats: {
              health: playerInfo.health,
              gameMode: playerInfo.gameMode
            }
          }));

          // Start ping measurement
          this.startPingInterval();
          resolve(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('Failed to parse multiplayer message', e);
          }
        };

        socket.onerror = (err) => {
          console.warn('Multiplayer WebSocket error:', err);
          resolve(false);
        };

        socket.onclose = () => {
          this.isConnected = false;
          this.clearAllRemotePlayers();
          this.stopPingInterval();
          if (this.callbacks.onDisconnected) {
            this.callbacks.onDisconnected('連線已中斷');
          }
        };
      } catch (err) {
        console.error('Failed to establish WebSocket connection:', err);
        resolve(false);
      }
    });
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'server_state': {
        this.myPlayerId = data.yourPlayerId;
        this.currentServerName = data.serverName;
        this.chatMessages = data.chatHistory || [];

        // Apply any blocks modified in the room
        if (data.worldModifications) {
          Object.entries(data.worldModifications).forEach(([k, blockType]) => {
            const [x, y, z] = k.split(',').map(Number);
            this.world.setBlock(x, y, z, blockType as BlockType, false);
          });
        }

        // Spawn other connected players
        if (Array.isArray(data.players)) {
          data.players.forEach((p: RemotePlayer) => {
            this.addRemotePlayer(p);
          });
        }

        if (this.callbacks.onServerState) {
          this.callbacks.onServerState({
            serverId: data.serverId,
            serverName: data.serverName,
            worldType: data.worldType,
            seed: data.seed,
            gameMode: data.gameMode
          });
        }
        break;
      }

      case 'player_joined': {
        if (data.player && data.player.id !== this.myPlayerId) {
          this.addRemotePlayer(data.player);
          soundManager.playButtonClick();
        }
        break;
      }

      case 'player_moved': {
        const p = this.remotePlayers.get(data.id);
        if (p) {
          p.targetPos.set(data.x, data.y, data.z);
          p.targetYaw = data.yaw;
          p.targetPitch = data.pitch;
          p.info.health = data.health ?? p.info.health;
          p.info.isSwinging = Boolean(data.isSwinging);
          p.info.isSneaking = Boolean(data.isSneaking);
          p.info.isFlying = Boolean(data.isFlying);

          // Update nametag health text
          this.updateNameTag(p.nameTag, p.info.name, p.info.health);
        }
        break;
      }

      case 'block_changed': {
        if (data.x !== undefined && data.y !== undefined && data.z !== undefined) {
          this.world.setBlock(data.x, data.y, data.z, data.blockType, true);
        }
        break;
      }

      case 'player_left': {
        this.removeRemotePlayer(data.id);
        break;
      }

      case 'chat_broadcast': {
        if (data.chat) {
          this.chatMessages.push(data.chat);
          if (this.chatMessages.length > 80) this.chatMessages.shift();
          if (this.callbacks.onChatMessage) {
            this.callbacks.onChatMessage(data.chat);
          }
        }
        break;
      }

      case 'pong': {
        this.ping = Math.max(5, Date.now() - this.pingStartTime);
        break;
      }
    }
  }

  // Create 3D Nametag Sprite floating above player head
  private createNameTag(name: string, health: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    this.drawNameTagCanvas(ctx, name, health);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 0.38, 1);
    sprite.position.set(0, 2.2, 0);
    return sprite;
  }

  private drawNameTagCanvas(ctx: CanvasRenderingContext2D, name: string, health: number) {
    ctx.clearRect(0, 0, 256, 64);

    // Pill background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.roundRect(8, 8, 240, 48, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, 128, 32);

    // Mini Health Bar
    const hpRatio = Math.max(0, Math.min(1, health / 20));
    ctx.fillStyle = '#222222';
    ctx.fillRect(40, 40, 176, 8);

    ctx.fillStyle = hpRatio > 0.5 ? '#44bd32' : (hpRatio > 0.25 ? '#e1b12c' : '#e84118');
    ctx.fillRect(40, 40, 176 * hpRatio, 8);
  }

  private updateNameTag(sprite: THREE.Sprite, name: string, health: number) {
    const mat = sprite.material as THREE.SpriteMaterial;
    if (mat.map && mat.map.image) {
      const canvas = mat.map.image as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.drawNameTagCanvas(ctx, name, health);
        mat.map.needsUpdate = true;
      }
    }
  }

  private addRemotePlayer(info: RemotePlayer) {
    if (this.remotePlayers.has(info.id)) return;

    const skin = getSkinById(info.skinId || 'steve');
    const mesh = buildPlayerModel(skin);
    mesh.position.set(info.x, info.y, info.z);

    const nameTag = this.createNameTag(info.name, info.health);
    mesh.add(nameTag);

    this.scene.add(mesh);

    this.remotePlayers.set(info.id, {
      info,
      mesh,
      nameTag,
      targetPos: new THREE.Vector3(info.x, info.y, info.z),
      targetYaw: info.yaw || 0,
      targetPitch: info.pitch || 0,
      animTime: 0
    });

    this.notifyPlayersChanged();
  }

  private removeRemotePlayer(id: string) {
    const p = this.remotePlayers.get(id);
    if (p) {
      this.scene.remove(p.mesh);
      this.remotePlayers.delete(id);
      this.notifyPlayersChanged();
    }
  }

  private clearAllRemotePlayers() {
    this.remotePlayers.forEach((p) => {
      this.scene.remove(p.mesh);
    });
    this.remotePlayers.clear();
    this.notifyPlayersChanged();
  }

  private notifyPlayersChanged() {
    if (this.callbacks.onPlayersUpdated) {
      const list = Array.from(this.remotePlayers.values()).map((p) => p.info);
      this.callbacks.onPlayersUpdated(list);
    }
  }

  // Called in game loop: smoothly lerps remote player positions and animates limbs
  public update(delta: number) {
    if (!this.isConnected) return;

    this.remotePlayers.forEach((p) => {
      // Lerp position
      const dist = p.mesh.position.distanceTo(p.targetPos);
      const isMoving = dist > 0.04;
      p.mesh.position.lerp(p.targetPos, Math.min(1.0, delta * 12));

      // Lerp yaw
      p.mesh.rotation.y = THREE.MathUtils.lerp(p.mesh.rotation.y, p.targetYaw, Math.min(1.0, delta * 10));

      // Animate walking limbs
      if (isMoving) {
        p.animTime += delta * 12;
      } else {
        p.animTime = 0;
      }

      // Children bones: [0: Head, 1: Body, 2: LeftArm, 3: RightArm, 4: LeftLeg, 5: RightLeg]
      const leftArm = p.mesh.children[2] as THREE.Mesh;
      const rightArm = p.mesh.children[3] as THREE.Mesh;
      const leftLeg = p.mesh.children[4] as THREE.Mesh;
      const rightLeg = p.mesh.children[5] as THREE.Mesh;

      if (leftLeg && rightLeg) {
        leftLeg.rotation.x = Math.sin(p.animTime) * 0.55;
        rightLeg.rotation.x = -Math.sin(p.animTime) * 0.55;
      }

      if (leftArm && rightArm) {
        if (p.info.isSwinging) {
          rightArm.rotation.x = -Math.PI / 3 + Math.sin(Date.now() * 0.02) * 0.6;
        } else {
          leftArm.rotation.x = -Math.sin(p.animTime) * 0.5;
          rightArm.rotation.x = Math.sin(p.animTime) * 0.5;
        }
      }
    });
  }

  // Send local movement to server (throttled to ~20 packets/sec)
  public sendPlayerMove(
    pos: THREE.Vector3,
    yaw: number,
    pitch: number,
    health: number,
    isSwinging: boolean = false,
    isSneaking: boolean = false,
    isFlying: boolean = false
  ) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    if (now - this.lastMoveSendTime < 50) return;
    this.lastMoveSendTime = now;

    this.ws.send(JSON.stringify({
      type: 'player_move',
      x: Math.round(pos.x * 100) / 100,
      y: Math.round(pos.y * 100) / 100,
      z: Math.round(pos.z * 100) / 100,
      yaw: Math.round(yaw * 100) / 100,
      pitch: Math.round(pitch * 100) / 100,
      health,
      isSwinging,
      isSneaking,
      isFlying
    }));
  }

  // Broadcast block change to all players on the server
  public sendBlockChange(x: number, y: number, z: number, blockType: BlockType) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      type: 'block_change',
      x: Math.floor(x),
      y: Math.floor(y),
      z: Math.floor(z),
      blockType
    }));
  }

  // Send chat message
  public sendChatMessage(message: string) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (!message || !message.trim()) return;

    this.ws.send(JSON.stringify({
      type: 'chat_message',
      message: message.trim()
    }));
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStartTime = Date.now();
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 3000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public disconnect() {
    this.stopPingInterval();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.currentServerId = null;
    this.currentServerName = '';
    this.clearAllRemotePlayers();
  }
}
