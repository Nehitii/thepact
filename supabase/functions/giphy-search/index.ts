import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ═══════════════════════════════════════════════════════════════
   LE RELAIS GIPHY

   LA CLÉ NE DESCEND JAMAIS DANS LE NAVIGATEUR. Une clé Giphy posée
   dans le paquet du client est lisible par quiconque ouvre l'onglet
   réseau — et elle porte le quota de tout le monde. Elle reste donc
   dans les secrets Supabase, et cette fonction relaie.

   ELLE EXIGE UNE SESSION. Sans cela, l'adresse de la fonction devient
   un proxy Giphy gratuit pour n'importe qui : le quota se viderait
   sans qu'un seul message ait été publié ici.

   ON NE REND QUE CE QUI SERT. Giphy répond quarante champs par image ;
   le composeur en utilise quatre. Recopier le reste ferait passer par
   ce tuyau des URL de suivi et des identifiants d'utilisateur Giphy
   dont personne ici n'a l'usage.

   LA RECHERCHE EST BRIDÉE — la classification « g », celle des tout
   publics. Un fil de communauté n'est pas l'endroit où découvrir ce
   que Giphy range ailleurs.
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

/** Giphy rend quarante champs ; on en garde quatre. */
function reduire(g: Record<string, unknown>): GifRendu | null {
  const images = g?.images as Record<string, Record<string, string>> | undefined;
  const plein = images?.downsized_medium ?? images?.fixed_height ?? images?.original;
  const apercu = images?.fixed_height_small ?? images?.preview_gif ?? plein;
  if (!plein?.url || !apercu?.url) return null;
  return {
    id: String(g.id ?? ""),
    url: plein.url,
    apercu: apercu.url,
    largeur: Number(plein.width) || 0,
    hauteur: Number(plein.height) || 0,
    titre: String(g.title ?? "").slice(0, 120),
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
    const cle = Deno.env.get("GIPHY_API_KEY");
    if (!cle) {
      /* DEUX CENTS, ET NON CINQ CENT TROIS.

         Le secret manquant n'est pas une panne : c'est un état que le
         client doit AFFICHER. Or functions.invoke() traite tout code
         hors 2xx comme une erreur et jette le corps — le composeur
         annonçait donc « injoignable » là où il fallait dire « pas
         configuré ». Vérifié à l'écran avant de le corriger.

         Le contrat est le nôtre : on le rend lisible. */
      return repondre({ error: "cle-absente", message: "Le secret GIPHY_API_KEY n'est pas posé." });
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

    const { recherche = "", decalage = 0 } = (await req.json().catch(() => ({}))) as {
      recherche?: string;
      decalage?: number;
    };

    const q = String(recherche).trim().slice(0, 80);
    const offset = Math.max(0, Math.min(200, Number(decalage) || 0));
    const params = new URLSearchParams({
      api_key: cle,
      limit: "24",
      offset: String(offset),
      rating: "g",
      lang: "fr",
      bundle: "messaging_non_clips",
    });
    if (q) params.set("q", q);

    /* Sans recherche, la tendance : une grille vide au premier clic
       n'apprend pas ce qu'on peut y trouver. */
    const adresse = q
      ? `https://api.giphy.com/v1/gifs/search?${params}`
      : `https://api.giphy.com/v1/gifs/trending?${params}`;

    const r = await fetch(adresse, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) {
      return repondre({ error: "giphy-indisponible", statut: r.status }, r.status === 429 ? 429 : 502);
    }
    const brut = await r.json();
    const gifs = (Array.isArray(brut?.data) ? brut.data : [])
      .map(reduire)
      .filter((g: GifRendu | null): g is GifRendu => !!g);

    return repondre({ gifs });
  } catch (e) {
    return repondre({ error: "erreur", message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
