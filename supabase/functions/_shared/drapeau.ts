import type { ClientSupabase } from "./client.ts";

/**
 * UN DRAPEAU SE LIT AU MÊME ENDROIT DES DEUX CÔTÉS.
 *
 * Le client résout un drapeau dans `src/hooks/useFeatureFlag.ts` :
 * l'exception personnelle (`user_feature_overrides`) l'emporte sur le
 * réglage global (`feature_flags`), et l'absence de ligne vaut « fermé ».
 *
 * Une fonction Edge qui lirait seulement `feature_flags` donnerait une
 * réponse différente de l'écran pour la même personne — et c'est le genre
 * d'écart qu'on ne voit qu'en production, sur un compte précis. Les deux
 * lectures suivent donc la même règle, écrite deux fois faute de pouvoir
 * partager du code entre Deno et le navigateur.
 */
export async function drapeauOuvert(
  client: ClientSupabase,
  cle: string,
  userId: string,
): Promise<boolean> {
  const [global, perso] = await Promise.all([
    client.from("feature_flags").select("enabled").eq("key", cle).maybeSingle()
      .returns<{ enabled: boolean | null }[]>(),
    client.from("user_feature_overrides").select("enabled")
      .eq("user_id", userId).eq("key", cle).maybeSingle()
      .returns<{ enabled: boolean | null }[]>(),
  ]);

  const exception = (perso.data as unknown as { enabled?: boolean } | null)?.enabled;
  if (typeof exception === "boolean") return exception;

  return !!(global.data as unknown as { enabled?: boolean } | null)?.enabled;
}
