import { useEffect, useRef } from "react";

/* LE COEUR
 *
 * Vingt secondes de patience doivent ressembler a quelque chose. Ce
 * n est pas une barre de progression deguisee : c est un reacteur.
 * Plus la main tient, plus il tourne vite, plus il rayonne, plus il
 * jette d ondes et de filaments — et plus le fond se charge avec lui.
 * A la fin il s effondre sur lui-meme, et ce qu il emet efface tout.
 *
 * Tout est peint sur une seule toile, hors de React : la boucle lit une
 * reference, elle ne declenche aucun rendu.
 */

export type PhaseCoeur =
  | "attente" | "montee" | "critique"
  | "implosion" | "singularite" | "explosion" | "revelation" | "verrouille";

interface CoeurStellaireProps {
  /** La progression 0 → 1, ecrite par la page a chaque image. */
  progres: React.MutableRefObject<number>;
  phase: PhaseCoeur;
  immobile: boolean;
}

const TAU = Math.PI * 2;
const NB_ANNEAUX = 5;
const MAX_ONDES = 14;
const MAX_FILAMENTS = 26;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

interface Onde { r: number; force: number }
interface Filament { angle: number; vie: number; duree: number; longueur: number; sens: number }

export function CoeurStellaire({ progres, phase, immobile }: CoeurStellaireProps) {
  const toileRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<PhaseCoeur>(phase);
  const debutPhaseRef = useRef<number>(0);

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
    const inclinaisons = [0.28, 0.55, 0.16, 0.78, 0.42];
    const ondes: Onde[] = [];
    const filaments: Filament[] = [];

    let derniereOnde = 0;
    let dernierFilament = 0;
    let precedent = performance.now();
    let vivant = true;
    let boucleId = 0;

    const emettreOnde = (p: number) => {
      if (ondes.length >= MAX_ONDES) ondes.shift();
      ondes.push({ r: 0, force: 0.35 + p * 0.65 });
    };
    const emettreFilament = (p: number) => {
      if (filaments.length >= MAX_FILAMENTS) filaments.shift();
      filaments.push({
        angle: Math.random() * TAU,
        vie: 0,
        duree: lerp(900, 260, p),
        longueur: lerp(0.25, 1.5, p) * (0.5 + Math.random()),
        sens: Math.random() < 0.5 ? 1 : -1,
      });
    };

    const dessiner = (maintenant: number) => {
      if (!vivant) return;
      const dt = Math.min((maintenant - precedent) / 1000, 0.05);
      precedent = maintenant;

      const p = Math.max(0, Math.min(1, progres.current));
      const ph = phaseRef.current;
      const depuis = (maintenant - debutPhaseRef.current) / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, largeur, hauteur);
      if (largeur === 0 || hauteur === 0) { boucleId = requestAnimationFrame(dessiner); return; }

      const cx = largeur / 2;
      const cy = hauteur / 2;
      const base = Math.min(largeur, hauteur) * 0.15;
      const c = teinte(p);

      /* L effondrement : tout rentre dans le point, puis en jaillit. */
      let echelle = 1;
      let eclat = 1;
      if (ph === "implosion") {
        const u = Math.min(depuis / 0.5, 1);
        echelle = 1 - u * 0.97;
        eclat = 1 + u * 3;
      } else if (ph === "singularite") {
        echelle = 0.03; eclat = 4;
      } else if (ph === "explosion" || ph === "revelation" || ph === "verrouille") {
        echelle = 0;
      }

      // La secousse ne prend le cadre qu a la toute fin.
      const tremble = immobile ? 0 : Math.max(0, p - 0.55) * 26;
      const ox = (Math.random() - 0.5) * tremble;
      const oy = (Math.random() - 0.5) * tremble;
      ctx.translate(ox, oy);

      // ── Le fond : il se charge avec le coeur ──────────────────
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(largeur, hauteur) * 0.8);
      halo.addColorStop(0, rgba(c, (0.10 + p * 0.34) * eclat));
      halo.addColorStop(0.28, rgba(c, (0.05 + p * 0.20) * eclat));
      halo.addColorStop(0.7, rgba(c, 0.02 + p * 0.07));
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(-ox, -oy, largeur, hauteur);

      ctx.globalCompositeOperation = "lighter";

      if (echelle > 0.02) {
        // ── Les ondulations ────────────────────────────────────
        if (!immobile && p > 0 && maintenant - derniereOnde > lerp(1500, 170, p)) {
          derniereOnde = maintenant;
          emettreOnde(p);
        }
        for (let i = ondes.length - 1; i >= 0; i--) {
          const o = ondes[i];
          o.r += dt * lerp(90, 520, p);
          const portee = Math.max(largeur, hauteur) * 0.62;
          const reste = 1 - o.r / portee;
          if (reste <= 0) { ondes.splice(i, 1); continue; }
          ctx.beginPath();
          ctx.arc(cx, cy, o.r * echelle, 0, TAU);
          ctx.strokeStyle = rgba(c, reste * reste * 0.5 * o.force);
          ctx.lineWidth = 1 + reste * 2.5;
          ctx.stroke();
        }

        // ── Les anneaux : la vitesse EST la progression ─────────
        for (let i = 0; i < NB_ANNEAUX; i++) {
          const vitesse = (0.12 + Math.pow(p, 2.2) * 7) * sens[i] * (1 + i * 0.13);
          angles[i] += dt * vitesse * (immobile ? 0.15 : 1);
          const rx = base * (1.35 + i * 0.42) * echelle * (1 - Math.max(0, p - 0.85) * 1.4);
          const ry = rx * inclinaisons[i];
          const alpha = (0.16 + p * 0.5) * (1 - i * 0.1) * eclat;

          for (let couche = 0; couche < 3; couche++) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, angles[i], 0, TAU);
            ctx.strokeStyle = rgba(couche === 0 ? [255, 255, 255] : c, alpha / (couche + 1) ** 2);
            ctx.lineWidth = 0.8 + couche * 2.4 + p * 1.6;
            ctx.stroke();
          }
        }

        // ── Les emanations ─────────────────────────────────────
        if (!immobile && p > 0.08 && maintenant - dernierFilament > lerp(420, 40, p)) {
          dernierFilament = maintenant;
          emettreFilament(p);
        }
        for (let i = filaments.length - 1; i >= 0; i--) {
          const f = filaments[i];
          f.vie += dt * 1000;
          const u = f.vie / f.duree;
          if (u >= 1) { filaments.splice(i, 1); continue; }
          f.angle += dt * f.sens * (0.4 + p * 2);
          const debut = base * echelle * 0.95;
          const fin = debut + base * f.longueur * echelle * (0.35 + u * 1.4);
          const a = Math.sin(u * Math.PI) * (0.35 + p * 0.55);
          const g = ctx.createLinearGradient(
            cx + Math.cos(f.angle) * debut, cy + Math.sin(f.angle) * debut,
            cx + Math.cos(f.angle) * fin, cy + Math.sin(f.angle) * fin,
          );
          g.addColorStop(0, rgba([255, 255, 255], a));
          g.addColorStop(1, rgba(c, 0));
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(f.angle) * debut, cy + Math.sin(f.angle) * debut);
          ctx.lineTo(cx + Math.cos(f.angle) * fin, cy + Math.sin(f.angle) * fin);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1 + p * 2.4;
          ctx.stroke();
        }

        // ── Le coeur ───────────────────────────────────────────
        const souffle = immobile ? 1 : 1 + Math.sin(maintenant / 1000 * (2 + p * 14)) * (0.02 + p * 0.07);
        const r = base * echelle * souffle * (1 + p * 0.35);
        const noyau = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.6);
        noyau.addColorStop(0, rgba([255, 255, 255], Math.min(1, (0.75 + p * 0.25) * eclat)));
        noyau.addColorStop(0.32, rgba(c, Math.min(1, (0.5 + p * 0.5) * eclat)));
        noyau.addColorStop(0.65, rgba(c, 0.16 + p * 0.3));
        noyau.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = noyau;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2.6, 0, TAU);
        ctx.fill();

        // La couronne : un liseré net qui dit ou finit la matiere.
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.strokeStyle = rgba([255, 255, 255], (0.5 + p * 0.5) * eclat);
        ctx.lineWidth = 1 + p * 2;
        ctx.stroke();
      }

      // ── Ce qui jaillit de l effondrement ─────────────────────
      if (ph === "explosion") {
        const u = Math.min(depuis / (immobile ? 0.9 : 0.55), 1);
        const portee = Math.hypot(largeur, hauteur) * 0.75;
        const r = portee * (immobile ? u : Math.pow(u, 0.45));
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.strokeStyle = rgba([255, 255, 255], (1 - u) * 0.9);
        ctx.lineWidth = 6 + (1 - u) * 90;
        ctx.stroke();

        const souffle = ctx.createRadialGradient(cx, cy, 0, cx, cy, portee);
        souffle.addColorStop(0, rgba([255, 255, 255], (1 - u) * 0.55));
        souffle.addColorStop(Math.min(0.98, u), rgba(c, (1 - u) * 0.3));
        souffle.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = souffle;
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
  }, [progres, immobile]);

  return (
    <canvas
      ref={toileRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
