/* CE QUI DESSINE LE FOND DE LA SESSION DE FOCUS.
 *
 * Quatre peintres — mycelium, maillage, maree, aurores — et leurs
 * aides : semer, initialiser, convertir un jeton de couleur en RVB.
 * Sortis de `composants/FocusFond.tsx`, qui faisait 641 lignes et dont
 * le composant proprement dit n en fait que 173.
 *
 * Ils prennent un contexte de canevas et un etat, et ne rendent rien :
 * ni React, ni requete. C est de la peinture, pas de l interface.
 */
import type { Etat } from "@/domaines/focus/types";

export const PALETTE = {
  sombre: { fond: "#04060a", dissipe: "rgba(4,6,10,", or: [252, 238, 10] as [number, number, number] },
  clair:  { fond: "#E7E5E0", dissipe: "rgba(231,229,224,", or: [122, 92, 0] as [number, number, number] },
};

/* ── Bruit de valeur : bon marche, et suffisant pour un fond ── */
export function alea(x: number, y: number) {
  let n = (x * 374761393 + y * 668265263) >>> 0;
  n = ((n ^ (n >> 13)) * 1274126177) >>> 0;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

export function palette() {
  if (typeof document === "undefined") return PALETTE.sombre;
  return document.documentElement.classList.contains("dark") ? PALETTE.sombre : PALETTE.clair;
}

/** Cinq hyphes en eventail depuis un germe. */
/** La longueur d un premier segment, a l echelle du cadre. */
export function segmentBase(e: Etat) {
  return Math.min(e.w, e.h) * 0.16;
}

export function bruit(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = alea(xi, yi), b = alea(xi + 1, yi), c = alea(xi, yi + 1), d = alea(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export function rgba(c: [number, number, number], a: number) {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

export const SIGNES = "01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶ<>/\\{}[]#*+-=";

export function peindreMycelium(e: Etat, dt: number, eveil: number, prog: number) {
  const ctx = e.ctx;
  /* Dissipation tres lente : sans elle, l ecran finit sature. */
  e.dissipe += dt;
  if (e.dissipe > 900) {
    e.dissipe = 0;
    ctx.fillStyle = palette().dissipe + "0.055)";
    ctx.fillRect(0, 0, e.w, e.h);
  }
  if (eveil < 0.02 || !e.pointes || !e.germes) return;

  const vitesse = (1.15 + prog * 1.2) * eveil;
  const seg0 = segmentBase(e);
  const suite: NonNullable<Etat["pointes"]> = [];
  ctx.lineCap = "round";

  for (const p of e.pointes) {
    /* LE VIRAGE, SEPT FOIS PLUS DOUX QU AVANT.
       Le champ de bruit est lu a l echelle du cadre, pas du pixel : deux
       hyphes voisines lisent presque la meme valeur et s incurvent donc
       ensemble, comme si le milieu avait un grain. */
    const n = bruit(p.x * 0.0022, p.y * 0.0022 + p.vie * 0.004);
    p.a += (n - 0.5) * 0.055;

    const d = p.v * vitesse * (dt / 16.7);
    const nx = p.x + Math.cos(p.a) * d;
    const ny = p.y + Math.sin(p.a) * d;

    /* L EPAISSEUR VIENT DE LA GENERATION. Chaque division retire plus
       du tiers : le tronc est net, la cinquieme generation n est plus
       qu un fil. C est cette hierarchie qu on lit comme « vivant ». */
    const finesse = Math.pow(0.62, p.gen);
    ctx.lineWidth = Math.max(0.4, 2.2 * finesse);
    ctx.strokeStyle = rgba(e.teinte, 0.1 + 0.34 * finesse);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();

    p.x = nx; p.y = ny; p.vie++;
    p.reste -= d; p.seg -= d;

    const dehors = p.x < -30 || p.x > e.w + 30 || p.y < -30 || p.y > e.h + 30;
    if (dehors || p.reste <= 0) continue;

    /* LA DIVISION SE FAIT A LA DISTANCE, PAS AU DE.
       Elle etait tiree a 3,5 % par image : une hyphe courait donc en
       moyenne trente images — mais parfois deux cents, et elle
       traversait tout le cadre d un trait. Le fond se lisait comme un
       paquet de longues courbes qui se croisent, jamais comme un
       reseau qui se ramifie.

       Ici chaque hyphe court UN SEGMENT, puis se divise. Le segment
       raccourcit d un cinquieme a chaque generation : la colonie est
       dense pres du germe et clairseme au bord, ce qui est exactement
       la signature d un mycelium. */
    if (p.seg > 0 || p.gen >= 5 || e.pointes.length + suite.length > 110) {
      suite.push(p);
      continue;
    }

    const genFille = p.gen + 1;
    const segFille = seg0 * Math.pow(0.78, genFille);
    const ecart = 0.3 + Math.random() * 0.28;

    /* LE NOEUD, exactement la ou ca se divise : il marque un evenement
       au lieu de tomber au hasard. */
    ctx.fillStyle = p.gen === 0 ? rgba(e.or, 0.7) : rgba(e.teinte, 0.42);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1 + 1.6 * finesse, 0, 6.284);
    ctx.fill();

    /* Deux tiers des divisions sont DICHOTOMIQUES — la pointe meurt et
       donne deux filles en Y, ce qui se lit d emblee comme une
       ramification. Le tiers restant est LATERAL : la pointe continue
       et pousse une branche de cote, comme une hyphe reelle. Tout en Y
       ferait un arbre trop regulier ; tout en lateral, une tige a
       epines. */
    const enY = Math.random() < 0.66;
    const filles = enY ? [-1, 1] : [Math.random() < 0.5 ? -1 : 1];

    for (const cote of filles) {
      suite.push({
        x: p.x, y: p.y,
        a: p.a + cote * ecart,
        v: p.v * 0.94,
        vie: 0,
        gen: genFille,
        reste: p.reste * 0.82,
        seg: segFille,
      });
    }
    if (!enY) {
      p.gen = genFille;
      p.seg = segFille;
      p.vie = 0;
      suite.push(p);
    }
  }

  e.pointes = suite;

  /* Quand les colonies s epuisent, une autre s installe ailleurs. Le
     fond continue donc de vivre sans que rien ne reparte des bords. */
  if (e.pointes.length < 8) {
    if (e.germes.length > 14) e.germes.splice(0, e.germes.length - 8);
    const p = placeLibre(e);
    semer(e, p.x, p.y);
  }
}

export function peindreMaillage(e: Etat, dt: number, eveil: number, prog: number) {
  const ctx = e.ctx;
  ctx.fillStyle = palette().fond;
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

export function peindreMaree(e: Etat, dt: number, eveil: number, prog: number) {
  const ctx = e.ctx;
  ctx.fillStyle = palette().fond;
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
    ctx.font = `${taille}px "JetBrains Mono", monospace`;
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

export function peindreAurores(e: Etat, dt: number, eveil: number, prog: number) {
  const ctx = e.ctx;
  ctx.fillStyle = palette().dissipe + "0.032)";
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

/** Les jetons de theme sont des triplets HSL : on les convertit une fois
 *  pour pouvoir composer des couleurs avec alpha sur le canevas. */
export function jetonEnRvb(nom: string, repli: [number, number, number]): [number, number, number] {
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

/** Trois hyphes en eventail depuis un germe. */
export function semer(e: Etat, x: number, y: number) {
  const base = Math.random() * 6.283;
  const seg = segmentBase(e);
  for (let k = 0; k < 3; k++) {
    e.pointes!.push({
      x, y,
      a: base + (k / 3) * 6.283 + (Math.random() - 0.5) * 0.6,
      v: 1,
      vie: 0,
      gen: 0,
      /* Six generations de segments qui retrecissent : la colonie
         atteint environ 3,4 fois son premier segment, puis s arrete. */
      reste: seg * 3.4,
      seg,
    });
  }
  e.germes!.push({ x, y });
}

export function initMycelium(e: Etat) {
  e.ctx.fillStyle = palette().fond;
  e.ctx.fillRect(0, 0, e.w, e.h);
  e.pointes = [];
  e.germes = [];
  /* Deux colonies pour commencer. Une seule laisse l ecran vide trop
     longtemps ; au-dela de deux, elles se recouvrent avant d avoir eu
     le temps de se dessiner, et on ne voit plus de reseau. */
  for (let i = 0; i < 2; i++) {
    const p = placeLibre(e);
    semer(e, p.x, p.y);
  }
  e.dissipe = 0;
}

/** Un point loin des germes deja poses. Huit essais, puis tant pis. */
export function placeLibre(e: Etat): { x: number; y: number } {
  const marge = 0.18;
  let mieux = { x: e.w / 2, y: e.h / 2 }, mieuxD = -1;
  for (let i = 0; i < 8; i++) {
    const x = e.w * (marge + Math.random() * (1 - 2 * marge));
    const y = e.h * (marge + Math.random() * (1 - 2 * marge));
    let d = Infinity;
    for (const g of e.germes!) d = Math.min(d, Math.hypot(g.x - x, g.y - y));
    if (d > mieuxD) { mieuxD = d; mieux = { x, y }; }
  }
  return mieux;
}

/* ═══ D — MAREE ═══ */
export function initMaree(e: Etat) {
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
