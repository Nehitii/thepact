import type { PhaseCoeur } from "@/domaines/appel/logique/coeur";
import {
  ETAGES_DU_HALO, PLANCHER_DU_HALO, POIDS_DE_LA_REMONTEE, reglageDeLaLumiere,
} from "@/domaines/appel/logique/lumiere";
import { COMPOSER, DESCENDRE, EXTRAIRE, REMONTER, SOMMET } from "./shaders";

/* LA LUMIERE, SUR LE PROCESSEUR GRAPHIQUE.
 *
 * Une seconde toile, WebGL2, posee sur la premiere. A chaque image, la
 * toile 2D — qui continue de peindre tout ce qu elle peignait — devient
 * une texture ; la passe en extrait les lumieres, les floute en
 * cascade sur cinq etages, les rajoute a la scene, plie le tout par
 * l epaule et pose le grain (voir `shaders.ts`). Quand elle est active,
 * la toile 2D est rendue invisible ; elle reste la source.
 *
 * ELLE S EFFACE D ELLE-MEME, ET LA TOILE 2D REPREND :
 *   — sans WebGL2, ou si un shader ne compile pas ;
 *   — en theme clair : l encre ne rayonne pas ;
 *   — si le contexte graphique est perdu ;
 *   — si la machine ne suit pas : plus de la moitie des images au-dela
 *     de 33 ms sur une fenetre de quatre-vingt-dix, et la passe se
 *     retire pour la session.
 * Dans tous ces cas, l ecran est exactement celui d avant. */

const ETAGES = ETAGES_DU_HALO;
const IMAGE_LENTE = 1000 / 30;
const FENETRE = 90;

export interface ImageDeLaLumiere {
  p: number;
  phase: PhaseCoeur;
  /** Depuis le debut de la phase, en secondes. */
  depuis: number;
  /** A quel point la fusion commande, de zero a un. */
  focus: number;
  immobile: boolean;
  sombre: boolean;
  /** L horloge de la toile, en millisecondes. */
  maintenant: number;
  /** La hauteur de chaque bande, en part de la hauteur : elle reste noire. */
  bandes: number;
}

export interface Lumiere {
  redimensionner(largeur: number, hauteur: number): void;
  peindre(image: ImageDeLaLumiere): void;
  liberer(): void;
}

interface Etage { texture: WebGLTexture; tampon: WebGLFramebuffer; largeur: number; hauteur: number }

/* Le fond de la page, en sRGB de zero a un : la scene y etait posee par
   le navigateur, la passe l y pose elle-meme. */
function lireLeFond(element: HTMLElement): [number, number, number] {
  for (let e: HTMLElement | null = element.parentElement; e; e = e.parentElement) {
    const m = getComputedStyle(e).backgroundColor.match(/[\d.]+/g);
    if (m && (m.length < 4 || Number(m[3]) > 0)) return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
  }
  return [0, 0, 0];
}

