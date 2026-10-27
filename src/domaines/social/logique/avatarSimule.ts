/* UN AVATAR POUR LES GRIMPEURS DE LA CORDEE.
 *
 * POURQUOI PAS DES PHOTOS. Coller des visages sur des comptes qui
 * n existent pas, ce serait fabriquer des gens — et ces visages
 * viendraient forcement de quelqu un, ou d une machine qui a appris
 * sur quelqu un. Une cordee assumee n a pas besoin de ca.
 *
 * Un avatar genere, en revanche, est exactement ce que mettent Linear,
 * Vercel ou GitHub a qui n a pas depose de photo : une figure abstraite
 * tiree de l identifiant. C est varie, c est personnel, c est stable —
 * et ca ne pretend etre le portrait de personne.
 *
 * Rien ne sort du navigateur : l image est un SVG construit ici et
 * passe en data URI. Aucun service tiers, aucune requete, rien a
 * bloquer.
 */

/* Un melange deterministe — la variante de Fowler-Noll-Vo. Deux noms
   proches donnent deux figures franchement differentes, ce qui n est
   pas le cas d une simple somme de codes. */
function graine(cle: string): number {
  let h = 2166136261;
  for (let i = 0; i < cle.length; i++) {
    h ^= cle.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* Un generateur suivant, pour tirer plusieurs valeurs d une graine
   sans qu elles soient correlees. */
function suite(etat: number) {
  let x = etat || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 0xffffffff;
  };
}

/** Un SVG en data URI, stable pour une meme clef. */
export function avatarSimule(cle: string): string {
  const r = suite(graine(cle));

  /* Deux teintes voisines sur le cercle : un degrade a deux couleurs
     opposees vire au sale des qu elles se melangent. */
  const teinte = Math.floor(r() * 360);
  const teinte2 = (teinte + 24 + Math.floor(r() * 46)) % 360;
  const sat = 52 + Math.floor(r() * 26);
  const lum = 38 + Math.floor(r() * 14);

  const fond = `hsl(${teinte} ${sat}% ${lum}%)`;
  const fond2 = `hsl(${teinte2} ${sat}% ${Math.max(16, lum - 20)}%)`;

  /* Trois formes, posees puis coupees par le cadre. Les rayons sont
     larges : de petites formes disparaissent a la taille ou l avatar
     est reellement affiche, quarante pixels. */
  const formes: string[] = [];
  for (let i = 0; i < 3; i++) {
    const cx = Math.round(r() * 100);
    const cy = Math.round(r() * 100);
    const rr = 26 + Math.round(r() * 38);
    const o = (0.14 + r() * 0.22).toFixed(2);
    const clair = r() > 0.5 ? 255 : 0;
    formes.push(
      `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="rgb(${clair},${clair},${clair})" opacity="${o}"/>`,
    );
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${fond}"/><stop offset="1" stop-color="${fond2}"/>` +
    `</linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#g)"/>` +
    formes.join("") +
    `</svg>`;

  /* encodeURIComponent plutot que btoa : le SVG ne contient que de
     l ASCII ici, mais un nom accentue passerait un jour dedans et
     btoa echouerait sur lui. */
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
