export interface SectorStyle {
  bg: string;
  bgDark: string;
  text: string;
  textDark: string;
}

export const SECTOR_TAGS: Record<string, SectorStyle> = {
  "Technology":             { bg:"#EFF6FF", bgDark: "#1e3a8a33", text:"#1D4ED8", textDark: "#60a5fa" },
  "Consumer Cyclical":      { bg:"#FFF7ED", bgDark: "#7c2d1233", text:"#C2410C", textDark: "#fb923c" },
  "Consumer Defensive":     { bg:"#F0FDF4", bgDark: "#064e3b33", text:"#15803D", textDark: "#4ade80" },
  "Healthcare":             { bg:"#FDF4FF", bgDark: "#581c8733", text:"#7E22CE", textDark: "#c084fc" },
  "Industrials":            { bg:"#FFFBEB", bgDark: "#78350f33", text:"#B45309", textDark: "#fbbf24" },
  "Communication Services": { bg:"#F0F9FF", bgDark: "#0c4a6e33", text:"#0369A1", textDark: "#38bdf8" },
};
