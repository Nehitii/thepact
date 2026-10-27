/* LES NEUF EMBLEMES DU PACTE.
 *
 * Neuf composants d icone dessines en SVG, sortis de `PactVisual.tsx`
 * qui faisait 609 lignes. Pur deplacement : ils ne prennent aucune
 * prop, ne lisent aucun etat, et ne servent qu a ce visuel.
 *
 * Ils sont ensemble parce qu ils forment un jeu : le pacte en choisit
 * un selon son theme, et les neuf partagent le meme trace de base.
 */

export function FlameIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`${id}-fg`} x1="12" y1="22" x2="12" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cc1100" />
          <stop offset="35%" stopColor="#ff6a00" />
          <stop offset="70%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#fff8c0" />
        </linearGradient>
      </defs>
      <path d="M12 2C12 2 6.5 8.5 6.5 13.5a5.5 5.5 0 0011 0C17.5 10 15 8 15 8s.6 3.5-2.5 4.5C10.5 13 9 11.5 9 10 9 7 12 2 12 2z" fill={`url(#${id}-fg)`} />
      <path d="M12 13.5c0 0-1.2.6-1.2 2.2a1.2 1.2 0 002.4 0c0-1.6-1.2-2.2-1.2-2.2z" fill="#fff8c0" opacity="0.9" />
    </svg>
  );
}

export function HeartIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`${id}-hg`} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff80b0" />
          <stop offset="100%" stopColor="#cc0044" />
        </linearGradient>
      </defs>
      <path d="M12 21C12 21 2.5 14 2.5 8.5a4.5 4.5 0 019-0.9 4.5 4.5 0 019 .9C20.5 14 12 21 12 21z" fill={`url(#${id}-hg)`} />
      <ellipse cx="9" cy="9" rx="1.8" ry="2.2" fill="white" opacity="0.2" transform="rotate(-25 9 9)" />
    </svg>
  );
}

