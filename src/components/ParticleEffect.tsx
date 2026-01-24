import { useEffect, useState } from 'react';
import { useProfileSettings } from "@/hooks/useProfileSettings";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface ParticleEffectProps {
  x: number;
  y: number;
  color?: string;
  count?: number;
}

export const ParticleEffect = ({ x, y, color = 'hsl(195 100% 55%)', count = 12 }: ParticleEffectProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Create particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        id: i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
      });
    }
    setParticles(newParticles);

    // Animate particles
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2, // gravity
            life: p.life - 0.05,
          }))
          .filter((p) => p.life > 0)
      );
    }, 16);

    // Clean up after animation
    setTimeout(() => {
      setParticles([]);
    }, 400);

    return () => clearInterval(interval);
  }, [x, y, color, count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            opacity: particle.life,
            boxShadow: `0 0 ${4 * particle.life}px ${particle.color}`,
            transform: `scale(${particle.life})`,
          }}
        />
      ))}
    </div>
  );
};

// Hook to trigger particle effects
export const useParticleEffect = () => {
  const [effects, setEffects] = useState<Array<{ id: number; x: number; y: number; color: string; count: number }>>([]);

  const { profile } = useProfileSettings();
  const enabled = profile?.particles_enabled ?? true;
  const intensity = typeof profile?.particles_intensity === "number" ? profile!.particles_intensity : 1;

  const trigger = (event: React.MouseEvent, color = 'hsl(195 100% 55%)', count = 12) => {
    if (!enabled) return;
    const x = event.clientX;
    const y = event.clientY;

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
