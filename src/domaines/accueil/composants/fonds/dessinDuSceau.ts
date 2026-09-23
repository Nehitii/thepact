/* LE SCEAU, DESSINE DANS UN CIEL.
 *
 * Commun a la constellation et a l atlas : les deux posent l etoile du
 * pacte — le polygone {n/k} de `rosaceDuPacte` — et en allument les
 * traits a mesure que les objectifs s accomplissent.
 *
 * UN POLYGONE ETOILE PEUT ETRE COMPOSE. {6/2} n est pas une etoile a
 * six branches tracee d un trait : ce sont deux triangles. Parcourir
 * les sommets de k en k depuis 0 n en visiterait que la moitie. On
 * parcourt donc chaque boucle depuis son propre depart : les n aretes y
 * sont toutes, dans l ordre ou une main les tracerait. */

export interface Point {
  x: number;
  y: number;
}

export function rgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  const [r, g, b] = m ? [m[1], m[2], m[3]].map((c) => parseInt(c, 16)) : [139, 92, 246];
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

/** Les sommets de l etoile, en partant du haut, dans le sens horaire. */
export function sommetsDuSceau(ordre: number, centre: Point, rayon: number, angle: number): Point[] {
  return Array.from({ length: ordre }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / ordre + angle;
    return { x: centre.x + rayon * Math.cos(a), y: centre.y + rayon * Math.sin(a) };
  });
}

function pgcd(a: number, b: number): number {
  return b === 0 ? a : pgcd(b, a % b);
}

/** Les aretes du polygone {n/k}, dans l ordre ou une main les tracerait :
 *  chaque boucle d un trait, puis la suivante. {6/2} donne un triangle,
 *  puis l autre ; {7/3} une seule boucle de sept aretes. */
export function aretesDuSceau(ordre: number, pas: number): [number, number][] {
  const boucles = Math.max(1, pgcd(ordre, pas));
  const aretes: [number, number][] = [];
  for (let depart = 0; depart < boucles; depart++) {
    let j = depart;
    for (let i = 0; i < ordre / boucles; i++) {
      aretes.push([j, (j + pas) % ordre]);
      j = (j + pas) % ordre;
    }
  }
  return aretes;
}

/** Combien d aretes sont allumees pour une progression donnee. On
 *  allume des TRAITS, pas des points : un sceau a moitie trace se lit,
 *  une poignee de sommets isoles non. */
export function aretesAllumees(ordre: number, progression: number): number {
  return Math.round(Math.max(0, Math.min(1, progression)) * ordre);
}

interface Style {
  teinte: string;
  /** Multiplie toutes les opacites : l intensite du fond. */
  force: number;
  /** Encre de gravure (atlas en theme clair) plutot que lumiere. */
  encre?: boolean;
  echelle: number;
  /** De 0 a 1 : la part du trace deja dessinee, pour l apparition. */
  revele: number;
  temps: number;
}

/** Trace l etoile du pacte, ses sommets et les noms des valeurs. */
export function dessinerLeSceau(
  ctx: CanvasRenderingContext2D,
  sommets: Point[],
  aretes: [number, number][],
  allumees: number,
  valeurs: readonly { nom: string; sommet: number }[],
  centre: Point,
  { teinte, force, encre = false, echelle: k, revele, temps }: Style,
): void {
  const n = aretes.length;
  const allumes = new Set<number>();
  aretes.slice(0, allumees).forEach(([a, b]) => { allumes.add(a); allumes.add(b); });
  const estAllume = (i: number) => allumes.has(i);

  aretes.forEach(([a, b], i) => {
    const part = Math.max(0, Math.min(1, revele * n - i));
    if (part <= 0) return;
    const A = sommets[a];
    const B = { x: A.x + (sommets[b].x - A.x) * part, y: A.y + (sommets[b].y - A.y) * part };
    const allume = i < allumees;
    ctx.save();
    if (allume) {
      if (!encre) {
        ctx.strokeStyle = rgba(teinte, 0.1 * force);
        ctx.lineWidth = 5 * k;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
      ctx.strokeStyle = rgba(teinte, 0.9 * force);
      ctx.lineWidth = 1.5 * k;
    } else {
      ctx.strokeStyle = rgba(teinte, 0.34 * force);
      ctx.lineWidth = 1 * k;
      ctx.setLineDash([3 * k, 5 * k]);
    }
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    ctx.restore();
  });

  sommets.forEach((p, i) => {
    if (estAllume(i)) {
      const vibre = encre ? 1 : 0.85 + 0.15 * Math.sin(temps * 1.3 + i * 1.7);
      if (!encre) {
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 11 * k);
        halo.addColorStop(0, rgba(teinte, 0.55 * force * vibre));
        halo.addColorStop(1, rgba(teinte, 0));
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(p.x, p.y, 11 * k, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rgba("#ffffff", 0.35 * force * vibre);
        ctx.lineWidth = 0.8 * k;
        ctx.beginPath();
        ctx.moveTo(p.x - 12 * k, p.y); ctx.lineTo(p.x + 12 * k, p.y);
        ctx.moveTo(p.x, p.y - 12 * k); ctx.lineTo(p.x, p.y + 12 * k);
        ctx.stroke();
      }
      ctx.fillStyle = encre ? rgba(teinte, 0.95 * force) : rgba("#ffffff", 0.95 * force);
      ctx.beginPath(); ctx.arc(p.x, p.y, (encre ? 2.6 : 2) * k, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = rgba(teinte, 0.45 * force);
      ctx.lineWidth = 1 * k;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.8 * k, 0, Math.PI * 2); ctx.stroke();
    }
  });

  ctx.save();
  ctx.font = `600 ${10 * k}px Orbitron, Rajdhani, sans-serif`;
  ctx.textBaseline = "middle";
  valeurs.forEach(({ nom, sommet }) => {
    const p = sommets[sommet];
    if (!p) return;
    const dx = p.x - centre.x;
    const dy = p.y - centre.y;
    const d = Math.hypot(dx, dy) || 1;
    const ecart = 16 * k;
    const x = p.x + (dx / d) * ecart;
    const y = p.y + (dy / d) * ecart;
    ctx.textAlign = Math.abs(dx / d) < 0.3 ? "center" : dx > 0 ? "left" : "right";
    ctx.fillStyle = rgba(teinte, (estAllume(sommet) ? 0.92 : 0.55) * force);
    ctx.fillText(espacer(nom.toUpperCase()), x, y);
  });
  ctx.restore();
}

/* Des capitales espacees sans `letterSpacing`, que Safari n a pas
   partout : une espace fine entre chaque lettre. */
function espacer(mot: string): string {
  return mot.split("").join(" ");
}
