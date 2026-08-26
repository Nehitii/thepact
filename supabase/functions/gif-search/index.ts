import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ═══════════════════════════════════════════════════════════════
   LE RELAIS DE GIF — TENOR

   REMPLACE « giphy-search », QUI NE RÉPONDAIT PAS. Le nom ne porte plus
   celui d'un fournisseur : le composeur demande des GIF, il n'a pas à
   savoir qui les sert. Changer de source une seconde fois ne touchera
   plus au client.

   LA CLÉ NE DESCEND JAMAIS DANS LE NAVIGATEUR. Une clé posée dans le
   paquet du client est lisible par quiconque ouvre l'onglet réseau — et
   elle porte le quota de tout le monde. Elle reste dans les secrets
   Supabase, et cette fonction relaie.

   ELLE EXIGE UNE SESSION. Sans cela, l'adresse de la fonction devient un
   proxy gratuit pour n'importe qui : le quota se viderait sans qu'un
   seul message ait été publié ici.

   ON NE REND QUE CE QUI SERT. Tenor répond une vingtaine de formats par
   image ; le composeur en utilise deux — l'animé qu'on publiera, et une
   vignette légère pour la grille. Recopier le reste ferait passer par ce
   tuyau des adresses de suivi dont personne n'a l'usage.

   « contentfilter=high » est le filtre le plus strict de Tenor. Un fil
   de communauté n'est pas l'endroit où découvrir ce qu'il range
   ailleurs.
   ═══════════════════════════════════════════════════════════════ */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GifRendu {
  id: string;
  /** L'image animée, celle qu'on publiera. */
  url: string;
  /** Une version légère pour la grille de choix. */
  apercu: string;
  largeur: number;
  hauteur: number;
  titre: string;
}

interface FormatTenor {
  url?: string;
  dims?: number[];
}

/** Tenor rend une vingtaine de formats ; on en garde deux. */
function reduire(r: Record<string, unknown>): GifRendu | null {
  const f = r?.media_formats as Record<string, FormatTenor> | undefined;
  const plein = f?.gif ?? f?.mediumgif ?? f?.tinygif;
  const apercu = f?.tinygif ?? f?.nanogif ?? plein;
  if (!plein?.url || !apercu?.url) return null;
  const dims = Array.isArray(plein.dims) ? plein.dims : [];
  return {
    id: String(r.id ?? ""),
    url: plein.url,
    apercu: apercu.url,
    largeur: Number(dims[0]) || 0,
    hauteur: Number(dims[1]) || 0,
    titre: String(r.content_description ?? r.title ?? "").slice(0, 120),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const repondre = (corps: unknown, status = 200) =>
    new Response(JSON.stringify(corps), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const cle = Deno.env.get("TENOR_API_KEY");
    if (!cle) {
      /* DEUX CENTS, ET NON CINQ CENT TROIS.
         Le secret manquant n'est pas une panne : c'est un état que le
         client doit AFFICHER. Or functions.invoke() traite tout code
         hors 2xx comme une erreur et jette le corps — le composeur
         annonçait « injoignable » là où il fallait dire « pas
         configuré ». Le contrat est le nôtre, on le rend lisible. */
      return repondre({ error: "cle-absente", message: "Le secret TENOR_API_KEY n'est pas posé." });
    }

    const jeton = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jeton) return repondre({ error: "non-authentifie" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${jeton}` } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return repondre({ error: "non-authentifie" }, 401);

    const { recherche = "", suite = "" } = (await req.json().catch(() => ({}))) as {
      recherche?: string;
      suite?: string;
    };

    const q = String(recherche).trim().slice(0, 80);
    const params = new URLSearchParams({
      key: cle,
      /* Tenor demande un identifiant d'application pour séparer les
         quotas ; il n'a rien de secret. */
      client_key: "vowpact",
      limit: "24",
      contentfilter: "high",
      media_filter: "gif,tinygif,nanogif",
      locale: "fr_FR",
    });
    if (String(suite)) params.set("pos", String(suite).slice(0, 64));

    /* Sans recherche, les tendances : une grille vide au premier clic
       n'apprend pas ce qu'on peut y trouver. */
    let adresse: string;
    if (q) {
      params.set("q", q);
      adresse = `https://tenor.googleapis.com/v2/search?${params}`;
    } else {
      adresse = `https://tenor.googleapis.com/v2/featured?${params}`;
    }

    const r = await fetch(adresse, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) {
      /* Le corps de Tenor dit POURQUOI — une clé refusée et un quota
         dépassé rendent tous deux un 4xx, et les confondre ferait
         chercher au mauvais endroit. */
      const detail = await r.text().catch(() => "");
      return repondre(
        { error: "gif-indisponible", statut: r.status, detail: detail.slice(0, 300) },
        r.status === 429 ? 429 : 502,
      );
    }
    const brut = await r.json();
    const gifs = (Array.isArray(brut?.results) ? brut.results : [])
      .map(reduire)
      .filter((g: GifRendu | null): g is GifRendu => !!g);

    return repondre({ gifs, suite: brut?.next ?? "" });
  } catch (e) {
    return repondre({ error: "erreur", message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
