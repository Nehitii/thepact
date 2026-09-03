import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import { usePact } from "@/domaines/objectifs";
import { etatDuPacteJure } from "@/domaines/onboarding/logique/pacteJure";

/**
 * CE QUI A DEJA ETE JURE, pour que le second passage ne reparte pas de rien.
 *
 * LE RITE ABREGE ETAIT INATTEIGNABLE, et c est ce qui se corrige ici :
 * son declencheur est « ?abrege » dans l adresse, et personne dans
 * l application n y menait. « Home » n envoie au rite que si le porteur
 * n a AUCUN pacte, et « reset_pact_data » fait un UPDATE sur le pacte,
 * qui survit. Quelqu un qui reinitialisait gardait donc un pacte, et ne
 * repassait jamais par la — six ecrans et une branche testee que
 * personne ne pouvait atteindre.
 *
 * MAIS ON NE PEUT PAS S Y RENDRE LES MAINS VIDES. « LeRite » ne lit son
 * etat initial qu au montage, et sans lui le second passage repartait
 * de « ETAT_VIDE » : le porteur redeclarait tout a l aveugle, et
 * « useSceller » ecrasait son pacte par ce qu il venait de retaper. Une
 * perte de donnees deguisee en rite.
 *
 * Il part donc de ce qui existe — nom, phrase, signe, teinte, valeurs
 * DANS LEUR ORDRE DE RANG, puisque c est cet ordre qui dessine la corde
 * du sceau. On revoit ses declarations, on les change si l on veut.
 *
 * DEUX CHAMPS NE SE REPRENNENT PAS. Les clauses et la signature
 * repartent a faux : jurer de nouveau est le sujet meme du second
 * passage, et un consentement recopie n en serait pas un. L objectif
 * reste nul — le rite abrege saute la rencontre, et le porteur a deja
 * des objectifs.
 */
export function usePacteJure(actif: boolean) {
  const { user } = useAuth();
  const { data: pacte, isSuccess: pacteVu } = usePact(actif ? user?.id : undefined);

  /* Le nom du porteur et les valeurs, que « usePact » ne rapporte pas. */
  const complement = useQuery({
    queryKey: ["pacte-jure", user?.id],
    enabled: actif && !!user?.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const [profil, valeurs] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle(),
        supabase.from("user_values").select("label").eq("user_id", user!.id).order("rank"),
      ]);
      if (profil.error) throw profil.error;
      if (valeurs.error) throw valeurs.error;
      return {
        nomDuPorteur: profil.data?.display_name ?? "",
        valeurs: (valeurs.data ?? []).map((v) => v.label),
      };
    },
  });

  if (!actif) return { etat: undefined, pret: true };
  if (!pacteVu || !complement.isSuccess) return { etat: undefined, pret: false };

  const etat = etatDuPacteJure({
    nomDuPorteur: complement.data.nomDuPorteur,
    nom: pacte?.name ?? null,
    mantra: pacte?.mantra ?? null,
    symbole: pacte?.symbol ?? null,
    couleur: pacte?.color ?? null,
    valeurs: complement.data.valeurs,
  });
  return { etat, pret: true };
}
