import { money, upside } from "../../lib/utils";
import { ScenarioTrack } from "../ui/ScenarioTrack";

interface TableViewProps {
  data: any[];
  onSelect: (stock: any) => void;
  darkMode: boolean;
  showAll: boolean;
}

export function TableView({ data, onSelect, darkMode, showAll }: TableViewProps) {
  const displayData = showAll ? data : data.slice(0, 5);
  
  return (
    <div className="w-full">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--chart-grid)' }}>
            {["Ticker","Sector","Price","Intrinsic","Upside%","FCF Yield","Score","Scenario Range"].map((h) => (
              <th
                key={h}
                className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest bg-transparent transition-colors"
                style={{ color: 'var(--chart-text)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: 'var(--chart-grid)' }}>
          {displayData.map((stock, i) => (
            <TableRow 
              key={stock.ticker} 
              stock={stock} 
              onClick={onSelect} 
              darkMode={darkMode}
              idx={i}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({ stock, onClick, darkMode }: any) {
  const up = upside(stock);
  const price = stock.inputs.price;
  
  return (
    <tr
      onClick={() => onClick(stock)}
      className="cursor-pointer transition-all duration-200 group border-b last:border-0"
      style={{ 
        background: 'var(--surface)',
        borderColor: 'var(--chart-grid)'
      }}
    >
      <td className="px-6 py-5">
        <span className="text-sm font-bold transition-colors uppercase leading-none"
          style={{ color: darkMode ? '#F1F5F9' : '#0F172A' }}>
          {stock.ticker}
        </span>
      </td>
      <td className="px-6 py-5">
        <span className="text-[10px] font-bold uppercase tracking-tight"
          style={{ color: darkMode ? '#8B949E' : '#94A3B8' }}>
          {stock.inputs.sector}
        </span>
      </td>
      <td className="px-6 py-5 font-bold text-[13px]" 
        style={{ color: darkMode ? '#C9D1D9' : '#475569' }}>
        {money(price)}
      </td>
      <td className="px-6 py-5 font-bold text-[13px] text-emerald-500 dark:text-[#22C55E]">{money(stock.valuation.intrinsic_value_per_share)}</td>
      <td className="px-6 py-5 font-bold text-[13px] text-emerald-500 dark:text-[#22C55E]">
        +{ (up * 100).toFixed(1)}%
      </td>
      <td className="px-6 py-5 font-bold text-[13px]" 
        style={{ color: 'var(--chart-text)' }}>
        {(stock.quality_metrics.fcf_yield * 100).toFixed(1)}%
      </td>
      <td className="px-6 py-5">
        <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[10px] border"
          style={{ 
            background: darkMode ? '#1C2433' : '#F1F5F9',
            color: darkMode ? '#818CF8' : '#2563EB',
            borderColor: 'var(--chart-grid)'
          }}>
          {(stock.score * 100).toFixed(0)}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="w-24">
          <ScenarioTrack stock={stock} compact />
        </div>
      </td>
    </tr>
  );
}
