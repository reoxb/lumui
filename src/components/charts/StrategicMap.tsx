import { useState, useRef, useEffect } from "react";

interface StrategicMapProps {
  data: any[];
  darkMode: boolean;
}

export function StrategicMap({ data, darkMode }: StrategicMapProps) {
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  
  function categorizeStock(stock: any) {
    const mos = stock.valuation.margin_of_safety;
    const roic = stock.quality_metrics.roic;
    
    if (mos > 0.3 && roic > 0.20) return 'core-buy';
    if (mos > 0.50) return 'valor-defensivo';
    if (roic > 0.25) return 'calidad-cara';
    return 'neutral';
  }
  
  const categoryColors: Record<string, string> = {
    'core-buy': '#22C55E',
    'valor-defensivo': '#3B82F6',
    'calidad-cara': '#EF4444',
    'neutral': '#94A3B8'
  };
  
  const categoryLabels: Record<string, string> = {
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
  
  const xScale = (val: number) => padding.left + ((val - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (val: number) => padding.top + plotHeight - ((val - yMin) / (yMax - yMin)) * plotHeight;
  
  // Reference lines positions
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
            <h2 className="text-lg font-bold" 
              style={{ color: darkMode ? '#F1F5F9' : '#1E293B' }}>
              Mapa Estratégico (Radar)
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              ROIC vs Margen de Seguridad • Tamaño = Score
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[key] }}></div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{label}</span>
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
            <rect 
              x={xMOS30} y={topY} 
              width={rightX - xMOS30} height={yROI - topY}
              fill="rgba(34, 197, 94, 0.06)" 
            />
            <rect 
              x={xMOS30} y={yROI} 
              width={rightX - xMOS30} height={bottomY - yROI}
              fill="rgba(59, 130, 246, 0.06)" 
            />
            <rect 
              x={leftX} y={topY} 
              width={xMOS30 - leftX} height={yROI - topY}
              fill="rgba(239, 68, 68, 0.06)" 
            />
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
            
            {/* Reference lines */}
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
              const baseRadius = Math.max(6, point.score * 26);
              const radius = isHovered ? baseRadius + 6 : baseRadius;
              const color = categoryColors[point.category];

              return (
                <g key={point.ticker}>
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 8}
                      fill={color}
                      opacity="0.18"
                    />
                  )}
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
                  textShadow: darkMode ? '0 0 4px rgba(0,0,0,1)' : '0 1px 2px rgba(255,255,255,0.9)',
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
