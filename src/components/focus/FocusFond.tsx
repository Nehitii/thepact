import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/* LE FOND VIVANT
 *
 * Quatre fonds, un seul canevas. La couche precedente empilait dix-neuf
 * animations DOM perpetuelles ; ici il n y a qu une surface a repeindre,
 * et le cout se mesure : entre 0,06 et 0,50 ms par image selon la
 * variante, sur une image qui en dure 16,7.
 *
 * Le fond s allume a l apposition du sceau — un eveil de deux secondes —
 * et son intensite suit l avancement de la clause. Au repos il ne tourne
 * pas du tout : la boucle n est meme pas lancee.
 */

export type VarianteFond = "mycelium" | "aurores" | "maillage" | "maree" | "aucun";

export const VARIANTES_FOND: VarianteFond[] = ["mycelium", "aurores", "maillage", "maree", "aucun"];

interface FocusFondProps {
  variante: VarianteFond;
  actif: boolean;
  progress: number;
  isBreak?: boolean;
  /** Apercu : la scene tourne quoi qu il arrive, dans son propre cadre. */
  apercu?: boolean;
}

/* ── Bruit de valeur : bon marche, et suffisant pour un fond ── */
function alea(x: number, y: number) {
  let n = (x * 374761393 + y * 668265263) >>> 0;
  n = ((n ^ (n >> 13)) * 1274126177) >>> 0;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}
