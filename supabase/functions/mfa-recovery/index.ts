// LES CODES DE SECOURS DU SECOND FACTEUR.
//
// Trois actions, une seule porte :
//   compter   — combien de codes restent, pour l'écran des réglages
//   generer   — en tire huit neufs et les rend EN CLAIR, une seule fois
//   utiliser  — brûle un code et retire le facteur TOTP
//
// Un code brûlé ne redonne pas `aal2` : seul `mfa.verify()` le délivre.
// Il retire le facteur, donc rend l'accès à un compte redevenu simple,
// qu'on ré-enrôle ensuite. C'est ce qu'une récupération doit faire.
//
// La table `mfa_recovery_codes` n'a aucune politique RLS : cette
// fonction, avec le rôle de service, en est le seul lecteur.
// `@2` et non une version epinglee : `getClaims` n existe pas en
// 2.45.0, et c est de lui que vient `aal` — la seule chose qui
// distingue une session ayant prouve son second facteur.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOMBRE_DE_CODES = 8;

/** Un alphabet sans les caractères qu'on confond en les recopiant :
 *  pas de 0/O, pas de 1/I/L. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function tirerUnCode() {
  const octets = new Uint8Array(10);
  crypto.getRandomValues(octets);
  const lettres = Array.from(octets, (o) => ALPHABET[o % ALPHABET.length]).join("");
  // « ABCDE-FGHJK » : deux groupes de cinq se recopient sans se perdre.
  return `${lettres.slice(0, 5)}-${lettres.slice(5)}`;
}

async function empreinte(code: string) {
  // On normalise avant de hacher : la casse et les espaces ne doivent
  // pas décider du sort d'une récupération.
  const propre = code.trim().toUpperCase().replace(/\s+/g, "");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(propre));
  return Array.from(new Uint8Array(buf), (o) => o.toString(16).padStart(2, "0")).join("");
}

const json = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "non_authentifie" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const clientUtilisateur = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const jeton = authHeader.slice(7);
    const { data: claims, error: erreurClaims } = await clientUtilisateur.auth.getClaims(jeton);
    if (erreurClaims || !claims?.claims) return json({ error: "non_authentifie" }, 401);

    const userId = claims.claims.sub as string;
    const aal = claims.claims.aal as string | undefined;
    const admin = createClient(url, service);

    let corps: { action?: string; code?: string };
    try { corps = await req.json(); } catch { return json({ error: "corps_illisible" }, 400); }

    // ── COMPTER ───────────────────────────────────────────────
    if (corps.action === "compter") {
      const { count, error } = await admin
        .from("mfa_recovery_codes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("used_at", null);
      if (error) return json({ error: error.message }, 500);
      return json({ restants: count ?? 0 });
    }

    // ── GÉNÉRER ───────────────────────────────────────────────
    if (corps.action === "generer") {
      // Il faut pouvoir prouver qui l'on est pour se fabriquer une
      // porte de sortie. Sinon une session volée s'en fabriquerait une.
      if (aal !== "aal2") return json({ error: "aal2_requis" }, 403);

      const codes = Array.from({ length: NOMBRE_DE_CODES }, tirerUnCode);
      const lignes = await Promise.all(
        codes.map(async (c) => ({ user_id: userId, code_hash: await empreinte(c) })),
      );

      // Les anciens codes ne survivent pas à une nouvelle série : on ne
      // laisse pas traîner deux jeux valides.
      const { error: erreurPurge } = await admin
        .from("mfa_recovery_codes").delete().eq("user_id", userId);
      if (erreurPurge) return json({ error: erreurPurge.message }, 500);

      const { error: erreurInsert } = await admin.from("mfa_recovery_codes").insert(lignes);
      if (erreurInsert) return json({ error: erreurInsert.message }, 500);

      // La seule fois où les codes existent en clair.
      return json({ codes });
    }

    // ── UTILISER ──────────────────────────────────────────────
    if (corps.action === "utiliser") {
      if (!corps.code) return json({ error: "code_manquant" }, 400);

      const hash = await empreinte(corps.code);
      const { data: ligne, error } = await admin
        .from("mfa_recovery_codes")
        .select("id")
        .eq("user_id", userId)
        .eq("code_hash", hash)
        .is("used_at", null)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!ligne) return json({ error: "code_refuse" }, 403);

      // Le code est brûlé AVANT le retrait du facteur : si le retrait
      // échoue, on aura consommé un code pour rien — l'inverse laisserait
      // un code réutilisable après un retrait réussi, ce qui est pire.
      const { error: erreurMarque } = await admin
        .from("mfa_recovery_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", ligne.id);
      if (erreurMarque) return json({ error: erreurMarque.message }, 500);

      const { data: facteurs, error: erreurListe } =
        await admin.auth.admin.mfa.listFactors({ userId });
      if (erreurListe) return json({ error: "facteurs_illisibles" }, 500);

      for (const f of facteurs?.factors ?? []) {
        await admin.auth.admin.mfa.deleteFactor({ userId, id: f.id });
      }

      // Le compte redevient simple : l'utilisateur rouvre sa session
      // normalement, puis ré-enrôle s'il le souhaite.
      return json({ retire: true, facteurs: (facteurs?.factors ?? []).length });
    }

    return json({ error: "action_inconnue" }, 400);
  } catch (err) {
    console.error("mfa-recovery :", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
