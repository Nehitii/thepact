import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * L'état du jour, côté client.
 *
 * ═══════════════════════════════════════════════════════════════
 * LE MÊME RELEVÉ QUE CELUI DU SERVEUR, LU PAR L'INTERFACE.
 *
 * La passe 2 a posé un préambule dans `ai-coach` : pacte, jour N/M,
 * objectifs, étapes restantes, ordres du jour, focus, tâches, solde. Il
 * répond à la moitié des questions sans appeler un outil.
 *
 * Il peut répondre à la moitié des questions sans appeler LE MODÈLE non
 * plus — à condition que le client sache les mêmes choses. C'est ce que
 * fait ce hook : les mêmes requêtes, en parallèle, avec le jeton de
 * l'utilisateur. Les politiques RLS gardent le dernier mot.
 *
 * IL RENVOIE DES CHAMPS, PAS UNE PHRASE. Le serveur en fait de la prose
 * pour le modèle ; l'interface en fait des chiffres, des libellés et des
 * humeurs. Une même vérité, deux lecteurs.
 * ═══════════════════════════════════════════════════════════════
 */

export type PhaseDuPacte = "nominal" | "attention" | "critique" | "inconnue";

export interface OrdreDuJour {
  titre: string;
  progression: number;
  cible: number;
  reclame: boolean;
  prime: number;
}

export interface TacheProche {
  id: string;
  nom: string;
  echeance: string | null;
  enRetard: boolean;
}

export interface EtatDuJour {
  nom: string | null;
  pacte: {
    id: string;
    nom: string;
    jour: number;
    total: number;
    reste: number;
    pctEcoule: number;
    fin: string | null;
  } | null;
  phase: PhaseDuPacte;
  objectifs: {
    enCours: number;
    aVenir: number;
    finis: number;
    restantEnCours: number;
    restantAVenir: number;
    faites: number;
    etapes: number;
    plusGros: { nom: string; reste: number }[];
  };
  ordres: OrdreDuJour[];
  focusMinutes: number;
  taches: { ouvertes: number; prochaines: TacheProche[] };
  solde: number | null;
}

const JOUR_MS = 86_400_000;

interface LignePacte {
  id: string;
  name: string;
  project_start_date: string | null;
  project_end_date: string | null;
}
interface LigneObjectif {
  id: string;
  name: string;
  status: string;
  validated_steps: number | null;
  total_steps: number | null;
  pact_id: string;
  is_focus: boolean | null;
}

export function useEtatDuJour() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["mia_etat_du_jour", user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<EtatDuJour> => {
      const jour = new Date().toISOString().slice(0, 10);
      const [profil, pacts, objectifs, ordres, focus, taches, bonds] = await Promise.all([
        supabase.from("profiles").select("display_name, active_pact_id").eq("id", user!.id).maybeSingle(),
        supabase.from("pacts").select("id,name,project_start_date,project_end_date").eq("user_id", user!.id),
        /* `goals` n'a pas de user_id : le lien passe par le pacte, et RLS filtre. */
        supabase.from("goals").select("id,name,status,validated_steps,total_steps,pact_id,is_focus"),
        supabase.from("daily_quests").select("title,progress,target,status,reward_bonds").eq("user_id", user!.id).eq("date", jour),
        supabase.from("pomodoro_sessions").select("duration_minutes").eq("user_id", user!.id).eq("completed", true).gte("started_at", `${jour}T00:00:00`),
        supabase.from("todo_tasks").select("id,name,deadline").eq("user_id", user!.id).eq("status", "active").limit(60),
        supabase.from("bond_balance").select("balance").eq("user_id", user!.id).maybeSingle(),
      ]);

      const listePacts = (pacts.data ?? []) as LignePacte[];
      const actifId = profil.data?.active_pact_id ?? null;
      const choisi = listePacts.find((p) => p.id === actifId) ?? listePacts[0] ?? null;

      let pacte: EtatDuJour["pacte"] = null;
      let phase: PhaseDuPacte = "inconnue";
      if (choisi) {
        const debut = choisi.project_start_date ? new Date(choisi.project_start_date).getTime() : null;
        const fin = choisi.project_end_date ? new Date(choisi.project_end_date).getTime() : null;
        if (debut && fin && fin > debut) {
          const total = Math.round((fin - debut) / JOUR_MS);
          const ecoule = Math.max(0, Math.floor((Date.now() - debut) / JOUR_MS));
          const reste = Math.max(0, Math.ceil((fin - Date.now()) / JOUR_MS));
          const pct = Math.min(100, Math.max(0, ((Date.now() - debut) / (fin - debut)) * 100));
          pacte = { id: choisi.id, nom: choisi.name, jour: ecoule, total, reste, pctEcoule: pct, fin: choisi.project_end_date };
          /* Les mêmes seuils que le compte à rebours : c'est le même
             instrument, il ne peut pas dire deux choses. */
          const partRestante = 100 - pct;
          phase = partRestante > 75 ? "nominal" : partRestante > 25 ? "attention" : "critique";
        } else {
          pacte = { id: choisi.id, nom: choisi.name, jour: 0, total: 0, reste: 0, pctEcoule: 0, fin: null };
        }
      }

      const buts = ((objectifs.data ?? []) as LigneObjectif[]).filter((g) =>
        listePacts.some((p) => p.id === g.pact_id),
      );
      const restant = (statut: string) =>
        buts
          .filter((g) => g.status === statut)
          .reduce((s, g) => s + Math.max(0, (g.total_steps ?? 0) - (g.validated_steps ?? 0)), 0);

      const plusGros = buts
        .filter((g) => g.status === "in_progress")
        .map((g) => ({ nom: g.name, reste: Math.max(0, (g.total_steps ?? 0) - (g.validated_steps ?? 0)) }))
        .filter((g) => g.reste > 0)
        .sort((a, b) => b.reste - a.reste)
        .slice(0, 3);

      const listeTaches = (taches.data ?? []) as { id: string; name: string; deadline: string | null }[];
      const aujourdhui = new Date(jour).getTime();
      const prochaines: TacheProche[] = listeTaches
        .filter((t) => t.deadline)
        .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          nom: t.name,
          echeance: t.deadline,
          enRetard: new Date(t.deadline as string).getTime() < aujourdhui,
        }));

      return {
        nom: profil.data?.display_name ?? null,
        pacte,
        phase,
        objectifs: {
          enCours: buts.filter((g) => g.status === "in_progress").length,
          aVenir: buts.filter((g) => g.status === "not_started").length,
          finis: buts.filter((g) => g.status === "fully_completed" || g.status === "validated").length,
          restantEnCours: restant("in_progress"),
          restantAVenir: restant("not_started"),
          faites: buts.reduce((s, g) => s + (g.validated_steps ?? 0), 0),
          etapes: buts.reduce((s, g) => s + (g.total_steps ?? 0), 0),
          plusGros,
        },
        ordres: ((ordres.data ?? []) as { title: string; progress: number; target: number; status: string; reward_bonds: number | null }[]).map((q) => ({
          titre: q.title,
          progression: q.progress,
          cible: q.target,
          reclame: q.status === "claimed",
          prime: q.reward_bonds ?? 0,
        })),
        focusMinutes: ((focus.data ?? []) as { duration_minutes: number | null }[]).reduce(
          (s, p) => s + (p.duration_minutes ?? 0),
          0,
        ),
        taches: { ouvertes: listeTaches.length, prochaines },
        solde: bonds.data?.balance ?? null,
      };
    },
  });
}
