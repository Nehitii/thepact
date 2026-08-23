import { supabase } from "@/integrations/supabase/client";
import { optimizeImage } from "@/lib/imageOptimization";

/**
 * LES IMAGES ET GIFS DES PUBLICATIONS.
 *
 * POURQUOI UN DEPOT PUBLIC, ET NON CELUI DE LA WISHLIST.
 *
 * La wishlist range ses images dans goal-images, qui est prive : elle
 * enregistre un chemin et le signe au moment de l afficher. Ce modele
 * ne tient pas ici. Une signature est delivree pour le porteur de la
 * session, et la regle de lecture de ce depot est celle du
 * proprietaire du fichier : personne ne pourrait afficher l image
 * d une publication qui n est pas la sienne.
 *
 * Un fil public affiche des images publiques. Le depot l est donc
 * aussi, l URL est stable et rien n a besoin d etre signe a chaque
 * lecture. L ECRITURE, elle, reste celle de l auteur : le premier
 * dossier du chemin doit porter son identifiant, comme partout
 * ailleurs dans le produit.
 *
 * LES GIFS TRAVERSENT SANS ETRE TOUCHES. optimizeImage convertit en
 * webp, ce qui aplatirait l animation ; il ecarte deja le type
 * image/gif de lui-meme. On lui fait confiance et on garde
 * l extension d origine.
 */

export const DEPOT_COMMUNITY = "community-media";

/** 8 Mo : la limite du depot. Un GIF anime depasse vite une image fixe. */
export const POIDS_MAX = 8 * 1024 * 1024;

export const TYPES_ACCEPTES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export function estUnTypeAccepte(type: string): boolean {
  return TYPES_ACCEPTES.includes(type);
}

function extensionDe(fichier: File): string {
  if (fichier.type === "image/gif") return "gif";
  if (fichier.type === "image/avif") return "avif";
  if (fichier.type === "image/png") return "png";
  if (fichier.type === "image/jpeg") return "jpg";
  return "webp";
}

export interface ResultatDepot {
  url: string;
  chemin: string;
}

/** Optimise si c est une image fixe, depose, et rend l URL publique. */
export async function deposerMedia(fichier: File, userId: string): Promise<ResultatDepot> {
  if (!estUnTypeAccepte(fichier.type)) {
    throw new Error("type-refuse");
  }

  const prepare = await optimizeImage(fichier, "journal");
  if (prepare.size > POIDS_MAX) {
    throw new Error("trop-lourd");
  }

  const jeton = Math.random().toString(36).slice(2, 9);
  const chemin = `${userId}/community/${Date.now()}-${jeton}.${extensionDe(prepare)}`;

  const { error } = await supabase.storage
    .from(DEPOT_COMMUNITY)
    .upload(chemin, prepare, { contentType: prepare.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(DEPOT_COMMUNITY).getPublicUrl(chemin);
  return { url: data.publicUrl, chemin };
}

/** Retire un fichier depose — pour annuler avant d avoir publie. */
export async function retirerMedia(chemin: string): Promise<void> {
  await supabase.storage.from(DEPOT_COMMUNITY).remove([chemin]);
}
