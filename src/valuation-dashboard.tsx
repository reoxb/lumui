// @ts-nocheck
import { useState, useEffect, useRef } from "react";

import outputText from "../output.txt?raw";
import { MOCK_ANALYSIS } from "./mockData";

const raw = JSON.parse(outputText);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pctFmt = (n) => `${(n * 100).toFixed(1)}%`;
const money  = (n) => n >= 1000 ? `$${n.toFixed(0)}` : `$${n.toFixed(2)}`;
const upside = (d) => (d.valuation.intrinsic_value_per_share - d.inputs.price) / d.inputs.price;
const billions = (n) => `$${(n / 1e9).toFixed(2)}B`;

const SECTOR_TAGS = {
  "Technology":             { bg:"#EFF6FF", bgDark: "#1e3a8a33", text:"#1D4ED8", textDark: "#60a5fa" },
  "Consumer Cyclical":      { bg:"#FFF7ED", bgDark: "#7c2d1233", text:"#C2410C", textDark: "#fb923c" },
  "Consumer Defensive":     { bg:"#F0FDF4", bgDark: "#064e3b33", text:"#15803D", textDark: "#4ade80" },
  "Healthcare":             { bg:"#FDF4FF", bgDark: "#581c8733", text:"#7E22CE", textDark: "#c084fc" },
  "Industrials":            { bg:"#FFFBEB", bgDark: "#78350f33", text:"#B45309", textDark: "#fbbf24" },
  "Communication Services": { bg:"#F0F9FF", bgDark: "#0c4a6e33", text:"#0369A1", textDark: "#38bdf8" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconGrid     = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const IconTable    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>;
const IconAnalyze  = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
const IconSpinner  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:"spin 1s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
const IconSun      = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.07" x2="5.64" y2="17.66"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IconMoon     = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

// ─── Scenario Asymmetry Chart ─────────────────────────────────────────────────────
function ScenarioAsymmetryChart({ data, darkMode }) {
  const [hoveredStock, setHoveredStock] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate asymmetry data
  const chartData = data.map(stock => {
    const price = stock.inputs.price;
    const low = stock.scenario_analysis.intrinsic_low;
    const high = stock.scenario_analysis.intrinsic_high;
    const bullValue = Math.max(high - price, 0);
    const bearValue = Math.max(Math.abs(low - price), 0); // always show bear distance (absolute)
    const asymRatio = bearValue === 0 ? Infinity : (bullValue / bearValue);

    return {
      ticker: stock.ticker,
      price,
      low,
      high,
      bullUpside: bullValue,
      bearDownside: bearValue,
      asymmetry: asymRatio,
    };
  });

  const maxDistance = Math.max(
    ...chartData.map(d => Math.abs(d.bullUpside)),
    ...chartData.map(d => Math.abs(d.bearDownside)),
    100 // minimum range to avoid division by zero or tiny ranges
  );

  const chartHeight = 320;
  const chartWidth = containerWidth || 820;
  const padding = { top: 30, right: 20, bottom: 70, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const groupWidth = plotWidth / Math.max(chartData.length, 1);
  const barWidth = Math.min(20, groupWidth * 0.35);
  const groupGap = Math.max(12, groupWidth * 0.1);

  const yTicks = [maxDistance, maxDistance * 0.5, 0, -maxDistance * 0.5, -maxDistance];
  const yScale = (val) => {
    const ratio = (val + maxDistance) / (2 * maxDistance);
    return padding.top + plotHeight - ratio * plotHeight;
  };
  const zeroY = yScale(0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mt-6 transition-colors" style={{ border: "1px solid var(--chart-grid)" }}>
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Asimetria de Escenarios</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Perfil de riesgo/recompensa: Distancia desde precio actual</p>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="relative" style={{ height: `${chartHeight}px` }}>
        <svg width={chartWidth} height={chartHeight} className="absolute inset-0">
          {yTicks.map((val) => (
            <g key={`grid-${val}`}>
              <line
                x1={padding.left}
                y1={yScale(val)}
                x2={chartWidth - padding.right}
                y2={yScale(val)}
                stroke={darkMode ? "#1F2937" : "#E5E7EB"}
                strokeWidth={val === 0 ? 1.5 : 0.8}
                strokeDasharray={val === 0 ? "" : "4,4"}
              />
              <text
                x={padding.left - 10}
                y={yScale(val) + 4}
                textAnchor="end"
                fill={darkMode ? "#4B5563" : "#9CA3AF"}
                fontSize="9"
                fontWeight={val === 0 ? 600 : 400}
              >
                {val > 0 ? `+$${val}` : val < 0 ? `-$${Math.abs(val)}` : `$${val}`}
              </text>
              {val === 0 && (
                <text
                  x={chartWidth - padding.right + 5}
                  y={yScale(val) - 5}
                  textAnchor="end"
                  fill={darkMode ? "#4B5563" : "#9CA3AF"}
                  fontSize="8"
                  fontWeight="bold"
                  className="uppercase tracking-widest"
                >
                  Precio Actual
                </text>
              )}
            </g>
          ))}

          {/* Y-axis title */}
          <text
            x={15}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="var(--chart-text)"
            fontSize="11"
            transform={`rotate(-90, 15, ${chartHeight / 2})`}
          >
            Distancia ($)
          </text>

          {chartData.map((item, index) => {
            const groupWidth = plotWidth / Math.max(chartData.length, 1);
            const effectiveBarWidth = Math.min(barWidth, Math.max(10, groupWidth * 0.2));
            const offsetX = padding.left + index * groupWidth + (groupWidth - (effectiveBarWidth * 2 + 3)) / 2;
            const bullX = offsetX;
            const bearX = offsetX + effectiveBarWidth + 3;

            const bull = Math.max(item.bullUpside, 0);
            const bear = Math.max(item.bearDownside, 0);
            const bullHeight = (bull / (2 * maxDistance)) * plotHeight;
            const bearHeight = (bear / (2 * maxDistance)) * plotHeight;
            const isHovered = hoveredStock === item.ticker;

            return (
              <g key={item.ticker}>
                {bull > 0 && (
                  <rect
                    x={bullX}
                    y={zeroY - bullHeight}
                    width={barWidth}
                    height={bullHeight}
                    fill="#22C55E"
                    rx="3"
                    opacity={isHovered ? 0.8 : 1}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredStock(item.ticker)}
                    onMouseLeave={() => setHoveredStock(null)}
                  />
                )}
                {bear > 0 && (
                  <rect
                    x={bearX}
                    y={zeroY}
                    width={barWidth}
                    height={bearHeight}
                    fill="#EF4444"
                    rx="3"
                    opacity={isHovered ? 0.8 : 1}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredStock(item.ticker)}
                    onMouseLeave={() => setHoveredStock(null)}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Labels below X-axis */}
        <div className="absolute left-0 right-0" style={{ top: `${chartHeight - padding.bottom + 12}px` }}>
          {chartData.map((item, index) => {
            const x = padding.left + index * (plotWidth / Math.max(chartData.length, 1)) + (plotWidth / Math.max(chartData.length, 1) / 2);
            return (
              <div
                key={`label-${item.ticker}`}
                className="absolute text-[10px] font-bold text-slate-500 dark:text-slate-400"
                style={{
                  left: `${x}px`,
                  transform: 'translateX(-50%) rotate(-45deg)',
                  transformOrigin: 'top center',
                  whiteSpace: 'nowrap',
                  lineHeight: '1'
                }}
              >
                {item.ticker}
              </div>
            );
          })}
        </div>

        {/* Tooltip */}
        {hoveredStock && (() => {
          const item = chartData.find(d => d.ticker === hoveredStock);
          if (!item) return null;

          const index = chartData.indexOf(item);
          const x = padding.left + index * (plotWidth / Math.max(chartData.length, 1)) + (plotWidth / Math.max(chartData.length, 1) / 2);
          const asym = item.asymmetry;

          return (
            <div
              className={`absolute p-2 rounded-lg shadow-lg z-20 pointer-events-none text-xs border ${darkMode ? "bg-slate-900 text-slate-100 border-slate-700" : "bg-gray-900 text-white border-transparent"}`}
              style={{
                left: `${x + 10}px`,
                top: '16px',
                transform: x > chartWidth / 2 ? 'translateX(-100%) translateX(-20px)' : 'translateX(0)'
              }}
            >
              <div className="font-bold mb-1">{item.ticker}</div>
              <div className="text-green-300">Bull: +{item.bullUpside.toFixed(2)}</div>
              <div className="text-red-300">Bear: +{item.bearDownside.toFixed(2)}</div>
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-6 mt-8">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22C55E' }}></div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Bull Upside</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Bear Downside</span>
        </div>
      </div>
    </div>
  );
}

// ─── PDF generator (builds HTML → opens in new tab → user prints/saves) ───────
function openAnalysisPDF(data) {
  const a  = data.analysis;
  const cd = data.committee_decision;
  const ag = cd.agent_outputs;

  const decisionColor = cd.decision === "BUY" ? "#15803D" : cd.decision === "SELL" ? "#DC2626" : "#B45309";
  const decisionBg    = cd.decision === "BUY" ? "#F0FDF4" : cd.decision === "SELL" ? "#FFF1F2" : "#FFFBEB";
  const up = ((a.valuation.intrinsic_value_per_share - a.inputs.price) / a.inputs.price * 100).toFixed(1);
  const upColor = up > 0 ? "#15803D" : "#DC2626";

  const scoreBar = (val, color = "#1D4ED8") =>
    `<div style="height:6px;border-radius:4px;background:#E5E7EB;margin-top:4px">
       <div style="height:6px;border-radius:4px;background:${color};width:${Math.min(val*100,100).toFixed(0)}%"></div>
     </div>`;

  const agentCard = (emoji, label, score, summary, extra = "") =>
    `<div style="background:#F8FAFC;border-radius:10px;padding:14px;border:1px solid #E5E7EB;margin-bottom:10px">
       <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
         <span style="font-weight:700;font-size:13px;color:#1E3A8A">${emoji} ${label}</span>
         <span style="font-size:12px;font-weight:700;color:#1D4ED8">${(score*10).toFixed(1)}/10</span>
       </div>
       ${scoreBar(score)}
       <p style="font-size:12px;color:#374151;margin-top:8px;line-height:1.55">${summary}</p>
       ${extra}
     </div>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Investment Analysis — ${a.ticker}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1F2937;background:#fff;padding:40px;max-width:820px;margin:0 auto}
    h1{font-size:26px;font-weight:800;color:#1E3A8A}
    h2{font-size:15px;font-weight:700;color:#1E3A8A;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #DBEAFE}
    .section{margin-bottom:28px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .box{background:#F8FAFC;border-radius:10px;padding:12px;border:1px solid #E5E7EB}
    .label{font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
    .val{font-size:16px;font-weight:700}
    .tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
    .divider{height:1px;background:#E5E7EB;margin:20px 0}
    @media print{body{padding:20px}}
  </style>
</head>
<body>

  <!-- HEADER -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
    <div>
      <div style="font-size:11px;font-weight:600;color:#1D4ED8;letter-spacing:.15em;text-transform:uppercase;margin-bottom:4px">DCF Investment Analysis</div>
      <h1>${a.ticker} — Investment Committee Report</h1>
      <div style="margin-top:6px">
        <span class="tag" style="background:${SECTOR_TAGS[a.inputs.sector]?.bg||'#F3F4F6'};color:${SECTOR_TAGS[a.inputs.sector]?.text||'#374151'}">${a.inputs.sector}</span>
        ${a.assumptions.growth_regime ? `<span class="tag" style="background:#FFFBEB;color:#B45309;margin-left:6px">${a.assumptions.growth_regime}</span>` : ""}
      </div>
    </div>
    <div style="text-align:right">
      <div style="background:${decisionBg};border:2px solid ${decisionColor};border-radius:12px;padding:10px 20px;display:inline-block">
        <div style="font-size:10px;color:${decisionColor};font-weight:600;letter-spacing:.1em">COMMITTEE DECISION</div>
        <div style="font-size:28px;font-weight:900;color:${decisionColor}">${cd.decision}</div>
        <div style="font-size:11px;color:${decisionColor};font-weight:600">${cd.conviction_level} conviction</div>
      </div>
    </div>
  </div>

  <div style="font-size:11px;color:#9CA3AF;margin-bottom:28px">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Final Score: ${(cd.final_score*10).toFixed(2)}/10 &nbsp;|&nbsp; Confidence: ${pctFmt(a.data_quality.confidence_score)}</div>

  <!-- KEY METRICS -->
  <div class="section">
    <h2>Key Metrics</h2>
    <div class="grid4">
      <div class="box">
        <div class="label">Current Price</div>
        <div class="val" style="color:#1F2937">${money(a.inputs.price)}</div>
      </div>
      <div class="box">
        <div class="label">Intrinsic Value</div>
        <div class="val" style="color:${up > 0 ? '#1D4ED8' : '#DC2626'}">${money(a.valuation.intrinsic_value_per_share)}</div>
      </div>
      <div class="box">
        <div class="label">Upside / Downside</div>
        <div class="val" style="color:${upColor}">${up > 0 ? '+' : ''}${up}%</div>
      </div>
      <div class="box">
        <div class="label">Margin of Safety</div>
        <div class="val" style="color:#1D4ED8">${pctFmt(a.valuation.margin_of_safety)}</div>
      </div>
      <div class="box">
        <div class="label">ROIC</div>
        <div class="val">${pctFmt(a.quality_metrics.roic)}</div>
      </div>
      <div class="box">
        <div class="label">FCF Yield</div>
        <div class="val">${pctFmt(a.quality_metrics.fcf_yield)}</div>
      </div>
      <div class="box">
        <div class="label">Debt / FCF</div>
        <div class="val">${a.quality_metrics.debt_to_fcf.toFixed(2)}x</div>
      </div>
      <div class="box">
        <div class="label">Normalized FCF</div>
        <div class="val">${billions(a.normalized_fcf)}</div>
      </div>
    </div>
  </div>

  <!-- VALUATION -->
  <div class="section">
    <h2>DCF Assumptions &amp; Valuation</h2>
    <div class="grid2">
      <div>
        <div class="grid3" style="margin-bottom:10px">
          <div class="box"><div class="label">Growth Used</div><div class="val" style="font-size:14px">${pctFmt(a.assumptions.growth_used)}</div></div>
          <div class="box"><div class="label">WACC</div><div class="val" style="font-size:14px">${pctFmt(a.assumptions.wacc)}</div></div>
          <div class="box"><div class="label">Terminal g</div><div class="val" style="font-size:14px">${pctFmt(a.assumptions.terminal_growth)}</div></div>
        </div>
        <div class="grid3">
          <div class="box"><div class="label">Proj. Years</div><div class="val" style="font-size:14px">${a.assumptions.projection_years}</div></div>
          <div class="box"><div class="label">Fade Start</div><div class="val" style="font-size:14px">Yr ${a.assumptions.fade_start_year}</div></div>
          <div class="box"><div class="label">Cost of Eq.</div><div class="val" style="font-size:14px">${pctFmt(a.assumptions.cost_of_equity)}</div></div>
        </div>
      </div>
      <div class="box">
        <div class="label" style="margin-bottom:8px">Enterprise &amp; Equity Value</div>
        <div style="font-size:13px;color:#374151;margin-bottom:4px">Enterprise Value</div>
        <div style="font-size:18px;font-weight:700;color:#1E3A8A;margin-bottom:10px">${billions(a.valuation.enterprise_value)}</div>
        <div style="font-size:13px;color:#374151;margin-bottom:4px">Equity Value</div>
        <div style="font-size:18px;font-weight:700;color:#1E3A8A">${billions(a.valuation.equity_value)}</div>
      </div>
    </div>
  </div>

  <!-- SCENARIOS -->
  <div class="section">
    <h2>Scenario Analysis</h2>
    <div class="grid3">
      ${[
        { label:"🐻 Bear Case", sc: a.scenario_analysis.bear, iv: a.scenario_analysis.intrinsic_low,  bg:"#FFF1F2", border:"#FCA5A5", tc:"#DC2626" },
        { label:"📊 Base Case", sc: a.scenario_analysis.base, iv: a.scenario_analysis.intrinsic_mid,  bg:"#EFF6FF", border:"#BFDBFE", tc:"#1D4ED8" },
        { label:"🚀 Bull Case", sc: a.scenario_analysis.bull, iv: a.scenario_analysis.intrinsic_high, bg:"#F0FDF4", border:"#86EFAC", tc:"#15803D" },
      ].map(({ label, sc, iv, bg, border, tc }) => `
        <div style="background:${bg};border-radius:10px;padding:14px;border:1px solid ${border}">
          <div style="font-weight:700;font-size:13px;color:${tc};margin-bottom:10px">${label}</div>
          <div class="label">Intrinsic Value</div>
          <div style="font-size:20px;font-weight:800;color:${tc};margin-bottom:8px">${money(iv)}</div>
          <div style="font-size:11px;color:#6B7280">WACC: ${pctFmt(sc.wacc)} &nbsp;|&nbsp; Fade: Yr ${sc.fade_start_year}</div>
          <div style="font-size:11px;color:#6B7280">MoS: ${pctFmt(sc.margin_of_safety)}</div>
        </div>
      `).join("")}
    </div>
    <!-- Price position bar -->
    <div style="margin-top:14px;background:#F8FAFC;border-radius:10px;padding:14px;border:1px solid #E5E7EB">
      <div style="font-size:11px;color:#9CA3AF;margin-bottom:6px">Current price vs. scenario range</div>
      <div style="position:relative;height:10px;background:#E5E7EB;border-radius:6px">
        ${(() => {
          const lo = a.scenario_analysis.intrinsic_low, hi = a.scenario_analysis.intrinsic_high;
          const p  = a.inputs.price;
          const min = Math.min(lo, p) * 0.92, max = Math.max(hi, p) * 1.05;
          const rng = max - min;
          const toP = v => ((v - min) / rng * 100).toFixed(1);
          return `
            <div style="position:absolute;top:0;height:10px;border-radius:6px;background:linear-gradient(90deg,#FCA5A5,#BFDBFE,#86EFAC);left:${toP(lo)}%;width:${(toP(hi) - toP(lo)).toFixed(1)}%"></div>
            <div style="position:absolute;top:-3px;width:4px;height:16px;background:#1F2937;border-radius:2px;left:${toP(p)}%;transform:translateX(-50%)"></div>
          `;
        })()}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-top:4px;color:#6B7280">
        <span style="color:#DC2626;font-weight:600">Bear ${money(a.scenario_analysis.intrinsic_low)}</span>
        <span>&#9679; Price ${money(a.inputs.price)}</span>
        <span style="color:#15803D;font-weight:600">Bull ${money(a.scenario_analysis.intrinsic_high)}</span>
      </div>
    </div>
  </div>

  <!-- COMMITTEE MEMO -->
  <div class="section">
    <h2>Investment Committee Summary</h2>
    <div style="background:#EFF6FF;border-left:4px solid #1D4ED8;padding:14px 16px;border-radius:0 10px 10px 0;margin-bottom:14px">
      <p style="font-size:13px;color:#1E3A8A;line-height:1.6">${cd.full_memo.replace(/\n/g,"<br/>")}</p>
    </div>
  </div>

  <!-- AGENT ANALYSIS -->
  <div class="section">
    <h2>Agent Analysis</h2>
    ${agentCard("📐","Quant",   ag.quant.conviction,   ag.quant.summary,
      `<div style="display:flex;gap:8px;margin-top:6px;font-size:11px;color:#6B7280">
         <span>Val. Gap: ${(ag.quant.valuation_gap_strength*10).toFixed(1)}/10</span>
         <span>|</span><span>Model Conf.: ${pctFmt(ag.quant.model_confidence_adjusted)}</span>
       </div>`)}
    ${agentCard("💎","Quality", ag.quality.quality_score, ag.quality.summary,
      `<div style="display:flex;gap:8px;margin-top:6px;font-size:11px;color:#6B7280">
         <span>Moat: ${(ag.quality.moat_durability*10).toFixed(1)}/10</span>
         <span>|</span><span>Balance Sheet: ${(ag.quality.balance_sheet_safety*10).toFixed(1)}/10</span>
         <span>|</span><span>Compounder: ${(ag.quality.long_term_compounder_probability*10).toFixed(1)}/10</span>
       </div>`)}
    ${agentCard("⚠️","Risk",    ag.risk.risk_score,     ag.risk.summary,
      `<div style="margin-top:6px;font-size:11px;color:#DC2626;font-weight:600">Primary risk: ${ag.risk.primary_risk_vector}</div>`)}
    ${agentCard("🌍","Macro",   ag.macro.regime_alignment, ag.macro.summary,
      `<div style="display:flex;gap:8px;margin-top:6px;font-size:11px;color:#6B7280">
         <span>Cyclical Adv: ${(ag.macro.cyclical_advantage*10).toFixed(1)}/10</span>
         <span>|</span><span>Rate Risk: ${(ag.macro.rate_sensitivity_risk*10).toFixed(1)}/10</span>
       </div>`)}
    <div style="background:#FFF1F2;border-radius:10px;padding:14px;border:1px solid #FCA5A5">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-weight:700;font-size:13px;color:#DC2626">😈 Devil's Advocate</span>
        <span style="font-size:12px;font-weight:700;color:#DC2626">Fatal flaw: ${pctFmt(ag.devil.fatal_flaw_probability)}</span>
      </div>
      ${scoreBar(ag.devil.bear_strength, "#DC2626")}
      <p style="font-size:12px;color:#374151;margin-top:8px;line-height:1.55">${ag.devil.core_argument}</p>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="divider"></div>
  <div style="font-size:10px;color:#9CA3AF;text-align:center">
    This report is generated automatically from a DCF model and does not constitute financial advice. &nbsp;|&nbsp; ${cd.timestamp}
  </div>

</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (win) win.focus();
}

// ─── Simulate async endpoint call ────────────────────────────────────────────
async function fetchAnalysis(ticker) {
  await new Promise(r => setTimeout(r, 1200)); // simulate network delay
  return { ...MOCK_ANALYSIS, analysis: { ...MOCK_ANALYSIS.analysis, ticker } };
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────
function ScoreRing({ score, darkMode }) {
  const r = 19, circ = 2 * Math.PI * r;
  const color = score >= 0.75 ? "#0EA5E9" : score >= 0.6 ? "#F59E0B" : "#EF4444";
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke={darkMode ? "#334155" : "#E2E8F0"} strokeWidth="4"/>
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4.5"
        strokeDasharray={`${Math.min(score,1) * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="29" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {(score * 10).toFixed(1)}
      </text>
    </svg>
  );
}

// ─── ScenarioTrack ────────────────────────────────────────────────────────────
function ScenarioTrack({ stock, compact = false, darkMode }) {
  const isDark = darkMode;
  const price = stock.inputs.price;
  const { bear_value, intrinsic_value_per_share: base, bull_value } = stock.valuation;
  const minV = Math.min(price, bear_value, base, bull_value);
  const maxV = Math.max(price, bear_value, base, bull_value);
  const range = maxV - minV || 1;
  const pct = (v) => ((v - minV) / range) * 100;

  if (compact) {
    return (
      <div className="relative h-4 w-full flex items-center">
        <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="absolute h-0.5 bg-blue-500/50 rounded-full" style={{ left: `${pct(bear_value)}%`, width: `${pct(bull_value) - pct(bear_value)}%` }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-rose-400 border border-white dark:border-slate-900" style={{ left: `${pct(bear_value)}%`, transform: 'translateX(-50%)' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white border border-blue-500" style={{ left: `${pct(base)}%`, transform: 'translateX(-50%)' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 border border-white dark:border-slate-900" style={{ left: `${pct(bull_value)}%`, transform: 'translateX(-50%)' }} />
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1.5 uppercase font-bold tracking-widest">
        <span>Bear</span>
        <span>Base</span>
        <span>Bull</span>
      </div>
      <div className="relative h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="absolute top-0 h-full bg-red-400" style={{ left: `${pct(Math.min(bear_value, base))}%`, width: `${pct(Math.max(bear_value, base)) - pct(Math.min(bear_value, base))}%` }}/>
        <div className="absolute top-0 h-full bg-blue-500" style={{ left: `${pct(Math.min(base, bull_value))}%`, width: `${pct(Math.max(base, bull_value)) - pct(Math.min(base, bull_value))}%` }}/>
      </div>
      <div className="relative h-4 mt-1">
        <div className="absolute top-0 w-0.5 h-3 bg-slate-800 dark:bg-slate-200" style={{ left: `${pct(price)}%`, transform: 'translateX(-50%)' }}>
          <div className="absolute -top-1 left-1.5 text-[9px] font-bold text-slate-800 dark:text-slate-200">${price.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ stock, onClick, darkMode }) {
  const up  = upside(stock);
  const tag = SECTOR_TAGS[stock.inputs.sector] || { bg:"#F3F4F6", text:"#374151" };
  const isDark = darkMode;

  return (
    <div onClick={() => onClick(stock)}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-slate-200 dark:border-slate-700">
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
          ROIC <span className="font-semibold text-slate-700 dark:text-slate-400">{pctFmt(stock.quality_metrics.roic)}</span>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mb-3">
        <div className="h-1.5 rounded-full" style={{ width:`${Math.min(stock.quality_metrics.roic*200,100)}%`, background:"linear-gradient(90deg,#F472B6,#A78BFA,#38BDF8)" }}/>
      </div>

      <ScenarioTrack stock={stock} darkMode={darkMode}/>
    </div>
  );
}

// ─── Table View Component (with truncation) ───────────────────────────────────
function TableView({ data, onSelect, darkMode, showAll }) {
  const displayData = showAll ? data : data.slice(0, 5);
  
  return (
    <div className="w-full">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 dark:border-[#1F2937]">
            {["Ticker","Sector","Price","Intrinsic","Upside%","FCF Yield","Score","Scenario Range"].map((h) => (
              <th
                key={h}
                className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-transparent"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-[#1B2129]">
          {displayData.map((stock, i) => (
            <TableRow 
              key={stock.ticker} 
              stock={stock} 
              onClick={onSelect} 
              darkMode={darkMode}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────
function TableRow({ stock, onClick, darkMode }) {
  const up = upside(stock);
  const range = stock.scenario_analysis;
  const price = stock.inputs.price;
  
  return (
    <tr
      onClick={() => onClick(stock)}
      className="cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-[#161B22] group"
    >
      <td className="px-6 py-5">
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors uppercase leading-none">{stock.ticker}</span>
      </td>
      <td className="px-6 py-5">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
          {stock.inputs.sector}
        </span>
      </td>
      <td className="px-6 py-5 font-bold text-[13px] text-slate-600 dark:text-slate-400">{money(price)}</td>
      <td className="px-6 py-5 font-bold text-[13px] text-emerald-500 dark:text-[#22C55E]">{money(stock.valuation.intrinsic_value_per_share)}</td>
      <td className="px-6 py-5 font-bold text-[13px] text-emerald-500 dark:text-[#22C55E]">
        +{ (up * 100).toFixed(1)}%
      </td>
      <td className="px-6 py-5 font-bold text-[13px] text-slate-600 dark:text-slate-400">
        {(stock.quality_metrics.fcf_yield * 100).toFixed(1)}%
      </td>
      <td className="px-6 py-5">
        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#1C2433] border border-slate-200 dark:border-[#2D3748] font-bold text-[10px] text-blue-600 dark:text-indigo-400">
          {(stock.score * 100).toFixed(0)}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="w-24">
          <ScenarioTrack stock={stock} compact darkMode={darkMode} />
        </div>
      </td>
    </tr>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ stock, onClose, darkMode }) {
  const [loading, setLoading] = useState(false);

  if (!stock) return null;
  const up  = upside(stock);
  const tag = SECTOR_TAGS[stock.inputs.sector] || { bg:"#F3F4F6", text:"#374151" };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await fetchAnalysis(stock.ticker);
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
                {su > 0 ? "+" : ""}{su}%
              </span>
            </div>
          );
        })}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
            <p className="text-xs text-blue-400 dark:text-blue-500 mb-1">Crecimiento usado</p>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{pctFmt(stock.assumptions.growth_used)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
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

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected]           = useState(null);
  const [isMobile, setIsMobile]           = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [view, setView]                   = useState(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table")); // "cards" | "table"
  const [sortBy, setSortBy]               = useState("score");
  const [showSortExtras, setShowSortExtras] = useState(false);
  const [filterValuation, setFilterVal]   = useState("All");
  const [filterSector, setFilterSector]   = useState("All");
  const [search, setSearch]               = useState("");
  const [showAll, setShowAll]             = useState(false);
  const [darkMode, setDarkMode]           = useState(true);

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

  const sectors = ["All", ...Array.from(new Set(raw.map(d => d.inputs.sector))).sort()];

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
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-[#1F2937] bg-white dark:bg-[#0D1117]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">L</div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">AlphaQuant Terminal</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400">Dashboard</a>
            <a href="#" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">Portfolio</a>
            <a href="#" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">Alerts</a>
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
          <div key={i} className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
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
        
        {/* Top Conviction Picks */}
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-slate-200 dark:border-[#1F2937] p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Top Conviction Picks</h2>
          
          <div className="space-y-4 flex-1">
            {data.slice(0, 3).map((stock, i) => {
              const up = upside(stock);
              return (
                <div key={i} className="group p-4 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-transparent dark:border-[#1B2129] hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => setSelected(stock)}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{stock.ticker}</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium truncate w-32">{stock.inputs.sector}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-500">+{ (up * 100).toFixed(1)}%</span>
                      <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-wider">Bull Case</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#1F2937]">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              <span>Portfolio Diversification</span>
              <span>82% Target met</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1F2937] rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: "82%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MARKET COVERAGE ── */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" 
          style={{ background: darkMode ? '#0D1117' : '#fff' }}>
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Market Coverage & Valuations</h2>
            <div className="flex items-center gap-3">
              <div className="relative h-9">
                <input
                  type="text"
                  placeholder="Search ticker..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500/50 text-slate-800 dark:text-slate-100 transition-colors"
                />
                <div className="absolute left-3 top-2.5 text-slate-500">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
              </div>
              <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-slate-200 dark:border-slate-700"
                style={{ background: darkMode ? '#1F2937' : '#F1F5F9' }}>
                Export CSV
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider border border-blue-700 shadow-sm shadow-blue-500/20">Add Ticker</button>
            </div>
          </div>
          
          <TableView data={data} onSelect={setSelected} darkMode={darkMode} showAll={showAll} />
          
          {!showAll && data.length > 5 && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-[#0D1117] border-t border-slate-100 dark:border-slate-800 flex justify-center transition-colors"
               style={{ background: darkMode ? '#0D1117' : '#F8FAFC' }}>
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

      {/* ── CONTEXTUAL INTELLIGENCE FLAGS ── */}
      <ContextualFlags data={data} darkMode={darkMode} />

      <Modal stock={selected} onClose={() => setSelected(null)} darkMode={darkMode}/>
    </div>
  );
}

// ─── Strategic Map Component ─────────────────────────────────────────────────────
function StrategicMap({ data, darkMode }) {
  const [hoveredStock, setHoveredStock] = useState(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Calculate metrics for each stock
  const mapData = data.map(stock => ({
    ticker: stock.ticker,
    mos: (stock.valuation.margin_of_safety * 100),
    roic: (stock.quality_metrics.roic * 100),
    score: stock.score,
    category: categorizeStock(stock)
  }));
  
  function categorizeStock(stock) {
    const mos = stock.valuation.margin_of_safety;
    const roic = stock.quality_metrics.roic;
    
    if (mos > 0.3 && roic > 0.20) return 'core-buy';
    if (mos > 0.50) return 'valor-defensivo';
    if (roic > 0.25) return 'calidad-cara';
    return 'neutral';
  }
  
  const categoryColors = {
    'core-buy': '#22C55E',
    'valor-defensivo': '#3B82F6',
    'calidad-cara': '#EF4444',
    'neutral': '#94A3B8'
  };
  
  const categoryLabels = {
    'core-buy': 'Core Buy',
    'valor-defensivo': 'Defensivo',
    'calidad-cara': 'Calidad Cara',
    'neutral': 'Neutral'
  };
  
  // Chart dimensions
  const chartWidth = dimensions.width || 800;
  const chartHeight = 420;
  const padding = { top: 40, right: 50, bottom: 60, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  
  // Scales
  const xMin = -75, xMax = 225;
  const yMin = 0, yMax = 60;
  
  const xScale = (val) => padding.left + ((val - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (val) => padding.top + plotHeight - ((val - yMin) / (yMax - yMin)) * plotHeight;
  
  // Reference lines positions
  const xZero = xScale(0);
  const yROI = yScale(22); // ROI threshold
  const xMOS30 = xScale(30); // MOS 30% threshold
  
  // Quadrant coordinates
  const rightX = xScale(xMax);
  const leftX = xScale(xMin);
  const topY = yScale(yMax);
  const bottomY = yScale(yMin);
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white dark:bg-[#0D1117] rounded-2xl p-6 transition-colors border border-slate-200 dark:border-slate-800"
        style={{ background: darkMode ? '#0D1117' : '#fff' }}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Mapa Estratégico (Radar)</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              ROIC vs Margen de Seguridad • Tamaño = Score
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[key] }}></div>
                <span className="text-gray-500 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chart */}
        <div ref={containerRef} className="relative" style={{ height: `${chartHeight}px` }}>
          <svg width={chartWidth} height={chartHeight} className="absolute inset-0" >
            <defs>
              <filter id="bubbleBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Quadrant backgrounds */}
            {/* Core Buy: High ROIC (>22), High MOS (>30) - Top Right */}
            <rect 
              x={xMOS30} y={topY} 
              width={rightX - xMOS30} height={yROI - topY}
              fill="rgba(34, 197, 94, 0.06)" 
            />
            {/* Valor Defensivo: High MOS (>30), Low ROIC - Bottom Right */}
            <rect 
              x={xMOS30} y={yROI} 
              width={rightX - xMOS30} height={bottomY - yROI}
              fill="rgba(59, 130, 246, 0.06)" 
            />
            {/* Calidad Cara: High ROIC (>22), Low MOS - Top Left */}
            <rect 
              x={leftX} y={topY} 
              width={xMOS30 - leftX} height={yROI - topY}
              fill="rgba(239, 68, 68, 0.06)" 
            />
            {/* Neutral: Low ROIC, Low MOS - Bottom Left */}
            <rect 
              x={leftX} y={yROI} 
              width={xMOS30 - leftX} height={bottomY - yROI}
              fill="rgba(148, 163, 184, 0.04)" 
            />
            
            {/* Grid lines */}
            {[0, 15, 30, 45, 60].map(y => (
              <line key={`y-${y}`} x1={padding.left} y1={yScale(y)} x2={chartWidth - padding.right} y2={yScale(y)} stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
            ))}
            {[-75, -37.5, 0, 37.5, 75, 112.5, 150, 187.5, 225].map(x => (
              <line key={`x-${x}`} x1={xScale(x)} y1={padding.top} x2={xScale(x)} y2={chartHeight - padding.bottom} stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
            ))}
            
            {/* Reference lines - solid and more prominent */}
            <line x1={xMOS30} y1={padding.top} x2={xMOS30} y2={chartHeight - padding.bottom} stroke="var(--chart-text)" strokeWidth="1.5" strokeDasharray="5,5" opacity="0.3" />
            <line x1={padding.left} y1={yROI} x2={chartWidth - padding.right} y2={yROI} stroke="var(--chart-text)" strokeWidth="1.5" strokeDasharray="5,5" opacity="0.3" />
            
            {/* Reference labels */}
            <text x={xMOS30} y={padding.top - 8} textAnchor="middle" fill="var(--chart-text)" fontSize="9" fontWeight="500">MOS 30%</text>
            <text x={chartWidth - padding.right + 8} y={yROI + 3} textAnchor="start" fill="var(--chart-text)" fontSize="9" fontWeight="500">ROI 22%</text>
            
            {/* Axes labels */}
            <text x={chartWidth / 2} y={chartHeight - 10} textAnchor="middle" fill="var(--chart-text)" fontSize="10" fontWeight="500">VALOR (MOS %)</text>
            <text x={18} y={chartHeight / 2} textAnchor="middle" fill="var(--chart-text)" fontSize="10" fontWeight="500" transform={`rotate(-90, 18, ${chartHeight / 2})`}>CALIDAD (ROIC %)</text>
            
            {/* X-axis labels */}
            {[-75, 0, 75, 150, 225].map(x => (
              <text key={`xlabel-${x}`} x={xScale(x)} y={chartHeight - padding.bottom + 14} textAnchor="middle" fill="var(--chart-text)" fontSize="9">{x}%</text>
            ))}
            
            {/* Y-axis labels */}
            {[0, 15, 30, 45, 60].map(y => (
              <text key={`ylabel-${y}`} x={padding.left - 6} y={yScale(y) + 3} textAnchor="end" fill="var(--chart-text)" fontSize="9">{y}%</text>
            ))}
            
            {/* Data points */}
            {mapData.map((point) => {
              const isHovered = hoveredStock === point.ticker;
              const x = xScale(point.mos);
              const y = yScale(point.roic);
              const baseRadius = Math.max(6, point.score * 26); // tamaño basado en score
              const radius = isHovered ? baseRadius + 6 : baseRadius;
              const color = categoryColors[point.category];

              return (
                <g key={point.ticker}>
                  {/* Glow effect on hover */}
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 8}
                      fill={color}
                      opacity="0.18"
                    />
                  )}
                  {/* Main circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={color}
                    fillOpacity={0.9}
                    stroke="white"
                    strokeWidth={isHovered ? 3 : 2}
                    className="cursor-pointer transition-all duration-200"
                    style={{ filter: 'drop-shadow(0 3px 12px rgba(15, 23, 42, 0.25))', backdropFilter: 'blur(1px)', mixBlendMode: 'multiply' }}
                    onMouseEnter={() => setHoveredStock(point.ticker)}
                    onMouseLeave={() => setHoveredStock(null)}
                  />
                  {/* Small inner highlight circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.max(1.5, radius * 0.3)}
                    fill="#ffffff"
                    fillOpacity={isHovered ? 0.6 : 0.35}
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Ticker labels */}
          {mapData.map((point) => {
            const x = xScale(point.mos);
            const y = yScale(point.roic);
            const radius = 4 + (point.score * 5);
            
            return (
              <div
                key={`label-${point.ticker}`}
                className="absolute text-[10px] font-bold text-gray-700 dark:text-slate-300 pointer-events-none"
                style={{
                  left: `${x}px`,
                  top: `${y - radius - 6}px`,
                  transform: 'translateX(-50%)',
                  textShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.9)',
                  opacity: hoveredStock && hoveredStock !== point.ticker ? 0.4 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {point.ticker}
              </div>
            );
          })}
          
          {/* Enhanced Tooltip */}
          {hoveredStock && (() => {
            const point = mapData.find(p => p.ticker === hoveredStock);
            if (!point) return null;
            
            const x = xScale(point.mos);
            const y = yScale(point.roic);
            const isRightSide = x > chartWidth / 2;
            
            return (
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  left: isRightSide ? `${x - 180}px` : `${x + 15}px`,
                  top: `${Math.max(10, Math.min(y - 50, chartHeight - 120))}px`,
                  width: '170px'
                }}
              >
                <div 
                  className="rounded-xl p-3 shadow-xl border"
                  style={{ 
                    background: 'rgba(30, 41, 59, 0.98)', 
                    borderColor: categoryColors[point.category],
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{point.ticker}</span>
                    <span 
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ 
                        background: `${categoryColors[point.category]}30`,
                        color: categoryColors[point.category]
                      }}
                    >
                      {categoryLabels[point.category]}
                    </span>
                  </div>
                  
                  {/* Stats */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-gray-400">Score</span>
                      <span className="text-[11px] font-mono text-white">{(point.score * 10).toFixed(0)}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-gray-400">ROIC</span>
                      <span className="text-[11px] font-mono text-white">{point.roic.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-gray-400">MOS</span>
                      <span 
                        className="text-[11px] font-mono"
                        style={{ color: point.mos > 0 ? '#22C55E' : '#EF4444' }}
                      >
                        {point.mos > 0 ? '+' : ''}{point.mos.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Contextual Flags Component ──────────────────────────────────────────────
function ContextualFlags({ data, darkMode }) {
  // Helper to get tickers matching criteria
  const getTickers = (criteria) => data.filter(criteria).map(d => d.ticker);
  
  // Define all flags with their logic
  const flags = [
    {
      id: "quality-yielders",
      icon: "💎",
      title: "Quality Yielders",
      status: "ON",
      statusColor: "#10B981",
      bgColor: "#F0FDF4",
      borderColor: "#86EFAC",
      description: "Cluster de calidad (ROIC > 15%) con FCF Yield > 5%. Valor tangible, no especulativo.",
      tickers: getTickers(d => d.quality_metrics.roic > 0.15 && d.quality_metrics.fcf_yield > 0.05)
    },
    {
      id: "fcf-normalization",
      icon: "⚡",
      title: "FCF Normalization",
      status: "ACTIVE",
      statusColor: "#F59E0B",
      bgColor: "#FFFBEB",
      borderColor: "#FCD34D",
      description: "El modelo castigo los picos de crecimiento. No somos ingenuos con outliers de FCF.",
      tickers: getTickers(d => d.assumptions.growth_regime === "HYPER_GROWTH")
    },
    {
      id: "debt-fcf",
      icon: "🛡️",
      title: "Debt vs. FCF",
      status: "SAFE",
      statusColor: "#0EA5E9",
      bgColor: "#F0F9FF",
      borderColor: "#7DD3FC",
      description: "Empresas con deuda manejable y flujo de caja suficiente. Sin alarmas de solvencia.",
      tickers: getTickers(d => d.quality_metrics.debt_to_fcf < 3)
    },
    {
      id: "hyper-growth",
      icon: "🚀",
      title: "Hyper Growth",
      status: "HYPER",
      statusColor: "#8B5CF6",
      bgColor: "#F5F3FF",
      borderColor: "#C4B5FD",
      description: "Regimen de crecimiento acelerado detectado. Mas potencial, mayor incertidumbre.",
      tickers: getTickers(d => d.assumptions.growth_regime === "HYPER_GROWTH")
    },
    {
      id: "sector-capped",
      icon: "⚠️",
      title: "Sector Capped",
      status: "WATCH",
      statusColor: "#EF4444",
      bgColor: "#FEF2F2",
      borderColor: "#FCA5A5",
      description: "Crecimiento historico capado por el sector. Upside limitado por restricciones macro.",
      tickers: getTickers(d => ["Consumer Defensive", "Utilities"].includes(d.inputs.sector))
    },
    {
      id: "fcf-stability",
      icon: "📊",
      title: "FCF Stability",
      status: "STABLE",
      statusColor: "#06B6D4",
      bgColor: "#ECFEFF",
      borderColor: "#67E8F9",
      description: "Alta estabilidad de flujo libre de caja. Predecibilidad alta, ideal como ancla de portfolio.",
      tickers: getTickers(d => d.data_quality?.confidence_score > 0.8 || d.score > 0.7)
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Inteligencia Contextual</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Flags de Segundo Orden</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flags.map((flag) => (
          <div
            key={flag.id}
            className="rounded-xl p-5 transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-800"
            style={{
              background: darkMode ? (flag.bgColor.includes('FDF') ? '#064e3b33' : flag.bgColor.includes('FBE') ? '#78350f33' : flag.bgColor.includes('F9F') ? '#0c4a6e33' : flag.bgColor.includes('F3F') ? '#581c8733' : '#1e293b') : flag.bgColor,
              borderLeft: `4px solid ${flag.borderColor}`,
              border: `1px solid ${darkMode ? '#334155' : flag.borderColor}`
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{flag.icon}</span>
                <h3 className="font-bold text-gray-900 dark:text-slate-100">{flag.title}</h3>
              </div>
              <span
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  backgroundColor: flag.statusColor,
                  color: "#fff"
                }}
              >
                {flag.status}
              </span>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
              {flag.description}
            </p>
            
            {/* Tickers */}
            {flag.tickers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {flag.tickers.slice(0, 6).map(ticker => (
                  <span
                    key={ticker}
                    className="text-xs font-medium px-2 py-1 rounded-md"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.6)",
                      color: "#374151",
                      border: "1px solid rgba(0,0,0,0.1)"
                    }}
                  >
                    {ticker}
                  </span>
                ))}
                {flag.tickers.length > 6 && (
                  <span className="text-xs text-gray-500 px-1 py-1">+{flag.tickers.length - 6}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
