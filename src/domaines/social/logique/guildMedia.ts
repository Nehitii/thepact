import { supabase } from "@/socle/supabase/client";
import { optimizeImage } from "@/socle/outils/imageOptimization";

/**
 * LA BANNIERE ET L EMBLEME D UNE GUILDE.
 *
 * Depot public, pour la meme raison que community-media : une guilde
 * publique se laisse decouvrir par des gens qui n en sont pas membres,
 * et une URL signee est delivree au porteur d une session — elle ne
 * traverserait pas cette frontiere.
 *
 * L ECRITURE, elle, reste celle des officiers : le premier dossier du
 * chemin porte l identifiant de la guilde, et la regle de depot
 * verifie l appartenance et le role. Un membre simple ne peut donc pas
 * changer l identite de la guilde.
 *
 * Pas de GIF ici, contrairement aux publications : une banniere qui
 * s anime derriere un titre le rend illisible, et personne ne peut la
 * mettre en pause.
 */

export const DEPOT_GUILDE = "guild-media";

/** 5 Mo : la limite du depot. */
export const POIDS_MAX = 5 * 1024 * 1024;

export const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function estUnTypeAccepte(type: string): boolean {
  return TYPES_ACCEPTES.includes(type);
}

export type Usage = "banniere" | "embleme";

function extensionDe(fichier: File): string {
  if (fichier.type === "image/avif") return "avif";
  if (fichier.type === "image/png") return "png";
  if (fichier.type === "image/jpeg") return "jpg";
  return "webp";
}

export interface ResultatDepot {
  url: string;
  chemin: string;
}

/** Optimise, depose, et rend l URL publique. */
export async function deposerImageGuilde(
  fichier: File,
  guildId: string,
  usage: Usage,
): Promise<ResultatDepot> {
  if (!estUnTypeAccepte(fichier.type)) throw new Error("type-refuse");

  /* Une banniere est large et lue de loin ; un embleme est un aplat
     regarde de pres, sur une plaque de 56px — donc 112 sur un ecran a
     double densite. Les deux profils existent deja : « journal » pour
     la premiere, « logo » pour le second. Tous deux rendent du webp,
     qui garde la transparence d un embleme detoure. */
  const prepare = await optimizeImage(fichier, usage === "banniere" ? "journal" : "logo");
  if (prepare.size > POIDS_MAX) throw new Error("trop-lourd");

  const jeton = Math.random().toString(36).slice(2, 9);
  const chemin = `${guildId}/${usage}/${Date.now()}-${jeton}.${extensionDe(prepare)}`;

  const { error } = await supabase.storage
    .from(DEPOT_GUILDE)
    .upload(chemin, prepare, { contentType: prepare.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(DEPOT_GUILDE).getPublicUrl(chemin);
  return { url: data.publicUrl, chemin };
}

/** Le chemin interne d une URL publique de ce depot, s il en vient. */
export function cheminDeLUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marqueur = `/${DEPOT_GUILDE}/`;
  const i = url.indexOf(marqueur);
  return i < 0 ? null : decodeURIComponent(url.slice(i + marqueur.length));
}

/** Retire une image — pour ne pas laisser derriere soi ce qu on remplace. */
export async function retirerImageGuilde(url: string | null | undefined): Promise<void> {
  const chemin = cheminDeLUrl(url);
  if (!chemin) return;
  await supabase.storage.from(DEPOT_GUILDE).remove([chemin]);
}
