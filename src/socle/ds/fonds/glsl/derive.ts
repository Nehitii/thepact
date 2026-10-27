import { ENTETE, OUTILS } from "./commun";

/* LA DERIVE : DES ETOILES EN PERSPECTIVE.
 *
 * Chaque etoile est un trait de deux sommets, la tete et la queue. Les
 * deux ont la meme position dans le plan, mais pas la meme profondeur :
 * la queue est un peu plus loin, et la division perspective les ecarte
 * d autant plus que l etoile est proche. A vitesse de croisiere, les
 * proches sont de courts tirets et les lointaines des points ; quand le
 * defilement accelere, la queue s allonge et le ciel se met a filer.
 *
 * La DISTANCE PARCOURUE est integree cote processeur, image apres image,
 * et non calculee comme temps × vitesse : sinon, chaque changement de
 * vitesse ferait sauter tout le champ d un coup. Le shader ne recoit
 * qu elle, et la longueur de la trainee.
 *
 * Le point de fuite est un peu au-dessus du centre, derriere le bandeau :
 * les etoiles naissent sous le contenu et filent vers les marges, la ou
 * elles se voient. Le plan des etoiles est deux fois plus large que
 * haut : sans quoi les lointaines, serrees vers le point de fuite,
 * n atteindraient jamais les marges d un ecran large.
 */

export const SOMMETS_DERIVE = `
attribute vec4 a_etoile;
uniform vec2 u_resolution;
uniform float u_distance;
uniform float u_trainee;
uniform vec3 u_teinte;
uniform float u_intensite;
uniform vec2 u_souris;
varying float v_alpha;
varying vec3 v_couleur;

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  float z = fract(a_etoile.z - u_distance);
  float profondeur = z + a_etoile.w * u_trainee;
  vec2 p = a_etoile.xy / (profondeur * 1.7 + 0.05);
  p += vec2(0.0, 0.14) + u_souris * vec2(0.03, 0.02) * (1.0 - z);
  gl_Position = vec4(p.x / aspect, p.y, 0.0, 1.0);

  float apparition = smoothstep(1.0, 0.72, z) * smoothstep(0.0, 0.05, z);
  float eclat = fract(a_etoile.x * 37.3 - a_etoile.y * 57.9);
  v_alpha = apparition * (1.0 - a_etoile.w * 0.9) * (0.5 + 0.8 * u_intensite)
          * (0.35 + 0.9 * (1.0 - z)) * (0.55 + 0.9 * eclat * eclat);
  float teinte = step(0.84, fract(a_etoile.x * 91.7 + a_etoile.y * 17.3));
  v_couleur = mix(vec3(0.78, 0.87, 1.0), u_teinte * 1.2, teinte);
}
`;

export const FRAGMENTS_DERIVE = `
precision mediump float;
varying float v_alpha;
varying vec3 v_couleur;
void main() { gl_FragColor = vec4(v_couleur * v_alpha, 1.0); }
`;

/* Le fond sur lequel les traits se posent. Un champ d etoiles fixes,
   trop lointaines pour bouger quand le vaisseau avance — c est ce qui
   donne sa profondeur au mouvement des autres —, une brume froide, et
   une lueur de la teinte du pacte au point de fuite, la ou l on va. */
export const FOND_DERIVE = `${ENTETE}${OUTILS}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec3 c = vec3(0.004, 0.006, 0.018);
  float lueur = exp(-length((uv - vec2(0.0, 0.07)) * vec2(0.9, 1.6)) * 2.6);
  c += u_teinte * lueur * (0.06 + 0.14 * u_intensite);
  c += vec3(0.02, 0.1, 0.16) * pow(fbm3(uv * 1.6 + 4.0), 3.0) * 0.5;
  c += etoiles(uv * 70.0, 0.9, u_temps) * 0.45 + etoiles(uv * 150.0 + 7.0, 0.93, u_temps) * 0.3;
  c *= 1.0 - 0.4 * smoothstep(0.5, 1.2, length(uv));
  gl_FragColor = vec4(max(c + tramage(gl_FragCoord.xy), 0.0), 1.0);
}
`;
