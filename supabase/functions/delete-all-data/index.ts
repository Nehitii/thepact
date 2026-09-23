import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { messageDErreur } from "../_shared/erreurs.ts";
import { exigerLeSecondFacteur } from "../_shared/secondFacteur.ts";
import { DEPOTS_PERSONNELS, EFFACEES } from "./perimetre.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* « SUPPRIMER TOUTES MES DONNEES »
 *
 * Trois defauts, releves a l audit du 22/09 :
 *
 *   - LE SECOND FACTEUR N ETAIT PAS EXIGE. Une session ouverte avec le
 *     seul mot de passe effacait tout ; `delete-account`, a cote, le
 *     refusait depuis le 24/08. La garde est commune desormais.
 *
 *   - TRENTE TABLES SUR QUATRE-VINGT-HUIT. Le perimetre complet vit dans
 *     `perimetre.ts`, confronte au schema par son test.
 *
 *   - RIEN NE SE LISAIT. Chaque effacement partait sans qu on regarde
 *     sa reponse, et la fonction repondait « success » sur un
 *     effacement partiel. Chaque echec est maintenant compte ; le reste
 *     continue, pour effacer tout ce qui peut l etre, et le client dit
 *     ce qui a manque.
 */

type Admin = SupabaseClient;

/** Tous les fichiers sous un dossier, sous-dossiers compris. */
async function cheminsSous(admin: Admin, depot: string, dossier: string): Promise<string[]> {
  const PAGE = 1000;
  const chemins: string[] = [];
  for (let decalage = 0; ; decalage += PAGE) {
    const { data, error } = await admin.storage.from(depot).list(dossier, { limit: PAGE, offset: decalage });
    if (error) throw error;
    for (const entree of data ?? []) {
      const chemin = `${dossier}/${entree.name}`;
      // Un dossier n a pas d identifiant : on y descend.
      if (!entree.id) chemins.push(...await cheminsSous(admin, depot, chemin));
      else chemins.push(chemin);
    }
    if (!data || data.length < PAGE) return chemins;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const refus = await exigerLeSecondFacteur(
      () => userClient.rpc("a_un_second_facteur"),
      claimsData.claims.aal,
      corsHeaders,
    );
    if (refus) return refus;

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const echecs: string[] = [];

    /* Les objectifs n ont pas de colonne de personne : ils partent par
       leurs pactes, et emportent en cascade etapes, depenses, contrats,
       etiquettes et journaux d habitude. */
    const { data: pactes, error: erreurPactes } = await admin.from("pacts").select("id").eq("user_id", userId);
    if (erreurPactes) echecs.push(`pacts : ${erreurPactes.message}`);
    const idsDesPactes = (pactes ?? []).map((p: { id: string }) => p.id);
    if (idsDesPactes.length > 0) {
      const { error } = await admin.from("goals").delete().in("pact_id", idsDesPactes);
      if (error) echecs.push(`goals : ${error.message}`);
    }

    for (const [table, colonne] of EFFACEES) {
      const { error } = await admin.from(table).delete().eq(colonne, userId);
      if (error) echecs.push(`${table}.${colonne} : ${error.message}`);
    }

    // Le pacte est remis a zero, pas efface : l application en exige un.
    if (idsDesPactes.length > 0) {
      const { error } = await admin.from("pacts").update({
        points: 0,
        global_progress: 0,
        checkin_streak: 0,
        checkin_total_count: 0,
      }).in("id", idsDesPactes);
      if (error) echecs.push(`pacts, remise a zero : ${error.message}`);
    }

    /* Les fichiers. Sans eux, l image d un objectif efface restait
       servie par son adresse publique. */
    let fichiers = 0;
    for (const depot of DEPOTS_PERSONNELS) {
      try {
        const chemins = await cheminsSous(admin, depot, userId);
        for (let i = 0; i < chemins.length; i += 100) {
          const lot = chemins.slice(i, i + 100);
          const { error } = await admin.storage.from(depot).remove(lot);
          if (error) echecs.push(`${depot} : ${error.message}`);
          else fichiers += lot.length;
        }
      } catch (e: unknown) {
        echecs.push(`${depot} : ${messageDErreur(e)}`);
      }
    }

    if (echecs.length > 0) {
      console.error("delete-all-data, effacement partiel :", echecs);
      return new Response(JSON.stringify({ error: "effacement_partiel", echecs }), { status: 500, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true, fichiers }), { headers: corsHeaders });
  } catch (err: unknown) {
    console.error("delete-all-data error:", err);
    return new Response(JSON.stringify({ error: messageDErreur(err) }), { status: 500, headers: corsHeaders });
  }
});
