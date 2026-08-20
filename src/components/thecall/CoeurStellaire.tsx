import { useEffect, useRef } from "react";

/* LE COEUR
 *
 * Vingt secondes de patience doivent ressembler a quelque chose. Ce
 * n est pas une barre de progression deguisee : c est un reacteur.
 * Plus la main tient, plus il tourne vite, plus il rayonne, plus il
 * jette d ondes et de filaments — et plus le fond se charge avec lui.
 * A la fin il s effondre sur lui-meme, et ce qu il emet efface tout.
 *
 * Tout est peint sur une seule toile, hors de React : la boucle lit des
 * references, elle ne declenche aucun rendu.
 *
 * Six ameliorations sont montees en options, pour pouvoir les comparer
 * avant de choisir :
 *   A « recit »  — quatre seuils, chacun avec son evenement
 *   B « matiere » — arcs electriques, debris, aurore
 *   C « gravite » — la grille se courbe vers le coeur
 *   D « main »    — le coeur repond a l appui et au relachement
 *   E « final »   — effondrement inverse, blanc, souffle deformant
 *   F « apres »   — un astre calme reste apres le rituel
 */

export type PhaseCoeur =
  | "attente" | "montee" | "critique"
  | "implosion" | "singularite" | "explosion" | "revelation" | "verrouille";

export interface OptionsCoeur {
  recit?: boolean;
  matiere?: boolean;
  gravite?: boolean;
  main?: boolean;
  final?: boolean;
  apres?: boolean;
}

export type EvenementMain = "appui" | "rupture";

interface CoeurStellaireProps {
  progres: React.MutableRefObject<number>;
  phase: PhaseCoeur;
  immobile: boolean;
  /** Le coeur se centre sur CET element, pas sur la toile. */
  cible: React.RefObject<HTMLElement>;
  options?: OptionsCoeur;
  /** La page y depose « appui » ou « rupture » ; la boucle les consomme. */
  evenements?: React.MutableRefObject<EvenementMain[]>;
}

const TAU = Math.PI * 2;
const NB_ANNEAUX = 5;
const MAX_ONDES = 16;
const MAX_FILAMENTS = 26;
const NB_DEBRIS = 22;
const SEUILS = [0.25, 0.5, 0.75, 0.9];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* Du cyan froid au blanc de fusion, en passant par le violet. */
function teinte(p: number): [number, number, number] {
  if (p < 0.5) {
    const t = p * 2;
    return [lerp(6, 139, t), lerp(182, 92, t), lerp(212, 246, t)];
  }
  if (p < 0.85) {
    const t = (p - 0.5) / 0.35;
    return [lerp(139, 255, t), lerp(92, 64, t), lerp(246, 255, t)];
  }
  const t = (p - 0.85) / 0.15;
  return [lerp(255, 255, t), lerp(64, 245, t), lerp(255, 255, t)];
}

