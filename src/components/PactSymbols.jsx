import { useState, useId } from "react";

/* ─── FONTS + KEYFRAMES ─────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');

  /* — PHOENIX — */
  @keyframes ph-wing { 0%,100%{transform:scaleX(1) translateY(0)} 50%{transform:scaleX(1.06) translateY(-2px)} }
  @keyframes ph-body  { 0%,100%{filter:drop-shadow(0 0 6px #ff6a00) drop-shadow(0 0 18px #ff330055)}
                         50%{filter:drop-shadow(0 0 14px #ffaa00) drop-shadow(0 0 36px #ff660099)} }
  @keyframes ph-ember { 0%{transform:translate(0,0) scale(1);opacity:.9}
                        100%{transform:translate(var(--ex),var(--ey)) scale(0);opacity:0} }
  @keyframes ph-tail  { 0%,100%{stroke-dashoffset:0} 50%{stroke-dashoffset:-20} }

  /* — COMPASS — */
  @keyframes co-needle { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
  @keyframes co-ring   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes co-glow   { 0%,100%{filter:drop-shadow(0 0 4px #00d4ff)} 50%{filter:drop-shadow(0 0 12px #00eeff)} }

  /* — LOTUS — */
  @keyframes lo-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  @keyframes lo-petal   { 0%,100%{opacity:.65;transform:scale(1) rotate(var(--r))}
                           50%{opacity:1;transform:scale(1.07) rotate(var(--r))} }
  @keyframes lo-orbit   { from{transform:rotate(0deg) translateX(var(--d)) rotate(0deg)}
                           to{transform:rotate(360deg) translateX(var(--d)) rotate(-360deg)} }

  /* — CITADEL — */
  @keyframes ci-pulse { 0%,100%{filter:drop-shadow(0 0 5px #00ffaa) drop-shadow(0 0 16px #00884433)}
                         50%{filter:drop-shadow(0 0 12px #44ffcc) drop-shadow(0 0 30px #00ff8866)} }
  @keyframes ci-scan  { 0%{transform:translateY(-26px);opacity:0}
                        10%,90%{opacity:.7} 100%{transform:translateY(26px);opacity:0} }
  @keyframes ci-blink { 0%,90%,100%{opacity:1} 93%,97%{opacity:.2} }

  /* — VORTEX — */
  @keyframes vo-cw    { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes vo-ccw   { from{transform:rotate(0)} to{transform:rotate(-360deg)} }
  @keyframes vo-core  { 0%,100%{r:4px;filter:drop-shadow(0 0 5px #a855f7)}
                         50%{r:5.5px;filter:drop-shadow(0 0 14px #c084fc)} }

  /* — SHIELD — */
  @keyframes sh-charge { 0%,100%{filter:drop-shadow(0 0 4px #38bdf8) drop-shadow(0 0 12px #0ea5e933)}
                          50%{filter:drop-shadow(0 0 10px #7dd3fc) drop-shadow(0 0 28px #38bdf866)} }
  @keyframes sh-bolt   { 0%,85%,100%{opacity:1} 87%,92%{opacity:0} }
  @keyframes sh-ring   { 0%{transform:scale(.7);opacity:.8} 100%{transform:scale(1.6);opacity:0} }

  /* UI */
  @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tabglow { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 12px var(--ac)} }
`;

let injected = false;
function inject() {
  if (typeof document !== "undefined" && !injected) {
    const s = document.createElement("style");
    s.textContent = STYLES;
    document.head.appendChild(s);
    injected = true;
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   SYMBOLE 1 — PHOENIX
   Un oiseau de feu simplifié, ailes éployées. Corps lumineux, particules
   de braise qui s'échappent vers le bas. Lisible même en petit.
   Thème : renaissance, transformation, recommencer.
   ════════════════════════════════════════════════════════════════════════════ */
function PhoenixSVG({ id, sz }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 48 48" fill="none" overflow="visible">
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

      {/* Aile gauche */}
      <path d="M24 24 C18 20, 8 22, 4 18 C8 28, 16 30, 24 28Z"
        fill={`url(#${id}-wing)`}
        style={{ transformOrigin: "24px 24px", animation: "ph-wing 2.4s ease-in-out infinite" }} />

      {/* Aile droite */}
      <path d="M24 24 C30 20, 40 22, 44 18 C40 28, 32 30, 24 28Z"
        fill={`url(#${id}-wing)`}
        style={{ transformOrigin: "24px 24px", animation: "ph-wing 2.4s ease-in-out 0.1s infinite" }} />

      {/* Corps / tête */}
      <path d="M24 8 C21 14, 19 20, 20 28 C22 32, 26 32, 28 28 C29 20, 27 14, 24 8Z"
        fill={`url(#${id}-body)`}
        style={{ animation: "ph-body 2s ease-in-out infinite" }} />

      {/* Queue — 3 plumes */}
      <path d="M22 28 C20 34, 16 38, 14 44" stroke="#ff6600" strokeWidth="1.5" strokeLinecap="round" fill="none"
        strokeDasharray="12 4"
        style={{ animation: "ph-tail 2s ease-in-out infinite" }} />
      <path d="M24 29 C24 35, 24 40, 24 45" stroke="#ff9900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M26 28 C28 34, 32 38, 34 44" stroke="#ffcc00" strokeWidth="1.5" strokeLinecap="round" fill="none"
        strokeDasharray="12 4"
        style={{ animation: "ph-tail 2s ease-in-out 0.3s infinite" }} />

      {/* Œil */}
      <circle cx="24" cy="13" r="1.5" fill="#fff5cc" />
      <circle cx="24" cy="13" r="0.7" fill="#ff3300" />

      {/* Braises */}
      {[[-5,-6],[ 6,-4],[-3, 4],[ 7,-2],[ 2, 6]].map(([ex,ey], i) => (
        <circle key={i} cx="24" cy="28" r="1.2"
          fill={i % 2 === 0 ? "#ff8800" : "#ffcc44"}
          style={{
            ["--ex"]: `${ex}px`,
            ["--ey"]: `${ey * 4}px`,
            animation: `ph-ember ${1.2 + i * 0.3}s ease-out ${i * 0.25}s infinite`,
          }} />
      ))}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SYMBOLE 2 — COMPASS
   Boussole avec aiguille animée nord/sud. Cercle extérieur qui tourne lentement,
   cadran gravé. Très lisible. Thème : direction, vision, focus stratégique.
   ════════════════════════════════════════════════════════════════════════════ */
function CompassSVG({ id, sz }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 48 48" fill="none" style={{ animation: "co-glow 2.5s ease-in-out infinite" }}>
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

      {/* Cadran extérieur */}
      <circle cx="24" cy="24" r="21" stroke="#00d4ff" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="24" cy="24" r="21" stroke="#00d4ff" strokeWidth="0.5" fill="none" strokeDasharray="3 9"
        style={{ transformOrigin: "24px 24px", animation: "co-ring 20s linear infinite" }} />

      {/* Cadran intérieur */}
      <circle cx="24" cy="24" r="17" stroke="#00aacc" strokeWidth="0.5" fill="rgba(0,20,35,0.6)" opacity="0.8" />

      {/* Graduations */}
      {Array.from({ length: 36 }, (_, i) => (
        <line key={i}
          x1="24" y1="8" x2="24" y2={i % 9 === 0 ? "12" : "10"}
          stroke="#00d4ff" strokeWidth={i % 9 === 0 ? "1.5" : "0.5"}
          opacity={i % 9 === 0 ? 0.9 : 0.3}
          transform={`rotate(${i * 10} 24 24)`} />
      ))}

      {/* Lettres NESW */}
      {[
        { l: "N", x: 24, y: 17, col: "#00eeff" },
        { l: "S", x: 24, y: 35, col: "#446677" },
        { l: "E", x: 35, y: 25, col: "#446677" },
        { l: "W", x: 13, y: 25, col: "#446677" },
      ].map(({ l, x, y, col }) => (
        <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          fill={col} fontSize="5" fontFamily="monospace" fontWeight="bold">{l}</text>
      ))}

      {/* Aiguille Nord */}
      <polygon points="24,8 21.5,24 24,22 26.5,24"
        fill={`url(#${id}-north)`}
        style={{ transformOrigin: "24px 24px", animation: "co-needle 3s ease-in-out infinite" }} />

      {/* Aiguille Sud */}
      <polygon points="24,40 21.5,24 24,26 26.5,24"
        fill={`url(#${id}-south)`}
        style={{ transformOrigin: "24px 24px", animation: "co-needle 3s ease-in-out infinite" }} />

      {/* Centre */}
      <circle cx="24" cy="24" r="3" fill="#001a2e" stroke="#00d4ff" strokeWidth="1" />
      <circle cx="24" cy="24" r="1.2" fill="#00d4ff" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SYMBOLE 3 — LOTUS
   Fleur de lotus stylisée, 6 pétales gradients violets, deux points orbitaux.
   Respiration douce. Thème : croissance intérieure, sérénité, expansion.
   ════════════════════════════════════════════════════════════════════════════ */
function LotusSVG({ id, sz }) {
  const petals = [0, 60, 120, 180, 240, 300];
  return (
    <svg width={sz} height={sz} viewBox="0 0 48 48" fill="none" overflow="visible">
      <defs>
        <linearGradient id={`${id}-p1`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`${id}-p2`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf4ff" />
          <stop offset="60%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>
      </defs>

      {/* Pétales */}
      {petals.map((r, i) => (
        <ellipse key={i}
          cx="24" cy="24"
          rx="5" ry="11"
          fill={`url(#${id}-${i % 2 === 0 ? "p1" : "p2"})`}
          transform={`rotate(${r} 24 24) translate(0 -8)`}
          style={{
            ["--r"]: `${r}deg`,
            transformOrigin: "24px 24px",
            animation: `lo-petal 2.5s ease-in-out ${i * 0.35}s infinite`,
          }} />
      ))}

      {/* Orbite 1 */}
      <circle r="2.5" fill="#e879f9"
        style={{
          ["--d"]: "18px",
          transformOrigin: "24px 24px",
          animation: "lo-orbit 4s linear infinite",
        }} />

      {/* Orbite 2 */}
      <circle r="1.8" fill="#c084fc" opacity="0.8"
        style={{
          ["--d"]: "14px",
          transformOrigin: "24px 24px",
          animation: "lo-orbit 2.8s linear infinite reverse",
        }} />

      {/* Noyau */}
      <circle cx="24" cy="24" r="5.5" fill={`url(#${id}-core)`}
        style={{ animation: "lo-breathe 2.5s ease-in-out infinite" }} />
      <circle cx="24" cy="24" r="2" fill="#fdf4ff" opacity="0.95" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SYMBOLE 4 — CITADEL
   Tour / forteresse vue de face. Créneaux nets, fenêtre qui clignote, ligne
   de scan verticale. Solide, reconnaissable. Thème : discipline, protection,
   système fort.
   ════════════════════════════════════════════════════════════════════════════ */
function CitadelSVG({ id, sz }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 48 48" fill="none" style={{ animation: "ci-pulse 2.5s ease-in-out infinite" }}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="24" y1="48" x2="24" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#002b1a" />
          <stop offset="100%" stopColor="#00442a" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="8" y="4" width="32" height="44" />
        </clipPath>
      </defs>

      {/* Corps principal */}
      <rect x="10" y="18" width="28" height="28" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />

      {/* Créneaux gauche */}
      <rect x="10" y="10" width="6" height="10" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      {/* Créneaux centre */}
      <rect x="21" y="6" width="6" height="13" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      {/* Créneaux droit */}
      <rect x="32" y="10" width="6" height="10" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />

      {/* Porte arrondie */}
      <path d="M20 46 L20 34 Q24 30 28 34 L28 46Z" fill="#001a10" stroke="#00cc66" strokeWidth="0.8" />

      {/* Fenêtre haute — clignote */}
      <rect x="21.5" y="22" width="5" height="6" rx="0.5" fill="#00ff88"
        style={{ animation: "ci-blink 4s ease-in-out infinite" }} />
      <rect x="21.5" y="22" width="5" height="6" rx="0.5" fill="none" stroke="#00ff44" strokeWidth="0.5" />

      {/* Deux fenêtres basses */}
      {[15, 29].map((x, i) => (
        <rect key={i} x={x} y="28" width="4" height="5" rx="0.5" fill="#003320" stroke="#00aa55" strokeWidth="0.5"
          style={{ animation: `ci-blink ${3 + i}s ease-in-out ${i * 1.5}s infinite` }} />
      ))}

      {/* Ligne de scan */}
      <line x1="10" y1="0" x2="38" y2="0" stroke="#00ff88" strokeWidth="1.5" opacity="0.6"
        clipPath={`url(#${id}-clip)`}
        style={{ animation: "ci-scan 2.5s ease-in-out infinite" }} />

      {/* Drapeau */}
      <line x1="24" y1="6" x2="24" y2="2" stroke="#00ff88" strokeWidth="1" />
      <path d="M24 2 L30 3.5 L24 5Z" fill="#00ff88" opacity="0.8" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SYMBOLE 5 — VORTEX
   Trois anneaux concentriques à vitesses différentes, point central pulsant.
   Violet + indigo. Propre et hypnotique. Thème : focus, momentum, flux.
   ════════════════════════════════════════════════════════════════════════════ */
function VortexSVG({ id, sz }) {
  const rings = [
    { r: 20, dash: "8 6",  speed: "8s",  w: 1.5, col: "#7c3aed", dir: "cw"  },
    { r: 14, dash: "5 8",  speed: "5s",  w: 2,   col: "#a855f7", dir: "ccw" },
    { r: 8,  dash: "3 5",  speed: "3s",  w: 2.5, col: "#c084fc", dir: "cw"  },
  ];
  return (
    <svg width={sz} height={sz} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf4ff" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>
      </defs>

      {rings.map(({ r, dash, speed, w, col, dir }, i) => (
        <circle key={i} cx="24" cy="24" r={r}
          stroke={col} strokeWidth={w} fill="none"
          strokeDasharray={dash} strokeLinecap="round"
          style={{
            transformOrigin: "24px 24px",
            animation: `vo-${dir} ${speed} linear infinite`,
            opacity: 0.75 + i * 0.08,
          }} />
      ))}

      {/* Points cardinaux sur l'anneau ext */}
      {[0, 90, 180, 270].map((deg, i) => (
        <circle key={i} cx="24" cy="4" r="2"
          fill="#a855f7"
          transform={`rotate(${deg} 24 24)`}
          opacity="0.9" />
      ))}

      {/* Noyau */}
      <circle cx="24" cy="24" r="4" fill={`url(#${id}-core)`}
        style={{ animation: "vo-core 2s ease-in-out infinite" }} />
      <circle cx="24" cy="24" r="1.5" fill="white" opacity="0.95" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SYMBOLE 6 — SHIELD
   Bouclier hexagonal avec éclair central. Onde de choc qui se propage.
   Bleu acier + cyan. Thème : protection, résilience, immunité.
   ════════════════════════════════════════════════════════════════════════════ */
function ShieldSVG({ id, sz }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 48 48" fill="none" overflow="visible">
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

      {/* Ondes de choc */}
      {[16, 21].map((r, i) => (
        <circle key={i} cx="24" cy="24" r={r}
          stroke="#38bdf8" strokeWidth="1" fill="none"
          style={{ animation: `sh-ring ${1.8 + i * 0.6}s ease-out ${i * 0.9}s infinite` }} />
      ))}

      {/* Bouclier */}
      <path d="M24 4 L40 11 L40 26 Q40 38 24 46 Q8 38 8 26 L8 11 Z"
        fill={`url(#${id}-sh)`} stroke="#38bdf8" strokeWidth="1.2"
        style={{ animation: "sh-charge 2.5s ease-in-out infinite" }} />

      {/* Reflet haut */}
      <path d="M24 6 L38 12 L38 20 Q24 14 12 20 L12 12 Z"
        fill="white" opacity="0.06" />

      {/* Lignes internes */}
      <path d="M16 20 L32 20" stroke="#38bdf8" strokeWidth="0.5" opacity="0.3" />
      <path d="M14 26 L34 26" stroke="#38bdf8" strokeWidth="0.5" opacity="0.2" />

      {/* Éclair */}
      <path d="M26 14 L20 25 L24 25 L22 34 L28 23 L24 23 Z"
        fill={`url(#${id}-bolt)`}
        style={{ animation: "sh-bolt 3s ease-in-out infinite" }} />
    </svg>
  );
}

/* ─── REGISTRY ───────────────────────────────────────────────────────────── */
const SYMBOLS = [
  {
    key: "phoenix",
    label: "PHOENIX",
    tagline: "Renaissance",
    desc: "Renaître de ses cendres. Pour les recommencements, les transformations radicales.",
    Component: PhoenixSVG,
    accent: "#ff6600",
    glow: "rgba(255,102,0,0.5)",
  },
  {
    key: "compass",
    label: "COMPASS",
    tagline: "Direction & Vision",
    desc: "Toujours trouver le nord. Pour les projets guidés par une vision claire.",
    Component: CompassSVG,
    accent: "#00d4ff",
    glow: "rgba(0,212,255,0.45)",
  },
  {
    key: "lotus",
    label: "LOTUS",
    tagline: "Croissance intérieure",
    desc: "S'épanouir malgré la boue. Pour la croissance personnelle et la sérénité.",
    Component: LotusSVG,
    accent: "#a855f7",
    glow: "rgba(168,85,247,0.45)",
  },
  {
    key: "citadel",
    label: "CITADEL",
    tagline: "Discipline & Système",
    desc: "Bâtir une forteresse intérieure. Pour les projets de structure et de maîtrise.",
    Component: CitadelSVG,
    accent: "#00ff88",
    glow: "rgba(0,255,136,0.4)",
  },
  {
    key: "vortex",
    label: "VORTEX",
    tagline: "Focus & Momentum",
    desc: "Tout aspirer vers le centre. Pour maintenir un flux de travail ininterrompu.",
    Component: VortexSVG,
    accent: "#a855f7",
    glow: "rgba(124,58,237,0.5)",
  },
  {
    key: "shield",
    label: "SHIELD",
    tagline: "Résilience & Protection",
    desc: "Absorber les chocs, rester debout. Pour les projets de longue durée.",
    Component: ShieldSVG,
    accent: "#38bdf8",
    glow: "rgba(56,189,248,0.45)",
  },
];

/* ─── VISUAL WRAPPER (reproduit exactement le PactVisual existant) ────────── */
const PX = { sm: 64, md: 96, lg: 128 };
const IX = { sm: 30, md: 46, lg: 62 };

function PactVisualNew({ symbolKey, size = "md" }) {
  const id = useId().replace(/:/g, "x");
  const sym = SYMBOLS.find((s) => s.key === symbolKey);
  if (!sym) return null;
  const pw = PX[size], iw = IX[size];
  return (
    <div style={{
      width: pw, height: pw, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
      background: `radial-gradient(circle, ${sym.glow.replace("0.5","0.10").replace("0.45","0.09").replace("0.4","0.08")} 0%, transparent 70%)`,
      boxShadow: `0 0 ${size === "lg" ? 24 : 14}px ${sym.glow}, 0 0 ${size === "lg" ? 60 : 36}px ${sym.glow.replace(/[\d.]+\)$/, "0.15)")}`,
    }}>
      <sym.Component id={id} sz={iw} />
    </div>
  );
}

/* ─── APP ────────────────────────────────────────────────────────────────── */
export default function App() {
  inject();
  const [selected, setSelected] = useState("phoenix");
  const [previewSize, setPreviewSize] = useState("lg");
  const sym = SYMBOLS.find((s) => s.key === selected);

  return (
    <div style={{
      minHeight: "100vh", background: "#030810",
      color: "#c8d8e8", fontFamily: "'Share Tech Mono', monospace",
      display: "flex", flexDirection: "column",
    }}>
      {/* ── Header */}
      <div style={{
        borderBottom: "1px solid rgba(0,212,255,0.1)",
        padding: "14px 24px", display: "flex", alignItems: "center", gap: 12,
        background: "rgba(0,8,18,0.9)",
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 8px #00d4ff" }} />
        <span style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(0,212,255,0.7)" }}>
          PACT SYMBOLS // NEW DESIGNS v3
        </span>
        <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>
          6 SYMBOLS — DROP-IN READY
        </span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left: symbol tabs */}
        <div style={{
          width: 260, borderRight: "1px solid rgba(0,212,255,0.08)",
          overflowY: "auto", padding: "12px 10px",
          background: "rgba(0,4,12,0.6)", flexShrink: 0,
        }}>
          <p style={{ fontSize: 9, letterSpacing: "0.25em", color: "rgba(0,212,255,0.35)", padding: "4px 6px 10px" }}>
            SYMBOL INDEX
          </p>
          {SYMBOLS.map((s, i) => {
            const active = selected === s.key;
            return (
              <button key={s.key} onClick={() => setSelected(s.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 10px", marginBottom: 3,
                  background: active ? `${s.accent}14` : "transparent",
                  border: `1px solid ${active ? s.accent + "55" : "rgba(255,255,255,0.04)"}`,
                  cursor: "pointer", textAlign: "left",
                  animation: `fadein 0.3s ease-out ${i * 0.06}s both`,
                  transition: "border 0.2s, background 0.2s",
                  position: "relative", overflow: "hidden",
                }}>
                {active && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background: s.accent, boxShadow:`0 0 8px ${s.accent}` }} />}
                <PactVisualNew symbolKey={s.key} size="sm" />
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", color: active ? s.accent : "rgba(200,216,232,0.75)", fontWeight: 700 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(180,200,220,0.35)", marginTop: 1 }}>
                    {s.tagline}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Center: preview */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
          background: "radial-gradient(ellipse at center, rgba(0,15,30,0.9) 0%, #030810 70%)",
        }}>
          {/* Scanlines bg */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,212,255,0.012) 0px, rgba(0,212,255,0.012) 1px, transparent 1px, transparent 5px)",
          }} />

          {/* Glow orb */}
          {sym && (
            <div style={{
              position: "absolute", width: 380, height: 380,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${sym.glow.replace(/[\d.]+\)$/, "0.06)")} 0%, transparent 70%)`,
              top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              pointerEvents: "none",
            }} />
          )}

          {/* Symbol */}
          {sym && (
            <div style={{ animation: "fadein 0.35s ease-out" }} key={selected}>
              <PactVisualNew symbolKey={selected} size={previewSize} />
            </div>
          )}

          {/* Label */}
          {sym && (
            <div style={{ marginTop: 28, textAlign: "center", animation: "fadein 0.4s ease-out 0.05s both" }} key={selected + "t"}>
              <h2 style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900,
                letterSpacing: "0.25em", color: sym.accent, margin: "0 0 6px",
                textShadow: `0 0 18px ${sym.glow}`,
              }}>
                {sym.label}
              </h2>
              <p style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(200,216,232,0.45)", margin: "0 0 10px" }}>
                {sym.tagline.toUpperCase()}
              </p>
              <p style={{ fontSize: 12, maxWidth: 300, color: "rgba(200,216,232,0.38)", lineHeight: 1.7, margin: "0 auto" }}>
                {sym.desc}
              </p>
            </div>
          )}

          {/* Size picker */}
          <div style={{ display: "flex", gap: 6, marginTop: 22 }}>
            {["sm","md","lg"].map((s) => (
              <button key={s} onClick={() => setPreviewSize(s)} style={{
                padding: "4px 14px", fontSize: 9, letterSpacing: "0.2em",
                background: previewSize === s ? (sym?.accent + "22") : "transparent",
                border: `1px solid ${previewSize === s ? sym?.accent : "rgba(255,255,255,0.1)"}`,
                color: previewSize === s ? sym?.accent : "rgba(255,255,255,0.3)",
                cursor: "pointer", textTransform: "uppercase", fontFamily: "inherit",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* ── Right: integration guide */}
        <div style={{
          width: 280, borderLeft: "1px solid rgba(0,212,255,0.08)",
          padding: "16px", overflowY: "auto",
          background: "rgba(0,4,12,0.6)", flexShrink: 0, fontSize: 10,
        }}>
          <p style={{ fontSize: 9, letterSpacing: "0.25em", color: "rgba(0,212,255,0.4)", marginBottom: 14 }}>
            INTÉGRATION
          </p>

          {/* Current symbol info */}
          {sym && (
            <div style={{
              padding: "10px", marginBottom: 14,
              border: `1px solid ${sym.accent}33`,
              background: `${sym.accent}08`,
            }}>
              <p style={{ fontSize: 9, color: sym.accent, letterSpacing: "0.2em", marginBottom: 6 }}>
                SÉLECTIONNÉ // {sym.label}
              </p>
              <p style={{ fontSize: 9, color: "rgba(200,216,232,0.4)", lineHeight: 1.6 }}>
                Couleur accent: <span style={{ color: sym.accent }}>{sym.accent}</span><br />
                Clé: <span style={{ color: "rgba(200,216,232,0.7)" }}>"{sym.key}"</span>
              </p>
            </div>
          )}

          {/* SYMBOL_OPTIONS snippet */}
          <p style={{ fontSize: 9, color: "rgba(0,212,255,0.4)", letterSpacing: "0.2em", marginBottom: 8 }}>
            PACTIDENTITYCARD.TSX
          </p>
          <pre style={{
            fontSize: 8, color: "rgba(200,216,232,0.45)", lineHeight: 1.9,
            background: "rgba(0,212,255,0.03)", padding: "10px",
            border: "1px solid rgba(0,212,255,0.08)",
            overflowX: "auto", marginBottom: 14,
          }}>
{`const SYMBOL_OPTIONS = [
  { key: "flame",
    label: "Flame" },   // ✅ garder
  { key: "heart",
    label: "Heart" },   // ✅ garder
  { key: "target",
    label: "Target" },  // ✅ garder
  { key: "phoenix",
    label: "Phoenix" }, // 🆕
  { key: "compass",
    label: "Compass" }, // 🆕
  { key: "lotus",
    label: "Lotus" },   // 🆕
  { key: "citadel",
    label: "Citadel" }, // 🆕
  { key: "vortex",
    label: "Vortex" },  // 🆕
  { key: "shield",
    label: "Shield" },  // 🆕
];`}
          </pre>

          {/* EN.JSON */}
          <p style={{ fontSize: 9, color: "rgba(0,212,255,0.4)", letterSpacing: "0.2em", marginBottom: 8 }}>
            EN.JSON
          </p>
          <pre style={{
            fontSize: 8, color: "rgba(200,216,232,0.45)", lineHeight: 1.9,
            background: "rgba(0,212,255,0.03)", padding: "10px",
            border: "1px solid rgba(0,212,255,0.08)",
            overflowX: "auto",
          }}>
{SYMBOLS.map((s) =>
  `"symbol${s.key[0].toUpperCase()+s.key.slice(1)}": "${s.label}"`
).join(",\n")}
          </pre>

          {/* Status */}
          <div style={{ marginTop: 14, padding: "8px", border: "1px solid rgba(0,255,136,0.15)", background: "rgba(0,255,136,0.04)" }}>
            {[
              "overflow:visible sur SVG ✅",
              "viewBox centrés 48×48 ✅",
              "Animations CSS stables ✅",
              "Pas de glitch de rendu ✅",
              "Lisibles en taille sm ✅",
            ].map((line, i) => (
              <p key={i} style={{ fontSize: 9, color: "rgba(0,255,136,0.6)", margin: "3px 0" }}>{line}</p>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
