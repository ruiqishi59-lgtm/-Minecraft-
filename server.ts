import express from 'express';
import http from 'http';
import path from 'path';
import { randomUUID } from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3000;

interface RoomPlayer {
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
  ws: WebSocket;
  lastPing: number;
}

interface GameRoom {
  id: string;
  name: string;
  ip: string;
  motd: string;
  worldType: 'default' | 'flat' | 'mountains' | 'heaven' | 'fusion';
  gameMode: 'survival' | 'creative';
  seed: number;
  maxPlayers: number;
  isOfficial?: boolean;
  isPrivate?: boolean;
  roomCode?: string;
  creatorName?: string;
  icon: string;
  tags: string[];
  players: Map<string, RoomPlayer>;
  worldModifications: Record<string, string>; // coordKey -> blockType
  chatHistory: Array<{ id: string; senderId: string; senderName: string; message: string; timestamp: string; isSystem?: boolean }>;
}

const gameRooms = new Map<string, GameRoom>();

function initDefaultRooms() {
  gameRooms.set('official_survival', {
    id: 'official_survival',
    name: '🌲 官方純淨生存大服 (MineClone Survival)',
    ip: 'survival.mineclone.net:25565',
    motd: '歡迎來到 24/7 原版多人探險生存！自由砍樹挖礦、村民集市、無重置存檔！',
    worldType: 'default',
    gameMode: 'survival',
    seed: 998877,
    maxPlayers: 100,
    isOfficial: true,
    icon: '🌲',
    tags: ['生存', '24/7在線', '村民貿易', 'PvE探險'],
    players: new Map(),
    worldModifications: {},
    chatHistory: [
      { id: 'c1', senderId: 'system', senderName: '伺服器主機', message: '歡迎來到官方生存大服！已啟用 5 秒無敵重生保護。', timestamp: '12:00', isSystem: true }
    ]
  });

  gameRooms.set('official_aether', {
    id: 'official_aether',
    name: '☁️ 以太天神浮島服 (Aether Sky Realm)',
    ip: 'aether.mineclone.net:25565',
    motd: '浮島水晶雲海仙境！天使飛行羽翼、神聖建築與高空跳島同樂！',
    worldType: 'heaven',
    gameMode: 'survival',
    seed: 88888,
    maxPlayers: 50,
    isOfficial: true,
    icon: '☁️',
    tags: ['天堂維度', '空島探險', '水晶雲海', '神廟尋寶'],
    players: new Map(),
    worldModifications: {},
    chatHistory: [
      { id: 'c2', senderId: 'system', senderName: '伺服器主機', message: '天堂浮島伺服器運作中，小心不要踩空掉落虛空！', timestamp: '12:00', isSystem: true }
    ]
  });

  gameRooms.set('official_creative', {
    id: 'official_creative',
    name: '🟩 無界自由創造建築服 (Creative World Guild)',
    ip: 'creative.mineclone.net:25565',
    motd: '無限方塊無限可能！雙擊空格自由飛行，全體玩家共建宏偉奇蹟！',
    worldType: 'flat',
    gameMode: 'creative',
    seed: 12345,
    maxPlayers: 50,
    isOfficial: true,
    icon: '🟩',
    tags: ['創造模式', '無限方塊', '自由飛行', '巨型建築'],
    players: new Map(),
    worldModifications: {},
    chatHistory: [
      { id: 'c3', senderId: 'system', senderName: '伺服器主機', message: '創造服所有人皆享有飛行與無限方塊特權，發揮你的想像力吧！', timestamp: '12:00', isSystem: true }
    ]
  });

  gameRooms.set('official_hardcore', {
    id: 'official_hardcore',
    name: '⚔️ 暗夜極限生存挑戰服 (Hardcore PvP/PvE)',
    ip: 'hardcore.mineclone.net:25565',
    motd: '骷髏射手軍團全面進攻！考驗團隊走位防禦與武器鍛造！',
    worldType: 'mountains',
    gameMode: 'survival',
    seed: 777666,
    maxPlayers: 30,
    isOfficial: true,
    icon: '⚔️',
    tags: ['極限硬派', '骷髏狂潮', '懸崖峭壁', '戰鬥競技'],
    players: new Map(),
    worldModifications: {},
    chatHistory: [
      { id: 'c4', senderId: 'system', senderName: '伺服器主機', message: '天黑請務必組隊行動，骷髏射手將會在崇山峻嶺間猛烈伏擊！', timestamp: '12:00', isSystem: true }
    ]
  });
}

