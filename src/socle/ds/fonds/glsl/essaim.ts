/* L ESSAIM : UNE GALAXIE CALCULEE PAR LA CARTE GRAPHIQUE.
 *
 * Soixante mille etoiles, et le processeur n en deplace aucune. Chaque
 * point recoit une fois pour toutes quatre nombres — son rayon, sa
 * phase, son bras et son eclat — et c est le vertex shader qui, a
 * chaque image, en deduit sa position. Rien ne remonte vers la memoire
 * graphique apres le premier envoi.
 *
 * LA SPIRALE est logarithmique : l angle croit comme le logarithme du
 * rayon, le dessin des galaxies reelles. Le centre tourne plus vite que
 * les bords, mais doucement — une rotation differentielle franche
 * enroulerait les bras sur eux-memes en quelques minutes.
 *
 * LE POINTEUR creuse un puits : les etoiles proches tournent autour de
 * lui et s en ecartent un peu. Un effet d a peine quelques pour cent,
 * qu on remarque parce qu il repond.
 *
 * LA LUMIERE S ETALE OU LA MATIERE SE SERRE. Soixante mille points
 * additionnes saturent au blanc la ou ils s entassent, et grenaillent la
 * ou ils sont rares. Dans le bulbe et au milieu des bras, chaque point
 * grossit donc et palit d autant — sa lumiere totale ne change pas,
 * elle se repartit : le coeur devient une lueur, les bras une trainee.
 * Les etoiles les plus vives, elles, restent des points nets.
 *
 * DES NOEUDS LE LONG DES BRAS. Certaines portions de bras, tirees par
 * la suite du nombre d or, s allument a la teinte du pacte : les
 * pouponnieres d etoiles des vraies galaxies, enfilees comme des perles.
 *
 * Les etoiles de champ, repandues sur tout l ecran, passent par le meme
 * programme : un rayon negatif les designe.
 */

export const SOMMETS_ESSAIM = `
attribute vec4 a_graine;
uniform vec2 u_resolution;
uniform float u_temps;
uniform vec3 u_teinte;
uniform vec2 u_souris;
uniform float u_intensite;
uniform float u_defilement;
uniform float u_echelle;
varying vec3 v_couleur;
varying float v_alpha;

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  float r = a_graine.x;

  if (r < 0.0) {
    vec2 champ = a_graine.yz;
    champ.y += u_defilement / u_resolution.y * 0.06;
    champ.y = mod(champ.y + 1.0, 2.0) - 1.0;
    gl_Position = vec4(champ, 0.0, 1.0);
    gl_PointSize = (0.8 + a_graine.w * 1.6) * u_echelle;
    v_couleur = mix(vec3(0.75, 0.84, 1.0), vec3(1.0, 0.9, 0.75), step(0.7, fract(a_graine.y * 13.7)));
    v_alpha = (0.25 + a_graine.w * 0.6) * (0.75 + 0.25 * sin(u_temps * (0.6 + a_graine.w * 2.0) + a_graine.z * 40.0));
    return;
  }

  float bras = floor(a_graine.z);
  float ecart = fract(a_graine.z) - 0.5;
  float bulbe = step(2.5, bras);
  float enroulement = log(max(r, 0.015)) * 2.4;
  float vitesse = 0.03 / (0.25 + r);
  float angle = mix(bras * 2.0944 + enroulement + ecart * (1.1 - r * 0.5) + a_graine.y * 0.3,
                    a_graine.y * 6.2832, bulbe) + u_temps * vitesse;
  float epaisseur = mix((a_graine.w - 0.5) * 0.05 * (1.0 - r) + ecart * 0.02,
                        ecart * 1.6 * r, bulbe);
  vec3 p = vec3(cos(angle) * r, sin(angle) * r, epaisseur);

  float ci = 0.42;
  float si = 0.9075;
  vec3 q = vec3(p.x, p.y * ci - p.z * si, p.y * si + p.z * ci);
  float o = -0.45;
  vec2 s = vec2(q.x * cos(o) - q.y * sin(o), q.x * sin(o) + q.y * cos(o));

  vec2 centre = vec2(-0.2 * aspect, 0.14);
  vec2 ecran = centre + s * 0.95;
  ecran.y += u_defilement / u_resolution.y * 0.08;

  vec2 pointeur = u_souris * vec2(0.5 * aspect, 0.5);
  vec2 vers = ecran - pointeur;
  float puits = exp(-dot(vers, vers) * 36.0);
  ecran += vec2(-vers.y, vers.x) * puits * 0.32 + vers * puits * 0.12;

  gl_Position = vec4(ecran.x * 2.0 / aspect, ecran.y * 2.0, 0.0, 1.0);
  float eclat = a_graine.w;
  float serre = 2.4 * exp(-r * 9.0) + 0.6 * (1.0 - 2.0 * abs(ecart));
  float etale = 1.0 + serre * (1.0 - eclat);
  gl_PointSize = (1.2 + eclat * eclat * 3.5) * etale * u_echelle;

  vec3 chaud = vec3(1.0, 0.84, 0.6);
  vec3 froid = vec3(0.45, 0.72, 1.0);
  vec3 c = mix(chaud, u_teinte * 1.3, smoothstep(0.02, 0.25, r));
  c = mix(c, froid, smoothstep(0.6, 1.0, r) * 0.35);
  float bande = floor(r * 22.0) + bras * 7.0;
  float noeud = step(0.8, fract(bande * 0.618034)) * step(0.3, r) * smoothstep(0.1, 0.0, abs(ecart)) * (1.0 - bulbe);
  c = mix(c, mix(u_teinte * 1.3, vec3(1.0, 0.95, 1.0), 0.55), noeud);
  v_couleur = c;

  float colonne = 1.0 - 0.55 * exp(-pow(ecran.x / (0.34 * aspect), 2.0) * 3.0) * smoothstep(-0.2, 0.3, -ecran.y + 0.2);
  v_alpha = (0.05 + eclat * 0.35) * (0.4 + 0.9 * u_intensite) * (1.0 - smoothstep(0.82, 1.0, r)) * colonne
          * (1.0 + 0.8 * exp(-r * 12.0)) * (1.0 + noeud * 1.6) / pow(etale, 1.6);
}
`;

export const FRAGMENTS_ESSAIM = `
precision mediump float;
varying vec3 v_couleur;
varying float v_alpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(v_couleur * a * a * v_alpha, 1.0);
}
`;
