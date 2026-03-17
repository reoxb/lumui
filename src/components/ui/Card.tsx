import { SECTOR_TAGS } from "../../lib/constants";
import { money, upside } from "../../lib/utils";
import { ScoreRing } from "./ScoreRing";
import { ScenarioTrack } from "./ScenarioTrack";

interface CardProps {
  stock: any;
  onClick: (stock: any) => void;
  darkMode: boolean;
}

export function Card({ stock, onClick, darkMode }: CardProps) {
  const up  = upside(stock);
  const tag = SECTOR_TAGS[stock.inputs.sector] || { bg:"#F3F4F6", text:"#374151" };
  const isDark = darkMode;

  return (
    <div onClick={() => onClick(stock)}
      className="rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border shadow-sm"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{stock.ticker}</span>
            {stock.assumptions.growth_regime === "HYPER_GROWTH" && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">HG</span>
            )}
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full transition-colors" 
            style={{ 
              background: isDark ? (tag.bgDark || tag.bg) : tag.bg, 
              color: isDark ? (tag.textDark || tag.text) : tag.text 
            }}>
            {stock.inputs.sector}
          </span>
        </div>
        <ScoreRing score={stock.score} darkMode={darkMode}/>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Precio</p>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{money(stock.inputs.price)}</p>
        </div>
        <div className="rounded-xl p-3 border border-sky-100 dark:border-sky-900/50" 
          style={{ background: up > 0 ? (isDark ? "rgb(12 74 110 / 0.2)" : "#F0F9FF") : (isDark ? "rgb(127 29 29 / 0.2)" : "#FFF1F2") }}>
          <p className="text-xs mb-1" style={{ color: up > 0 ? (darkMode ? "#34d399" : "#0EA5E9") : (darkMode ? "#f87171" : "#EF4444") }}>Valor intrínseco</p>
          <p className="text-base font-semibold" style={{ color: up > 0 ? (isDark ? "#7dd3fc" : "#0F172A") : (isDark ? "#fca5a5" : "#B91C1C") }}>
            {money(stock.valuation.intrinsic_value_per_share)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" style={{ color: up > 0 ? "#10B981" : "#EF4444" }}>{up > 0 ? "▲" : "▼"}</span>
          <span className="text-sm font-semibold" style={{ color: up > 0 ? "#0F9F6E" : "#B91C1C" }}>
            {up > 0 ? "+" : ""}{(up * 100).toFixed(1)}% upside
          </span>
        </div>
        <div className="text-xs text-slate-500">
          ROIC <span className="font-semibold text-slate-700 dark:text-slate-400">{(stock.quality_metrics.roic * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mb-3">
        <div className="h-1.5 rounded-full" style={{ width:`${Math.min(stock.quality_metrics.roic*200,100)}%`, background:"linear-gradient(90deg,#F472B6,#A78BFA,#38BDF8)" }}/>
      </div>

      <ScenarioTrack stock={stock} />
    </div>
  );
}
