// @ts-nocheck
import { useState, useEffect } from "react";

// Data
import outputText from "../output.txt?raw";
import { MOCK_ANALYSIS } from "./mockData";

// Lib
import { pctFmt, upside } from "./lib/utils";

// Components
import { IconSun, IconMoon, IconAnalyze, IconSpinner } from "./components/Icons";
import { StrategicMap } from "./components/charts/StrategicMap";
import { ScenarioAsymmetryChart } from "./components/charts/ScenarioAsymmetryChart";
import { SecondOrderFlags } from "./components/dashboard/SecondOrderFlags";
import { TableView } from "./components/table/TableView";
import { Modal } from "./components/ui/Modal";

const raw = JSON.parse(outputText);

export default function App() {
  const [selected, setSelected]           = useState(null);
  const [isMobile, setIsMobile]           = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [sortBy, setSortBy]               = useState("score");
  const [filterValuation, setFilterVal]   = useState("All");
  const [filterSector, setFilterSector]   = useState("All");
  const [search, setSearch]               = useState("");
  const [showAll, setShowAll]             = useState(false);
  const [darkMode, setDarkMode]           = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('darkMode');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const data = [...raw]
    .filter(d => filterSector === "All" || d.inputs.sector === filterSector)
    .filter(d => {
      if (filterValuation === "Subvaloradas")   return upside(d) >  0.05;
      if (filterValuation === "Sobrevaloradas") return upside(d) < -0.05;
      return true;
    })
    .filter(d => d.ticker.includes(search.toUpperCase()))
    .sort((a, b) => {
      if (sortBy === "score")  return b.score - a.score;
      if (sortBy === "upside") return upside(b) - upside(a);
      if (sortBy === "roic")   return b.quality_metrics.roic - a.quality_metrics.roic;
      if (sortBy === "fcf")    return b.quality_metrics.fcf_yield - a.quality_metrics.fcf_yield;
      return 0;
    });

  const avgRoic = raw.reduce((s, d) => s + d.quality_metrics.roic, 0) / raw.length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#06080C] text-slate-100' : 'bg-slate-50 text-slate-900'}`} style={{ fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* ── HEADER ── */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-[#1F2937] transition-all duration-300"
        style={{ background: darkMode ? '#06080C' : '#FFFFFF' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">L</div>
          <h1 className="text-lg font-bold uppercase tracking-tight"
            style={{ color: darkMode ? '#F1F5F9' : '#0F172A' }}>
            AlphaQuant Terminal
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-xs font-semibold" style={{ color: darkMode ? '#60A5FA' : '#2563EB' }}>Dashboard</a>
            <a href="#" className="text-xs font-semibold hover:opacity-80 transition-opacity" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Portfolio</a>
            <a href="#" className="text-xs font-semibold hover:opacity-80 transition-opacity" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Alerts</a>
          </nav>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <IconSun /> : <IconMoon />}
          </button>
          
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">JD</div>
        </div>
      </header>

      {/* ── KPI PILLS ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap gap-4">
        {[
          { label: "Total Stocks", value: raw.length, color: "text-slate-400" },
          { label: "Avg MOS", value: pctFmt(raw.reduce((s, d) => s + d.valuation.margin_of_safety, 0) / raw.length), color: "text-emerald-500" },
          { label: "Avg ROIC", value: pctFmt(avgRoic), color: "text-slate-200" },
          { label: "Avg Conviction", value: "High", color: "text-blue-400" },
        ].map((pill, i) => (
          <div key={i} className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
            style={{ background: darkMode ? '#1e293b' : '#fff' }}>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{pill.label}</span>
            <span className={`text-sm font-bold ${pill.color}`}>{pill.value}</span>
          </div>
        ))}
      </div>

      {/* ── TOP SECTION ── */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Scenario Asymmetry Chart */}
        <div className="lg:col-span-2">
          <ScenarioAsymmetryChart data={data} darkMode={darkMode} />
        </div>
        
        {/* Contextual Intelligence - Second Order Flags */}
        <div className="lg:col-span-1">
          <SecondOrderFlags data={data} darkMode={darkMode} />
        </div>
      </div>

      {/* ── MARKET COVERAGE ── */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden" 
          style={{ 
            background: darkMode ? '#0D1117' : '#FFFFFF',
            borderColor: darkMode ? '#21262D' : '#E2E8F0'
          }}>
          <div className="px-6 py-5 border-b flex items-center justify-between"
            style={{ borderColor: darkMode ? '#21262D' : '#E5E7EB' }}>
            <h2 className="text-lg font-bold" 
              style={{ color: darkMode ? '#F1F5F9' : '#1E293B' }}>
              Market Coverage & Valuations
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative h-9">
                <input
                  type="text"
                  placeholder="Search ticker..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 h-full rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors border"
                  style={{ 
                    background: darkMode ? '#161B22' : '#F8FAFC',
                    color: darkMode ? '#F1F5F9' : '#1E293B',
                    borderColor: darkMode ? '#30363D' : '#E2E8F0'
                  }}
                />
                <div className="absolute left-3 top-2.5 text-slate-500">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
              </div>
              <button className="px-4 py-2 text-[10px] font-bold rounded-lg uppercase tracking-wider border transition-colors"
                style={{ 
                  background: darkMode ? '#21262D' : '#F1F5F9',
                  color: darkMode ? '#C9D1D9' : '#64748B',
                  borderColor: darkMode ? '#30363D' : '#E2E8F0'
                }}>
                Export CSV
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider border border-blue-700 shadow-sm shadow-blue-500/20">Add Ticker</button>
            </div>
          </div>
          
          <TableView data={data} onSelect={setSelected} darkMode={darkMode} showAll={showAll} />
          
          {!showAll && data.length > 5 && (
            <div className="px-6 py-4 border-t flex justify-center transition-colors"
               style={{ background: darkMode ? '#0D1117' : '#F8FAFC', borderColor: darkMode ? '#21262D' : '#E5E7EB' }}>
              <button 
                onClick={() => setShowAll(true)}
                className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                View Full List ({data.length} Stocks)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── STRATEGIC MAP ── */}
      <StrategicMap data={data} darkMode={darkMode} />

      <Modal stock={selected} onClose={() => setSelected(null)} darkMode={darkMode}/>
    </div>
  );
}
