export interface Rank {
  id: string;
  name: string;
  min_points: number;
  max_points?: number | null;
  logo_url?: string | null;
  background_url?: string | null;
  background_opacity?: number | null;
  frame_color?: string | null;
  glow_color?: string | null;
  quote?: string | null;
}
