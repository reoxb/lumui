interface ScenarioTrackProps {
  stock: any;
  compact?: boolean;
}

export function ScenarioTrack({ stock, compact = false }: ScenarioTrackProps) {
  const price = stock.inputs.price;
  const { bear_value, intrinsic_value_per_share: base, bull_value } = stock.valuation;
  const minV = Math.min(price, bear_value, base, bull_value);
  const maxV = Math.max(price, bear_value, base, bull_value);
  const range = maxV - minV || 1;
  const pct = (v: number) => ((v - minV) / range) * 100;

  if (compact) {
    return (
      <div className="relative h-4 w-full flex items-center">
        <div className="h-0.5 w-full rounded-full" style={{ background: 'var(--chart-grid)' }} />
        <div className="absolute h-0.5 bg-blue-500/50 rounded-full" style={{ left: `${pct(bear_value)}%`, width: `${pct(bull_value) - pct(bear_value)}%` }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-rose-400 border" style={{ borderColor: 'var(--surface)', left: `${pct(bear_value)}%`, transform: 'translateX(-50%)' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white border border-blue-500" style={{ left: `${pct(base)}%`, transform: 'translateX(-50%)' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 border" style={{ borderColor: 'var(--surface)', left: `${pct(bull_value)}%`, transform: 'translateX(-50%)' }} />
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
