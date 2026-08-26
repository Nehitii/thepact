import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ce que la barre latérale sait trouver EN PLUS de ses propres menus.
 *
 * ═══════════════════════════════════════════════════════════════
 * LES MENUS D'ABORD, LE CONTENU ENSUITE.
 *
 * Quelqu'un qui tape « sport » cherche neuf fois sur dix la page, pas
 * l'objectif. Les libellés de navigation se comparent sur place, sans
 * requête, et sortent donc instantanément ; ce crochet ne s'occupe que
 * du second rideau — les objectifs et les tâches dont le nom contient
 * le mot. Il est le filet, pas la première prise.
 *
 * DEUX CARACTÈRES MINIMUM. Sur une seule lettre, « ilike %a% » rend la
 * moitié de la base et n'apprend rien à personne.
 *
 * SIX DE CHAQUE. Au-delà, la liste cesse d'être un raccourci : c'est
 * une page de résultats, et il en existe déjà une.
 * ═══════════════════════════════════════════════════════════════
 */

export interface Trouvaille {
  id: string;
  nom: string;
  /* « en cours », « terminé »… — utile pour ne pas confondre deux
     objectifs qui portent presque le même nom. */
  etat: string | null;
}

export interface Recherche {
  objectifs: Trouvaille[];
  taches: Trouvaille[];
}

const VIDE: Recherche = { objectifs: [], taches: [] };

export function useRechercheBarre(terme: string, pactId?: string | null, userId?: string) {
  const q = terme.trim();
  const actif = q.length >= 2;

  return useQuery({
    queryKey: ["recherche-barre", q, pactId ?? null, userId ?? null],
    enabled: actif,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<Recherche> => {
      /* Le pourcentage et le tiret bas sont les jokers de « like » :
         non échappés, taper « 100_ » balaierait bien plus que prévu. */
      const motif = "%" + q.replace(/[%_\\]/g, (c) => "\\" + c) + "%";

      const [objectifs, taches] = await Promise.all([
        pactId
          ? supabase.from("goals").select("id, name, status").eq("pact_id", pactId).ilike("name", motif).limit(6)
          : Promise.resolve({ data: [], error: null }),
        userId
          ? supabase.from("todo_tasks").select("id, name, status").eq("user_id", userId).ilike("name", motif).limit(6)
          : Promise.resolve({ data: [], error: null }),
      ]);

      /* On LIT les erreurs. Une recherche qui rend le vide parce que la
         requête a échoué se confond avec une recherche sans résultat,
         et l'écran laisse croire que l'objectif n'existe pas. */
      if (objectifs.error) throw objectifs.error;
      if (taches.error) throw taches.error;

      const ranger = (l: unknown[]): Trouvaille[] =>
        (l as { id: string; name: string | null; status: string | null }[])
          .filter((x) => x?.id && x?.name)
          .map((x) => ({ id: x.id, nom: x.name as string, etat: x.status ?? null }));

      return { objectifs: ranger(objectifs.data ?? []), taches: ranger(taches.data ?? []) };
    },
    placeholderData: VIDE,
  });
}
