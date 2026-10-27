import { supabase } from "@/socle/supabase/client";
import type { Json } from "@/socle/supabase/types";

/**
 * Le journal de securite.
 *
 * La table `security_events` existait, avec ses politiques RLS, et
 * l ecran « Journal de connexions » la lisait — mais son unique
 * ecrivain etait la fonction edge `two-factor`, le 2FA maison remplace
 * depuis par le MFA de Supabase. Plus rien ne l appelait : la table
 * etait vide, et le panneau affichait « aucune activite recente » a
 * perpetuite. Cette fonction a ete retiree du depot le 30/08/2026 ;
 * ne la cherchez pas, elle n existe plus.
 *
 * On ne peut pas enregistrer les *connexions* depuis le navigateur :
 * une session qui demarre ailleurs ne passe pas par ici, et un client
 * qui s auto-declare ne prouve rien. Ce qu on peut enregistrer, en
 * revanche, ce sont les gestes qui touchent a la securite du compte —
 * et ce sont precisement ceux qu on veut pouvoir relire apres coup.
 * Le panneau s appelle donc « Journal de securite ».
 */

export type EvenementSecurite =
  | "password_changed"
  | "mfa_enrolled"
  | "mfa_revoked"
  | "sessions_revoked";

export const LIBELLES_EVENEMENT: Record<EvenementSecurite, string> = {
  password_changed: "Mot de passe changé",
  mfa_enrolled: "Second facteur activé",
  mfa_revoked: "Second facteur retiré",
  sessions_revoked: "Autres sessions fermées",
};

/**
 * Enregistre un evenement. Ne leve jamais.
 *
 * Un journal qui fait echouer l action qu il enregistre est pire que
 * pas de journal du tout : on perdrait le changement de mot de passe
 * parce que sa trace n a pas pu s ecrire. L echec est donc avale, et
 * seulement porte a la console.
 */
export async function noterEvenementSecurite(
  userId: string | undefined,
  evenement: EvenementSecurite,
  metadata: Record<string, Json> = {},
): Promise<void> {
  if (!userId) return;
  try {
    const { error } = await supabase
      .from("security_events")
      .insert({ user_id: userId, event_type: evenement, metadata });
    if (error) console.warn("journal de sécurité :", error.message);
  } catch (e) {
    console.warn("journal de sécurité :", e);
  }
}
