/* CE QUE TOUS LES SHADERS PLEIN ECRAN PARTAGENT.
 *
 * GLSL ES 1.00 : boucles a bornes constantes, pas de `round`, pas de
 * `tanh`. Le hachage est celui de Dave Hoskins — sans `sin`, donc
 * stable d une carte graphique a l autre, la ou `fract(sin(x) * 43758)`
 * dessine des motifs differents selon la precision du materiel.
 *
 * LE TRAMAGE N EST PAS UN DETAIL. Un degrade sombre sur 8 bits par
 * canal fait des marches visibles : entre le noir et un bleu nuit, il
 * n y a que quelques valeurs. Un bruit d un demi-niveau avant la sortie
 * les dissout, et l oeil ne le voit pas.
 */

export const ENTETE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_temps;
uniform vec3 u_teinte;
uniform float u_intensite;
uniform vec2 u_souris;
uniform float u_defilement;
uniform float u_vitesse;
`;

export const OUTILS = `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float bruit(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

const mat2 TOUR = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * bruit(p);
    p = TOUR * p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}

float fbm3(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * bruit(p);
    p = TOUR * p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}

/* Un champ d etoiles cellulaire : au plus une etoile par case, placee et
   allumee au hasard. Le seuil decide de la rarete : 0.9 laisse une case
   sur dix habitee. Trois temperatures, parce qu un ciel monochrome se
   lit comme une trame. */
vec3 etoiles(vec2 p, float seuil, float temps) {
  vec2 cellule = floor(p);
  float h = hash12(cellule);
  if (h < seuil) return vec3(0.0);
  vec2 local = fract(p) - 0.5 - (hash22(cellule) - 0.5) * 0.7;
  float d = length(local);
  float eclat = pow((h - seuil) / (1.0 - seuil), 2.6);
  float scintille = 0.72 + 0.28 * sin(temps * (0.8 + h * 2.4) + h * 60.0);
  float coeur = smoothstep(0.075 + eclat * 0.05, 0.0, d);
  float halo = exp(-d * 16.0) * eclat * 0.55;
  float temperature = hash12(cellule + 7.7);
  vec3 couleur = temperature < 0.3 ? vec3(0.72, 0.82, 1.0)
    : (temperature < 0.82 ? vec3(1.0) : vec3(1.0, 0.85, 0.64));
  return couleur * (coeur + halo) * (0.3 + 0.7 * eclat) * scintille;
}

float tramage(vec2 fc) {
  return (hash12(fc + fract(u_temps * 7.13) * 91.7) - 0.5) / 255.0;
}
`;