initDefaultRooms();

const sanitizeText = (val: unknown, fallback: string, maxLen: number): string => {
  if (typeof val !== 'string') return fallback;
  const cleaned = val.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, maxLen);
  return cleaned || fallback;
};

const clampNumber = (val: unknown, fallback: number, min: number, max: number): number => {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
};

const ALLOWED_WORLD_TYPES = new Set(['default', 'flat', 'mountains', 'heaven', 'fusion']);
const ALLOWED_GAME_MODES = new Set(['survival', 'creative']);

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Security headers middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(express.json({ limit: '64kb' }));

  // WebSocket Server Setup with strict payload cap
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

  wss.on('connection', (ws) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return;

        if (msg.type === 'join_server') {
          const requestedServerId = sanitizeText(msg.serverId, '', 64);
          if (!requestedServerId) return;

          const safePlayerName = sanitizeText(msg.playerName, '冒險家', 32);
          const safeSkinId = sanitizeText(msg.skinId, 'steve', 40).replace(/[^a-zA-Z0-9_-]/g, '') || 'steve';

          let room = gameRooms.get(requestedServerId);
          if (!room) {
            for (const r of gameRooms.values()) {
              if (r.roomCode && r.roomCode.toLowerCase() === requestedServerId.toLowerCase()) {
                room = r;
                break;
              }
            }
          }

          if (!room) {
            if (gameRooms.size >= 100) {
              ws.send(JSON.stringify({ type: 'error', message: '伺服器房間數量已達上限' }));
              return;
            }
            const customCode = requestedServerId.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) || 'ROOM';
            const wt = typeof msg.worldType === 'string' && ALLOWED_WORLD_TYPES.has(msg.worldType) ? msg.worldType : 'default';
            const gm = typeof msg.gameMode === 'string' && ALLOWED_GAME_MODES.has(msg.gameMode) ? msg.gameMode : 'survival';
            room = {
              id: `custom_${customCode}`,
              name: `自訂房間 [${customCode}]`,
              ip: `custom.mineclone.net:${Math.floor(Math.random() * 9000 + 20000)}`,
              motd: `玩家 ${safePlayerName} 創建的線上多人房間`,
              worldType: wt as GameRoom['worldType'],
              gameMode: gm as GameRoom['gameMode'],
              seed: typeof msg.seed === 'number' && Number.isFinite(msg.seed) ? Math.floor(msg.seed) : Math.floor(Math.random() * 999999),
              maxPlayers: 20,
              isPrivate: true,
              roomCode: customCode,
              creatorName: safePlayerName,
              icon: '🎮',
              tags: ['私人房間', '好友同樂'],
              players: new Map(),
              worldModifications: {},
              chatHistory: []
            };
            gameRooms.set(room.id, room);
          }

          if (room.players.size >= room.maxPlayers) {
            ws.send(JSON.stringify({ type: 'error', message: '房間人數已滿' }));
            return;
          }

          currentRoomId = room.id;
          // Always generate playerId server-side so clients cannot hijack another player's session
          const assignedPlayerId = `p_${randomUUID()}`;
          currentPlayerId = assignedPlayerId;

          const newPlayer: RoomPlayer = {
            id: assignedPlayerId,
            name: safePlayerName,
            skinId: safeSkinId,
            x: clampNumber(msg.playerPos?.x, 0, -10000, 10000),
            y: clampNumber(msg.playerPos?.y, 16, -256, 512),
            z: clampNumber(msg.playerPos?.z, 0, -10000, 10000),
            yaw: clampNumber(msg.playerPos?.yaw, 0, -100, 100),
            pitch: clampNumber(msg.playerPos?.pitch, 0, -10, 10),
            health: clampNumber(msg.playerStats?.health, 20, 0, 20),
            isSwinging: false,
            isSneaking: false,
            isFlying: false,
            ws,
            lastPing: Date.now()
          };

          room.players.set(assignedPlayerId, newPlayer);

          // Prepare list of other players
          const otherPlayers = Array.from(room.players.values())
            .filter((p) => p.id !== assignedPlayerId)
            .map((p) => ({
              id: p.id,
              name: p.name,
              skinId: p.skinId,
              x: p.x,
              y: p.y,
              z: p.z,
              yaw: p.yaw,
              pitch: p.pitch,
              health: p.health,
              isSwinging: p.isSwinging,
              isSneaking: p.isSneaking,
              isFlying: p.isFlying
            }));

          // Send full current room state to joining player
          ws.send(JSON.stringify({
            type: 'server_state',
            serverId: room.id,
            serverName: room.name,
            worldType: room.worldType,
            gameMode: room.gameMode,
            seed: room.seed,
            yourPlayerId: currentPlayerId,
            players: otherPlayers,
            worldModifications: room.worldModifications,
            chatHistory: room.chatHistory.slice(-25)
          }));

          // Broadcast to other players in room
          const joinBroadcast = JSON.stringify({
            type: 'player_joined',
            player: {
              id: newPlayer.id,
              name: newPlayer.name,
              skinId: newPlayer.skinId,
              x: newPlayer.x,
              y: newPlayer.y,
              z: newPlayer.z,
              yaw: newPlayer.yaw,
              pitch: newPlayer.pitch,
              health: newPlayer.health
            }
          });

          const joinChat = {
            id: `sys_${Date.now()}`,
            senderId: 'system',
            senderName: '系統',
            message: `🎉 玩家 ${newPlayer.name} 加入了伺服器！`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
          };
          room.chatHistory.push(joinChat);
          const chatBroadcast = JSON.stringify({ type: 'chat_broadcast', chat: joinChat });

          room.players.forEach((p) => {
            if (p.id !== currentPlayerId && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(joinBroadcast);
              p.ws.send(chatBroadcast);
            }
          });
        } else if (msg.type === 'player_move') {
          if (!currentRoomId || !currentPlayerId) return;
          const room = gameRooms.get(currentRoomId);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player) return;

          player.x = clampNumber(msg.x, player.x, -10000, 10000);
          player.y = clampNumber(msg.y, player.y, -256, 512);
          player.z = clampNumber(msg.z, player.z, -10000, 10000);
          player.yaw = clampNumber(msg.yaw, player.yaw, -100, 100);
          player.pitch = clampNumber(msg.pitch, player.pitch, -10, 10);
          player.health = clampNumber(msg.health, player.health, 0, 20);
          player.isSwinging = Boolean(msg.isSwinging);
          player.isSneaking = Boolean(msg.isSneaking);
          player.isFlying = Boolean(msg.isFlying);

          const moveBroadcast = JSON.stringify({
            type: 'player_moved',
            id: currentPlayerId,
            x: player.x,
            y: player.y,
            z: player.z,
            yaw: player.yaw,
            pitch: player.pitch,
            health: player.health,
            isSwinging: player.isSwinging,
            isSneaking: player.isSneaking,
            isFlying: player.isFlying
          });

          room.players.forEach((p) => {
            if (p.id !== currentPlayerId && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(moveBroadcast);
            }
          });
        } else if (msg.type === 'block_change') {
          if (!currentRoomId || !currentPlayerId) return;
          const room = gameRooms.get(currentRoomId);
          if (!room) return;

          if (
            typeof msg.x !== 'number' || !Number.isFinite(msg.x) ||
            typeof msg.y !== 'number' || !Number.isFinite(msg.y) ||
            typeof msg.z !== 'number' || !Number.isFinite(msg.z)
          ) {
            return;
          }
          const bx = Math.floor(clampNumber(msg.x, 0, -2048, 2048));
          const by = Math.floor(clampNumber(msg.y, 0, -64, 256));
          const bz = Math.floor(clampNumber(msg.z, 0, -2048, 2048));
          const safeBlockType = sanitizeText(msg.blockType, 'air', 32).replace(/[^a-zA-Z0-9_]/g, '') || 'air';

          const key = `${bx},${by},${bz}`;
          room.worldModifications[key] = safeBlockType;

          const blockBroadcast = JSON.stringify({
            type: 'block_changed',
            x: bx,
            y: by,
            z: bz,
            blockType: safeBlockType,
            changedBy: currentPlayerId
          });

          room.players.forEach((p) => {
            if (p.id !== currentPlayerId && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(blockBroadcast);
            }
          });
        } else if (msg.type === 'chat_message') {
          if (!currentRoomId || !currentPlayerId) return;
          const room = gameRooms.get(currentRoomId);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player) return;

          const safeChatMsg = sanitizeText(msg.message, '', 150);
          if (!safeChatMsg) return;

          const chat = {
            id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            senderId: currentPlayerId,
            senderName: player.name,
            message: safeChatMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: false
          };
          room.chatHistory.push(chat);
          if (room.chatHistory.length > 100) room.chatHistory.shift();

          const broadcast = JSON.stringify({ type: 'chat_broadcast', chat });
          room.players.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(broadcast);
            }
          });
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = gameRooms.get(currentRoomId);
        if (room) {
          const departing = room.players.get(currentPlayerId);
          room.players.delete(currentPlayerId);

          if (departing) {
            const leaveBroadcast = JSON.stringify({
              type: 'player_left',
              id: currentPlayerId,
              name: departing.name
            });

            const leaveChat = {
              id: `sys_${Date.now()}`,
              senderId: 'system',
              senderName: '系統',
              message: `👋 玩家 ${departing.name} 離開了伺服器。`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSystem: true
            };
            room.chatHistory.push(leaveChat);
            const chatBroadcast = JSON.stringify({ type: 'chat_broadcast', chat: leaveChat });

            room.players.forEach((p) => {
              if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(leaveBroadcast);
                p.ws.send(chatBroadcast);
              }
            });
          }
        }
      }
    });
  });

  // REST API Endpoints for Servers List and Server Creation
  app.get('/api/servers', (req, res) => {
    const list = Array.from(gameRooms.values()).map((r) => ({
      id: r.id,
      name: r.name,
      ip: r.ip,
      motd: r.motd,
      worldType: r.worldType,
      gameMode: r.gameMode,
      seed: r.seed,
      maxPlayers: r.maxPlayers,
      onlineCount: r.players.size,
      ping: Math.floor(Math.random() * 15 + 14), // 14-29ms low ping
      isOfficial: r.isOfficial,
      isPrivate: r.isPrivate,
      roomCode: r.roomCode,
      creatorName: r.creatorName,
      icon: r.icon,
      tags: r.tags
    }));
    res.json({ servers: list });
  });

  app.post('/api/servers/create', (req, res) => {
    if (gameRooms.size >= 100) {
      return res.status(429).json({ error: '房間數量已達伺服器上限' });
    }
    const rawBody = req.body && typeof req.body === 'object' ? req.body : {};
    const safeName = sanitizeText(rawBody.name, '', 48);
    const safeCreator = sanitizeText(rawBody.creatorName, '房主', 32);
    const worldType = (
      typeof rawBody.worldType === 'string' && ALLOWED_WORLD_TYPES.has(rawBody.worldType)
        ? rawBody.worldType
        : 'default'
    ) as GameRoom['worldType'];
    const gameMode = (
      typeof rawBody.gameMode === 'string' && ALLOWED_GAME_MODES.has(rawBody.gameMode)
        ? rawBody.gameMode
        : 'survival'
    ) as GameRoom['gameMode'];
    const isPrivate = Boolean(rawBody.isPrivate);

    const roomCode = `ROOM-${Math.floor(Math.random() * 8999 + 1000)}`;
    const id = `custom_${roomCode}`;
    const newRoom: GameRoom = {
      id,
      name: safeName || `自訂房間 [${roomCode}]`,
      ip: `custom.mineclone.net:${Math.floor(Math.random() * 9000 + 20000)}`,
      motd: `${safeCreator} 的多人冒險房間！歡迎大家一起來蓋建築打怪！`,
      worldType,
      gameMode,
      seed: Math.floor(Math.random() * 999999),
      maxPlayers: 20,
      isOfficial: false,
      isPrivate,
      roomCode,
      creatorName: safeCreator,
      icon: worldType === 'heaven' ? '☁️' : (worldType === 'flat' ? '🟩' : '🌲'),
      tags: ['自訂服', gameMode === 'creative' ? '創造' : '生存', '多人連線'],
      players: new Map(),
      worldModifications: {},
      chatHistory: [
        {
          id: 'init_msg',
          senderId: 'system',
          senderName: '系統',
          message: `房間建立成功！房間代碼是 【${roomCode}】，複製代碼給朋友即可連線同遊！`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        }
      ]
    };
    gameRooms.set(id, newRoom);
    res.json({ success: true, server: { ...newRoom, players: undefined } });
  });

  // Initialize Gemini API client lazily if key exists
  let aiClient: GoogleGenAI | null = null;
  function getAIClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return aiClient;
  }

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // Game AI Guide API endpoint
  app.post('/api/chat-ai-guide', async (req, res) => {
    try {
      const rawMessage = req.body?.message;
      const history = req.body?.history;
      if (!rawMessage || typeof rawMessage !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }
      const message = sanitizeText(rawMessage, '', 1000);
      if (!message) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      const client = getAIClient();

      const gameSystemInstruction = `你是一位精通《MineClone 3D》(盜版 3D Web Edition) 的專業「遊戲大師 AI 導遊」。
你的任務是熱情、幽默、具體且清晰地向玩家介紹這款遊戲、它的世界觀、核心玩法、生存技巧、天堂以太世界與控制方式。

【遊戲全貌與核心特色】：
1. 遊戲背景：這是基於 Three.js 與 React 打造的高性能 3D 體素沙盒冒險世界，向經典 Minecraft 致敬，並加入全新的「天堂以太世界 (The Aether)」、自由創世界系統、市集積分商城與 Google 雲端存檔。
2. 世界維度：
   - 🌲 主世界 (Overworld)：經典地貌，有茂密林地、橡木/樺木、綠地、沙灘、水源與隨機生成的村民聚落，草地上有可愛小野兔跳躍。
   - ☁️ 天堂以太世界 (The Aether)：浮空神聖群島，漂浮於水晶雲海之上，擁有以太水晶石、聖光天穹與專屬金色生態。
   - 🏔️ 高聳山脈 (High Mountains)：千仞絕壁、險峻陡坡，適合冒險家攀爬挑戰。
   - 🟩 超平坦 (Superflat)：無限延伸的平整綠茵，建築狂熱者的無障礙畫布。
3. 核心玩法機制：
   - 採集與挖掘：赤手空拳可伐木取得原木；使用鎬子可快速開採石頭、煤礦、鐵礦、金礦、綠寶石與鑽石。
   - 合成系統：按 [E] 鍵開啟 36 格背包與內建 3x3 合成台，可合成木棒、木鎬、石鎬、鐵鎬、鑽石劍、火把等必備工具。
   - 生存與生命值：生存模式有生命值 (20 HP) 與飢餓度 (20)。受到摔落傷害或骷髏攻擊會扣血；飢餓度過低無法回血；可食用野兔掉落的兔肉或麵包恢復生命與體力。
   - 重生保護：每次進入世界或重生享有 5 秒無敵保護（畫面上方有盾牌徽章），免於剛進遊戲就被偷襲！
   - 晝夜循環與怪物：夜晚或雷暴時會生成手持骨弓的骷髏神射手，需要走位或合成武器迎擊；白天陽光可使能見度提升。
   - 創造模式：無限方塊供給，無生命飢餓限制，雙擊空白鍵即可切換自由飛行！
4. 操作控制：
   - 電腦模式：[W][A][S][D] 移動，[空白鍵] 跳躍，數字鍵 [1]-[9] 或滾輪切換快捷欄，滑鼠 [左鍵] 挖掘/攻擊，滑鼠 [右鍵] 放置方塊/吃食物/與村民交易，[E] 開啟背包，[ESC] 暫停選單。
   - 手機與平板模式：點擊頂部或選單中的觸控模式開關，即可開啟虛擬觸控搖桿、跳躍、挖掘、放置、飛行與視角滑動按鍵。
5. 經濟與市集 (Marketplace)：
   - 設有積分商城，積分額度由 100 ～ 10,000 點，價格由 100 ～ 400 NT$。
   - 玩家可購買積分並在市集中兌換「天堂水晶神鎬」、「熾焰以太聖劍」、「天使飛行羽翼」與「終極資源箱」等強大福利。
6. 帳號與存檔：
   - 支援 Google 帳號登入，保障安全驗證與信箱/意見箱功能，並支援將世界存檔匯出 JSON 備份檔。

【回答風格要求】：
- 語氣親切、專業、富有冒險精神。
- 善用粗體、重點列表與恰當的遊戲 Emoji (如 🌲, ⛏️, ☁️, 🛡️, ⚔️, 🍞, 🪙) 排版，使內容極具可讀性。
- 如果玩家詢問新手攻略，給出清晰的「第 1 天生存清單」；如果問天堂世界，介紹浮島與飛行特色；如果問操作或市集，詳細引導按鍵與功能。`;

      if (client) {
        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            if (item && typeof item.text === 'string') {
              const safeHistText = sanitizeText(item.text, '', 1000);
              if (safeHistText) {
                contents.push({
                  role: item.role === 'model' ? 'model' : 'user',
                  parts: [{ text: safeHistText }]
                });
              }
            }
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: gameSystemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        });

        const reply = response.text || '抱歉，我剛剛稍微發呆了一下，請再問我一次關於遊戲的玩法吧！';
        return res.json({ reply });
      }

      // Offline / Fallback response if GEMINI_API_KEY is not configured
      let fallbackReply = '';
      const lower = message.toLowerCase();

      if (lower.includes('介紹') || lower.includes('特色') || lower.includes('什麼遊戲') || lower.includes('世界觀')) {
        fallbackReply = `### 🎮 《MineClone 3D (盜版 3D)》遊戲特色介紹

歡迎來到這款基於 Three.js 打造的高自由度 3D 體素方塊沙盒世界！

🌟 **核心核心特色**：
1. **多重世界維度**：
   - 🌲 **主世界**：原汁原味的自然群系、茂密森林、河流、隨機生成的友好村民村莊與漫步野兔。
   - ☁️ **天堂以太世界 (The Aether)**：懸浮於萬米高空的浮空島嶼、水晶雲海與金色天穹。
   - 🏔️ **高聳山脈** 與 🟩 **超平坦** 地圖隨心挑選。
2. **完整生存與創造系統**：
   - **生存模式**：砍樹、挖礦、合成工具、捕食野兔維持飽食度、對抗夜間遊蕩的骷髏射手。享有 **5 秒無敵重生保護**！
   - **創造模式**：無限資源、雙擊空白鍵翱翔天際，自由打造專屬奇蹟建築。
3. **🛒 市集積分商城**：
   - 購買 100 ～ 10,000 點積分（價格 NT$ 100 ～ 400），兌換神級水晶鎬與以太飛行羽翼！
4. **👤 Google 帳號與雲端存檔**：
   - 支援 Google 帳號一鍵登入，世界進度隨時備份至 Google Drive！`;
      } else if (lower.includes('新手') || lower.includes('第一天') || lower.includes('合成') || lower.includes('玩法') || lower.includes('開局')) {
        fallbackReply = `### ⛏️ 新手第一天生存指南與合成攻略

剛進入世界的冒險家，請按照以下步驟快速度過第一天：

1. **赤手空拳砍樹** 🪵
   - 朝著附近的樹木按住【滑鼠左鍵】，採集 3～5 塊原木。
2. **打開背包與合成** 🎒
   - 按下鍵盤 **[E]** 鍵打開 36 格背包與 3x3 合成台。
   - 將原木分解為【木材】，用 2 塊木材合成【木棒】。
   - 再用 3 塊木材 + 2 根木棒合成【木鎬】，邁入石器時代！
3. **開採石頭升級石鎬** 🪨
   - 用木鎬挖掘地面下的鵝卵石，合成更堅固的【石鎬】與【石劍】。
4. **獲取食物維持飽食度** 🍞
   - 尋找在草原跳躍的小野兔，擊敗野兔可取得兔肉。在背包手持右鍵食用補充飢餓度與血量。
5. **夜晚防禦** 💀
   - 天黑時骷髏射手會出沒，記得蓋起簡單避難所，或是手持武器進行反擊！`;
      } else if (lower.includes('天堂') || lower.includes('以太') || lower.includes('aether')) {
        fallbackReply = `### ☁️ 天堂以太世界 (The Aether) 玩法揭秘

天堂是本版本最盛大的全新維度：
- **浮島地貌**：巨大的空島懸浮在無盡雲海之上，島上有以太神聖草地、發光水晶石塊與純淨水源。
- **前往方法**：在遊戲頂部點擊【☁️ 往天堂】或在建立世界時選擇【☁️ 天堂世界】即可直接體驗。
- **探險建議**：小心不要踩空掉落虛空！建議在市集兌換【天使以太羽翼】或開啟創造模式飛行，盡情俯瞰壯闊的金色雲海！`;
      } else if (lower.includes('操作') || lower.includes('按鍵') || lower.includes('手機')) {
        fallbackReply = `### 🎮 全平台操作按鍵對照表

💻 **電腦鍵盤與滑鼠**：
- **移動**：\`W\` / \`A\` / \`S\` / \`D\`
- **跳躍**：\`空白鍵 (Space)\`（創造模式雙擊切換飛行）
- **挖掘 / 攻擊**：\`滑鼠左鍵\`
- **放置方塊 / 互動 / 吃食物**：\`滑鼠右鍵\`
- **背包 / 合成台**：\`E\` 鍵
- **快捷欄**：數字鍵 \`1\` ～ \`9\` 或滑鼠滾輪
- **選單 / 暫停**：\`ESC\` 鍵

📱 **手機虛擬按鈕**：
- 點擊頂部【手機模式】開關，左下角可使用搖桿走動，右側提供跳躍、挖掘、放置與視角滑動面板！`;
      } else if (lower.includes('市集') || lower.includes('積分') || lower.includes('買') || lower.includes('nt')) {
        fallbackReply = `### 🪙 市集與積分商城指南

在主選單或遊戲內頂部點擊【🛒 市集】，即可進入商城：
- **積分定價**：由 100 積分 (NT$ 100) 到 10,000 積分 (NT$ 400)，檔位越高贈送越多！
- **積分兌換好禮**：
  - ⚡ **天堂水晶神鎬** (300 積分)：挖掘速度倍增
  - ⚔️ **熾焰以太聖劍** (500 積分)：強力對抗夜間怪物
  - 🪽 **天使以太羽翼** (800 積分)：解鎖任意維度飛行
  - 💎 **終極建造資源箱** (600 積分)：鑽石、黃金一應俱全
- 登入 **Google 帳號** 即可永久保留您的積分與兌換記錄！`;
      } else {
        fallbackReply = `### 🤖 遊戲導師解答：${message}

很高興為您解答！在《MineClone 3D》中：
- 自由探索由隨機種子碼生成的無限世界，體驗經典的伐木、挖礦、合成與建築樂趣。
- 您可以隨時按 **[E]** 開啟合成背包，使用 **[ESC]** 開啟世界保存與設定。
- 想要體驗更刺激的挑戰，可以前往【☁️ 天堂以太世界】，或在【🛒 市集】升級強力裝備。
- 隨時登入您的 **Google 帳號**，即可保障存檔安全並累積專屬積分！

您還想了解合成配方、村民交易、手機操作還是戰鬥技巧呢？歡迎隨時問我！`;
      }

      return res.json({ reply: fallbackReply });
    } catch (error: unknown) {
      console.error('AI Guide error:', error);
      return res.status(500).json({
        error: 'Failed to process AI guide request'
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
