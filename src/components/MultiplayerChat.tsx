import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { ServerChatMessage } from '../types';

interface MultiplayerChatProps {
  messages: ServerChatMessage[];
  onSendMessage: (text: string) => void;
  serverName: string;
  isMobile: boolean;
}

export const MultiplayerChat: React.FC<MultiplayerChatProps> = ({
  messages,
  onSendMessage,
  serverName,
  isMobile
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Keyboard shortcut [T] or [Enter] to open chat in desktop mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if currently typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.code === 'Escape') {
          setIsOpen(false);
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
        return;
      }

      if (e.code === 'KeyT' || e.code === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 left-4 z-40 flex flex-col pointer-events-auto max-w-sm sm:max-w-md w-full font-mono select-none">
      {/* Messages Window */}
      <div
        className={`flex flex-col gap-1 p-2 rounded-xl text-xs transition-all ${
          isOpen
            ? 'bg-black/80 backdrop-blur-md border border-stone-600 shadow-2xl max-h-52 overflow-y-auto'
            : 'bg-black/40 hover:bg-black/70 max-h-36 overflow-hidden'
        }`}
      >
        <div className="flex items-center justify-between pb-1 border-b border-white/10 text-[10px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-stone-300 truncate max-w-[180px]">{serverName}</span>
          </div>
          <span className="text-stone-500">按 [T] 或 [Enter] 聊天</span>
        </div>

        <div className="space-y-1">
          {messages.slice(isOpen ? -35 : -5).map((m) => (
            <div
              key={m.id}
              className={`leading-relaxed break-words text-[11px] ${
                m.isSystem
                  ? 'text-amber-300 font-bold bg-amber-950/30 px-1.5 py-0.5 rounded'
                  : 'text-stone-100'
              }`}
            >
              {!m.isSystem && (
                <span className="font-bold text-emerald-400 mr-1.5">
                  &lt;{m.senderName}&gt;
                </span>
              )}
              <span>{m.message}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input Bar */}
      {isOpen ? (
        <form onSubmit={handleSend} className="mt-2 flex items-center gap-1.5 animate-in slide-in-from-bottom-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="輸入聊天訊息... (按 Enter 發送, ESC 關閉)"
            maxLength={120}
            className="flex-1 px-3 py-2 rounded-lg bg-black/90 border-2 border-emerald-500/80 text-white text-xs placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-xl"
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <div className="mt-1 flex items-center gap-1">
          <button
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 hover:bg-black/90 text-stone-300 text-[10px] font-bold border border-white/10 transition-all shadow"
          >
            <MessageSquare className="h-3 w-3 text-emerald-400" />
            <span>開啟聊天 (Enter)</span>
          </button>
        </div>
      )}
    </div>
  );
};