export function TargetIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id={`${id}-tg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00ff99" />
          <stop offset="100%" stopColor="#007744" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="#00ff88" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="5.5" stroke="#00ff88" strokeWidth="1.5" fill="none" opacity=".6" />
      <circle cx="12" cy="12" r="2.5" fill={`url(#${id}-tg)`} />
      {[0, 90, 180, 270].map((deg) => (
        <line key={deg} x1="12" y1="2" x2="12" y2="5.5" stroke="#00ff88" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${deg} 12 12)`} />
      ))}
    </svg>
  );
}

export function SparklesIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`${id}-sg`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path d="M12 2l1.8 5.4H20l-4.9 3.6 1.9 5.5L12 13l-5 3.5 1.9-5.5L4 7.4h6.2z" fill={`url(#${id}-sg)`} />
      <path d="M19.5 2l.7 2.2H22.5l-2 1.5.8 2.3L19.5 6.7 17.7 8l.8-2.3-2-1.5h2.3z" fill="#e879f9" opacity=".7" />
      <path d="M4.5 14l.7 2.2H7.7l-2 1.5.8 2.3L4.5 18.7l-1.8 1.3.8-2.3-2-1.5h2.3z" fill="#c084fc" opacity=".6" />
    </svg>
  );
}

export function PhoenixIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" overflow="visible">
      <defs>
        <linearGradient id={`${id}-body`} x1="24" y1="42" x2="24" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cc2200" />
          <stop offset="40%" stopColor="#ff6600" />
          <stop offset="75%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#fff5cc" />
        </linearGradient>
        <linearGradient id={`${id}-wing`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff9900" />
          <stop offset="100%" stopColor="#ff3300" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M24 24 C18 20, 8 22, 4 18 C8 28, 16 30, 24 28Z" fill={`url(#${id}-wing)`} style={{ transformOrigin: "24px 24px", animation: "ph-wing 2.4s ease-in-out infinite" }} />
      <path d="M24 24 C30 20, 40 22, 44 18 C40 28, 32 30, 24 28Z" fill={`url(#${id}-wing)`} style={{ transformOrigin: "24px 24px", animation: "ph-wing 2.4s ease-in-out 0.1s infinite" }} />
      <path d="M24 8 C21 14, 19 20, 20 28 C22 32, 26 32, 28 28 C29 20, 27 14, 24 8Z" fill={`url(#${id}-body)`} style={{ animation: "ph-body 2s ease-in-out infinite" }} />
      <path d="M22 28 C20 34, 16 38, 14 44" stroke="#ff6600" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="12 4" style={{ animation: "ph-tail 2s ease-in-out infinite" }} />
      <path d="M24 29 C24 35, 24 40, 24 45" stroke="#ff9900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M26 28 C28 34, 32 38, 34 44" stroke="#ffcc00" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="12 4" style={{ animation: "ph-tail 2s ease-in-out 0.3s infinite" }} />
      <circle cx="24" cy="13" r="1.5" fill="#fff5cc" />
      <circle cx="24" cy="13" r="0.7" fill="#ff3300" />
      {([[-5,-6],[6,-4],[-3,4],[7,-2],[2,6]] as [number,number][]).map(([ex,ey], i) => (
        <circle key={i} cx="24" cy="28" r="1.2" fill={i % 2 === 0 ? "#ff8800" : "#ffcc44"}
          style={{ "--ex": `${ex}px`, "--ey": `${ey * 4}px`, animation: `ph-ember ${1.2 + i * 0.3}s ease-out ${i * 0.25}s infinite` } as React.CSSProperties} />
      ))}
    </svg>
  );
}

export function CompassIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ animation: "co-glow 2.5s ease-in-out infinite" }}>
      <defs>
        <linearGradient id={`${id}-north`} x1="24" y1="6" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00eeff" />
          <stop offset="100%" stopColor="#0066aa" />
        </linearGradient>
        <linearGradient id={`${id}-south`} x1="24" y1="24" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334455" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="#00d4ff" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="24" cy="24" r="21" stroke="#00d4ff" strokeWidth="0.5" fill="none" strokeDasharray="3 9" style={{ transformOrigin: "24px 24px", animation: "co-ring 20s linear infinite" }} />
      <circle cx="24" cy="24" r="17" stroke="#00aacc" strokeWidth="0.5" fill="rgba(0,20,35,0.6)" opacity="0.8" />
      {Array.from({ length: 36 }, (_, i) => (
        <line key={i} x1="24" y1="8" x2="24" y2={i % 9 === 0 ? 12 : 10} stroke="#00d4ff" strokeWidth={i % 9 === 0 ? 1.5 : 0.5} opacity={i % 9 === 0 ? 0.9 : 0.3} transform={`rotate(${i * 10} 24 24)`} />
      ))}
      {/* « O » pour Ouest : la rose des vents suit la langue de
          l interface, pas l anglais. */}
      {[{ l: "N", x: 24, y: 17, col: "#00eeff" }, { l: "S", x: 24, y: 35, col: "#446677" }, { l: "E", x: 35, y: 25, col: "#446677" }, { l: "O", x: 13, y: 25, col: "#446677" }].map(({ l, x, y, col }) => (
        <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={col} fontSize="5" fontFamily="monospace" fontWeight="bold">{l}</text>
      ))}
      <polygon points="24,8 21.5,24 24,22 26.5,24" fill={`url(#${id}-north)`} style={{ transformOrigin: "24px 24px", animation: "co-needle 3s ease-in-out infinite" }} />
      <polygon points="24,40 21.5,24 24,26 26.5,24" fill={`url(#${id}-south)`} style={{ transformOrigin: "24px 24px", animation: "co-needle 3s ease-in-out infinite" }} />
      <circle cx="24" cy="24" r="3" fill="#001a2e" stroke="#00d4ff" strokeWidth="1" />
      <circle cx="24" cy="24" r="1.2" fill="#00d4ff" />
    </svg>
  );
}

