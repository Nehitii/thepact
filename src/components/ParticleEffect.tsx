import { useEffect, useRef, useState } from 'react';
import { useProfileSettings } from "@/hooks/useProfileSettings";

interface ParticleEffectProps {
  x: number;
  y: number;
  color?: string;
  count?: number;
}

type ParticleState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  el: HTMLDivElement;
};

export const ParticleEffect = ({ x, y, color = 'hsl(195 100% 55%)', count = 12 }: ParticleEffectProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create DOM nodes for each particle (no React state per frame)
    const particles: ParticleState[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.width = '6px';
      el.style.height = '6px';
      el.style.borderRadius = '9999px';
      el.style.backgroundColor = color;
      el.style.boxShadow = `0 0 4px ${color}`;
      el.style.willChange = 'transform, opacity';
      el.style.pointerEvents = 'none';
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
      container.appendChild(el);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        el,
      });
    }

    let rafId = 0;
    let lastTs = performance.now();
    // Original loop: setInterval 16ms with life -= 0.05 and vy += 0.2 per tick.
    // Normalize to time so visuals match across refresh rates.
    const STEP_MS = 16;

    const tick = (ts: number) => {
      const dt = (ts - lastTs) / STEP_MS;
      lastTs = ts;

      let alive = false;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.life <= 0) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.2 * dt; // gravity
        p.life -= 0.05 * dt;
        if (p.life <= 0) {
          p.el.style.opacity = '0';
          continue;
        }
        alive = true;
        const life = p.life;
        p.el.style.opacity = String(life);
        p.el.style.boxShadow = `0 0 ${4 * life}px ${color}`;
        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${life})`;
      }

      if (alive) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      for (const p of particles) {
        p.el.remove();
      }
    };
  }, [x, y, color, count]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
};

// Hook to trigger particle effects
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
