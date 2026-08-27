import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ═══════════════════════════════════════════════════════════════
   LE RELAIS DE GIF

   IL ACCEPTE LES DEUX FOURNISSEURS, et c'est le secret posé qui
   tranche. Giphy d'abord si sa clé est là, Tenor sinon. La raison est
   simple : Tenor v2 passe par un projet Google Cloud, Giphy donne une
   clé en deux minutes — et personne ne devrait avoir à changer du code
   parce qu'un formulaire d'inscription est plus long que l'autre.

   Changer de source revient donc à poser un secret et à retirer
   l'autre. Aucun déploiement, aucune ligne côté client.

   LA CLÉ NE DESCEND JAMAIS DANS LE NAVIGATEUR. Une clé posée dans le
   paquet du client est lisible par quiconque ouvre l'onglet réseau — et
   elle porte le quota de tout le monde.

   LE RELAIS EXIGE UNE SESSION. Sans cela, son adresse devient un proxy
   gratuit pour n'importe qui : le quota se viderait sans qu'un seul
   message ait été publié ici.

   ON NE REND QUE CE QUI SERT. Les deux services répondent des dizaines
   de champs par image ; le composeur en utilise quatre. Recopier le
   reste ferait passer par ce tuyau des adresses de suivi dont personne
   n'a l'usage.

   LE FILTRE EST LE PLUS STRICT DES DEUX ÉCHELLES — « g » chez Giphy,
   « high » chez Tenor. Un fil de communauté n'est pas l'endroit où
   découvrir ce qu'ils rangent ailleurs.
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

interface Format { url?: string; width?: string | number; height?: string | number; dims?: number[] }

/** Giphy : une vingtaine de formats, on en garde deux. */
function deGiphy(g: Record<string, unknown>): GifRendu | null {
  const im = g?.images as Record<string, Format> | undefined;
  const plein = im?.downsized_medium ?? im?.fixed_height ?? im?.original;
  const apercu = im?.fixed_height_small ?? im?.preview_gif ?? plein;
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

/** Tenor : même travail, autre nom de champs. */
function deTenor(r: Record<string, unknown>): GifRendu | null {
  const f = r?.media_formats as Record<string, Format> | undefined;
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
    const cleGiphy = Deno.env.get("GIPHY_API_KEY");
    const cleTenor = Deno.env.get("TENOR_API_KEY");
    if (!cleGiphy && !cleTenor) {
      /* DEUX CENTS, ET NON CINQ CENT TROIS. Le secret manquant n'est pas
         une panne : c'est un état que le client doit AFFICHER. Or
         functions.invoke() traite tout code hors 2xx comme une erreur et
         jette le corps — le composeur annonçait « injoignable » là où il
         fallait dire « pas configuré ». Vérifié à l'écran. */
      return repondre({
        error: "cle-absente",
        message: "Pose GIPHY_API_KEY ou TENOR_API_KEY dans les secrets du projet.",
      });
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

    const { recherche = "" } = (await req.json().catch(() => ({}))) as { recherche?: string };
    const q = String(recherche).trim().slice(0, 80);

    /* Giphy d'abord s'il est là : sa clé est la plus simple à obtenir,
       donc la plus probable. */
    const source = cleGiphy ? "giphy" : "tenor";
    let adresse: string;
    if (source === "giphy") {
      const p = new URLSearchParams({
        api_key: cleGiphy!, limit: "24", rating: "g", lang: "fr",
        bundle: "messaging_non_clips",
      });
      if (q) p.set("q", q);
      adresse = q
        ? `https://api.giphy.com/v1/gifs/search?${p}`
        : `https://api.giphy.com/v1/gifs/trending?${p}`;
    } else {
      const p = new URLSearchParams({
        key: cleTenor!, client_key: "overwrite", limit: "24",
        contentfilter: "high", media_filter: "gif,tinygif,nanogif", locale: "fr_FR",
      });
      if (q) p.set("q", q);
      /* Sans recherche, les tendances : une grille vide au premier clic
         n'apprend pas ce qu'on peut y trouver. */
      adresse = q
        ? `https://tenor.googleapis.com/v2/search?${p}`
        : `https://tenor.googleapis.com/v2/featured?${p}`;
    }

    const r = await fetch(adresse, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) {
      /* Le corps du fournisseur dit POURQUOI : une clé refusée et un
         quota dépassé rendent tous deux un 4xx, et les confondre ferait
         chercher au mauvais endroit. */
      const detail = await r.text().catch(() => "");
      return repondre(
        { error: "gif-indisponible", source, statut: r.status, detail: detail.slice(0, 300) },
        r.status === 429 ? 429 : 502,
      );
    }

    const brut = await r.json();
    const brutes = source === "giphy" ? brut?.data : brut?.results;
    const gifs = (Array.isArray(brutes) ? brutes : [])
      .map(source === "giphy" ? deGiphy : deTenor)
      .filter((g: GifRendu | null): g is GifRendu => !!g);

    return repondre({ gifs, source });
  } catch (e) {
    return repondre({ error: "erreur", message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
