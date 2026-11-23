import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, Compass, Hammer, Shield, Cloud, Smartphone, HelpCircle, Loader2 } from 'lucide-react';
import { soundManager } from '../game/audio';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AIGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_QUESTIONS = [
  {
    icon: '🌟',
    label: '介紹這款遊戲與世界觀',
    query: '請為我詳細介紹這款 3D 方塊沙盒遊戲的背景、維度與核心特色！'
  },
  {
    icon: '⛏️',
    label: '新手第一天合成生存攻略',
    query: '我是新手玩家，第一天該如何砍樹、打開合成台製作木鎬並度過夜晚？'
  },
  {
    icon: '☁️',
    label: '天堂以太世界玩法特色',
    query: '全新「天堂以太世界」要如何進入？浮島、水晶雲海有什麼特殊玩法？'
  },
  {
    icon: '💀',
    label: '怪物對抗與重生保護機制',
    query: '夜晚出沒的骷髏怪物要如何戰鬥與防禦？遊戲有什麼重生保護機制？'
  },
  {
    icon: '📱',
    label: '手機觸控模式操作指引',
    query: '在手機或平板上該如何操作移動、跳躍、採集與放置方塊？'
  },
  {
    icon: '🪙',
    label: '市集積分與道具說明',
    query: '市集中的積分方案 (100~10000 點) 與神級道具有什麼用途？'
  }
];

export const AIGuideModal: React.FC<AIGuideModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `👋 **你好，勇敢的冒險家！**\n\n我是你的專屬 **遊戲大師 AI 導遊**！我對《MineClone 3D》(盜版 3D Web Edition) 的所有世界維度、合成配方、生存技巧、天堂以太世界、市集系統與操作方式瞭若指掌。\n\n你可以直接點選下方的常見問題，或是隨時在輸入框中提問，我會立刻為你解答！🌲⛏️`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          text: m.text
        }));

      const res = await fetch('/api/chat-ai-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history })
      });

      if (!res.ok) {
        throw new Error('伺服器連線異常');
      }

      const data = await res.json();
      const reply = data.reply || '抱歉，暫時無法取得導遊回應，請稍候重試！';

      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
      soundManager.playButtonClick();
    } catch (e: any) {
      const errorMessage: Message = {
        id: `bot_err_${Date.now()}`,
        role: 'assistant',
        text: `🤖 導遊筆記：\n\n這款遊戲是自由度極高的 3D 體素沙盒冒險遊戲！\n- **砍樹與合成**：按 [E] 鍵開啟 36 格背包，用原木做木材、木棒與木鎬。\n- **探險天堂**：點擊頂部【往天堂】即可抵達懸浮於水晶雲海的天堂以太空島！\n- **安全保障**：剛進世界與每次重生皆有 5 秒無敵盾牌保護。\n- **市集積分**：支援 100～10,000 點積分購買 (NT$ 100~400)，可兌換神鎬與飛行羽翼！`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm font-mono select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-emerald-500/60 bg-[#191919] text-stone-100 shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 bg-[#121212] px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-stone-950 shadow-md">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-emerald-300">
                  遊戲玩法 AI 智慧導覽
                </h2>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                專屬方塊冒險導遊 • 即時解答世界觀、合成配方、天堂維度與操作
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preset Questions Bar */}
        <div className="border-b border-stone-800 bg-[#1f1f1f] p-2 sm:p-2.5 overflow-x-auto flex gap-1.5 scrollbar-thin">
          {PRESET_QUESTIONS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.query)}
              disabled={isLoading}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-stone-700 bg-stone-900/90 px-2.5 py-1 text-xs text-stone-300 hover:border-emerald-500 hover:bg-emerald-950/40 hover:text-emerald-200 transition-all shrink-0"
            >
              <span>{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#171717]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-stone-950 font-bold text-xs mt-1 shadow">
                  AI
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                  m.role === 'user'
                    ? 'bg-emerald-700 text-white rounded-tr-none'
                    : 'bg-stone-900 text-stone-200 border border-stone-800 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`mt-1.5 text-[10px] ${
                    m.role === 'user' ? 'text-emerald-200 text-right' : 'text-stone-500'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-stone-900/80 p-3 rounded-2xl border border-stone-800 max-w-[200px]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>導遊正在思考回答中...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-stone-800 bg-[#121212] p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="輸入您想問的遊戲問題（例如：如何合成石鎬、天堂世界有什麼、手機怎麼操作）..."
              className="flex-1 rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-all"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">發送</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
