/**
 * Unified Frame Renderer
 * 
 * This module provides consistent frame rendering logic across:
 * - Admin editor preview
 * - Shop preview (FramePreview)
 * - Profile bounded avatar (AvatarFrame)
 * 
 * The key insight is that offsets are stored as PERCENTAGES (0-100 range),
 * which allows them to scale proportionally regardless of container size.
 * 
 * Transform model:
 * - frameScale: multiplier for the frame size (1.0 = 100%)
 * - frameOffsetX: horizontal offset as percentage of container width
 * - frameOffsetY: vertical offset as percentage of container height
 * - transformOrigin: always "center center"
 */

export interface FrameTransformParams {
  frameScale?: number;
  frameOffsetX?: number; // Percentage-based (e.g., 5 means 5% of container)
  frameOffsetY?: number; // Percentage-based
}

export interface ComputedFrameTransform {
  transform: string;
  transformOrigin: string;
}

/**
 * Computes the CSS transform for a frame overlay.
 * 
 * @param params - The frame transform parameters (scale and percentage offsets)
 * @returns CSS transform properties to apply to the frame element
 */
export function computeFrameTransform(params: FrameTransformParams): ComputedFrameTransform {
  const scale = params.frameScale ?? 1;
  const offsetXPercent = params.frameOffsetX ?? 0;
  const offsetYPercent = params.frameOffsetY ?? 0;

  // Translate uses percentage values directly
  // Note: CSS translate with % is relative to the element's own size, not the parent
  // So we compute pixel-equivalent by using the scale factor
  return {
    transform: `scale(${scale}) translate(${offsetXPercent}%, ${offsetYPercent}%)`,
    transformOrigin: 'center center',
  };
}

/**
 * Container sizes used in different contexts.
 * These are the actual rendered sizes for reference.
 */
export const FRAME_CONTAINER_SIZES = {
  admin: 96,    // Admin alignment tool
  shopSm: 48,   // Shop small preview
  shopMd: 64,   // Shop medium preview
  shopLg: 80,   // Shop large preview
  shopXl: 96,   // Shop xl preview
  profileSm: 48,  // Profile avatar small
  profileMd: 64,  // Profile avatar medium
  profileLg: 96,  // Profile avatar large
  profileXl: 128, // Profile avatar xl
} as const;

export type FrameSize = "sm" | "md" | "lg" | "xl" | "2xl";
