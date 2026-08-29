/* QUI PUBLIE, ET SOUS QUEL REGIME.
 *
 * En amont des articles, qui la citent. La coupe de contenu.ts a
 * revele un cycle : les articles nomment l editeur et le produit, et
 * l assemblage nomme les articles. Trois etages, pas deux. */
export type Regime = "particulier" | "professionnel";

export const REGIME: Regime = "particulier";

/**
 * L'IDENTITÉ DE L'ÉDITEUR.
 *
 * En régime « particulier », seul `courriel` est requis : les autres
 * champs peuvent rester vides sans que la page le signale, parce que
 * les taire est un droit et non un oubli. En régime « professionnel »,
 * tous deviennent obligatoires et la page redit ce qui manque.
 */
export const EDITEUR = {
  /** Raison sociale ou nom complet. Facultatif en régime particulier. */
  nom: "",
  /** Forme juridique et capital, s'il y a une société. */
  forme: "",
  /** Adresse postale complète. Facultative en régime particulier. */
  adresse: "",
  /** SIREN / SIRET, ou numéro d'immatriculation équivalent. */
  immatriculation: "",
  /** Directeur de la publication. */
  directeur: "",
  /** Adresse de contact. REQUISE DANS LES DEUX RÉGIMES — voir le RGPD ci-dessus. */
  courriel: "support.overwrite@gmail.com",
};

/** Les champs que le régime en vigueur rend obligatoires. */
export const CHAMPS_REQUIS: (keyof typeof EDITEUR)[] =
  REGIME === "particulier"
    ? ["courriel"]
    : ["nom", "forme", "adresse", "immatriculation", "directeur", "courriel"];

/* L'HÉBERGEUR DU SITE ET CELUI DES DONNÉES NE SONT PAS LE MÊME, et la
   LCEN vise d'abord celui qui met le contenu à disposition du public.
   Ne nommer que Supabase était donc incomplet : c'est Cloudflare qui
   sert l'application. Les deux sont désormais cités, chacun pour ce
   qu'il héberge. */

export const HEBERGEUR_SITE = {
  nom: "Cloudflare, Inc.",
  detail: "101 Townsend St., San Francisco, CA 94107, États-Unis",
  role: "Hébergement de l'application (Cloudflare Workers).",
};

export const HEBERGEUR = {
  nom: "Supabase, Inc.",
  detail: "970 Toa Payoh North, Singapour",
  region: "Région d'hébergement des données : eu-west-2 (Londres, Royaume-Uni)",
};

/** La version du document et sa date, affichées en pied de page. */
export const VERSION = "2026.08";
export const MISE_A_JOUR = "25 août 2026";

/** Le nom du produit, en un seul endroit. */
export const PRODUIT = "Overwrite";
