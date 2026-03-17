import { useState, useEffect, useRef } from "react";

interface ScenarioAsymmetryChartProps {
  data: any[];
  darkMode: boolean;
}

export function ScenarioAsymmetryChart({ data, darkMode }: ScenarioAsymmetryChartProps) {
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const yTicks = [maxDistance, maxDistance * 0.5, 0, -maxDistance * 0.5, -maxDistance];
  const yScale = (val: number) => {
    const ratio = (val + maxDistance) / (2 * maxDistance);
    return padding.top + plotHeight - ratio * plotHeight;
  };
  const zeroY = yScale(0);

  return (
    <div className="bg-white dark:bg-[#0D1117] rounded-2xl p-6 mt-6 transition-colors" 
      style={{ border: "1px solid var(--chart-grid)", background: darkMode ? '#0D1117' : '#fff' }}>
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Asimetria de Escenarios</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Perfil de riesgo/recompensa: Distancia desde precio actual</p>
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
                fill={darkMode ? "#94A3B8" : "#9CA3AF"}
                fontSize="9"
                fontWeight={val === 0 ? 600 : 400}
              >
                {(() => {
                  const abs = Math.abs(val);
                  let label = "";
                  if (abs >= 1e9) label = (val/1e9).toFixed(1) + "B";
                  else if (abs >= 1e6) label = (val/1e6).toFixed(1) + "M";
                  else if (abs >= 1e3) label = (val/1e3).toFixed(1) + "k";
                  else label = val.toFixed(0);
                  return val > 0 ? `+$${label}` : val < 0 ? `-$${label.replace('-','')}` : `$${label}`;
                })()}
              </text>
              {val === 0 && (
                <text
                  x={chartWidth - padding.right + 5}
                  y={yScale(val) - 5}
                  textAnchor="end"
                  fill={darkMode ? "#94A3B8" : "#9CA3AF"}
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
                className="absolute text-[10px] font-bold text-slate-500 dark:text-slate-300"
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
