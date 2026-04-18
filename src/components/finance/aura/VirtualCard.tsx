import { useState } from 'react';

interface VirtualCardProps {
  label?: string;
  holderName?: string;
  currency?: string;
  accountId?: string;
}

/**
 * Pure-CSS 3D virtual bank card with hover tilt.
 */
export function VirtualCard({
  label = 'AURA',
  holderName = 'PACT MEMBER',
  currency = 'EUR',
  accountId,
}: VirtualCardProps) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ ry: (px - 0.5) * 14, rx: -(py - 0.5) * 10 });
  };

  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  const last4 = accountId ? accountId.replace(/[^0-9]/g, '').slice(-4).padStart(4, '0') : '0420';

  return (
    <div
      className="relative w-full max-w-[320px] aspect-[1.586/1] mx-auto motion-safe:[perspective:1200px] motion-reduce:transform-none"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        className="relative w-full h-full rounded-[20px] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out [transform-style:preserve-3d] overflow-hidden"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          background:
            'linear-gradient(135deg, hsl(220 50% 14%) 0%, hsl(225 45% 9%) 50%, hsl(192 80% 14%) 100%)',
          boxShadow:
            '0 30px 60px -20px hsl(var(--aura-electric) / 0.35), 0 0 0 1px hsl(var(--aura-electric) / 0.18) inset',
        }}
      >
        {/* Holographic shimmer */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, hsl(var(--aura-mint) / 0.35), transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--aura-electric) / 0.4), transparent 55%)',
          }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top row: label + chip */}
        <div className="absolute top-5 left-5 right-5 flex items-start justify-between [transform:translateZ(20px)]">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">
              Virtual Card
            </div>
            <div className="text-base font-bold text-white tracking-wide mt-0.5">{label}</div>
          </div>
          {/* Chip */}
          <div
            className="w-9 h-7 rounded-md relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, hsl(45 90% 65%), hsl(40 70% 45%) 50%, hsl(45 90% 65%))',
            }}
          >
            <div
              className="absolute inset-1 rounded-sm"
              style={{
                backgroundImage:
                  'linear-gradient(hsl(40 50% 30% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(40 50% 30% / 0.6) 1px, transparent 1px)',
                backgroundSize: '6px 6px',
              }}
            />
          </div>
        </div>

        {/* Card number */}
        <div className="absolute left-5 right-5 top-[55%] [transform:translateZ(15px)]">
          <div className="font-mono tabular-nums text-white/85 text-base sm:text-lg tracking-[0.18em]">
            •••• •••• •••• {last4}
          </div>
        </div>

        {/* Bottom row */}
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between [transform:translateZ(15px)]">
          <div>
            <div className="text-[8px] font-mono uppercase tracking-[0.25em] text-white/40">
              Holder
            </div>
            <div className="text-[11px] font-medium text-white/90 tracking-wide mt-0.5 uppercase">
              {holderName}
            </div>
          </div>
          <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-white/70">
            {currency}
          </div>
        </div>

        {/* Glare */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              'linear-gradient(115deg, transparent 35%, hsl(0 0% 100% / 0.12) 50%, transparent 65%)',
          }}
        />
      </div>
    </div>
  );
}