function programme(gl: WebGL2RenderingContext, fragment: string): WebGLProgram | null {
  const compiler = (type: number, source: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const v = compiler(gl.VERTEX_SHADER, SOMMET), f = compiler(gl.FRAGMENT_SHADER, fragment);
  const p = gl.createProgram();
  if (!v || !f || !p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

const INERTE: Lumiere = { redimensionner() {}, peindre() {}, liberer() {} };

export function creerLaLumiere(toileGL: HTMLCanvasElement | null, toile2D: HTMLCanvasElement): Lumiere {
  if (!toileGL) return INERTE;
  const gl = toileGL.getContext("webgl2", {
    alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  if (!gl) return INERTE;
  const extraire = programme(gl, EXTRAIRE), descendre = programme(gl, DESCENDRE);
  const remonter = programme(gl, REMONTER), composer = programme(gl, COMPOSER);
  if (!extraire || !descendre || !remonter || !composer) return INERTE;

  /* Des demi-flottants quand la carte sait y peindre : le halo s y
     additionne sans se plafonner. Sinon, huit bits — il plafonne, mais
     il est la. */
  const flottant = !!gl.getExtension("EXT_color_buffer_float");
  const uniformes = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
  const u = (p: WebGLProgram, nom: string) => {
    let m = uniformes.get(p);
    if (!m) uniformes.set(p, (m = new Map()));
    if (!m.has(nom)) m.set(nom, gl.getUniformLocation(p, nom));
    return m.get(nom) ?? null;
  };

  const texture = () => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const scene = texture();
  let etages: Etage[] = [];

  let actif = false, banni = false, fond: [number, number, number] = [0, 0, 0], sombreVu: boolean | null = null;
  let derniere = 0, jugees = 0, lentes = 0;

  const montrer = (gpu: boolean) => {
    if (gpu === actif) return;
    actif = gpu;
    toileGL.style.opacity = gpu ? "1" : "0";
    toile2D.style.opacity = gpu ? "0" : "1";
  };
  toileGL.style.opacity = "0";

  const perdu = (e: Event) => { e.preventDefault(); banni = true; montrer(false); };
  toileGL.addEventListener("webglcontextlost", perdu);

  const liberer = () => {
    for (const e of etages) { gl.deleteTexture(e.texture); gl.deleteFramebuffer(e.tampon); }
    etages = [];
  };

  /* La machine suit-elle ? On ne juge que ce qu on voit : un onglet
     cache, une pause, ne comptent pas. */
  const surveiller = () => {
    const ici = performance.now();
    const ecart = ici - derniere;
    derniere = ici;
    if (document.visibilityState !== "visible" || ecart <= 0 || ecart > 250) return;
    jugees++;
    if (ecart > IMAGE_LENTE) lentes++;
    if (jugees < FENETRE) return;
    if (lentes / jugees > 0.5) { banni = true; montrer(false); }
    jugees = 0;
    lentes = 0;
  };

  const passe = (prog: WebGLProgram, source: WebGLTexture, cible: Etage | null, tx: number, ty: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, cible ? cible.tampon : null);
    gl.viewport(0, 0, cible ? cible.largeur : toileGL.width, cible ? cible.hauteur : toileGL.height);
    gl.useProgram(prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source);
    gl.uniform1i(u(prog, "u_source"), 0);
    gl.uniform2f(u(prog, "u_texel"), tx, ty);
  };

  return {
    redimensionner(largeur: number, hauteur: number) {
      toileGL.width = Math.max(1, largeur);
      toileGL.height = Math.max(1, hauteur);
      liberer();
      for (let i = 0; i < ETAGES; i++) {
        const l = Math.max(1, Math.floor(largeur / 2 ** (i + 1))), h = Math.max(1, Math.floor(hauteur / 2 ** (i + 1)));
        const t = texture();
        gl.texImage2D(gl.TEXTURE_2D, 0, flottant ? gl.RGBA16F : gl.RGBA8, l, h, 0, gl.RGBA,
          flottant ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
        const f = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        etages.push({ texture: t, tampon: f, largeur: l, hauteur: h });
      }
    },

    peindre(e: ImageDeLaLumiere) {
      const gpu = !banni && e.sombre && !gl.isContextLost() && etages.length === ETAGES && toile2D.width > 1;
      montrer(gpu);
      if (!gpu) return;
      if (e.sombre !== sombreVu) { fond = lireLeFond(toile2D); sombreVu = e.sombre; }
      surveiller();
      const r = reglageDeLaLumiere(e.p, e.phase, e.depuis, e.focus);

      /* La toile 2D devient la scene : retournee, parce que WebGL compte
         les lignes du bas, et premultipliee, comme elle l est deja. */
      gl.bindTexture(gl.TEXTURE_2D, scene);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toile2D);

      passe(extraire, scene, etages[0], 1 / toile2D.width, 1 / toile2D.height);
      gl.uniform1f(u(extraire, "u_seuil"), r.seuil);
      gl.uniform1f(u(extraire, "u_genou"), r.genou);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      for (let i = 1; i < ETAGES; i++) {
        passe(descendre, etages[i - 1].texture, etages[i], 1 / etages[i - 1].largeur, 1 / etages[i - 1].hauteur);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      /* Chaque etage remonte avec un poids : le plus large pese le moins. */
      gl.enable(gl.BLEND);
      gl.blendColor(POIDS_DE_LA_REMONTEE, POIDS_DE_LA_REMONTEE, POIDS_DE_LA_REMONTEE, 1);
      gl.blendFunc(gl.CONSTANT_COLOR, gl.ONE);
      for (let i = ETAGES - 1; i > 0; i--) {
        passe(remonter, etages[i].texture, etages[i - 1], 1 / etages[i].largeur, 1 / etages[i].hauteur);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      gl.disable(gl.BLEND);

      passe(composer, scene, null, 1 / toile2D.width, 1 / toile2D.height);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, etages[0].texture);
      gl.uniform1i(u(composer, "u_halo"), 1);
      gl.uniform3f(u(composer, "u_fond"), fond[0], fond[1], fond[2]);
      gl.uniform1f(u(composer, "u_exposition"), r.exposition);
      gl.uniform1f(u(composer, "u_eclat"), r.eclat);
      gl.uniform1f(u(composer, "u_grain"), r.grain);
      gl.uniform1f(u(composer, "u_temps"), e.immobile ? 0 : e.maintenant / 1000);
      gl.uniform1f(u(composer, "u_plancher"), PLANCHER_DU_HALO);
      gl.uniform1f(u(composer, "u_bandes"), e.bandes);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    liberer() {
      toileGL.removeEventListener("webglcontextlost", perdu);
      liberer();
      gl.deleteTexture(scene);
      for (const p of [extraire, descendre, remonter, composer]) gl.deleteProgram(p);
      toile2D.style.opacity = "1";
      toileGL.style.opacity = "0";
    },
  };
}
