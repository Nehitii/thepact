import { CyberBackground } from "@/components/CyberBackground";
import { AuraBackground } from "@/components/finance/aura/AuraBackground";
import { HealthBioMesh } from "@/components/health/HealthBioMesh";

export type DSBackgroundVariant =
  | "none"
  | "cyber"
  | "cyber-grid"
  | "aura"
  | "bio"
  | "corners";

interface DSBackgroundProps {
  variant: DSBackgroundVariant;
  /** For variant="bio" : score 0-100 that influences colors/intensity */
  bioScore?: number;
  /** Override accent token, default uses --ds-accent-primary */
  accent?: "primary" | "success" | "warning" | "critical" | "special";
}

/**
 * Unified background layer. Phase 1 wraps legacy backgrounds — extraction to pure CSS
 * utilities comes in Phase 5.
 */
export function DSBackground({ variant, bioScore = 75 }: DSBackgroundProps) {
  if (variant === "none") return <div className="absolute inset-0" />;

  if (variant === "cyber") {
    return <CyberBackground />;
  }

  if (variant === "cyber-grid") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 journal-grid-bg opacity-30" />
        <div className="absolute inset-0 journal-scanline pointer-events-none" />
        <div className="absolute inset-0 journal-noise opacity-[0.04] pointer-events-none" />
      </div>
    );
  }

  if (variant === "aura") {
    return <AuraBackground />;
  }

  if (variant === "bio") {
    return (
      <div className="absolute inset-0">
        <HealthBioMesh score={bioScore} />
      </div>
    );
  }

  if (variant === "corners") {
    return (
      <>
        <div className="ds-corner-bracket tl" />
        <div className="ds-corner-bracket tr" />
        <div className="ds-corner-bracket bl" />
        <div className="ds-corner-bracket br" />
      </>
    );
  }

  return null;
}