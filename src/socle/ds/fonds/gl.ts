/* LES OUTILS WEBGL DES FONDS.
 *
 * WebGL 1 et GLSL ES 1.00, volontairement : ce sont des fonds, pas un
 * moteur de jeu. Tout ce qu ils demandent tient dans la premiere version
 * de l API, et elle tourne sur tout ce qui a un navigateur depuis 2014.
 *
 * `powerPreference: "low-power"` : sur un portable a deux cartes
 * graphiques, un fond n a aucune raison de reveiller la plus gourmande.
 */

export type GL = WebGLRenderingContext;

export function contexte(canvas: HTMLCanvasElement): GL | null {
  const attributs: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  };
  return canvas.getContext("webgl", attributs) as GL | null;
}

function compiler(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader impossible a creer.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const journal = gl.getShaderInfoLog(shader) ?? "compilation refusee";
    gl.deleteShader(shader);
    throw new Error(journal);
  }
  return shader;
}

export function programme(gl: GL, sommets: string, fragments: string): WebGLProgram {
  const p = gl.createProgram();
  if (!p) throw new Error("Programme impossible a creer.");
  gl.attachShader(p, compiler(gl, gl.VERTEX_SHADER, sommets));
  gl.attachShader(p, compiler(gl, gl.FRAGMENT_SHADER, fragments));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) ?? "liaison refusee");
  }
  return p;
}

/** Le vertex shader d un rendu plein ecran : un triangle qui deborde. */
export const SOMMETS_PLEIN_ECRAN = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

/* Un seul triangle plutot que deux : il couvre l ecran sans diagonale,
   donc sans la ligne ou deux triangles se partagent des pixels. */
export function trianglePleinEcran(gl: GL, p: WebGLProgram): void {
  const tampon = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(p, "a_position");
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
}

/** Les emplacements de plusieurs uniformes d un coup. */
export function uniformes<N extends string>(gl: GL, p: WebGLProgram, noms: readonly N[]) {
  return Object.fromEntries(noms.map((n) => [n, gl.getUniformLocation(p, `u_${n}`)])) as Record<
    N, WebGLUniformLocation | null
  >;
}

/** Le nom de la carte graphique, quand le navigateur accepte de le dire. */
export function carteGraphique(gl: GL): string | null {
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  if (!ext) return null;
  const nom = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
  return typeof nom === "string" ? nom.replace(/^ANGLE \((.*)\)$/, "$1") : null;
}

/** Rend la memoire graphique tout de suite, sans attendre le ramasse-miettes. */
export function liberer(gl: GL): void {
  gl.getExtension("WEBGL_lose_context")?.loseContext();
}

/** Un generateur pseudo-aleatoire reproductible : meme graine, meme ciel. */
export function aleatoire(graine: number): () => number {
  let s = graine >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
