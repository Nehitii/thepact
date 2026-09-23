import { ENTETE, OUTILS } from "./commun";

/* L ORBITE.
 *
 * Une planete dont on ne voit que le haut, au bas de l ecran, du cote
 * de la nuit. Pour chaque pixel du disque on retrouve la normale de la
 * sphere, donc une latitude et une longitude : les continents et les
 * villes sont du bruit lu dans ces coordonnees, et la planete tourne en
 * faisant glisser la longitude.
 *
 * LES VILLES sont un bruit tres serre, pousse a la puissance six pour
 * n en garder que les pics, et confine aux terres par un second bruit
 * plus large : des megapoles en grappes, pas un semis regulier.
 *
 * LE SOLEIL arrive de derriere, a droite : un croissant de jour mince
 * sur le limbe, et les villes s eteignent la ou il eclaire.
 *
 * L ATMOSPHERE est dans la teinte du pacte : un liseré a l interieur du
 * limbe, un halo au-dehors. C est elle qui dit a qui est ce monde. */
export const ORBITE = `${ENTETE}${OUTILS}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float defil = u_defilement / u_resolution.y;

  vec3 couleur = vec3(0.004, 0.006, 0.016);
  vec2 ps = uv + vec2(0.0, defil * 0.05) + u_souris * 0.01;
  couleur += etoiles(ps * 46.0, 0.86, u_temps) + etoiles(ps * 110.0 + 3.0, 0.91, u_temps) * 0.6;

  float R = 1.25;
  vec2 C = vec2(0.0, -0.5 - R + 0.23 + defil * 0.1);
  vec2 d = (uv - C) / R;
  float r2 = dot(d, d);

  if (r2 < 1.0) {
    float z = sqrt(1.0 - r2);
    vec3 n = vec3(d, z);
    float lon = atan(n.x, n.z) + u_temps * 0.006;
    float lat = asin(clamp(n.y, -1.0, 1.0));
    vec2 geo = vec2(lon, lat) * 2.2;
    float terre = smoothstep(0.5, 0.56, fbm(geo * 1.7 + 4.0));
    float villes = pow(bruit(geo * 60.0), 6.0) * smoothstep(0.45, 0.7, fbm3(geo * 6.0 + 1.3)) * terre;
    villes += pow(bruit(geo * 140.0 + 7.0), 10.0) * terre * 0.6;

    vec3 soleil = normalize(vec3(0.95, 0.35, -0.55));
    float jour = clamp(dot(n, soleil), 0.0, 1.0);
    vec3 sol = mix(vec3(0.004, 0.012, 0.03), vec3(0.012, 0.018, 0.014), terre);
    vec3 surface = sol + vec3(1.0, 0.72, 0.38) * villes * 1.5 * (1.0 - smoothstep(0.0, 0.25, jour));
    surface += vec3(0.25, 0.42, 0.62) * pow(jour, 1.5) * 0.45;

    float limbe = pow(1.0 - z, 3.0);
    surface += u_teinte * limbe * 0.6 + vec3(0.2, 0.55, 1.0) * limbe * 0.12;
    couleur = mix(couleur, surface, smoothstep(1.0, 0.994, r2));
  }

  float dehors = sqrt(r2) - 1.0;
  float halo = exp(-max(dehors, 0.0) * 34.0) * step(0.0, dehors);
  couleur += (u_teinte * 0.85 + vec3(0.15, 0.4, 0.8) * 0.25) * halo * (0.4 + 0.7 * u_intensite);
  float aube = exp(-length(d - vec2(0.62, 0.78)) * 5.0) * step(0.0, dehors + 0.02);
  couleur += vec3(1.0, 0.86, 0.66) * aube * 0.25 * (0.4 + 0.6 * u_intensite);

  couleur *= 0.55 + 0.7 * u_intensite;
  gl_FragColor = vec4(max(couleur + tramage(gl_FragCoord.xy), 0.0), 1.0);
}
`;
