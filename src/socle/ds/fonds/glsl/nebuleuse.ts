import { ENTETE, OUTILS } from "./commun";

/* LA NEBULEUSE.
 *
 * Du bruit fractal a domaine deforme, la technique d Inigo Quilez : on
 * ne lit pas le bruit a la position du pixel, mais a une position
 * elle-meme deplacee par du bruit, deux fois. C est ce double repli qui
 * donne les volutes — un bruit simple ne fait que des taches.
 *
 * LA DENSITE D ABORD, LA COULEUR ENSUITE. Le bruit brut est une brume
 * moyenne partout ; on le tranche en nuages francs et en vides
 * profonds, puis chaque couleur prend une region, et une seule :
 * - le corps du nuage, a la teinte du pacte ;
 * - ses lisieres, ni vides ni pleines, au cyan du systeme — la ou, dans
 *   une vraie nebuleuse, le gaz est ionise par les etoiles voisines ;
 * - les coeurs les plus denses, d un blanc chaud.
 * Des voies de poussiere sombre le creusent : la matiere absorbe autant
 * qu elle brille. Dans les vides, les etoiles reprennent le dessus.
 *
 * Le centre est eteint a 80 % : c est la que vit le contenu. */
export const NEBULEUSE = `${ENTETE}${OUTILS}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec2 decalage = u_souris * 0.035 + vec2(0.0, u_defilement / u_resolution.y * 0.1);
  vec2 p = (uv + decalage) * 1.55;
  float t = u_temps * 0.022;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.8 * q + vec2(1.7, 9.2) + 0.35 * t),
                fbm(p + 3.8 * q + vec2(8.3, 2.8) - 0.28 * t));
  float f = fbm(p + 3.8 * r);

  float densite = smoothstep(0.30, 0.84, f);
  float lisiere = densite * (1.0 - densite) * 4.0;
  float coeur = smoothstep(0.6, 1.0, densite) * smoothstep(0.42, 0.78, r.x);

  vec3 couleur = u_teinte * (0.1 * densite + 0.95 * densite * densite);
  couleur += vec3(0.04, 0.52, 0.76) * lisiere * smoothstep(0.5, 0.95, length(q)) * 0.55;
  couleur = mix(couleur, vec3(1.0, 0.87, 0.72) * 0.9, coeur * 0.6);

  float poussiere = smoothstep(0.5, 0.76, fbm3(p * 2.2 + r * 1.3 + 7.0));
  couleur *= 1.0 - poussiere * 0.7;
  couleur += vec3(0.004, 0.006, 0.018);

  float centre = smoothstep(0.08, 0.95, length(uv * vec2(0.72, 1.05)));
  couleur *= mix(0.2, 1.0, centre) * (0.3 + 1.0 * u_intensite);

  vec2 ps = uv + decalage * 0.5;
  vec3 champ = etoiles(ps * 42.0, 0.85, u_temps) * 1.3 + etoiles(ps * 95.0 + 13.0, 0.89, u_temps * 1.3) * 0.8;
  couleur += champ * (1.0 - 0.8 * densite);

  couleur *= 1.0 - 0.5 * smoothstep(0.55, 1.25, length(uv * vec2(0.85, 1.15)));
  gl_FragColor = vec4(max(couleur + tramage(gl_FragCoord.xy), 0.0), 1.0);
}
`;