export function CitadelIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ animation: "ci-pulse 2.5s ease-in-out infinite" }}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="24" y1="48" x2="24" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#002b1a" />
          <stop offset="100%" stopColor="#00442a" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="8" y="4" width="32" height="44" />
        </clipPath>
      </defs>
      <rect x="10" y="18" width="28" height="28" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      <rect x="10" y="10" width="6" height="10" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      <rect x="21" y="6" width="6" height="13" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      <rect x="32" y="10" width="6" height="10" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      <path d="M20 46 L20 34 Q24 30 28 34 L28 46Z" fill="#001a10" stroke="#00cc66" strokeWidth="0.8" />
      <rect x="21.5" y="22" width="5" height="6" rx="0.5" fill="#00ff88" style={{ animation: "ci-blink 4s ease-in-out infinite" }} />
      <rect x="21.5" y="22" width="5" height="6" rx="0.5" fill="none" stroke="#00ff44" strokeWidth="0.5" />
      {[15, 29].map((x, i) => (
        <rect key={i} x={x} y="28" width="4" height="5" rx="0.5" fill="#003320" stroke="#00aa55" strokeWidth="0.5" style={{ animation: `ci-blink ${3 + i}s ease-in-out ${i * 1.5}s infinite` }} />
      ))}
      <line x1="10" y1="0" x2="38" y2="0" stroke="#00ff88" strokeWidth="1.5" opacity="0.6" clipPath={`url(#${id}-clip)`} style={{ animation: "ci-scan 2.5s ease-in-out infinite" }} />
      <line x1="24" y1="6" x2="24" y2="2" stroke="#00ff88" strokeWidth="1" />
      <path d="M24 2 L30 3.5 L24 5Z" fill="#00ff88" opacity="0.8" />
    </svg>
  );
}

export function VortexIcon({ id, size }: { id: string; size: number }) {
  const rings = [
    { r: 20, dash: "8 6", speed: "calc(8s * var(--pv-cadence, 1))", w: 1.5, col: "#7c3aed", dir: "cw" },
    { r: 14, dash: "5 8", speed: "calc(5s * var(--pv-cadence, 1))", w: 2, col: "#a855f7", dir: "ccw" },
    { r: 8, dash: "3 5", speed: "calc(3s * var(--pv-cadence, 1))", w: 2.5, col: "#c084fc", dir: "cw" },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf4ff" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>
      </defs>
      {rings.map(({ r, dash, speed, w, col, dir }, i) => (
        <circle key={i} cx="24" cy="24" r={r} stroke={col} strokeWidth={w} fill="none" strokeDasharray={dash} strokeLinecap="round"
          style={{ transformOrigin: "24px 24px", animation: `vo-${dir} ${speed} linear infinite`, opacity: 0.75 + i * 0.08 }} />
      ))}
      {[0, 90, 180, 270].map((deg, i) => (
        <circle key={i} cx="24" cy="4" r="2" fill="#a855f7" transform={`rotate(${deg} 24 24)`} opacity="0.9" />
      ))}
      <circle cx="24" cy="24" r="4" fill={`url(#${id}-core)`} style={{ animation: "vo-core calc(2s * var(--pv-cadence, 1)) ease-in-out infinite" }} />
      <circle cx="24" cy="24" r="1.5" fill="white" opacity="0.95" />
    </svg>
  );
}

export function ShieldIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" overflow="visible">
      <defs>
        <linearGradient id={`${id}-sh`} x1="24" y1="4" x2="24" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="50%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0c1a4f" />
        </linearGradient>
        <linearGradient id={`${id}-bolt`} x1="22" y1="14" x2="26" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="50%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {[16, 21].map((r, i) => (
        <circle key={i} cx="24" cy="24" r={r} stroke="#38bdf8" strokeWidth="1" fill="none"
          style={{ animation: `sh-ring ${1.8 + i * 0.6}s ease-out ${i * 0.9}s infinite` }} />
      ))}
      <path d="M24 4 L40 11 L40 26 Q40 38 24 46 Q8 38 8 26 L8 11 Z" fill={`url(#${id}-sh)`} stroke="#38bdf8" strokeWidth="1.2"
        style={{ animation: "sh-charge 2.5s ease-in-out infinite" }} />
      <path d="M24 6 L38 12 L38 20 Q24 14 12 20 L12 12 Z" fill="white" opacity="0.06" />
      <path d="M16 20 L32 20" stroke="#38bdf8" strokeWidth="0.5" opacity="0.3" />
      <path d="M14 26 L34 26" stroke="#38bdf8" strokeWidth="0.5" opacity="0.2" />
      <path d="M26 14 L20 25 L24 25 L22 34 L28 23 L24 23 Z" fill={`url(#${id}-bolt)`} style={{ animation: "sh-bolt 3s ease-in-out infinite" }} />
    </svg>
  );
}
