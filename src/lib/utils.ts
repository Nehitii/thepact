import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Unified difficulty color system - single source of truth
export const DIFFICULTY_COLORS = {
  easy: "hsl(142 70% 50%)",
  medium: "hsl(45 95% 55%)",
  hard: "hsl(25 100% 60%)",
  extreme: "hsl(0 90% 65%)",
  impossible: "hsl(280 75% 45%)",
  custom: "hsl(270 90% 65%)", // Default, will be overridden by user's custom color
} as const;

export type DifficultyLevel = keyof typeof DIFFICULTY_COLORS;

/**
 * Get the color for a difficulty level
 * @param difficulty - The difficulty level
 * @param customColor - Optional custom color for "custom" difficulty (from user profile)
 * @returns HSL color string
 */
export function getDifficultyColor(
  difficulty: string | undefined | null,
  customColor?: string
): string {
  if (!difficulty) return DIFFICULTY_COLORS.medium;
  
  const normalizedDifficulty = difficulty.toLowerCase() as DifficultyLevel;
  
  // If it's custom difficulty and a custom color is provided, use it
  if (normalizedDifficulty === "custom" && customColor) {
    // Ensure it's in HSL format if possible, otherwise use as-is
    return customColor.startsWith("hsl") ? customColor : customColor;
  }
  
  return DIFFICULTY_COLORS[normalizedDifficulty] || DIFFICULTY_COLORS.medium;
}
