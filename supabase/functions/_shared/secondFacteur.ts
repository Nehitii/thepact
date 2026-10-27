/* LE SECOND FACTEUR, DIT UNE SEULE FOIS.
 *
 * `delete-account` exigeait la session elevee depuis le 24/08. Sa
 * voisine `delete-all-data` ne l a jamais exigee : avec le seul mot de
 * passe — vole, devine, reutilise ailleurs — on effacait journal,
 * sante, finances et messages d un compte protege par un second
 * facteur. La garde existait ; elle etait ecrite dans un fichier et pas
 * dans l autre. (Audit du 22/09.)
 *
 * Le commentaire de `delete-account` le disait deja : une seule
 * definition de « ce compte est protege », plutot que deux qui
 * divergent. Il manquait l endroit ou la poser. C est ici, et les deux
 * fonctions l appellent.
 *
 * LE PREDICAT est `a_un_second_facteur()`, la fonction que les
 * politiques `mfa_aal2_requis` appellent deja, lue par le client DE
 * L APPELANT pour que `auth.uid()` le designe.
 *
 * Aucun import : ce fichier est verifie par Deno et eprouve par vitest.
 */

/** Le verdict, sans reseau. Un compte muni d un facteur exige une
 *  session `aal2`. Tout ce qui n est pas un « non » franc compte comme
 *  un oui : on ne detruit pas sur un doute. */
export function secondFacteurManquant(aUnFacteur: unknown, aal: unknown): boolean {
  return aUnFacteur !== false && aal !== "aal2";
}

type Lecture = PromiseLike<{ data: unknown; error: unknown }>;

/** `null` quand l appel peut continuer ; sinon la reponse de refus. */
export async function exigerLeSecondFacteur(
  lireLeFacteur: () => Lecture,
  aal: unknown,
  entetes: Record<string, string>,
): Promise<Response | null> {
  const { data, error } = await lireLeFacteur();
  if (error) {
    console.error("Etat du second facteur illisible :", error);
    return new Response(JSON.stringify({ error: "second_facteur_illisible" }), { status: 500, headers: entetes });
  }
  if (secondFacteurManquant(data, aal)) {
    return new Response(JSON.stringify({ error: "second_facteur_requis" }), { status: 403, headers: entetes });
  }
  return null;
}
