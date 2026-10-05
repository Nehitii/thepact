export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string; // HTML string from Tiptap
  mood: string;
  life_context: string | null;
  energy_level: number | null;
  valence_level: number | null;
  linked_goal_id: string | null;
  tags: string[];
  is_favorite: boolean;
  accent_color: string | null;
  font_id: string | null;
  size_id: string | null;
  align_id: string | null;
  line_numbers: boolean | null;
  created_at: string;
  updated_at: string;
}

// ─── ACCENT COLORS ─────────────────────────────────────────────────────────────
export const ACCENT_COLORS = [
  { id: "cyan",   label: "CYAN",  hex: "#00ffe0", dim: "rgba(0,255,224,0.07)",  glow: "rgba(0,255,224,0.2)"  },
  { id: "purple", label: "PRPL",  hex: "#bf5af2", dim: "rgba(191,90,242,0.07)", glow: "rgba(191,90,242,0.2)" },
  { id: "red",    label: "RED",   hex: "#ff375f", dim: "rgba(255,55,95,0.07)",  glow: "rgba(255,55,95,0.2)"  },
  { id: "gold",   label: "GOLD",  hex: "#ffd60a", dim: "rgba(255,214,10,0.07)", glow: "rgba(255,214,10,0.2)" },
  { id: "blue",   label: "BLUE",  hex: "#0a84ff", dim: "rgba(10,132,255,0.07)", glow: "rgba(10,132,255,0.2)" },
  { id: "green",  label: "GRÜN",  hex: "#30d158", dim: "rgba(48,209,88,0.07)",  glow: "rgba(48,209,88,0.2)"  },
];

export const FONT_OPTIONS = [
  { id: "mono",   label: "MONO",   css: "'JetBrains Mono', monospace", style: "normal" as const },
  { id: "mono-i", label: "MONO·I", css: "'JetBrains Mono', monospace", style: "italic" as const },
  { id: "raj",    label: "RAJD",   css: "'Rajdhani', sans-serif",      style: "normal" as const },
];

export const SIZE_OPTIONS = [
  { id: "xs", label: "XS", px: 12 },
  { id: "sm", label: "SM", px: 14 },
  { id: "md", label: "MD", px: 16 },
  { id: "lg", label: "LG", px: 19 },
  { id: "xl", label: "XL", px: 23 },
];

export const ALIGN_OPTIONS = [
  { id: "left",   label: "LEFT",   val: "left" as const },
  { id: "center", label: "CNTR",   val: "center" as const },
  { id: "right",  label: "RGHT",   val: "right" as const },
];

export const MOOD_OPTIONS = [
  { id: "flow",    sym: "◈", label: "FLOW",    color: "#00ffe0" },
  { id: "tension", sym: "◉", label: "TENSION", color: "#ff375f" },
  { id: "static",  sym: "◎", label: "STATIC",  color: "#ffd60a" },
  { id: "signal",  sym: "◐", label: "SIGNAL",  color: "#bf5af2" },
  { id: "void",    sym: "◯", label: "VOID",    color: "#0a84ff" },
  { id: "surge",   sym: "◆", label: "SURGE",   color: "#30d158" },
];

// Helpers
export const getAccent = (id: string | null | undefined) =>
  ACCENT_COLORS.find(a => a.id === id) || ACCENT_COLORS[0];
export const getMood = (id: string | null | undefined) =>
  MOOD_OPTIONS.find(m => m.id === id) || MOOD_OPTIONS[0];
export const getFont = (id: string | null | undefined) =>
  FONT_OPTIONS.find(f => f.id === id) || FONT_OPTIONS[0];
export const getSize = (id: string | null | undefined) =>
  SIZE_OPTIONS.find(s => s.id === id) || SIZE_OPTIONS[2];
export const getAlign = (id: string | null | undefined) =>
  ALIGN_OPTIONS.find(a => a.id === id) || ALIGN_OPTIONS[0];

// Legacy exports kept for backward-compat
export type JournalMood = string;
export const MOOD_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  flow:    { icon: "◈", color: "text-cyan-300",    bgColor: "bg-cyan-500/20" },
  tension: { icon: "◉", color: "text-red-400",     bgColor: "bg-red-500/20" },
  static:  { icon: "◎", color: "text-yellow-300",  bgColor: "bg-yellow-500/20" },
  signal:  { icon: "◐", color: "text-purple-300",  bgColor: "bg-purple-500/20" },
  void:    { icon: "◯", color: "text-blue-400",    bgColor: "bg-blue-500/20" },
  surge:   { icon: "◆", color: "text-emerald-300", bgColor: "bg-emerald-500/20" },
};

export const VALENCE_LABELS = [
  { value: 1, label: "Very Negative", color: "hsl(0 90% 65%)" },
  { value: 2, label: "Negative", color: "hsl(15 85% 60%)" },
  { value: 3, label: "Slightly Negative", color: "hsl(30 80% 55%)" },
  { value: 4, label: "Mildly Negative", color: "hsl(40 75% 55%)" },
  { value: 5, label: "Neutral", color: "hsl(210 30% 60%)" },
  { value: 6, label: "Mildly Positive", color: "hsl(160 60% 50%)" },
  { value: 7, label: "Slightly Positive", color: "hsl(150 65% 50%)" },
  { value: 8, label: "Positive", color: "hsl(142 70% 50%)" },
  { value: 9, label: "Very Positive", color: "hsl(130 75% 50%)" },
  { value: 10, label: "Euphoric", color: "hsl(120 80% 50%)" },
];

export const ENERGY_LABELS = [
  { value: 1, label: "Depleted", color: "hsl(0 60% 40%)" },
  { value: 2, label: "Exhausted", color: "hsl(15 55% 45%)" },
  { value: 3, label: "Low", color: "hsl(30 50% 50%)" },
  { value: 4, label: "Below Average", color: "hsl(40 50% 55%)" },
  { value: 5, label: "Average", color: "hsl(210 30% 60%)" },
  { value: 6, label: "Moderate", color: "hsl(180 50% 50%)" },
  { value: 7, label: "Good", color: "hsl(170 60% 50%)" },
  { value: 8, label: "High", color: "hsl(200 80% 55%)" },
  { value: 9, label: "Very High", color: "hsl(200 90% 60%)" },
  { value: 10, label: "Supercharged", color: "hsl(200 100% 67%)" },
];
