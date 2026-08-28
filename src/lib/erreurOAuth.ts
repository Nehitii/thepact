/* ═══════════════════════════════════════════════════════════════
   L'ERREUR D'UN FOURNISSEUR NE DOIT PAS DISPARAÎTRE EN CHEMIN

   Quand une connexion Google, GitHub ou Discord échoue, Supabase
   renvoie vers l'application avec l'explication dans l'URL :

     https://…/#error=access_denied
                &error_code=provider_email_needs_verification
                &error_description=Unverified+email+with+google

   Personne ne la lisait. Le retour se faisait sur « / », une route
   protégée ; faute de session, le routeur rebondissait vers « /auth »
   — et ce rebond PERD LE FRAGMENT. La personne se retrouvait devant le
   formulaire de connexion sans un mot, avec le sentiment que son clic
   n'avait rien fait.

   D'OÙ LA LECTURE ICI, ET PAS DANS Auth.tsx. Ce module s'exécute à
   l'import, donc avant le premier rendu de React et avant toute
   navigation. C'est le seul instant où le fragment existe encore.

   CE QU'ON NE TOUCHE PAS : un fragment qui contient `access_token`.
   C'est le flux implicite en train de réussir, et le client Supabase a
   besoin de le lire. On ne nettoie l'URL que lorsqu'on y a trouvé une
   erreur, et jamais autrement.
   ═══════════════════════════════════════════════════════════════ */

export type ErreurOAuth = {
  code: string;
  description: string;
};

let enAttente: ErreurOAuth | null = null;

function depuis(source: string): ErreurOAuth | null {
  if (!source) return null;
  const p = new URLSearchParams(source.replace(/^[#?]/, ""));
  const code = p.get("error_code") ?? p.get("error");
  if (!code) return null;
  const brut = p.get("error_description") ?? "";
  return { code, description: brut.replace(/\+/g, " ") };
}

function capturer(): void {
  if (typeof window === "undefined") return;

  /* Le fragment porte l'erreur du flux implicite, la requête celle du
     flux PKCE. Les deux existent selon le fournisseur et le réglage. */
  const trouvee = depuis(window.location.hash) ?? depuis(window.location.search);
  if (!trouvee) return;

  enAttente = trouvee;

  /* On efface pour que l'erreur ne se rejoue pas au rechargement — mais
     seulement l'erreur : le reste du chemin est conservé tel quel. */
  const url = new URL(window.location.href);
  ["error", "error_code", "error_description"].forEach((c) => url.searchParams.delete(c));
  if (url.hash.includes("error")) url.hash = "";
  window.history.replaceState({}, "", url.toString());
}

capturer();

/** Rend l'erreur une seule fois : la lire la consomme. */
export function consommerErreurOAuth(): ErreurOAuth | null {
  const e = enAttente;
  enAttente = null;
  return e;
}

/* Les codes que Supabase et les trois fournisseurs renvoient réellement.
   Le reste tombe sur la description brute, qui est en anglais mais vaut
   mieux que le silence. */
const EN_CLAIR: Record<string, string> = {
  access_denied: "L'autorisation a été refusée. Rien n'a été partagé.",
  provider_email_needs_verification:
    "L'adresse de ce compte n'est pas vérifiée chez le fournisseur. Vérifie-la chez lui, puis réessaie.",
  provider_disabled: "Ce fournisseur n'est plus disponible pour le moment.",
  signup_disabled: "Les inscriptions sont fermées pour l'instant.",
  user_banned: "Ce compte est suspendu.",
  validation_failed: "La demande a été refusée par le serveur d'authentification.",
  bad_oauth_state: "La connexion a expiré en cours de route. Réessaie.",
  bad_oauth_callback: "Le fournisseur a répondu de façon inattendue. Réessaie.",
  unexpected_failure: "Le serveur d'authentification n'a pas pu répondre. Réessaie dans un instant.",
};

export function messageDErreurOAuth(e: ErreurOAuth): string {
  return EN_CLAIR[e.code] ?? e.description ?? "La connexion n'a pas abouti.";
}
