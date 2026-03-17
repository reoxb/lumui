import { SECTOR_TAGS } from "./constants";

export const pctFmt = (n: number) => `${(n * 100).toFixed(1)}%`;
export const money = (n: number) => n >= 1000 ? `$${n.toFixed(0)}` : `$${n.toFixed(2)}`;
export const upside = (d: any) => (d.valuation.intrinsic_value_per_share - d.inputs.price) / d.inputs.price;
export const billions = (n: number) => `$${(n / 1e9).toFixed(2)}B`;

export function openAnalysisPDF(data: any) {
  const a  = data.analysis;
  const cd = data.committee_decision;
  const ag = cd.agent_outputs;

  const decisionColor = cd.decision === "BUY" ? "#15803D" : cd.decision === "SELL" ? "#DC2626" : "#B45309";
  const decisionBg    = cd.decision === "BUY" ? "#F0FDF4" : cd.decision === "SELL" ? "#FFF1F2" : "#FFFBEB";
  const up = ((a.valuation.intrinsic_value_per_share - a.inputs.price) / a.inputs.price * 100).toFixed(1);
  const upColor = parseFloat(up) > 0 ? "#15803D" : "#DC2626";

  const scoreBar = (val: number, color = "#1D4ED8") =>
    `<div style="height:6px;border-radius:4px;background:#E5E7EB;margin-top:4px">
       <div style="height:6px;border-radius:4px;background:${color};width:${Math.min(val*100,100).toFixed(0)}%"></div>
     </div>`;

  const agentCard = (emoji: string, label: string, score: number, summary: string, extra = "") =>
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
        <div class="val" style="color:${parseFloat(up) > 0 ? '#1D4ED8' : '#DC2626'}">${money(a.valuation.intrinsic_value_per_share)}</div>
      </div>
      <div class="box">
        <div class="label">Upside / Downside</div>
        <div class="val" style="color:${upColor}">${parseFloat(up) > 0 ? '+' : ''}${up}%</div>
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
          const toP = (v: number) => ((v - min) / rng * 100).toFixed(1);
          return `
            <div style="position:absolute;top:0;height:10px;border-radius:6px;background:linear-gradient(90deg,#FCA5A5,#BFDBFE,#86EFAC);left:${toP(lo)}%;width:${(parseFloat(toP(hi)) - parseFloat(toP(lo))).toFixed(1)}%"></div>
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

export async function fetchAnalysis(ticker: string, mockData: any) {
  await new Promise(r => setTimeout(r, 1200)); // simulate network delay
  return { ...mockData, analysis: { ...mockData.analysis, ticker } };
}
