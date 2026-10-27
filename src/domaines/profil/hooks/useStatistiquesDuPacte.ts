import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format, isValid, parseISO } from "date-fns";
import type { Locale } from "date-fns";
import { supabase } from "@/socle/supabase/client";

/* CE QUE LE PACTE A PRODUIT.
 *
 * Six chiffres montres avant de proposer une sauvegarde : ils disent ce
 * qu on emporterait. Ils vivaient dans le corps de la page, entre les
 * poignees d export et d import.
 *
 * LA LECTURE RESTE NOUEE A LA BASE ; LA MISE EN FORME EN EST SORTIE.
 * C est elle qui decide ce que l ecran affiche — une date invalide, un
 * pacte absent, un statut d etape — et elle ne depend que de ce qui a
 * ete lu.
 */
export function useStatistiquesDuPacte(userId: string | undefined, locale: Locale) {
  return useQuery({
    queryKey: ["user-stats", userId],
    queryFn: async () => {
      if (!userId) return null;

      /* LE PACTE ACTIF, PAS UN PACTE AU HASARD.
         `pacts.maybeSingle()` supposait qu il n y en ait qu un : a deux
         pactes, PostgREST rend une erreur et le panneau reste vide. Et
         meme sans erreur, rien ne disait lequel etait compte. On prend
         `active_pact_id` — la source dont tout le reste depend, de
         `xp_du_membre` a la carte publique — avec le plus recent en
         repli. */
      const { data: profil } = await supabase
        .from("profiles").select("active_pact_id").eq("id", userId).maybeSingle();
      let pactId = profil?.active_pact_id ?? null;
      if (!pactId) {
        const { data: dernier } = await supabase
          .from("pacts").select("id").eq("user_id", userId)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        pactId = dernier?.id ?? null;
      }

      /* Sans pacte, on ne demande rien. Le repli precedent envoyait
         `pact_id = ""` — une chaine vide la ou Postgres attend un uuid —
         et la requete echouait en silence, le compte retombant a zero
         par `|| 0`. */
      /* Le nom sert a la confirmation de reinitialisation, la date de
         creation aux deux chiffres repris de « Mon pacte ». */
      const { data: pacte } = pactId
        ? await supabase.from("pacts").select("name, created_at").eq("id", pactId).maybeSingle()
        : { data: null };

      const objectifs = pactId
        ? (await supabase.from("goals").select("id").eq("pact_id", pactId)).data ?? []
        : [];
      const idsObjectifs = objectifs.map((g) => g.id);

      /* Trois requetes independantes, lancees ensemble. Les etapes
         attendaient jusqu ici la liste des objectifs *a l interieur* de
         leur propre argument : cinq allers-retours en file. */
      const [etapesRes, journalRes, succesRes] = await Promise.all([
        idsObjectifs.length
          ? supabase.from("steps").select("id, status").in("goal_id", idsObjectifs)
          : Promise.resolve({ data: [] as { id: string; status: string | null }[] }),
        supabase.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("user_achievements").select("*", { count: "exact", head: true })
          .eq("user_id", userId).not("unlocked_at", "is", null),
      ]);

      const etapes = etapesRes.data ?? [];

      return composerLesStatistiques({
      pactId, pacte, idsObjectifs, etapes,
      entreesDeJournal: journalRes.count ?? 0,
      succesObtenus: succesRes.count ?? 0,
      locale,
    });
    },
    enabled: !!userId,
  });
}

interface Lu {
  pactId: string | null;
  pacte: { name?: string | null; created_at?: string | null } | null;
  idsObjectifs: string[];
  etapes: { status?: string | null }[];
  entreesDeJournal: number;
  succesObtenus: number;
  locale: Locale;
  /** L heure qu il est. Passee pour que « jours tenus » soit reproductible. */
  maintenant?: Date;
}

export function composerLesStatistiques({
  pactId, pacte, idsObjectifs, etapes, entreesDeJournal, succesObtenus, locale,
  maintenant = new Date(),
}: Lu) {
  /* UNE DATE ILLISIBLE N EST PAS UNE DATE. Sans ce controle, la fiche
     affichait « Invalid Date » et un nombre de jours tenus egal a NaN —
     deux facons de dire « je ne sais pas » qui ressemblent a des
     reponses. */
  const scelle = pacte?.created_at ? parseISO(pacte.created_at) : null;
  const valide = scelle !== null && isValid(scelle);

  return {
    pactId,
    pactName: pacte?.name ?? "",
    scelleLe: valide ? format(scelle, "d MMM yyyy", { locale }) : null,
    joursTenus: valide ? differenceInDays(maintenant, scelle) : 0,
    goalsCreated: idsObjectifs.length,
    /* « completed » est bien le statut des ETAPES — contrairement aux
       objectifs, ou il n existe pas. */
    stepsCompleted: etapes.filter((s) => s.status === "completed").length,
    totalSteps: etapes.length,
    journalEntries: entreesDeJournal,
    achievementsUnlocked: succesObtenus,
  };
}
