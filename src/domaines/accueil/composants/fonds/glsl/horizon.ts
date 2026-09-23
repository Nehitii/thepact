import { ENTETE, OUTILS } from "./commun";

/* L HORIZON DES EVENEMENTS.
 *
 * Un trou noir vu presque par la tranche, sur la droite de l ecran, hors
 * de la colonne du contenu. Toutes les longueurs se comptent en rayons de
 * l ombre : le dessin reste le meme quand l intensite la grossit.
 *
 * LA LENTILLE. Chaque pixel lit le ciel a une position deviee vers
 * l exterieur, en rs au carre sur r — l approximation de la lentille
 * mince. Les etoiles du fond s etirent en arcs autour du trou.
 *
 * LE DISQUE, ET SES DEUX IMAGES. La moitie avant du disque barre l ombre
 * d une bande mince ; la moitie arriere est cachee, mais la lumiere
 * qu elle emet est courbee par-dessus le trou : elle reapparait en un
 * arc epais qui epouse l ombre, et, par-dessous, en un filet plus fin.
 * Ce sont ces deux images, collees au bord noir et rejoignant le disque
 * sur les cotes, qui disent « trou noir » — vu de trois quarts, avec un
 * vide entre l ombre et le disque, on lisait des anneaux de Saturne.
 * Entre elles et l ombre, la sphere de photons : un trait, pas un halo.
 *
 * LA MATIERE TOURNE SANS S ENROULER. Un bruit qui tourne plus vite au
 * centre qu au bord s enroule sans fin, et finit en anneaux
 * concentriques au bout d une minute. Deux couches decalees d une
 * demi-periode se relaient donc : l une nait, tourne, s efface pendant
 * que l autre prend le relais. Leur melange est renormalise, sinon le
 * contraste baisserait a chaque passage de relais.
 *
 * LE COTE QUI VIENT VERS NOUS BRILLE. Le disque tourne dans le sens
 * direct : a gauche, la matiere s approche, et l effet Doppler
 * relativiste la rend plus vive et plus blanche ; a droite, elle
 * s eloigne, et s eteint dans la teinte du pacte. */
export const HORIZON = `${ENTETE}${OUTILS}
const float APLATI = 0.13;
const float INTERIEUR = 1.35;
const float EXTERIEUR = 3.9;

float matiere(float a, float rho) {
  float phase = fract(u_temps / 16.0);
  float vitesse = 0.5 * pow(INTERIEUR / max(rho, INTERIEUR), 1.5);
  float t1 = phase * 16.0;
  float t2 = fract(phase + 0.5) * 16.0;
  float m1 = fbm(vec2((a - vitesse * t1) * 3.2, rho * 2.4));
  float m2 = fbm(vec2((a - vitesse * t2) * 3.2 + 11.0, rho * 2.4 + 5.3));
  float w = 1.0 - abs(phase * 2.0 - 1.0);
  return 0.5 + (mix(m2, m1, w) - 0.5) / sqrt(w * w + (1.0 - w) * (1.0 - w));
}

vec3 feu(float a, float rho) {
  float chaleur = pow(clamp(1.0 - (rho - INTERIEUR) / (EXTERIEUR - INTERIEUR), 0.0, 1.0), 2.0);
  float bordChaud = exp(-max(rho - INTERIEUR, 0.0) * 5.0);
  float approche = 0.5 - 0.5 * sin(a);
  float doppler = 0.35 + 0.95 * pow(approche, 1.5);
  vec3 c = mix(u_teinte * 1.2, vec3(1.0, 0.95, 0.88), clamp(chaleur * 0.9 + approche * 0.2, 0.0, 1.0));
  return c * (0.25 + 0.85 * matiere(a, rho)) * (0.1 + 0.8 * chaleur + 0.5 * bordChaud) * doppler;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 centre = vec2(0.5 * aspect - 0.2, 0.17) + u_souris * vec2(0.012, 0.008);
  centre.y += u_defilement / u_resolution.y * 0.05;
  float rs = 0.07 + 0.012 * u_intensite;

  vec2 d = uv - centre;
  float r = length(d);
  vec2 dir = d / max(r, 1e-4);

  vec2 ciel = uv - dir * (rs * rs * 1.9) / max(r, 1e-3);
  ciel += vec2(u_temps * 0.0015, 0.0);
  vec3 couleur = vec3(0.007, 0.008, 0.02);
  couleur += u_teinte * pow(fbm(ciel * 1.8 + 3.1), 3.0) * 0.16;
  couleur += vec3(0.02, 0.1, 0.16) * pow(fbm3(ciel * 2.6 + 9.0), 4.0);
  couleur += etoiles(ciel * 44.0, 0.84, u_temps) + etoiles(ciel * 100.0 + 5.0, 0.9, u_temps) * 0.6;

  float ombre = smoothstep(rs * 0.985, rs * 1.015, r);
  couleur *= ombre;
  couleur += u_teinte * exp(-max(r / rs - 1.0, 0.0) * 1.4) * 0.07 * ombre;

  vec2 axe = vec2(0.955, 0.296);
  vec2 normale = vec2(-0.296, 0.955);
  vec2 dd = vec2(dot(d, axe), dot(d, normale));
  vec2 dp = vec2(dd.x, dd.y / APLATI) / rs;
  float rho = length(dp);
  float dedans = smoothstep(INTERIEUR, INTERIEUR + 0.12, rho) * (1.0 - smoothstep(EXTERIEUR * 0.62, EXTERIEUR, rho));
  if (dedans > 0.0) {
    float a = atan(dp.x, -dp.y);
    couleur += feu(a, rho) * dedans * mix(ombre, 1.0, step(dd.y, 0.0));
  }

  float montee = dot(dir, normale);
  float cote = dot(dir, axe);
  float x = (r / rs - 1.02) / 0.95;
  float haut = pow(clamp((montee + 0.12) / 1.12, 0.0, 1.0), 0.45)
             * smoothstep(0.0, 0.025, x) * (1.0 - smoothstep(0.45, 0.8, x));
  if (haut > 0.001) {
    couleur += feu(3.14159265 - atan(cote, montee), mix(INTERIEUR, EXTERIEUR, clamp(x, 0.0, 1.0))) * haut * 1.5;
  }
  float xb = (r / rs - 1.02) / 0.32;
  float bas = pow(clamp((0.12 - montee) / 1.12, 0.0, 1.0), 0.7)
            * smoothstep(0.0, 0.06, xb) * (1.0 - smoothstep(0.5, 0.9, xb));
  if (bas > 0.001) {
    couleur += feu(3.14159265 - atan(cote, -montee), mix(INTERIEUR, EXTERIEUR, clamp(xb, 0.0, 1.0))) * bas * 0.9;
  }

  float anneau = exp(-pow((r / rs - 1.015) / 0.018, 2.0));
  couleur += mix(u_teinte, vec3(1.0, 0.96, 0.9), 0.7) * anneau * (0.2 + 0.45 * (0.5 - 0.5 * cote));

  couleur *= 0.45 + 0.9 * u_intensite;
  couleur *= 1.0 - 0.45 * smoothstep(0.6, 1.3, length(uv * vec2(0.8, 1.1)));
  gl_FragColor = vec4(max(couleur + tramage(gl_FragCoord.xy), 0.0), 1.0);
}
`;
