import React from 'react';
import { X, Keyboard, MousePointer, Sun, ShieldAlert, Sparkles } from 'lucide-react';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm font-mono">
      <div className="relative w-full max-w-xl rounded-2xl border-2 border-stone-600 bg-stone-900 text-stone-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-700 bg-stone-950 px-6 py-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-300">遊戲操作指南 & 生存手冊</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Game Modes Explanation */}
          <div>
            <h3 className="mb-2 font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> 模式規則：生存模式 vs 創造模式
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-300">
              <div className="rounded-lg bg-emerald-950/40 p-3 border border-emerald-800/60">
                <span className="font-bold text-emerald-300 text-sm">⚔️ 生存模式 (Survival)</span>
                <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                  • <strong>無作弊物資：</strong>不包含任何創造模式免費方塊與武器，背包一開始乾淨赤手空拳。<br />
                  • <strong>探索採集：</strong>必須砍樹伐木、用工作台合成鎬/斧/劍、挖掘採集礦石。<br />
                  • <strong>生存指標：</strong>擁有真實生命值與飢餓度，受到黑夜骷髏攻擊會扣血，生命耗盡出現死亡畫面。<br />
                  • <strong>禁用飛行：</strong>重力真實下墜，不可自由飛行。
                </p>
              </div>

              <div className="rounded-lg bg-amber-950/40 p-3 border border-amber-800/60">
                <span className="font-bold text-amber-300 text-sm">🎨 創造模式 (Creative)</span>
                <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                  • <strong>專屬全物品庫：</strong>按 E 開啟創造物品庫，一鍵選取所有建築方塊、礦石與工具。<br />
                  • <strong>無限放置方塊：</strong>方塊放置不消耗庫存，可以隨心所欲無限建造。<br />
                  • <strong>秒破方塊：</strong>點擊即可瞬間破壞任何方塊，不掉落雜物。<br />
                  • <strong>自由飛行與無敵：</strong>按 F 鍵（或雙擊空白鍵/手機羽毛鈕）即可翱翔天空，免疫任何怪物傷害！
                </p>
              </div>
            </div>
          </div>

          {/* Tablet & Mobile Touch Controls */}
          <div>
            <h3 className="mb-2 font-bold text-sky-400 flex items-center gap-1.5">
              <span>📱</span> 平板與手機觸控操作說明（完整適配）
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-300">
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">左下角虛擬搖桿 & 疾跑/潛行</span>
                <p className="text-stone-400 text-xs mt-0.5">拖動拇指走動；上方可切換 ⚡疾跑 與 🛡️潛行（邊緣防掉落）</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">多指同時滑動視角</span>
                <p className="text-stone-400 text-xs mt-0.5">支援左手移動同時右手滑動螢幕旋轉 3D 視角</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">⛏️ 長按挖掘 / 點擊攻擊</span>
                <p className="text-stone-400 text-xs mt-0.5">長按連續採掘方塊 / 點擊揮劍攻擊怪物</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">🧱 長按放置 / 互動鈕</span>
                <p className="text-stone-400 text-xs mt-0.5">長按連續砌牆搭橋 / 食用食物 / 開啟工作台或村民交易</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">🛠️ 右側快捷按鈕</span>
                <p className="text-stone-400 text-xs mt-0.5">一鍵開啟 3×3 合成台、背包與切換第一/第三人稱視角</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">下方快捷欄點擊</span>
                <p className="text-stone-400 text-xs mt-0.5">直接點擊切換拿取的方塊與武器</p>
              </div>
            </div>
          </div>

          {/* Movement & View */}
          <div>
            <h3 className="mb-2 font-bold text-emerald-400 flex items-center gap-1.5">
              <MousePointer className="h-4 w-4" /> 電腦鍵盤與滑鼠
            </h3>
            <div className="grid grid-cols-2 gap-2 text-stone-300">
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">W / A / S / D</span>
                <p className="text-stone-400 text-xs mt-0.5">前後左右走動（雙擊 W 可疾跑）</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">空白鍵 (Space)</span>
                <p className="text-stone-400 text-xs mt-0.5">跳躍 / 水中向上游泳浮起</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">Shift 鍵 / C 鍵</span>
                <p className="text-stone-400 text-xs mt-0.5">潛行蹲下 (降高、邊緣防掉落)</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">Ctrl 鍵</span>
                <p className="text-stone-400 text-xs mt-0.5">疾跑奔馳 (動態視角拉寬 & 躍進)</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">F 鍵 (創造模式)</span>
                <p className="text-stone-400 text-xs mt-0.5">切換自由飛行模式 (或雙擊空白)</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">F5 鍵</span>
                <p className="text-stone-400 text-xs mt-0.5">切換第一人稱 / 第三人稱視角</p>
              </div>
            </div>
          </div>

          {/* Action & Combat */}
          <div>
            <h3 className="mb-2 font-bold text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" /> 挖掘、放置與戰鬥 (同 盜版Rickie -2015 經典規則)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-stone-300">
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">滑鼠左鍵 (長按)</span>
                <p className="text-stone-400 text-xs mt-0.5">連續挖掘破壞方塊 (即時呈現 3D 裂紋階層與碎裂粒子)</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">滑鼠右鍵 (長按)</span>
                <p className="text-stone-400 text-xs mt-0.5">連續放置手持方塊 (快速搭橋砌牆) / 食用食物 / 村民交易</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">1 ~ 9 或 滾輪</span>
                <p className="text-stone-400 text-xs mt-0.5">迅速切換 9 格快捷欄物品</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                <span className="font-bold text-amber-300">E 鍵</span>
                <p className="text-stone-400 text-xs mt-0.5">開啟 36 格背包與創造物品庫</p>
              </div>
              <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800 sm:col-span-2">
                <span className="font-bold text-emerald-300">R 鍵 / 右鍵工作台方塊</span>
                <p className="text-stone-400 text-xs mt-0.5">開啟 3×3 高級合成工作台 GUI，合成黑曜石神級工具與精美裝飾方塊</p>
              </div>
            </div>
          </div>

          {/* Day & Night & Mobs */}
          <div>
            <h3 className="mb-2 font-bold text-amber-400 flex items-center gap-1.5">
              <Sun className="h-4 w-4" /> 日夜交替環境光照系統
            </h3>
            <div className="space-y-1.5 rounded-lg bg-stone-950 p-3 border border-stone-800 text-stone-400 text-xs leading-relaxed">
              <p>
                <strong className="text-stone-200">🌅 日出晨光 (06:00)：</strong> 金橙色晨曦破曉，地平線晨霧繚繞，方塊太陽緩緩升起，星光隱退。
              </p>
              <p>
                <strong className="text-stone-200">☀️ 蔚藍正午 (12:00)：</strong> 陽光如金，照耀大地，天藍雲白，生態生機盎然。
              </p>
              <p>
                <strong className="text-stone-200">🌇 火紅日落 (18:00)：</strong> 太陽西沉，天際化為赤紅與紫霞，陰影拉長，光影變幻沈浸感十足。
              </p>
              <p>
                <strong className="text-stone-200">🌙 幽邃午夜 (00:00)：</strong> 方塊月亮高懸，逾千顆繁星閃爍，環境暗沉，敵對骷髏將開始出沒巡邏！
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-800 bg-stone-950 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-amber-400"
          >
            我知道了，開始冒險
          </button>
        </div>
      </div>
    </div>
  );
};
