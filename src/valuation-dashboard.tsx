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
  "Technology":             { bg:"#EFF6FF", text:"#1D4ED8" },
  "Consumer Cyclical":      { bg:"#FFF7ED", text:"#C2410C" },
  "Consumer Defensive":     { bg:"#F0FDF4", text:"#15803D" },
  "Healthcare":             { bg:"#FDF4FF", text:"#7E22CE" },
  "Industrials":            { bg:"#FFFBEB", text:"#B45309" },
  "Communication Services": { bg:"#F0F9FF", text:"#0369A1" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconGrid     = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const IconTable    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>;
const IconAnalyze  = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
const IconSpinner  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:"spin 1s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;

// ─── Scenario Asymmetry Chart ─────────────────────────────────────────────────────
function ScenarioAsymmetryChart({ data }) {
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
    const bullDistance = stock.scenario_analysis.intrinsic_high - stock.inputs.price;
    const bearDistance = stock.scenario_analysis.intrinsic_low - stock.inputs.price;
    
    return {
      ticker: stock.ticker,
      bullUpside: bullDistance,
      bearDownside: bearDistance,
    };
  });

  const maxDistance = Math.max(
    ...chartData.map(d => Math.abs(d.bullUpside)),
    ...chartData.map(d => Math.abs(d.bearDownside))
  );
  
  const chartHeight = 320;
  const chartWidth = containerWidth || 800;
  const padding = { top: 20, right: 20, bottom: 50, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const barWidth = Math.max(24, Math.min(40, plotWidth / chartData.length - 4));
  
  // Scale functions
  const yScale = (val) => {
    const ratio = (val + maxDistance) / (maxDistance * 2);
    return padding.top + plotHeight - (ratio * plotHeight);
  };
  
  const zeroY = yScale(0);
  
  return (
    <div className="bg-white rounded-2xl p-6 mt-6" style={{ border: "1px solid #E5E7EB" }}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Asimetria de Escenarios</h3>
        <p className="text-sm text-gray-500 mt-1">Perfil de riesgo/recompensa: Distancia desde precio actual</p>
      </div>
      
      {/* Chart */}
      <div ref={containerRef} className="relative" style={{ height: `${chartHeight}px` }}>
        <svg width={chartWidth} height={chartHeight} className="absolute inset-0">
          {/* Grid lines - horizontal */}
          {[2300, 1150, 0, -1150, -2300].map(val => (
            <line 
              key={`grid-${val}`} 
              x1={padding.left} 
              y1={yScale(val)} 
              x2={chartWidth - padding.right} 
              y2={yScale(val)} 
              stroke="#E5E7EB" 
              strokeWidth="1" 
              strokeDasharray="2,2" 
            />
          ))}
          
          {/* Grid lines - vertical */}
          {chartData.map((item, index) => {
            const x = padding.left + (index * (plotWidth / chartData.length)) + (plotWidth / chartData.length / 2);
            return (
              <line 
                key={`vgrid-${item.ticker}`} 
                x1={x} 
                y1={padding.top} 
                x2={x} 
                y2={chartHeight - padding.bottom} 
                stroke="#F3F4F6" 
                strokeWidth="1" 
              />
            );
          })}
          
          {/* Zero line - bold black */}
          <line 
            x1={padding.left} 
            y1={zeroY} 
            x2={chartWidth - padding.right} 
            y2={zeroY} 
            stroke="#374151" 
            strokeWidth="2" 
          />
          
          {/* Y-axis labels */}
          <text x={padding.left - 10} y={yScale(2300) + 4} textAnchor="end" fill="#6B7280" fontSize="10">2300</text>
          <text x={padding.left - 10} y={yScale(1150) + 4} textAnchor="end" fill="#6B7280" fontSize="10">1150</text>
          <text x={padding.left - 10} y={zeroY + 4} textAnchor="end" fill="#6B7280" fontSize="10" fontWeight="500">0</text>
          <text x={padding.left - 10} y={yScale(-1150) + 4} textAnchor="end" fill="#6B7280" fontSize="10">-1150</text>
          <text x={padding.left - 10} y={yScale(-2300) + 4} textAnchor="end" fill="#6B7280" fontSize="10">-2300</text>
          
          {/* Y-axis title */}
          <text 
            x={15} 
            y={chartHeight / 2} 
            textAnchor="middle" 
            fill="#9CA3AF" 
            fontSize="11" 
            transform={`rotate(-90, 15, ${chartHeight / 2})`}
          >
            Distancia ($)
          </text>
          
          {/* Bars */}
          {chartData.map((item, index) => {
            const x = padding.left + (index * (plotWidth / chartData.length)) + (plotWidth / chartData.length / 2);
            const barHalfWidth = barWidth / 2;
            
            // Bull bar extends upward from zero
            const bullValue = Math.abs(item.bullUpside);
            const bullHeight = (bullValue / (maxDistance * 2)) * plotHeight;
            const bullY = zeroY - bullHeight;
            
            // Bear bar extends downward from zero
            const bearValue = Math.abs(item.bearDownside);
            const bearHeight = (bearValue / (maxDistance * 2)) * plotHeight;
            const bearY = zeroY;
            
            const isHovered = hoveredStock === item.ticker;
            
            return (
              <g key={item.ticker}>
                {/* Bull Upside Bar - always show if has value */}
                {bullValue > 0 && (
                  <rect
                    x={x - barHalfWidth}
                    y={bullY}
                    width={barWidth}
                    height={bullHeight}
                    fill="#22C55E"
                    rx="2"
                    className="cursor-pointer"
                    opacity={isHovered ? 0.8 : 1}
                    onMouseEnter={() => setHoveredStock(item.ticker)}
                    onMouseLeave={() => setHoveredStock(null)}
                  />
                )}
                
                {/* Bear Downside Bar - always show if has value */}
                {bearValue > 0 && (
                  <rect
                    x={x - barHalfWidth}
                    y={bearY}
                    width={barWidth}
                    height={bearHeight}
                    fill="#EF4444"
                    rx="2"
                    className="cursor-pointer"
                    opacity={isHovered ? 0.8 : 1}
                    onMouseEnter={() => setHoveredStock(item.ticker)}
                    onMouseLeave={() => setHoveredStock(null)}
                  />
                )}
              </g>
            );
          })}
        </svg>
        
        {/* X-axis labels - HTML for better control */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: `${padding.bottom}px`, paddingLeft: `${padding.left}px`, paddingRight: `${padding.right}px` }}>
          <div className="flex h-full items-end justify-around">
            {chartData.map((item) => (
              <div
                key={`label-${item.ticker}`}
                className="text-xs text-gray-600 text-center"
                style={{ 
                  width: `${barWidth}px`,
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'top center',
                  marginBottom: '5px'
                }}
              >
                {item.ticker}
              </div>
            ))}
          </div>
        </div>
        
        {/* Tooltip */}
        {hoveredStock && (() => {
          const item = chartData.find(d => d.ticker === hoveredStock);
          if (!item) return null;
          
          const index = chartData.indexOf(item);
          const x = padding.left + (index * (plotWidth / chartData.length)) + (plotWidth / chartData.length / 2);
          
          return (
            <div
              className="absolute bg-gray-900 text-white p-2 rounded-lg shadow-lg z-20 pointer-events-none text-xs"
              style={{
                left: `${x + 10}px`,
                top: '20px',
                transform: x > chartWidth / 2 ? 'translateX(-100%) translateX(-20px)' : 'translateX(0)'
              }}
            >
              <div className="font-bold mb-1">{item.ticker}</div>
              <div className="space-y-0.5 text-gray-300">
                <div className="text-green-400">Bull: +${item.bullUpside.toFixed(2)}</div>
                <div className="text-red-400">Bear: ${item.bearDownside.toFixed(2)}</div>
              </div>
            </div>
          );
        })()}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22C55E' }}></div>
          <span className="text-xs text-gray-600">Bull Upside</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#EF4444' }}></div>
          <span className="text-xs text-gray-600">Bear Downside</span>
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
function ScoreRing({ score }) {
  const r = 19, circ = 2 * Math.PI * r;
  const color = score >= 0.75 ? "#0EA5E9" : score >= 0.6 ? "#F59E0B" : "#EF4444";
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#E2E8F0" strokeWidth="4"/>
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
function ScenarioTrack({ stock, compact = false }) {
  const { intrinsic_low, intrinsic_mid, intrinsic_high } = stock.scenario_analysis;
  const price = stock.inputs.price;
  const min = Math.min(intrinsic_low, price) * 0.92;
  const max = Math.max(intrinsic_high, price) * 1.05;
  const toP = (v) => `${((v - min) / (max - min) * 100).toFixed(1)}%`;

  if (compact) {
    return (
      <div className="min-w-[200px]">
        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
          <span>Bear</span><span>Base</span><span>Bull</span>
        </div>
        <div className="relative h-4">
          <div className="absolute top-1.5 left-0 right-0 h-1 rounded-full bg-slate-200" />
          <div
            className="absolute top-1.5 h-1 rounded-full"
            style={{
              left: toP(intrinsic_low),
              width: `${((intrinsic_high - intrinsic_low) / (max - min) * 100).toFixed(1)}%`,
              background: "linear-gradient(90deg,#F43F5E,#3B82F6,#10B981)"
            }}
          />
          <div className="absolute top-0.5 w-0.5 h-3 rounded-full bg-slate-600" style={{ left: toP(price), transform:"translateX(-50%)" }}/>
        </div>
        <div className="flex justify-between text-[11px] mt-0.5 font-semibold text-slate-700">
          <span>{money(intrinsic_low)}</span>
          <span>{money(intrinsic_mid)}</span>
          <span>{money(intrinsic_high)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
        <span>Escenarios</span><span>Bear · Base · Bull</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-3 left-0 right-0 h-1.5 rounded-full bg-slate-100" />
        <div
          className="absolute top-3 h-1.5 rounded-full border border-sky-100"
          style={{
            left: toP(intrinsic_low),
            width: `${((intrinsic_high - intrinsic_low) / (max - min) * 100).toFixed(1)}%`,
            background: "linear-gradient(90deg,#F43F5E,#3B82F6,#10B981)"
          }}
        />
        <div className="absolute top-1.5 w-1 h-4 rounded-sm bg-rose-500"  style={{ left: toP(intrinsic_low),  transform:"translateX(-50%)" }}/>
        <div className="absolute top-1.5 w-1 h-4 rounded-sm bg-sky-500"   style={{ left: toP(intrinsic_mid),  transform:"translateX(-50%)" }}/>
        <div className="absolute top-1.5 w-1 h-4 rounded-sm bg-emerald-500"style={{ left: toP(intrinsic_high), transform:"translateX(-50%)" }}/>
        <div className="absolute top-1 w-0.5 h-5 rounded-full bg-slate-700" style={{ left: toP(price), transform:"translateX(-50%)" }}/>
      </div>
      <div className="flex justify-between text-[12px] mt-1 font-semibold">
        <span className="text-rose-500">{money(intrinsic_low)}</span>
        <span className="text-sky-600">{money(intrinsic_mid)}</span>
        <span className="text-emerald-600">{money(intrinsic_high)}</span>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ stock, onClick }) {
  const up  = upside(stock);
  const tag = SECTOR_TAGS[stock.inputs.sector] || { bg:"#F3F4F6", text:"#374151" };
  return (
    <div onClick={() => onClick(stock)}
      className="bg-white rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ border:"1px solid #E5E7EB" }}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">{stock.ticker}</span>
            {stock.assumptions.growth_regime === "HYPER_GROWTH" && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">HG</span>
            )}
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background:tag.bg, color:tag.text }}>{stock.inputs.sector}</span>
        </div>
        <ScoreRing score={stock.score}/>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl p-3 border border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 mb-1">Precio</p>
          <p className="text-base font-semibold text-slate-900">{money(stock.inputs.price)}</p>
        </div>
        <div className="rounded-xl p-3 border border-sky-100" style={{ background: up > 0 ? "#F0F9FF" : "#FFF1F2" }}>
          <p className="text-xs mb-1" style={{ color: up > 0 ? "#0EA5E9" : "#EF4444" }}>Valor intrínseco</p>
          <p className="text-base font-semibold" style={{ color: up > 0 ? "#0F172A" : "#B91C1C" }}>
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
          ROIC <span className="font-semibold text-slate-700">{pctFmt(stock.quality_metrics.roic)}</span>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-slate-100 mb-3">
        <div className="h-1.5 rounded-full" style={{ width:`${Math.min(stock.quality_metrics.roic*200,100)}%`, background:"linear-gradient(90deg,#F472B6,#A78BFA,#38BDF8)" }}/>
      </div>

      <ScenarioTrack stock={stock}/>
    </div>
  );
}

// ─── Table View Component (with truncation) ───────────────────────────────────
function TableView({ data, onSelect }) {
  const [showAll, setShowAll] = useState(false);
  const displayData = showAll ? data : data.slice(0, 5);
  const hasMore = data.length > 5;
  
  // Column background colors (Intrínseco = blue, Upside = green)
  const colBgColors = [
    null,           // Ticker
    null,           // Sector  
    null,           // Precio
    '#EFF6FF',      // Intrínseco - blue light
    '#F0FDF4',      // Upside - green light
    null,           // FCF Yield
    null,           // Score
    null,           // Escenarios
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border:"1px solid #E5E7EB" }}>
        <table className="w-full">
          <thead>
            <tr>
              {["Ticker","Sector","Precio","Intrínseco","Upside","FCF Yield","Score","Escenarios"].map((h, i) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide"
                  style={{ 
                    color:"#64748B", 
                    background: colBgColors[i] || '#F8FAFC',
                    borderBottom:"1px solid #E2E8F0"
                  }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((stock, i) => (
              <TableRow 
                key={stock.ticker} 
                stock={stock} 
                onClick={onSelect} 
                idx={i}
                colBgColors={colBgColors}
              />
            ))}
          </tbody>
        </table>
        
        {/* Show More Button */}
        {hasMore && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-blue-50"
            >
              {showAll ? (
                <>Ver menos <span className="text-lg leading-none">▲</span></>
              ) : (
                <>Ver todos ({data.length} stocks) <span className="text-lg leading-none">▼</span></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────
function TableRow({ stock, onClick, idx, colBgColors = [] }) {
  const up  = upside(stock);
  const tag = SECTOR_TAGS[stock.inputs.sector] || { bg:"#F3F4F6", text:"#374151" };
  
  const cellBgs = colBgColors.map(bg => bg ? { background: bg } : {});
  
  return (
    <tr
      onClick={() => onClick(stock)}
      className="cursor-pointer transition-colors hover:bg-sky-50"
      style={{ background: idx % 2 === 0 ? "#fff" : "#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
      <td className="px-4 py-3" style={cellBgs[0]}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">{stock.ticker}</span>
          {stock.assumptions.growth_regime === "HYPER_GROWTH" && (
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">HG</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3" style={cellBgs[1]}>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background:tag.bg, color:tag.text }}>
          {stock.inputs.sector}
        </span>
      </td>
      <td className="px-4 py-3 font-semibold text-slate-800" style={cellBgs[2]}>{money(stock.inputs.price)}</td>
      <td className="px-4 py-3 font-semibold" style={{ ...cellBgs[3], color: up > 0 ? "#0EA5E9" : "#DC2626" }}>
        {money(stock.valuation.intrinsic_value_per_share)}
      </td>
      <td className="px-4 py-3" style={cellBgs[4]}>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Δ</span>
          <span className="font-semibold text-sm" style={{ color: up > 0 ? "#0F9F6E" : "#B91C1C" }}>
            {up > 0 ? "+" : ""}{(up * 100).toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3 font-semibold text-slate-700" style={cellBgs[5]}>
        {pctFmt(stock.quality_metrics.fcf_yield)}
      </td>
      <td className="px-4 py-3" style={cellBgs[6]}>
        <span
          className="font-bold text-sm"
          style={{ color: stock.score >= 0.75 ? "#0EA5E9" : stock.score >= 0.6 ? "#F59E0B" : "#EF4444" }}>
          {(stock.score * 10).toFixed(1)}
        </span>
      </td>
      <td className="px-4 py-3 align-top" style={cellBgs[7]}>
        <ScenarioTrack stock={stock} compact />
      </td>
    </tr>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ stock, onClose }) {
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
      style={{ background:"rgba(15,23,42,0.35)", backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl"
        style={{ border:"1px solid #E5E7EB" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-2xl font-bold text-gray-900">{stock.ticker}</h2>
              {stock.assumptions.growth_regime === "HYPER_GROWTH" && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">HYPER GROWTH</span>
              )}
            </div>
            <span className="text-sm font-medium px-2.5 py-1 rounded-full" style={{ background:tag.bg, color:tag.text }}>{stock.inputs.sector}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label:"Precio",           value:money(stock.inputs.price),                               color:"#374151" },
            { label:"Valor Intrínseco", value:money(stock.valuation.intrinsic_value_per_share),        color: up>0?"#1D4ED8":"#DC2626" },
            { label:"Upside",           value:`${up>0?"+":""}${(up*100).toFixed(1)}%`,                 color: up>0?"#15803D":"#DC2626" },
            { label:"ROIC",             value:pctFmt(stock.quality_metrics.roic),                      color:"#374151" },
            { label:"FCF Yield",        value:pctFmt(stock.quality_metrics.fcf_yield),                 color:"#374151" },
            { label:"Score",            value:`${(stock.score*10).toFixed(2)}/10`,                     color:"#1D4ED8" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 mb-3">
          <span className="text-xs text-gray-500 w-24 shrink-0">💰 Precio hoy</span>
          <div className="flex-1 h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-gray-400"
              style={{ width:`${Math.min((stock.inputs.price/stock.scenario_analysis.intrinsic_high)*100,100)}%` }}/>
          </div>
          <span className="text-xs font-bold w-16 text-right text-gray-600">{money(stock.inputs.price)}</span>
          <span className="text-xs w-14 text-right text-gray-400">—</span>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-3">Análisis de Escenarios</p>
        {[
          { label:"🐻 Pesimista", value:stock.scenario_analysis.intrinsic_low,  color:"#EF4444" },
          { label:"📊 Base",      value:stock.scenario_analysis.intrinsic_mid,  color:"#1D4ED8" },
          { label:"🚀 Optimista", value:stock.scenario_analysis.intrinsic_high, color:"#15803D" },
        ].map(({ label, value, color }) => {
          const w = Math.min((value / stock.scenario_analysis.intrinsic_high) * 100, 100);
          const su = ((value - stock.inputs.price) / stock.inputs.price * 100).toFixed(1);
          return (
            <div key={label} className="flex items-center gap-3 mb-2">
              <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full" style={{ width:`${w}%`, background:color, opacity:0.65 }}/>
              </div>
              <span className="text-xs font-bold w-16 text-right" style={{ color }}>{money(value)}</span>
              <span className="text-xs w-14 text-right" style={{ color: value > stock.inputs.price ? "#15803D" : "#DC2626" }}>
                {su > 0 ? "+" : ""}{su}%
              </span>
            </div>
          );
        })}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-400 mb-1">Crecimiento usado</p>
            <p className="text-sm font-bold text-blue-700">{pctFmt(stock.assumptions.growth_used)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-400 mb-1">WACC</p>
            <p className="text-sm font-bold text-blue-700">{pctFmt(stock.assumptions.wacc)}</p>
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
    <div className="min-h-screen" style={{ background:"#F8FAFC", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* ── TOP BAR: título a la izquierda, Resumen Estratégico a la derecha ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Izquierda: Título y subtítulo */}
          <div>
            <h1 className="text-xl font-bold text-slate-800">Finsano Radar</h1>
            <p className="text-sm text-slate-500 font-normal mt-1">Stock Valuation Analysis</p>
          </div>

          {/* Derecha: Card Resumen Estratégico */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 shrink-0">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[100px]">
                <p className="text-xs font-normal text-slate-500">Total Stocks</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{raw.length}</p>
              </div>
              <div className="min-w-[100px]">
                <p className="text-xs font-normal text-slate-500">MOS Promedio</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{pctFmt(raw.reduce((s, d) => s + d.valuation.margin_of_safety, 0) / raw.length)}</p>
              </div>
              <div className="min-w-[100px]">
                <p className="text-xs font-normal text-slate-500">ROIC Promedio</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{pctFmt(avgRoic)}</p>
              </div>
              <div className="min-w-[100px]">
                <p className="text-xs font-normal text-slate-500">Convicción Prom.</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{(raw.reduce((s, d) => s + d.score, 0) / raw.length * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ticker..."
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border:"1px solid #E5E7EB", width:150 }}/>
          </div>

          <div className="relative flex items-center gap-1 bg-gray-50 rounded-lg p-1" style={{ border:"1px solid #E2E7EB" }}>
            <span className="text-xs text-gray-400 px-2">Ordenar:</span>
            {[{ k:"score",l:"Score" },{ k:"upside",l:"Upside" }].map(({ k, l }) => (
              <button key={k} onClick={() => setSortBy(k)}
                className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                style={{ background: sortBy===k ? "#1D4ED8" : "transparent", color: sortBy===k ? "#fff" : "#6B7280" }}>
                {l}
              </button>
            ))}

            <button
              onClick={() => setShowSortExtras(prev => !prev)}
              className="px-2 py-1 rounded-md text-xs font-semibold transition-all"
              style={{ background: showSortExtras ? "#1D4ED8" : "transparent", color: showSortExtras ? "#fff" : "#6B7280" }}>
              ...
            </button>

            {showSortExtras && (
              <div className="absolute top-full mt-1 right-0 w-max bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-20">
                {[{ k:"roic", l:"ROIC" }, { k:"fcf", l:"FCF Yield" }].map(({ k, l }) => (
                  <button key={k} onClick={() => { setSortBy(k); setShowSortExtras(false); }}
                    className="block w-full text-left px-3 py-1 text-xs font-semibold rounded-md hover:bg-blue-50"
                    style={{ color: sortBy===k ? "#1D4ED8" : "#334155" }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1 bg-gray-50 rounded-lg p-1" style={{ border:"1px solid #E5E7EB" }}>
            {["All","Subvaloradas","Sobrevaloradas"].map(f => (
              <button key={f} onClick={() => setFilterVal(f)}
                className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                style={{ background: filterValuation===f ? (f==="Sobrevaloradas"?"#EF4444":"#1D4ED8") : "transparent", color: filterValuation===f ? "#fff" : "#6B7280" }}>
                {f==="All" ? "Todas" : f}
              </button>
            ))}
          </div>

          <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg outline-none"
            style={{ border:"1px solid #E5E7EB", background:"#F9FAFB", color:"#374151" }}>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-400">{data.length} resultados</span>
            <div className="flex gap-1 rounded-lg p-1 w-fit bg-slate-100 border border-slate-200">
              <button
                onClick={() => setView("cards")}
                title="Vista tarjetas"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: view === "cards" ? "#374151" : "transparent",
                  color: view === "cards" ? "#fff" : "#64748B"
                }}>
                <IconGrid /> Cards
              </button>
              <button
                onClick={() => setView("table")}
                title="Vista tabla"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{ background: view === "table" ? "#374151" : "transparent", color: view === "table" ? "#fff" : "#64748B" }}>
                <IconTable /> Tabla
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCENARIO ASYMMETRY CHART ── */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <ScenarioAsymmetryChart data={data} />
      </div>

      {/* ── CONTENT ── */}
      {view === "cards" ? (
        <>
          <div className="max-w-7xl mx-auto px-6 pt-4 pb-2 flex items-center gap-5 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="inline-block w-0.5 h-4 bg-gray-700 rounded"/>Precio actual</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-3 rounded-sm bg-red-400"/>Bear</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-3 rounded-sm bg-blue-500"/>Base</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-3 rounded-sm bg-green-500"/>Bull</span>
          </div>
          <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map(stock => <Card key={stock.ticker} stock={stock} onClick={setSelected}/>)}
          </div>
        </>
      ) : (
        <TableView data={data} onSelect={setSelected} />
      )}

      {/* ── STRATEGIC MAP ── */}
      <StrategicMap data={data} />

      {/* ── CONTEXTUAL INTELLIGENCE FLAGS ── */}
      <ContextualFlags data={data} />

      <Modal stock={selected} onClose={() => setSelected(null)}/>
    </div>
  );
}

// ─── Strategic Map Component ─────────────────────────────────────────────────────
function StrategicMap({ data }) {
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
      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mapa Estratégico (Radar)</h2>
            <p className="text-xs text-gray-500 mt-1">
              ROIC vs Margen de Seguridad • Tamaño = Score
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[key] }}></div>
                <span className="text-gray-600 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chart */}
        <div ref={containerRef} className="relative" style={{ height: `${chartHeight}px` }}>
          <svg width={chartWidth} height={chartHeight} className="absolute inset-0">
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
              <line key={`y-${y}`} x1={padding.left} y1={yScale(y)} x2={chartWidth - padding.right} y2={yScale(y)} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
            ))}
            {[-75, -37.5, 0, 37.5, 75, 112.5, 150, 187.5, 225].map(x => (
              <line key={`x-${x}`} x1={xScale(x)} y1={padding.top} x2={xScale(x)} y2={chartHeight - padding.bottom} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
            ))}
            
            {/* Reference lines - solid and more prominent */}
            <line x1={xMOS30} y1={padding.top} x2={xMOS30} y2={chartHeight - padding.bottom} stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="5,5" />
            <line x1={padding.left} y1={yROI} x2={chartWidth - padding.right} y2={yROI} stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="5,5" />
            
            {/* Reference labels */}
            <text x={xMOS30} y={padding.top - 8} textAnchor="middle" fill="#6B7280" fontSize="9" fontWeight="500">MOS 30%</text>
            <text x={chartWidth - padding.right + 8} y={yROI + 3} textAnchor="start" fill="#6B7280" fontSize="9" fontWeight="500">ROI 22%</text>
            
            {/* Axes labels */}
            <text x={chartWidth / 2} y={chartHeight - 10} textAnchor="middle" fill="#6B7280" fontSize="10" fontWeight="500">VALOR (MOS %)</text>
            <text x={18} y={chartHeight / 2} textAnchor="middle" fill="#6B7280" fontSize="10" fontWeight="500" transform={`rotate(-90, 18, ${chartHeight / 2})`}>CALIDAD (ROIC %)</text>
            
            {/* X-axis labels */}
            {[-75, 0, 75, 150, 225].map(x => (
              <text key={`xlabel-${x}`} x={xScale(x)} y={chartHeight - padding.bottom + 14} textAnchor="middle" fill="#6B7280" fontSize="9">{x}%</text>
            ))}
            
            {/* Y-axis labels */}
            {[0, 15, 30, 45, 60].map(y => (
              <text key={`ylabel-${y}`} x={padding.left - 6} y={yScale(y) + 3} textAnchor="end" fill="#6B7280" fontSize="9">{y}%</text>
            ))}
            
            {/* Data points */}
            {mapData.map((point) => {
              const isHovered = hoveredStock === point.ticker;
              const x = xScale(point.mos);
              const y = yScale(point.roic);
              const radius = 4 + (point.score * 5);
              
              return (
                <g key={point.ticker}>
                  {/* Glow effect on hover */}
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 6}
                      fill={categoryColors[point.category]}
                      opacity="0.2"
                    />
                  )}
                  {/* Main circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? radius + 2 : radius}
                    fill={categoryColors[point.category]}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
                    onMouseEnter={() => setHoveredStock(point.ticker)}
                    onMouseLeave={() => setHoveredStock(null)}
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
                className="absolute text-[10px] font-bold text-gray-700 pointer-events-none"
                style={{
                  left: `${x}px`,
                  top: `${y - radius - 6}px`,
                  transform: 'translateX(-50%)',
                  textShadow: '0 1px 2px rgba(255,255,255,0.9)',
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
function ContextualFlags({ data }) {
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
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Inteligencia Contextual</p>
        <h2 className="text-xl font-bold text-gray-900">Flags de Segundo Orden</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flags.map((flag) => (
          <div
            key={flag.id}
            className="rounded-xl p-5 transition-all duration-200 hover:shadow-md"
            style={{
              background: flag.bgColor,
              borderLeft: `4px solid ${flag.borderColor}`,
              border: `1px solid ${flag.borderColor}`
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{flag.icon}</span>
                <h3 className="font-bold text-gray-900">{flag.title}</h3>
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
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
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
