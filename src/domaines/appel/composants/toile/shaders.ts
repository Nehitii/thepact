/* LES SHADERS DE LA LUMIERE.
 *
 * Quatre programmes, un triangle plein ecran chacun :
 *
 *   EXTRAIRE   la scene, moyennee sur quatre texels et reduite de
 *              moitie ; ne garde que ce qui passe le seuil doux.
 *   DESCENDRE  une reduction de moitie a cinq prises (filtre « dual »
 *              de Kawase) : le flou s elargit d un etage a l autre.
 *   REMONTER   l agrandissement a huit prises, ajoute sur l etage du
 *              dessus avec un poids inferieur a un : la somme des etages
 *              fait le halo, net au pied, et chaque etage plus large
 *              pese moins — un halo qui s etale grise tout le cadre.
 *   COMPOSER   la scene sur le fond de la page, plus le halo, pliee par
 *              l epaule, puis le grain — plus visible dans les ombres,
 *              comme sur une pellicule.
 *
 * Les couleurs sont ramenees en lineaire (gamma 2,2) avant d etre
 * additionnees : additionner du sRGB eclaircit trop les demi-teintes.
 * L epaule et le seuil doux sont ceux de `logique/lumiere.ts`. */

export const SOMMET = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const TETE = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 o;
uniform sampler2D u_source;
uniform vec2 u_texel;
`;

export const EXTRAIRE = `${TETE}
uniform float u_seuil;
uniform float u_genou;
void main() {
  vec3 c = texture(u_source, v_uv + u_texel * vec2(-0.5, -0.5)).rgb
         + texture(u_source, v_uv + u_texel * vec2( 0.5, -0.5)).rgb
         + texture(u_source, v_uv + u_texel * vec2(-0.5,  0.5)).rgb
         + texture(u_source, v_uv + u_texel * vec2( 0.5,  0.5)).rgb;
  c = pow(c * 0.25, vec3(2.2));
  float l = max(c.r, max(c.g, c.b));
  float d = clamp(l - u_seuil + u_genou, 0.0, 2.0 * u_genou);
  float part = max(d * d / (4.0 * u_genou + 1e-4), l - u_seuil) / max(l, 1e-4);
  o = vec4(c * part, 1.0);
}`;

export const DESCENDRE = `${TETE}
void main() {
  vec3 s = texture(u_source, v_uv).rgb * 4.0
         + texture(u_source, v_uv - u_texel).rgb
         + texture(u_source, v_uv + u_texel).rgb
         + texture(u_source, v_uv + vec2(u_texel.x, -u_texel.y)).rgb
         + texture(u_source, v_uv - vec2(u_texel.x, -u_texel.y)).rgb;
  o = vec4(s / 8.0, 1.0);
}`;

export const REMONTER = `${TETE}
void main() {
  vec2 t = u_texel;
  vec3 s = texture(u_source, v_uv + vec2(-2.0 * t.x, 0.0)).rgb
         + texture(u_source, v_uv + vec2(-t.x, t.y)).rgb * 2.0
         + texture(u_source, v_uv + vec2(0.0, 2.0 * t.y)).rgb
         + texture(u_source, v_uv + vec2(t.x, t.y)).rgb * 2.0
         + texture(u_source, v_uv + vec2(2.0 * t.x, 0.0)).rgb
         + texture(u_source, v_uv + vec2(t.x, -t.y)).rgb * 2.0
         + texture(u_source, v_uv + vec2(0.0, -2.0 * t.y)).rgb
         + texture(u_source, v_uv + vec2(-t.x, -t.y)).rgb * 2.0;
  o = vec4(s / 12.0, 1.0);
}`;

export const COMPOSER = `${TETE}
uniform sampler2D u_halo;
uniform vec3 u_fond;
uniform float u_exposition;
uniform float u_eclat;
uniform float u_grain;
uniform float u_temps;
uniform float u_plancher;
uniform float u_bandes;
const float GENOU = 0.85;
vec3 epaule(vec3 x) {
  vec3 au_dela = GENOU + (1.0 - GENOU) * (1.0 - exp(-(x - GENOU) / (1.0 - GENOU)));
  return mix(x, au_dela, step(GENOU, x));
}
float hasard(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  /* La scene posee sur le fond COMME LE NAVIGATEUR LE FAISAIT, en sRGB,
     puis ramenee en lineaire : sinon les voiles changeraient de teinte. */
  vec4 s = texture(u_source, v_uv);
  vec3 lineaire = pow(s.rgb + u_fond * (1.0 - s.a), vec3(2.2));
  /* Le plancher coupe la traine du halo : sous lui, elle ne ferait que
     griser le noir que la table de montage a gagne. */
  vec3 halo = max(texture(u_halo, v_uv).rgb - u_plancher, 0.0);
  vec3 lumiere = lineaire * u_exposition + halo * u_eclat;
  vec3 c = pow(epaule(lumiere), vec3(1.0 / 2.2));
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c += (hasard(gl_FragCoord.xy + fract(u_temps * 0.37) * 911.0) - 0.5) * u_grain * (0.35 + 0.65 * (1.0 - l));
  /* Les bandes restent du noir : ni halo, ni grain n y passent. */
  float bande = step(v_uv.y, u_bandes) + step(1.0 - u_bandes, v_uv.y);
  o = vec4(c * (1.0 - min(bande, 1.0)), 1.0);
}`;
