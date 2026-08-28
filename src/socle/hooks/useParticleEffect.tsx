import { useState } from "react";
import { ParticleEffect } from "@/components/ParticleEffect";
import { useProfileSettings } from "@/socle/hooks/useProfileSettings";

/**
 * LE DÉCLENCHEUR DES PARTICULES, SORTI DU FICHIER DU COMPOSANT.
 *
 * Un fichier qui exporte un composant ET un crochet fait retomber Fast
 * Refresh sur un rechargement complet. Trois écrans s'en servent :
 * la liste des tâches, le détail d'un objectif et la liste des objectifs.
 */
export const useParticleEffect = () => {
  const [effects, setEffects] = useState<Array<{ id: number; x: number; y: number; color: string; count: number }>>([]);

  const { profile } = useProfileSettings();
  const enabled = profile?.particles_enabled ?? true;
  const intensity = typeof profile?.particles_intensity === "number" ? profile!.particles_intensity : 1;

  const trigger = (x: number, y: number, color = 'hsl(195 100% 55%)', count = 12) => {
    if (!enabled) return;

    const scaledCount = Math.max(0, Math.round(count * Math.max(0, Math.min(1, intensity))));
    if (scaledCount <= 0) return;
    
    const id = Date.now();
    setEffects((prev) => [...prev, { id, x, y, color, count: scaledCount }]);
    
    setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== id));
    }, 500);
  };

  const ParticleEffects = () => {
    if (!enabled) return null;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return null;
    return (
      <>
        {effects.map((effect) => (
          <ParticleEffect
            key={effect.id}
            x={effect.x}
            y={effect.y}
            color={effect.color}
            count={effect.count}
          />
        ))}
      </>
    );
  };

  return { trigger, ParticleEffects };
};