const rgba = ([r, g, b]: [number, number, number], a: number) =>
  `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;

interface Onde { r: number; force: number; sens: number }
interface Filament { angle: number; vie: number; duree: number; longueur: number; sens: number }
interface Arc { angle: number; vie: number; duree: number; portee: number; graine: number }
interface Debris { angle: number; rayon: number; vitesse: number; taille: number }

export function CoeurStellaire({
  progres, phase, immobile, cible, options, evenements,
}: CoeurStellaireProps) {
  const toileRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<PhaseCoeur>(phase);
  const debutPhaseRef = useRef<number>(0);
  const optionsRef = useRef<OptionsCoeur>(options ?? {});

  useEffect(() => { optionsRef.current = options ?? {}; }, [options]);

  useEffect(() => {
    if (phaseRef.current !== phase) {
      phaseRef.current = phase;
      debutPhaseRef.current = performance.now();
    }
  }, [phase]);

  useEffect(() => {
    const toile = toileRef.current;
    if (!toile) return;
    const ctx = toile.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = 1, largeur = 0, hauteur = 0;
    const redimensionner = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      largeur = toile.clientWidth;
      hauteur = toile.clientHeight;
      toile.width = Math.round(largeur * dpr);
      toile.height = Math.round(hauteur * dpr);
    };
    redimensionner();
    const observateur = new ResizeObserver(redimensionner);
    observateur.observe(toile);

    /* L etat de la scene vit ici, pas dans React. */
    const angles = Array.from({ length: NB_ANNEAUX }, (_, i) => (i / NB_ANNEAUX) * TAU);
    const sens = Array.from({ length: NB_ANNEAUX }, (_, i) => (i % 2 === 0 ? 1 : -1));
    const inclinaisonsBase = [0.28, 0.55, 0.16, 0.78, 0.42];
    const inclinaisons = [...inclinaisonsBase];
    const ecarts = Array.from({ length: NB_ANNEAUX }, () => 0);   // dispersion apres rupture
    const ondes: Onde[] = [];
    const filaments: Filament[] = [];
    const arcs: Arc[] = [];
    const debris: Debris[] = Array.from({ length: NB_DEBRIS }, () => ({
      angle: Math.random() * TAU,
      rayon: 1.6 + Math.random() * 2.4,
      vitesse: 0.25 + Math.random() * 0.5,
      taille: 1 + Math.random() * 1.6,
    }));

    let derniereOnde = 0;
    let dernierFilament = 0;
    let dernierArc = 0;
    let precedent = performance.now();
    let vivant = true;
    let boucleId = 0;

    // — Etat du recit —
    let seuilAtteint = -1;
    let eclatSeuil = 0;      // eclair court au passage d un seuil
    let alignement = 0;      // 0 → 1 apres le premier seuil
    let scission = 0;        // le coeur se dedouble au deuxieme
    let excentrique = 0;     // orbites decalees au troisieme
    // — Etat de la main —
    let impulsion = 0;       // contraction seche a l appui
    let purge = 0;           // dispersion apres une rupture
    let dernierP = 0;

    const dessiner = (maintenant: number) => {
      if (!vivant) return;
      const dt = Math.min((maintenant - precedent) / 1000, 0.05);
      precedent = maintenant;

      const o = optionsRef.current;
      const p = clamp01(progres.current);
      const ph = phaseRef.current;
      const depuis = (maintenant - debutPhaseRef.current) / 1000;

      // ── Les evenements de la main ────────────────────────────
      if (o.main && evenements?.current.length) {
        for (const e of evenements.current.splice(0)) {
          if (e === "appui") impulsion = 1;
          else if (e === "rupture") {
            purge = 1;
            for (let i = 0; i < NB_ANNEAUX; i++) ecarts[i] = 0.35 + Math.random() * 0.5;
          }
        }
      }
      impulsion = Math.max(0, impulsion - dt * 3.4);
      purge = Math.max(0, purge - dt * 1.5);
      for (let i = 0; i < NB_ANNEAUX; i++) ecarts[i] = Math.max(0, ecarts[i] - dt * 0.9);

      // ── Le recit : quatre seuils, quatre evenements ──────────
      if (o.recit) {
        for (let i = SEUILS.length - 1; i >= 0; i--) {
          if (p >= SEUILS[i] && seuilAtteint < i) {
            seuilAtteint = i;
            eclatSeuil = 1;
            ondes.push({ r: 0, force: 1.6, sens: 1 });
            break;
          }
        }
        if (p < 0.02) seuilAtteint = -1;
        alignement = clamp01(alignement + (seuilAtteint >= 0 ? dt * 1.6 : -dt * 3));
        scission = seuilAtteint >= 1 ? clamp01(scission + dt * 1.2) : clamp01(scission - dt * 3);
        excentrique = seuilAtteint >= 2 ? clamp01(excentrique + dt * 1.1) : clamp01(excentrique - dt * 3);
        for (let i = 0; i < NB_ANNEAUX; i++) {
          inclinaisons[i] = lerp(inclinaisonsBase[i], 0.42, alignement);
        }
      } else {
        seuilAtteint = -1; alignement = 0; scission = 0; excentrique = 0;
        for (let i = 0; i < NB_ANNEAUX; i++) inclinaisons[i] = inclinaisonsBase[i];
      }
      eclatSeuil = Math.max(0, eclatSeuil - dt * 2.2);
      dernierP = p;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, largeur, hauteur);
      if (largeur === 0 || hauteur === 0) { boucleId = requestAnimationFrame(dessiner); return; }

      const boite = cible.current?.getBoundingClientRect();
      const cadre = toile.getBoundingClientRect();
      const cx = boite ? boite.left - cadre.left + boite.width / 2 : largeur / 2;
      const cy = boite ? boite.top - cadre.top + boite.height / 2 : hauteur / 2;
      const base = (boite ? Math.min(boite.width, boite.height) : Math.min(largeur, hauteur) * 0.3) * 0.5;
      const c = teinte(p);

      /* L effondrement : tout rentre dans le point, puis en jaillit. */
      let echelle = 1;
      let eclat = 1 + eclatSeuil * 1.4;
      let calme = 0;   // l astre d apres
      if (ph === "implosion") {
        const u = Math.min(depuis / 0.5, 1);
        echelle = 1 - u * 0.97;
        eclat = 1 + u * 3;
      } else if (ph === "singularite") {
        echelle = 0.03; eclat = 4;
      } else if (ph === "explosion" || ph === "revelation") {
        echelle = 0;
      } else if (ph === "verrouille") {
        if (o.apres) { echelle = 0.42; eclat = 0.55; calme = 1; }
        else echelle = 0;
      }

      const tremble = immobile ? 0 : Math.max(0, p - 0.55) * 26 * (1 + excentrique);
      const ox = (Math.random() - 0.5) * tremble;
      const oy = (Math.random() - 0.5) * tremble;
      ctx.translate(ox, oy);

      // ── Le fond ──────────────────────────────────────────────
      const intensiteFond = calme ? 0.12 : (0.10 + p * 0.34) * eclat;
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(largeur, hauteur) * 0.8);
      halo.addColorStop(0, rgba(c, intensiteFond));
      halo.addColorStop(0.28, rgba(c, intensiteFond * 0.6));
      halo.addColorStop(0.7, rgba(c, 0.02 + p * 0.07));
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(-ox, -oy, largeur, hauteur);

      // ── C : la grille courbee ────────────────────────────────
      if (o.gravite && echelle > 0.02) {
        const pas = 46;
        const force = (0.35 + p * 2.6) * base * base;
        const deplacer = (x: number, y: number): [number, number] => {
          const dx = x - cx, dy = y - cy;
          const d2 = dx * dx + dy * dy + base * base * 0.35;
          const k = force / d2;
          return [x - dx * k, y - dy * k];
        };
        ctx.strokeStyle = rgba(c, 0.05 + p * 0.16);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = -pas; x <= largeur + pas; x += pas) {
          for (let y = -pas; y <= hauteur + pas; y += pas / 3) {
            const [px, py] = deplacer(x, y);
            if (y === -pas) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
        }
        for (let y = -pas; y <= hauteur + pas; y += pas) {
          for (let x = -pas; x <= largeur + pas; x += pas / 3) {
            const [px, py] = deplacer(x, y);
            if (x === -pas) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";

      // ── B : l aurore ─────────────────────────────────────────
      if (o.matiere && echelle > 0.02 && typeof ctx.createConicGradient === "function") {
        const aur = ctx.createConicGradient(-maintenant / 9000, cx, cy);
        aur.addColorStop(0, rgba(c, 0));
        aur.addColorStop(0.22, rgba(c, 0.05 + p * 0.12));
        aur.addColorStop(0.45, rgba(c, 0));
        aur.addColorStop(0.72, rgba(c, 0.04 + p * 0.1));
        aur.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = aur;
        ctx.fillRect(-ox, -oy, largeur, hauteur);
      }

      if (echelle > 0.02) {
        // ── Les ondulations ────────────────────────────────────
        if (!immobile && p > 0 && maintenant - derniereOnde > lerp(1500, 170, p)) {
          derniereOnde = maintenant;
          ondes.push({ r: 0, force: 0.35 + p * 0.65, sens: 1 });
          if (ondes.length > MAX_ONDES) ondes.shift();
        }
        const portee = Math.max(largeur, hauteur) * 0.62;
        for (let i = ondes.length - 1; i >= 0; i--) {
          const w = ondes[i];
          /* E : a l effondrement, les ondes repartent en arriere. */
          if (o.final && ph === "implosion") w.sens = -3.2;
          w.r += dt * lerp(90, 520, p) * w.sens;
          const reste = 1 - w.r / portee;
          if (reste <= 0 || w.r < 0) { ondes.splice(i, 1); continue; }
          ctx.beginPath();
          ctx.arc(cx, cy, w.r * (o.final && ph === "implosion" ? 1 : echelle), 0, TAU);
          ctx.strokeStyle = rgba(c, reste * reste * 0.5 * w.force);
          ctx.lineWidth = 1 + reste * 2.5;
          ctx.stroke();
        }

        // ── B : les debris happes ──────────────────────────────
        if (o.matiere && !immobile) {
          for (const d of debris) {
            const chute = (0.12 + p * 1.5) * d.vitesse * (ph === "implosion" ? 6 : 1);
            d.rayon -= dt * chute;
            d.angle += dt * (0.5 + p * 3.4) * (1 / Math.max(0.35, d.rayon));
            if (d.rayon < 0.55) { d.rayon = 2.6 + Math.random() * 1.6; d.angle = Math.random() * TAU; }
            const r1 = base * d.rayon * echelle;
            const r2 = base * (d.rayon + 0.12 + p * 0.2) * echelle;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(d.angle) * r1, cy + Math.sin(d.angle) * r1);
            ctx.lineTo(cx + Math.cos(d.angle - 0.07) * r2, cy + Math.sin(d.angle - 0.07) * r2);
            ctx.strokeStyle = rgba([255, 255, 255], (0.2 + p * 0.5) * clamp01(2.4 - d.rayon));
            ctx.lineWidth = d.taille;
            ctx.stroke();
          }
        }

        // ── Les anneaux ────────────────────────────────────────
        for (let i = 0; i < NB_ANNEAUX; i++) {
          const vitesse = (0.12 + Math.pow(p, 2.2) * 7) * sens[i] * (1 + i * 0.13);
          angles[i] += dt * vitesse * (immobile ? 0.15 : 1);
          const dispersion = 1 + ecarts[i] * 1.8;
          const rx = base * (1.35 + i * 0.42) * echelle * dispersion
            * (1 - Math.max(0, p - 0.85) * 1.4) * (1 - impulsion * 0.12);
          const ry = rx * inclinaisons[i];
          const alpha = (0.16 + p * 0.5) * (1 - i * 0.1) * eclat * (1 - purge * 0.75) * (1 - ecarts[i]);
          /* A : passe le troisieme seuil, les orbites se decentrent. */
          const dec = excentrique * base * 0.22;
          const ex = cx + Math.cos(angles[i] * 0.7) * dec;
          const ey = cy + Math.sin(angles[i] * 0.9) * dec * 0.6;

          for (let couche = 0; couche < 3; couche++) {
            ctx.beginPath();
            ctx.ellipse(ex, ey, Math.max(0, rx), Math.max(0, ry), angles[i], 0, TAU);
            ctx.strokeStyle = rgba(couche === 0 ? [255, 255, 255] : c, Math.max(0, alpha) / (couche + 1) ** 2);
            ctx.lineWidth = 0.8 + couche * 2.4 + p * 1.6;
            ctx.stroke();
          }
        }

        // ── Les emanations ─────────────────────────────────────
        if (!immobile && p > 0.08 && maintenant - dernierFilament > lerp(420, 40, p)) {
          dernierFilament = maintenant;
          filaments.push({
            angle: Math.random() * TAU, vie: 0, duree: lerp(900, 260, p),
            longueur: lerp(0.25, 1.5, p) * (0.5 + Math.random()),
            sens: Math.random() < 0.5 ? 1 : -1,
          });
          if (filaments.length > MAX_FILAMENTS) filaments.shift();
        }
        for (let i = filaments.length - 1; i >= 0; i--) {
          const f = filaments[i];
          f.vie += dt * 1000;
          const u = f.vie / f.duree;
          if (u >= 1) { filaments.splice(i, 1); continue; }
          f.angle += dt * f.sens * (0.4 + p * 2);
          const debut = base * echelle * 0.95;
          const fin = debut + base * f.longueur * echelle * (0.35 + u * 1.4);
          const a = Math.sin(u * Math.PI) * (0.35 + p * 0.55) * (1 - purge);
          const g = ctx.createLinearGradient(
            cx + Math.cos(f.angle) * debut, cy + Math.sin(f.angle) * debut,
            cx + Math.cos(f.angle) * fin, cy + Math.sin(f.angle) * fin,
          );
          g.addColorStop(0, rgba([255, 255, 255], Math.max(0, a)));
          g.addColorStop(1, rgba(c, 0));
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(f.angle) * debut, cy + Math.sin(f.angle) * debut);
          ctx.lineTo(cx + Math.cos(f.angle) * fin, cy + Math.sin(f.angle) * fin);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1 + p * 2.4;
          ctx.stroke();
        }

        // ── B : les arcs electriques ───────────────────────────
        if (o.matiere && !immobile && p > 0.12 && maintenant - dernierArc > lerp(900, 70, p)) {
          dernierArc = maintenant;
          arcs.push({
            angle: Math.random() * TAU, vie: 0, duree: 90 + Math.random() * 90,
            portee: 1.4 + Math.random() * (1 + p * 1.6), graine: Math.random() * 1000,
          });
          if (arcs.length > 10) arcs.shift();
        }
        for (let i = arcs.length - 1; i >= 0; i--) {
          const a = arcs[i];
          a.vie += dt * 1000;
          const u = a.vie / a.duree;
          if (u >= 1) { arcs.splice(i, 1); continue; }
          const r0 = base * echelle * 0.9;
          const r1 = base * a.portee * echelle;
          const segments = 7;
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const q = s / segments;
            const r = lerp(r0, r1, q);
            const devie = Math.sin(a.graine + q * 9) * 0.16 * (1 - q) * (0.4 + p);
            const ang = a.angle + devie;
            const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
            if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = rgba([255, 255, 255], (1 - u) * (0.5 + p * 0.5));
          ctx.lineWidth = 1 + p * 1.6;
          ctx.stroke();
        }

        // ── Le coeur ───────────────────────────────────────────
        const souffle = immobile ? 1 : 1 + Math.sin(maintenant / 1000 * (2 + p * 14)) * (0.02 + p * 0.07);
        const contraction = 1 - impulsion * 0.22 + Math.max(0, impulsion - 0.7) * 0.5;
        const r = base * echelle * souffle * (1 + p * 0.35) * contraction * (calme ? 0.8 : 1);

        /* A : au deuxieme seuil, le coeur se dedouble puis se ressoude. */
        const separation = Math.sin(scission * Math.PI) * base * 0.22 * echelle;
        const lobes: [number, number][] = separation > 0.5
          ? [[cx - separation, cy], [cx + separation, cy]]
          : [[cx, cy]];

        for (const [lx, ly] of lobes) {
          const noyau = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 2.6);
          noyau.addColorStop(0, rgba([255, 255, 255], Math.min(1, (0.75 + p * 0.25) * eclat)));
          noyau.addColorStop(0.32, rgba(c, Math.min(1, (0.5 + p * 0.5) * eclat)));
          noyau.addColorStop(0.65, rgba(c, 0.16 + p * 0.3));
          noyau.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = noyau;
          ctx.beginPath();
          ctx.arc(lx, ly, r * 2.6, 0, TAU);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(lx, ly, Math.max(0, r), 0, TAU);
          ctx.strokeStyle = rgba([255, 255, 255], Math.min(1, (0.5 + p * 0.5) * eclat));
          ctx.lineWidth = 1 + p * 2;
          ctx.stroke();
        }
      }

      // ── Ce qui jaillit de l effondrement ─────────────────────
      if (ph === "explosion") {
        const duree = immobile ? 0.9 : 0.55;
        const u = Math.min(depuis / duree, 1);

        /* E : une image de blanc total avant le souffle. */
        if (o.final && !immobile && depuis < 0.06) {
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = "#fff";
          ctx.fillRect(-ox, -oy, largeur, hauteur);
          ctx.globalCompositeOperation = "lighter";
        }

        const portee = Math.hypot(largeur, hauteur) * 0.75;
        const rr = portee * (immobile ? u : Math.pow(u, 0.45));
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, TAU);
        ctx.strokeStyle = rgba([255, 255, 255], (1 - u) * 0.9);
        ctx.lineWidth = 6 + (1 - u) * 90;
        ctx.stroke();

        /* E : le souffle deforme ce qu il traverse — un second anneau
           en retard, qui etire la lumiere derriere lui. */
        if (o.final) {
          for (let k = 1; k <= 3; k++) {
            const ur = clamp01(u - k * 0.06);
            if (ur <= 0) continue;
            ctx.beginPath();
            ctx.arc(cx, cy, portee * Math.pow(ur, 0.45), 0, TAU);
            ctx.strokeStyle = rgba(c, (1 - ur) * 0.28 / k);
            ctx.lineWidth = 2 + (1 - ur) * 30 / k;
            ctx.stroke();
          }
        }

        const s = ctx.createRadialGradient(cx, cy, 0, cx, cy, portee);
        s.addColorStop(0, rgba([255, 255, 255], (1 - u) * 0.55));
        s.addColorStop(Math.min(0.98, u), rgba(c, (1 - u) * 0.3));
        s.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = s;
        ctx.fillRect(-ox, -oy, largeur, hauteur);
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      boucleId = requestAnimationFrame(dessiner);
    };

    boucleId = requestAnimationFrame(dessiner);
    return () => {
      vivant = false;
      cancelAnimationFrame(boucleId);
      observateur.disconnect();
    };
  }, [progres, immobile, cible, evenements]);

  return (
    <canvas
      ref={toileRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
