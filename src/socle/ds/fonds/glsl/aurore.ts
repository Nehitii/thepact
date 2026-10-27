import { ENTETE, OUTILS } from "./commun";

/* L AURORE.
 *
 * Trois rideaux dans le haut de l ecran. Chacun a un bord bas net et
 * plus blanc — c est la que la lumiere nait, a l altitude ou les
 * particules solaires rencontrent l oxygene — et des rayons qui montent
 * en s effacant.
 *
 * CE QUI SEPARE UN RIDEAU D UNE DUNE. Une bande lumineuse de largeur
 * constante, bord net en bas, fondu en haut, empilee sur ses voisines :
 * c est un paysage de sable. Une aurore, elle, est faite de RAYONS —
 * des stries verticales tres contrastees, de hauteurs inegales — et
 * elle ne brule pas partout a la fois : chaque rideau s allume par
 * endroits, s eteint ailleurs, et ces plages derivent le long de lui.
 * Le bord bas n est net que la ou le rideau brille : partout net, il
 * tracerait sur tout l ecran une ligne d horizon qui n existe pas.
 * Le bord ondule a deux frequences plus un bruit lent : une seule
 * sinusoide ferait une vague, pas un pli. Bas sur l horizon, une lueur
 * verte a peine visible — la luminescence du ciel — tient le bas de
 * l ecran, qui sans elle serait un trou noir.
 *
 * La couleur suit la physique, a peine trichee : vert-cyan au bord bas
 * (l oxygene, 557 nm), la teinte du pacte en montant, la ou une vraie
 * aurore vire au rouge ou au violet. */
export const AURORE = `${ENTETE}${OUTILS}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_temps * 0.05;
  float montee = u_defilement / u_resolution.y * 0.12;

  vec3 couleur = mix(vec3(0.0, 0.004, 0.012), vec3(0.006, 0.018, 0.045), smoothstep(0.2, 1.0, uv.y));
  couleur += etoiles(p * 52.0 + vec2(0.0, montee * 30.0), 0.87, u_temps) * smoothstep(-0.2, 0.8, uv.y);
  couleur += vec3(0.015, 0.06, 0.04) * exp(-abs(uv.y - 0.3) * 6.0) * (0.4 + 0.6 * u_intensite);

  vec3 lumiere = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = p.x * (0.85 + fi * 0.2) + fi * 7.3;
    float ondule = 0.055 * sin(x * 2.3 + t * (1.0 + fi * 0.3))
                 + 0.025 * sin(x * 5.9 - t * 1.6 + fi * 2.0)
                 + 0.12 * (fbm3(vec2(x * 0.8 + fi * 3.1, t * 0.2)) - 0.5);
    float base = 0.5 + fi * 0.12 + ondule + montee;
    float h = uv.y - base;

    float presence = smoothstep(0.3, 0.58, fbm3(vec2(x * 0.6 - t * 0.35, fi * 5.0 + t * 0.1)));
    presence *= 0.35 + 0.65 * presence;
    float bordNet = smoothstep(-0.006 - (1.0 - presence) * 0.06, 0.01, h);
    float hauteur = 0.1 + 0.16 * bruit(vec2(x * 9.0 + t * 0.5, fi * 2.0));
    float elan = exp(-max(h, 0.0) / hauteur * 1.6);
    float rayons = pow(bruit(vec2(x * 46.0 + t * 0.6, fi * 3.0 + t * 0.4)), 1.8);
    float filets = bruit(vec2(x * 150.0 - t * 0.8, fi * 9.0));
    float drape = 0.18 + 1.1 * rayons + 0.22 * filets;

    float force = bordNet * elan * drape * presence * (0.85 - fi * 0.2);
    vec3 teinte = mix(vec3(0.12, 0.95, 0.6), u_teinte * 1.15, smoothstep(0.02, 0.2, h));
    teinte += vec3(0.55, 1.0, 0.8) * exp(-max(h, 0.0) * 70.0) * 0.4;
    lumiere += teinte * force;
  }
  couleur += lumiere * (0.6 + 1.1 * u_intensite);

  couleur *= mix(0.5, 1.0, smoothstep(0.25, 0.7, uv.y));
  couleur *= 1.0 - 0.35 * smoothstep(0.6, 1.3, length((uv - vec2(0.5, 0.55)) * vec2(aspect * 0.6, 1.0)));
  gl_FragColor = vec4(max(couleur + tramage(gl_FragCoord.xy), 0.0), 1.0);
}
`;
