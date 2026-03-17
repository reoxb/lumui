import { IconSeal, IconArrows, IconPercent, IconChart } from "../Icons";

interface SecondOrderFlagsProps {
  data: any[];
  darkMode: boolean;
}

export function SecondOrderFlags({ data, darkMode }: SecondOrderFlagsProps) {
  const getTickers = (criteria: (d: any) => boolean) => data.filter(criteria).map(d => d.ticker).slice(0, 6);
  
  const flags = [
    {
      id: "quality",
      icon: <IconSeal />,
      title: "Quality Yielders",
      status: "ON",
      color: "#10B981",
      tagColor: "#FFFFFF",
      description: "Cluster de calidad (ROIC > 15%) con FCF Yield > 5%. Valor tangible.",
      tickers: getTickers(d => d.quality_metrics.roic > 0.15 && d.quality_metrics.fcf_yield > 0.05)
    },
    {
      id: "fcf",
      icon: <IconArrows />,
      title: "FCF Normalization",
      status: "ACTIVE",
      color: "#F59E0B",
      tagColor: "#000000",
      description: "Actives de calidad redrimizar ari FCF normalization a...",
      tickers: getTickers(d => d.assumptions.growth_regime === "HYPER_GROWTH" || d.quality_metrics.fcf_yield > 0.08)
    },
    {
      id: "debt",
      icon: <IconPercent />,
      title: "Debt vs. FCF",
      status: "SAFE",
      color: "#0EA5E9",
      tagColor: "#FFFFFF",
      description: "Debt vs. hinamonseoclation; debt vs. FCF vs d...",
      tickers: getTickers(d => d.quality_metrics.debt_to_fcf < 2.5)
    },
    {
      id: "growth",
      icon: <IconChart />,
      title: "Hyper Growth",
      status: "HYPER",
      color: "#8B5CF6",
      tagColor: "#FFFFFF",
      description: "Fiuster de calidad (hyper growth) an tim: defe...",
      tickers: getTickers(d => d.assumptions.growth_regime === "HYPER_GROWTH")
    }
  ];

  return (
    <div className="flex flex-col h-full rounded-3xl p-6 border transition-all duration-300 shadow-sm"
      style={{ 
        background: darkMode ? '#0D1117' : '#FFFFFF', 
        borderColor: darkMode ? '#21262D' : '#E2E8F0' 
      }}>
      <div className="mb-6">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-80">Inteligencia Contextual</p>
        <h2 className="text-xl font-bold" style={{ color: darkMode ? '#F1F5F9' : '#1E293B' }}>Flags de Segundo Orden</h2>
      </div>
      
      <div className="space-y-3 overflow-y-auto pr-1">
        {flags.map((flag) => (
          <div key={flag.id} 
            className="p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01]"
            style={{ 
              background: darkMode ? '#161B22' : '#F8FAFC',
              borderColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9'
            }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg text-white shadow-sm" style={{ backgroundColor: flag.color }}>
                  {flag.icon}
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[13px]" style={{ color: darkMode ? '#F1F5F9' : '#334155' }}>{flag.title}</h3>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm" 
                    style={{ backgroundColor: flag.color, color: flag.tagColor }}>
                    {flag.status}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] mb-3 line-clamp-2 leading-relaxed opacity-70" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
              {flag.description}
            </p>
            
            <div className="flex flex-wrap gap-1.5">
              {flag.tickers.map(ticker => (
                <span key={ticker} 
                  className="text-[9px] font-bold px-2 py-1 rounded-md border transition-colors"
                  style={{ 
                    backgroundColor: darkMode ? '#21262D' : '#FFFFFF', 
                    color: darkMode ? '#CBD5E1' : '#475569',
                    borderColor: darkMode ? '#334155' : '#E2E8F0'
                  }}>
                  {ticker}
                </span>
              ))}
              <span className="text-[9px] font-bold px-2 py-1 rounded-md border"
                style={{ 
                  backgroundColor: darkMode ? '#21262D' : '#F1F5F9', 
                  color: darkMode ? '#64748B' : '#94A3B8',
                  borderColor: darkMode ? '#334155' : '#E2E8F0'
                }}>
                +12
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
