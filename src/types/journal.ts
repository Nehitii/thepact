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
  created_at: string;
  updated_at: string;
}

export type JournalMood =
  | "contemplative"
  | "nostalgic"
  | "inspired"
  | "heavy"
  | "calm"
  | "reflective"
  | "grateful"
  | "melancholic";

export const MOOD_CONFIG: Record<JournalMood, { icon: string; color: string; bgColor: string }> = {
  contemplative: { icon: "🌙", color: "text-indigo-300", bgColor: "bg-indigo-500/20" },
  nostalgic: { icon: "📜", color: "text-amber-300", bgColor: "bg-amber-500/20" },
  inspired: { icon: "✨", color: "text-cyan-300", bgColor: "bg-cyan-500/20" },
  heavy: { icon: "🌧️", color: "text-slate-400", bgColor: "bg-slate-500/20" },
  calm: { icon: "🍃", color: "text-emerald-300", bgColor: "bg-emerald-500/20" },
  reflective: { icon: "🔮", color: "text-purple-300", bgColor: "bg-purple-500/20" },
  grateful: { icon: "💜", color: "text-pink-300", bgColor: "bg-pink-500/20" },
  melancholic: { icon: "🌊", color: "text-blue-300", bgColor: "bg-blue-500/20" },
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
