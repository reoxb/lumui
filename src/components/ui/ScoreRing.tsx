interface ScoreRingProps {
  score: number;
  darkMode: boolean;
}

export function ScoreRing({ score, darkMode }: ScoreRingProps) {
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
