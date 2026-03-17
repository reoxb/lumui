import { useState } from "react";
import { SECTOR_TAGS } from "../../lib/constants";
import { money, pctFmt, upside, fetchAnalysis, openAnalysisPDF } from "../../lib/utils";
import { IconSpinner, IconAnalyze } from "../Icons";
import { MOCK_ANALYSIS } from "../../mockData";

interface ModalProps {
  stock: any;
  onClose: () => void;
  darkMode: boolean;
}

export function Modal({ stock, onClose, darkMode }: ModalProps) {
  const [loading, setLoading] = useState(false);

  if (!stock) return null;
  const up  = upside(stock);
  const tag = SECTOR_TAGS[stock.inputs.sector] || { bg:"#F3F4F6", text:"#374151" };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await fetchAnalysis(stock.ticker, MOCK_ANALYSIS);
      openAnalysisPDF(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(15,23,42,0.45)", backdropFilter:"blur(8px)" }}
      onClick={onClose}>
      <div className="bg-white dark:bg-[#0D1117] rounded-3xl p-7 w-full max-w-md shadow-2xl transition-colors border border-slate-200 dark:border-slate-800"
        style={{ background: darkMode ? '#0D1117' : '#fff' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stock.ticker}</h2>
              {stock.assumptions.growth_regime === "HYPER_GROWTH" && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">HYPER GROWTH</span>
              )}
            </div>
            <span className="text-sm font-medium px-2.5 py-1 rounded-full" 
              style={{ 
                background: darkMode ? (tag.bgDark || tag.bg) : tag.bg, 
                color: darkMode ? (tag.textDark || tag.text) : tag.text 
              }}>
              {stock.inputs.sector}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-500 dark:text-slate-400 text-lg transition-colors">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label:"Precio",           value:money(stock.inputs.price),                               color: darkMode ? "#94A3B8" : "#374151" },
            { label:"Valor Intrínseco", value:money(stock.valuation.intrinsic_value_per_share),        color: up>0 ? (darkMode ? "#38bdf8" : "#1D4ED8") : (darkMode ? "#f87171" : "#DC2626") },
            { label:"Upside",           value:`${up>0?"+":""}${(up*100).toFixed(1)}%`,                 color: up>0 ? (darkMode ? "#4ade80" : "#15803D") : (darkMode ? "#f87171" : "#DC2626") },
            { label:"ROIC",             value:pctFmt(stock.quality_metrics.roic),                      color: darkMode ? "#94A3B8" : "#374151" },
            { label:"FCF Yield",        value:pctFmt(stock.quality_metrics.fcf_yield),                 color: darkMode ? "#94A3B8" : "#374151" },
            { label:"Score",            value:`${(stock.score*10).toFixed(2)}/10`,                     color: darkMode ? "#38bdf8" : "#1D4ED8" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-50 dark:bg-[#161B22] rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800" 
              style={{ background: darkMode ? '#161B22' : '#F8FAFC' }}>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
              <p className="text-sm font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 mb-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0">💰 Precio hoy</span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
            <div className="h-2 rounded-full bg-slate-400 dark:bg-slate-500"
              style={{ width:`${Math.min((stock.inputs.price/stock.scenario_analysis.intrinsic_high)*100,100)}%` }}/>
          </div>
          <span className="text-xs font-bold w-16 text-right text-slate-600 dark:text-slate-200">{money(stock.inputs.price)}</span>
          <span className="text-xs w-14 text-right text-slate-400 dark:text-slate-500">—</span>
        </div>

        <p className="text-sm font-semibold text-slate-700 dark:text-slate-100 mb-3">Análisis de Escenarios</p>
        {[
          { label:"🐻 Pesimista", value:stock.scenario_analysis.intrinsic_low,  color:"#EF4444" },
          { label:"📊 Base",      value:stock.scenario_analysis.intrinsic_mid,  color:"#1D4ED8" },
          { label:"🚀 Optimista", value:stock.scenario_analysis.intrinsic_high, color:"#15803D" },
        ].map(({ label, value, color }) => {
          const w = Math.min((value / stock.scenario_analysis.intrinsic_high) * 100, 100);
          const su = ((value - stock.inputs.price) / stock.inputs.price * 100).toFixed(1);
          return (
            <div key={label} className="flex items-center gap-3 mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0">{label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-2 rounded-full" style={{ width:`${w}%`, background:color, opacity:0.65 }}/>
              </div>
              <span className="text-xs font-bold w-16 text-right" style={{ color }}>{money(value)}</span>
              <span className="text-xs w-14 text-right" style={{ color: value > stock.inputs.price ? (darkMode ? "#4ade80" : "#15803D") : (darkMode ? "#fca5a5" : "#DC2626") }}>
                {parseFloat(su) > 0 ? "+" : ""}{su}%
              </span>
            </div>
          );
        })}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3" style={{ background: darkMode ? 'rgba(30, 58, 138, 0.2)' : '#EFF6FF' }}>
            <p className="text-xs text-blue-400 dark:text-blue-500 mb-1">Crecimiento usado</p>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{pctFmt(stock.assumptions.growth_used)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3" style={{ background: darkMode ? 'rgba(30, 58, 138, 0.2)' : '#EFF6FF' }}>
            <p className="text-xs text-blue-400 dark:text-blue-500 mb-1">WACC</p>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{pctFmt(stock.assumptions.wacc)}</p>
          </div>
        </div>

        {/* ── ANALYZE BUTTON ── */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full mt-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background:"linear-gradient(135deg,#1D4ED8,#2563EB)" }}>
          {loading ? <><IconSpinner/> Generando reporte...</> : <><IconAnalyze/> Analyze</>}
        </button>
      </div>
    </div>
  );
}