function bruit(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = alea(xi, yi), b = alea(xi + 1, yi), c = alea(xi, yi + 1), d = alea(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** Les jetons de theme sont des triplets HSL : on les convertit une fois
 *  pour pouvoir composer des couleurs avec alpha sur le canevas. */
function jetonEnRvb(nom: string, repli: [number, number, number]): [number, number, number] {
  try {
    const brut = getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
    const m = brut.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
    if (!m) return repli;
    const h = parseFloat(m[1]) / 360, s = parseFloat(m[2]) / 100, l = parseFloat(m[3]) / 100;
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const f = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
  } catch {
    return repli;
  }
}

interface Etat {
  w: number; h: number; dpr: number;
  ctx: CanvasRenderingContext2D;
  teinte: [number, number, number];
  or: [number, number, number];
  pointes?: { x: number; y: number; a: number; v: number; vie: number }[];
  parts?: { x: number; y: number; vie: number }[];
  cols?: { x: number; y: number; plan: number; v: number; lg: number }[];
  temps: number;
  dissipe: number;
  impulsion: number;
}

const SIGNES = "01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶ<>/\\{}[]#*+-=";
const FOND = "#04060a";

function rgba(c: [number, number, number], a: number) {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/* ═══ A — MYCELIUM ═══
   Le trace s accumule : on ne repeint jamais ce qui existe deja, seulement
   les pointes actives. C est ce qui le rend huit fois moins cher que les
   autres — et c est le seul dont le fond garde une memoire de la seance. */
function initMycelium(e: Etat) {
  e.ctx.fillStyle = FOND;
  e.ctx.fillRect(0, 0, e.w, e.h);
  e.pointes = [];
  /* Quatre germes tous poses sur les bords ne donnaient que de petites
     touffes en peripherie : l ecran restait vide. Neuf germes, dont
     quatre lances depuis l interieur, et l ecran est occupe des les
     premieres secondes. */
  for (let i = 0; i < 9; i++) {
    const dedans = i >= 5;
    const bord = i % 4;
    const x = dedans ? e.w * (0.2 + Math.random() * 0.6) : bord === 0 ? 0 : bord === 1 ? e.w : Math.random() * e.w;
    const y = dedans ? e.h * (0.2 + Math.random() * 0.6) : bord === 2 ? 0 : bord === 3 ? e.h : Math.random() * e.h;
    const vers = dedans ? Math.random() * 6.283 : Math.atan2(e.h / 2 - y, e.w / 2 - x);
    e.pointes.push({ x, y, a: vers, v: 1, vie: 0 });
  }
  e.dissipe = 0;
}
function peindreMycelium(e: Etat, dt: number, eveil: number, prog: number) {
  const ctx = e.ctx;
  // Dissipation tres lente : sans elle, l ecran finit sature.
  e.dissipe += dt;
  if (e.dissipe > 900) {
    e.dissipe = 0;
    ctx.fillStyle = "rgba(4,6,10,0.055)";
    ctx.fillRect(0, 0, e.w, e.h);
  }
  if (eveil < 0.02 || !e.pointes) return;

  // La pousse mettait plusieurs minutes a couvrir un ecran. Doublee,
  // elle occupe l espace en une trentaine de secondes.
  const vitesse = (1.25 + prog * 1.5) * eveil;
  const neuves: typeof e.pointes = [];
  ctx.lineCap = "round";
  for (const p of e.pointes) {
    const n = bruit(p.x * 0.006, p.y * 0.006 + p.vie * 0.02);
    p.a += (n - 0.5) * 0.42;
    const d = p.v * vitesse * (dt / 16.7);
    const nx = p.x + Math.cos(p.a) * d, ny = p.y + Math.sin(p.a) * d;
    const jeune = Math.min(1, p.vie / 120);
    ctx.strokeStyle = rgba(e.teinte, 0.42 - jeune * 0.2);
    ctx.lineWidth = 2.8 - jeune * 1.8;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
    p.x = nx; p.y = ny; p.vie++;

    if (Math.random() < 0.012) {
      ctx.fillStyle = Math.random() < 0.22 ? rgba(e.or, 0.75) : rgba(e.teinte, 0.5);
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.8 + Math.random() * 2.2, 0, 6.284); ctx.fill();
    }
    if (p.vie > 22 && Math.random() < 0.03 && e.pointes.length + neuves.length < 120) {
      neuves.push({ x: p.x, y: p.y, a: p.a + (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.6), v: p.v * 0.86, vie: 0 });
    }
    if (p.x < -40 || p.x > e.w + 40 || p.y < -40 || p.y > e.h + 40 || p.vie > 900) {
      const bord = (Math.random() * 4) | 0;
      p.x = bord === 0 ? 0 : bord === 1 ? e.w : Math.random() * e.w;
      p.y = bord === 2 ? 0 : bord === 3 ? e.h : Math.random() * e.h;
      p.a = Math.atan2(e.h / 2 - p.y, e.w / 2 - p.x) + (Math.random() - 0.5);
      p.vie = 0; p.v = 0.9;
    }
  }
  e.pointes.push(...neuves);
}

/* ═══ B — AURORES ═══ */
function initAurores(e: Etat) {
  e.ctx.fillStyle = FOND;
  e.ctx.fillRect(0, 0, e.w, e.h);
  e.parts = [];
  for (let i = 0; i < 620; i++) {
    e.parts.push({ x: Math.random() * e.w, y: Math.random() * e.h, vie: Math.random() * 260 });
  }
  e.temps = 0;
}
function peindreAurores(e: Etat, dt: number, eveil: number, prog: number) {
  const ctx = e.ctx;
  ctx.fillStyle = "rgba(4,6,10,0.032)";
  ctx.fillRect(0, 0, e.w, e.h);
  if (eveil < 0.02 || !e.parts) return;
  e.temps += dt * 0.00013;
  const cx = e.w / 2, cy = e.h / 2;
  const rayon = eveil * Math.hypot(e.w, e.h);
  const vitesse = 0.5 + prog * 0.9;
  for (let i = 0; i < e.parts.length; i++) {
    const p = e.parts[i];
    if (Math.hypot(p.x - cx, p.y - cy) > rayon) continue;
    const ang = bruit(p.x * 0.0022, p.y * 0.0022 + e.temps) * 12.566;
    const nx = p.x + Math.cos(ang) * vitesse * (dt / 16.7) * 1.6;
    const ny = p.y + Math.sin(ang) * vitesse * (dt / 16.7) * 1.6;
    // Une particule sur sept porte un trait plus large : sans cette
    // difference le champ est uniforme et ne fait pas de rubans.
    const large = i % 7 === 0;
    ctx.lineWidth = large ? 2.2 : 1;
    ctx.strokeStyle = i % 23 === 0 ? rgba(e.or, large ? 0.1 : 0.15) : rgba(e.teinte, large ? 0.11 : 0.17);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
    p.x = nx; p.y = ny; p.vie--;
    if (p.vie < 0 || p.x < 0 || p.x > e.w || p.y < 0 || p.y > e.h) {
      p.x = Math.random() * e.w; p.y = Math.random() * e.h; p.vie = 160 + Math.random() * 220;
    }
  }
}

/* ═══ C — MAILLAGE ═══ */
function initMaillage(e: Etat) { e.temps = 0; e.impulsion = 0; }
function peindreMaillage(e: Etat, dt: number, eveil: number, prog: number) {
  const ctx = e.ctx;
  ctx.fillStyle = FOND;
  ctx.fillRect(0, 0, e.w, e.h);
  if (eveil < 0.02) return;
  e.temps += dt * 0.0009;
  e.impulsion = eveil < 1 ? eveil : Math.max(0, e.impulsion - dt * 0.0008);

  const COL = 46, LIG = 26;
  const ampl = (6 + prog * 30) * eveil;
  const horizon = e.h * 0.3;
  ctx.lineWidth = 1;
  const pts: { x: number; y: number; p: number }[][] = [];
  for (let j = 0; j < LIG; j++) {
    const f = j / (LIG - 1);
    const prof = Math.pow(f, 2.1);
    const y0 = horizon + prof * (e.h - horizon) * 1.25;
    const ligne: { x: number; y: number; p: number }[] = [];
    for (let i = 0; i < COL; i++) {
      const g = i / (COL - 1);
      const x = (g - 0.5) * (0.5 + prof * 2.4) * e.w + e.w / 2;
      const onde = Math.sin(g * 7 + e.temps * 1.7 + f * 5) * Math.cos(f * 4 - e.temps * 1.1);
      const choc = e.impulsion > 0 ? Math.sin(f * 9 - e.impulsion * 12) * e.impulsion * 22 : 0;
      ligne.push({ x, y: y0 + onde * ampl * (0.3 + prof) + choc, p: prof });
    }
    pts.push(ligne);
  }
  for (let j = 0; j < LIG; j++) {
    const l = pts[j];
    ctx.strokeStyle = rgba(e.teinte, 0.05 + l[0].p * 0.3);
    ctx.beginPath(); ctx.moveTo(l[0].x, l[0].y);
    for (let i = 1; i < COL; i++) ctx.lineTo(l[i].x, l[i].y);
    ctx.stroke();
  }
  ctx.strokeStyle = rgba(e.teinte, 0.1);
  for (let i = 0; i < COL; i += 2) {
    ctx.beginPath(); ctx.moveTo(pts[0][i].x, pts[0][i].y);
    for (let j = 1; j < LIG; j++) ctx.lineTo(pts[j][i].x, pts[j][i].y);
    ctx.stroke();
  }
  const grd = ctx.createLinearGradient(0, horizon - 30, 0, horizon + 8);
  grd.addColorStop(0, rgba(e.teinte, 0));
  grd.addColorStop(1, rgba(e.teinte, 0.2 * eveil));
  ctx.fillStyle = grd;
  ctx.fillRect(0, horizon - 30, e.w, 38);
}

/* ═══ D — MAREE ═══ */
function initMaree(e: Etat) {
  e.cols = [];
  const n = Math.max(24, Math.round(e.w / 26));
  for (let i = 0; i < n; i++) {
    const plan = i % 3;
    e.cols.push({
      x: (i + 0.5) * (e.w / n), y: e.h + Math.random() * e.h, plan,
      v: 0.35 + plan * 0.28 + Math.random() * 0.2, lg: 5 + ((Math.random() * 7) | 0),
    });
  }
  e.temps = 0;
}
function peindreMaree(e: Etat, dt: number, eveil: number, prog: number) {
  const ctx = e.ctx;
  ctx.fillStyle = FOND;
  ctx.fillRect(0, 0, e.w, e.h);
  if (eveil < 0.02 || !e.cols) return;
  e.temps += dt;
  const horizon = e.h * 0.42;

  const grd = ctx.createLinearGradient(0, horizon, 0, e.h);
  grd.addColorStop(0, rgba(e.teinte, 0.09 * eveil));
  grd.addColorStop(1, rgba(e.teinte, 0));
  ctx.fillStyle = grd;
  ctx.fillRect(0, horizon, e.w, e.h - horizon);

  ctx.textAlign = "center";
  for (let i = 0; i < e.cols.length; i++) {
    const c = e.cols[i];
    c.y -= c.v * (0.7 + prog * 1.1) * eveil * (dt / 16.7);
    if (c.y < -c.lg * 20) { c.y = e.h + Math.random() * 160; c.lg = 5 + ((Math.random() * 7) | 0); }
    const taille = 10 + c.plan * 4;
    ctx.font = `${taille}px "Share Tech Mono", monospace`;
    for (let k = 0; k < c.lg; k++) {
      const y = c.y + k * (taille + 4);
      if (y < -20 || y > e.h + 20) continue;
      const tete = k === 0;
      const al = (tete ? 0.85 : 0.36 * (1 - k / c.lg)) * (0.35 + c.plan * 0.32) * eveil;
      ctx.fillStyle = tete ? `rgba(255,255,255,${al})` : i % 11 === 0 ? rgba(e.or, al) : rgba(e.teinte, al);
      const idx = ((i * 7 + k * 13 + ((e.temps / 220) | 0)) % SIGNES.length + SIGNES.length) % SIGNES.length;
      ctx.fillText(SIGNES[idx], c.x, y);
    }
  }
  ctx.fillStyle = rgba(e.teinte, 0.5 * eveil);
  ctx.fillRect(0, horizon, e.w, 1);
  ctx.fillStyle = rgba(e.teinte, 0.13 * eveil);
  ctx.fillRect(0, horizon - 14, e.w, 14);
}

const SCENES: Record<Exclude<VarianteFond, "aucun">, {
  init: (e: Etat) => void;
  peindre: (e: Etat, dt: number, eveil: number, prog: number) => void;
}> = {
  mycelium: { init: initMycelium, peindre: peindreMycelium },
  aurores: { init: initAurores, peindre: peindreAurores },
  maillage: { init: initMaillage, peindre: peindreMaillage },
  maree: { init: initMaree, peindre: peindreMaree },
};

export function FocusFond({ variante, actif, progress, isBreak = false, apercu = false }: FocusFondProps) {
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const mouvementReduit = useReducedMotion();

  // Lues par la boucle, jamais par le rendu : sans refs, chaque seconde
  // relancerait l animation depuis zero.
  const progRef = useRef(progress);
  progRef.current = progress;
  const actifRef = useRef(actif);
  actifRef.current = actif;
  const teinteRef = useRef(isBreak);
  teinteRef.current = isBreak;
  const relireRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv || variante === "aucun") return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    const scene = SCENES[variante];
    const etat: Etat = {
      w: 0, h: 0, dpr: 1, ctx,
      teinte: [92, 182, 255], or: [252, 238, 10],
      temps: 0, dissipe: 0, impulsion: 0,
    };

    const relireCouleurs = () => {
      etat.teinte = jetonEnRvb(teinteRef.current ? "--accent" : "--primary", [92, 182, 255]);
      etat.or = [252, 238, 10];
    };
    relireRef.current = relireCouleurs;

    /* Redimensionner un canevas VIDE sa memoire. Le mycelium, dont tout
       l interet est d accumuler, repartait donc de zero a chaque
       changement de taille — et passer en plein ecran en est un. C est ce
       qui « relancait l animation ».
       On recopie donc l image avant de redimensionner, et on la repose
       ensuite, etiree a la nouvelle taille. */
    const dimensionne = (preserver = false) => {
      const avant = preserver && cv.width > 0 && cv.height > 0
        ? (() => {
            const t = document.createElement("canvas");
            t.width = cv.width; t.height = cv.height;
            t.getContext("2d")?.drawImage(cv, 0, 0);
            return t;
          })()
        : null;

      // Au-dela de 1,5 la densite ne se voit pas sur un fond, et le cout
      // double. Ce n est pas une image, c est une ambiance.
      etat.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = cv.getBoundingClientRect();
      etat.w = Math.max(1, Math.round(r.width));
      etat.h = Math.max(1, Math.round(r.height));
      cv.width = Math.round(etat.w * etat.dpr);
      cv.height = Math.round(etat.h * etat.dpr);
      ctx.setTransform(etat.dpr, 0, 0, etat.dpr, 0, 0);
      relireCouleurs();

      if (avant) {
        ctx.drawImage(avant, 0, 0, etat.w, etat.h);
      } else {
        scene.init(etat);
      }
    };
    dimensionne();

    /* Mouvement reduit : une seule image, puis plus rien. Le fond garde
       sa presence sans jamais bouger. */
    if (mouvementReduit) {
      for (let i = 0; i < 220; i++) scene.peindre(etat, 16.7, 1, progRef.current);
      let m = 0;
      const surResize = () => {
        clearTimeout(m);
        m = window.setTimeout(() => {
          dimensionne();
          for (let i = 0; i < 220; i++) scene.peindre(etat, 16.7, 1, progRef.current);
        }, 120);
      };
      window.addEventListener("resize", surResize);
      return () => { clearTimeout(m); window.removeEventListener("resize", surResize); };
    }

    let eveil = 0;
    let brut = 0;
    cv.style.opacity = "1";
    let tPrec = performance.now();
    let boucleId = 0;
    let vivant = true;

    const image = (now: number) => {
      if (!vivant) return;
      boucleId = requestAnimationFrame(image);
      const dt = Math.min(50, now - tPrec);
      tPrec = now;

      const cible = apercu || actifRef.current ? 1 : 0;
      eveil += (cible - eveil) * Math.min(1, dt / 2000) * (cible ? 1.6 : 3);

      /* Le trace deja pose sur la toile ne s eteint pas avec l eveil : il
         restait entier jusqu au fillRect final qui le supprimait d un
         coup. On fait fondre la toile elle-meme — c est une opacite, donc
         du compositeur — et on ne l efface qu une fois invisible. */
      const opacite = cible ? 1 : Math.max(0, Math.min(1, eveil * 1.6));
      cv.style.opacity = String(opacite);

      if (!cible && opacite <= 0.005) {
        if (brut > 0) { ctx.fillStyle = FOND; ctx.fillRect(0, 0, etat.w, etat.h); brut = 0; }
        return;
      }
      brut = 1;
      scene.peindre(etat, dt, eveil, progRef.current);
    };
    boucleId = requestAnimationFrame(image);

    const surVisibilite = () => {
      // Un onglet cache ne doit rien peindre du tout. Le navigateur bride
      // deja rAF, mais le dire explicitement evite la rafale de
      // rattrapage au retour.
      if (document.visibilityState === "hidden") { vivant = false; cancelAnimationFrame(boucleId); }
      else if (!vivant) { vivant = true; tPrec = performance.now(); boucleId = requestAnimationFrame(image); }
    };
    document.addEventListener("visibilitychange", surVisibilite);
    let minuterie = 0;
    const surResize = () => {
      clearTimeout(minuterie);
      minuterie = window.setTimeout(() => dimensionne(true), 120);
    };
    window.addEventListener("resize", surResize);

    return () => {
      vivant = false;
      relireRef.current = null;
      clearTimeout(minuterie);
      cancelAnimationFrame(boucleId);
      document.removeEventListener("visibilitychange", surVisibilite);
      window.removeEventListener("resize", surResize);
    };
  }, [variante, mouvementReduit, apercu]);

  // La teinte suit la phase sans relancer la scene : relancer effacerait
  // la pousse du mycelium, qui est justement sa raison detre.
  useEffect(() => { relireRef.current?.(); }, [isBreak]);

  if (variante === "aucun") return null;

  return (
    <canvas
      ref={cvRef}
      className={apercu ? "sc-apercu-toile" : "fixed inset-0 w-full h-full pointer-events-none"}
      style={apercu ? undefined : { zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

export default FocusFond;
