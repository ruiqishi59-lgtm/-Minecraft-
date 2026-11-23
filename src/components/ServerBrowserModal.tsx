import React, { useState, useEffect } from 'react';
import {
  Globe,
  Wifi,
  Users,
  Plus,
  Lock,
  Unlock,
  Sparkles,
  Server,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  Layers,
  ArrowRight,
  X,
  Compass
} from 'lucide-react';
import { GameServerInfo } from '../types';
import { getStoredUser, GoogleUserProfile } from '../utils/googleAuth';
import { soundManager } from '../game/audio';

interface ServerBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinServer: (server: GameServerInfo) => void;
  onOpenLoginModal: () => void;
}

export const ServerBrowserModal: React.FC<ServerBrowserModalProps> = ({
  isOpen,
  onClose,
  onJoinServer,
  onOpenLoginModal
}) => {
  const [activeTab, setActiveTab] = useState<'servers' | 'custom' | 'direct'>('servers');
  const [servers, setServers] = useState<GameServerInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(getStoredUser());
  const [directCode, setDirectCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Custom room form
  const [customName, setCustomName] = useState('');
  const [customDimension, setCustomDimension] = useState<'default' | 'heaven' | 'flat' | 'mountains'>('default');
  const [customGameMode, setCustomGameMode] = useState<'survival' | 'creative'>('survival');
  const [customIsPrivate, setCustomIsPrivate] = useState(false);

  const fetchServers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/servers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.servers)) {
          setServers(data.servers);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch servers list', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const user = getStoredUser();
    setGoogleUser(user);
    fetchServers();

    const interval = setInterval(fetchServers, 8000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isLoggedIn = Boolean(googleUser);

  const handleJoin = (server: GameServerInfo) => {
    if (!isLoggedIn) {
      soundManager.playButtonClick();
      onOpenLoginModal();
      return;
    }
    soundManager.playButtonClick();
    setIsJoining(true);
    setStatusMessage(`正在連線至 ${server.name}...`);

    setTimeout(() => {
      setIsJoining(false);
      onJoinServer(server);
    }, 400);
  };

  const handleDirectConnect = () => {
    if (!directCode.trim()) return;
    if (!isLoggedIn) {
      onOpenLoginModal();
      return;
    }

    const code = directCode.trim().toUpperCase();
    const targetServer = servers.find(
      (s) => s.roomCode?.toUpperCase() === code || s.id.toLowerCase() === code.toLowerCase()
    ) || {
      id: code,
      name: `連線至房間 [${code}]`,
      ip: `custom.mineclone.net:25565`,
      motd: `私人多人連線房間`,
      worldType: 'default',
      gameMode: 'survival',
      seed: 88888,
      maxPlayers: 20,
      onlineCount: 1,
      ping: 20,
      roomCode: code,
      icon: '🎮',
      tags: ['自訂房間']
    };

    handleJoin(targetServer as GameServerInfo);
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onOpenLoginModal();
      return;
    }

    try {
      const res = await fetch('/api/servers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName || `${googleUser?.name || '冒險家'} 的世界`,
          worldType: customDimension,
          gameMode: customGameMode,
          isPrivate: customIsPrivate,
          creatorName: googleUser?.name || '冒險家'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.server) {
          fetchServers();
          handleJoin(data.server);
        }
      }
    } catch (err) {
      console.error('Failed to create server', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-mono animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl h-[92vh] max-h-[720px] rounded-2xl bg-[#1e1e1e] border-2 border-stone-600 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#2b2b2b] border-b-2 border-stone-700 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-400">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  多人遊戲伺服器大廳 (Multiplayer Servers)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  REAL-TIME WS
                </span>
              </div>
              <p className="text-xs text-stone-400">
                加入 24/7 線上伺服器與朋友一同探險、採礦、建築與冒險！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User status badge */}
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-400/40 text-xs text-emerald-200">
                <img
                  src={googleUser?.avatar}
                  alt={googleUser?.name}
                  className="w-5 h-5 rounded-full object-cover border border-emerald-300"
                />
                <span className="font-bold truncate max-w-[120px]">{googleUser?.name}</span>
                <span className="text-[10px] text-emerald-400 font-mono">[已登入 • 功能啟用]</span>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-400/50 text-xs text-amber-200 hover:bg-amber-900 transition-all font-bold animate-pulse"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>未登入 (伺服器停用中)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Login Gated Warning Banner (If not logged in) */}
        {!isLoggedIn && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 bg-gradient-to-r from-red-950/90 via-amber-950/90 to-stone-900 border-b-2 border-amber-500/60 text-amber-200 text-xs shadow-inner">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-300">⚠️ 伺服器多人功能目前停用：</span>
                <span className="text-stone-300 ml-1">
                  伺服器連線與全球多人同遊為登入會員專屬功能。請先登入帳號以啟用伺服器連線！
                </span>
              </div>
            </div>
            <button
              onClick={onOpenLoginModal}
              className="px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-black text-xs tracking-wider shadow-lg transition-all shrink-0 active:scale-95"
            >
              立即登入以啟用伺服器 🔑
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#252525] border-b border-stone-700">
          <button
            onClick={() => setActiveTab('servers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all ${
              activeTab === 'servers'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>官方精選伺服器 ({servers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all ${
              activeTab === 'custom'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Plus className="h-4 w-4 text-amber-300" />
            <span>建立伺服器房間</span>
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all ${
              activeTab === 'direct'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Compass className="h-4 w-4 text-sky-400" />
            <span>輸入房號 / 直接連線</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={fetchServers}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-all"
              title="重新整理伺服器狀態"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">刷新</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Servers List */}
        {activeTab === 'servers' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-3">
            {servers.map((server) => (
              <div
                key={server.id}
                className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl bg-stone-900/90 border border-stone-700 hover:border-emerald-500/70 transition-all shadow-md gap-4"
              >
                {/* Server Icon & Main Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-stone-800 border-2 border-stone-600 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                    {server.icon || '🌲'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                        {server.name}
                      </h3>
                      {server.isOfficial && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          官方認證
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700">
                        {server.gameMode === 'creative' ? '創造模式' : '生存模式'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 mt-1 line-clamp-1">
                      {server.motd}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-stone-400">
                      <span className="font-mono text-stone-500">{server.ip}</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Users className="h-3 w-3" />
                        <span>{server.onlineCount} / {server.maxPlayers} 人在線</span>
                      </span>
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Wifi className="h-3 w-3" />
                        <span>{server.ping} ms</span>
                      </span>
                      {server.tags && server.tags.map((tag, i) => (
                        <span key={i} className="text-stone-500 hidden sm:inline">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Join Server Action Button */}
                <div className="w-full md:w-auto flex items-center justify-end shrink-0">
                  <button
                    onClick={() => handleJoin(server)}
                    disabled={isJoining}
                    className={`flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 rounded-lg font-bold text-xs tracking-wider transition-all shadow-lg active:scale-95 ${
                      !isLoggedIn
                        ? 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                    }`}
                  >
                    {!isLoggedIn ? (
                      <>
                        <Lock className="h-4 w-4 text-amber-400" />
                        <span>需登入帳號</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current text-white" />
                        <span>進入伺服器</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Create Custom Room */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCreateServer} className="flex-1 p-6 overflow-y-auto space-y-5">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200">
              <span className="font-bold text-emerald-300">💡 自由開服：</span>
              您可以在這裡創建專屬的多人線上冒險伺服器，系統將即時生成 6 位數房間碼（如 ROOM-8888），好友在輸入房號即可直接跨越網路一起連線！
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  伺服器名稱 (Server Name)
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="例如：我們的秘密空島家園"
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  世界維度 (World Dimension)
                </label>
                <select
                  value={customDimension}
                  onChange={(e) => setCustomDimension(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="default">🌲 預設主世界 (森林/村落/礦洞)</option>
                  <option value="heaven">☁️ 天堂以太世界 (浮島/水晶雲海)</option>
                  <option value="mountains">🏔️ 高聳山脈 (懸崖峭壁/綠寶石)</option>
                  <option value="flat">🟩 超平坦平原 (純淨建築畫布)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  遊戲模式 (Game Mode)
                </label>
                <select
                  value={customGameMode}
                  onChange={(e) => setCustomGameMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="survival">⛏️ 生存模式 (血量飢餓、挖礦伐木、防禦骷髏)</option>
                  <option value="creative">💎 創造模式 (無限方塊、雙擊飛行、無傷害)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  公開權限 (Privacy)
                </label>
                <select
                  value={customIsPrivate ? 'private' : 'public'}
                  onChange={(e) => setCustomIsPrivate(e.target.value === 'private')}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="public">🌐 公開大廳 (所有人皆可見)</option>
                  <option value="private">🔒 私人房間 (僅限持有房間碼的好友加入)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-700 flex justify-end">
              <button
                type="submit"
                disabled={!isLoggedIn}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm tracking-wider shadow-xl transition-all ${
                  !isLoggedIn
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                }`}
              >
                {!isLoggedIn ? (
                  <>
                    <Lock className="h-4 w-4 text-amber-400" />
                    <span>需登入帳號以建立房間</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>立即一鍵開服 (Start Server)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Direct Connect / Room Code */}
        {activeTab === 'direct' && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-3xl shadow-xl">
              🎯
            </div>

            <div>
              <h3 className="text-base font-black text-white">直接連線到房間代碼</h3>
              <p className="text-xs text-stone-400 mt-1">
                請輸入朋友發送給您的房間代碼（例如：ROOM-8888 或自訂代號）
              </p>
            </div>

            <div className="w-full">
              <input
                type="text"
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value)}
                placeholder="輸入 6 位數房間代碼 (如 ROOM-1010)"
                className="w-full px-4 py-3 text-center tracking-widest text-lg font-black uppercase rounded-xl bg-stone-900 border-2 border-stone-700 text-emerald-400 placeholder:text-stone-600 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleDirectConnect}
              disabled={!directCode.trim()}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-xs tracking-wider transition-all shadow-xl ${
                !isLoggedIn
                  ? 'bg-amber-600 hover:bg-amber-500 text-black'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {!isLoggedIn ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>請先登入帳號</span>
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  <span>立即加入此房間</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Bottom Footer Notice */}
        <div className="px-5 py-3 bg-[#181818] border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>WebSocket 伺服器核心在線 • 自動同房間方塊同步 & 3D 角色動畫</span>
          </div>
          {statusMessage && (
            <span className="text-emerald-400 font-bold animate-pulse">
              {statusMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
