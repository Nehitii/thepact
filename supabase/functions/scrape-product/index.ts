import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAiQuota } from "../_shared/quota.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/** Block private/internal IP ranges and metadata endpoints to prevent SSRF */
function isUrlSafe(urlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }

  // Only allow https
  if (parsed.protocol !== 'https:') return false;

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') return false;

  // Block metadata endpoints
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') return false;

  // Block private IP ranges
  const parts = hostname.split('.');
  if (parts.length === 4 && parts.every(p => /^\d+$/.test(p))) {
    const a = parseInt(parts[0]);
    const b = parseInt(parts[1]);
    if (a === 10) return false;                          // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return false;   // 172.16.0.0/12
    if (a === 192 && b === 168) return false;             // 192.168.0.0/16
    if (a === 169 && b === 254) return false;             // 169.254.0.0/16
    if (a === 0) return false;                            // 0.0.0.0/8
  }

  // Block IPv6 private (fc00::/7, fe80::/10)
  if (hostname.startsWith('[fc') || hostname.startsWith('[fd') || hostname.startsWith('[fe8') || hostname.startsWith('[fe9') || hostname.startsWith('[fea') || hostname.startsWith('[feb')) return false;

  return true;
}

/* ═══════════════════════════════════════════════════════════════
   LA LECTURE D UNE PAGE PRODUIT

   MESURE QUI A DECLENCHE CETTE REECRITURE. L import du nettoyeur
   Karcher K5 sur castorama.fr a bien rapporte une adresse d image —
   mais telle qu ecrite dans le HTML :

     ...MP?$MOB_PREV$&amp;$width=1200&amp;$height=1200

   Le « & » etait reste sous sa forme d entite HTML. Demandee ainsi,
   l adresse repond 403 avec quinze octets de texte ; decodee, elle
   repond 200 avec 162 Ko de JPEG. L image existait — l import la
   detruisait en la recopiant sans la decoder.

   On decode donc TOUT ce qui sort du HTML, et on cherche plus loin
   que og: — beaucoup de boutiques ne posent leur image que dans le
   JSON-LD ou dans un link rel=image_src.
   ═══════════════════════════════════════════════════════════════ */

const ENTITES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  eacute: 'é', egrave: 'è', ecirc: 'ê', agrave: 'à', ccedil: 'ç',
  ugrave: 'ù', ocirc: 'ô', icirc: 'î', euro: '€', hellip: '…',
  laquo: '«', raquo: '»', deg: '°', times: '×', mdash: '—', ndash: '–',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', trade: '™', reg: '®', copy: '©',
};

/** Decode les entites HTML nommees et numeriques. */
function decoderEntites(valeur: string): string {
  return valeur
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+[0-9]*);/gi, (entier, nom) => ENTITES[nom.toLowerCase()] ?? entier);
}

/** Une adresse relative devient absolue, sinon elle ne chargera jamais. */
function resoudreUrl(brut: string | null, base: string): string | null {
  if (!brut) return null;
  const propre = decoderEntites(brut.trim());
  if (!propre) return null;
  try {
    return new URL(propre, base).toString();
  } catch {
    return null;
  }
}

/* Les parametres de campagne n identifient pas le produit : deux
   liens vers la meme fiche ne differaient que par leur gclid, et la
   detection de doublon par adresse ne les reconnaissait pas. */
const PISTAGE = /^(utm_|gcl|gad_|wiz_|mc_|ms_|fb|yc|_hs|pk_|piwik_|matomo_|igshid|mkt_|ref_?src)/i;

function nettoyerUrl(brut: string): string {
  try {
    const u = new URL(brut);
    const aRetirer: string[] = [];
    u.searchParams.forEach((_, cle) => { if (PISTAGE.test(cle)) aRetirer.push(cle); });
    aRetirer.forEach((cle) => u.searchParams.delete(cle));
    u.hash = '';
    return u.toString();
  } catch {
    return brut;
  }
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name|itemprop)=["']${property}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]?.trim()) return decoderEntites(m[1].trim());
  }
  return null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ? decoderEntites(m[1].trim()) : null;
}

/** Tous les blocs JSON-LD de la page, a plat. */
function blocsJsonLd(html: string): unknown[] {
  const blocs = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!blocs) return [];
  const sortie: unknown[] = [];
  for (const bloc of blocs) {
    try {
      const contenu = bloc.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      const json = JSON.parse(decoderEntites(contenu));
      const pile = Array.isArray(json) ? [...json] : [json];
      while (pile.length) {
        const noeud = pile.shift();
        if (!noeud || typeof noeud !== 'object') continue;
        sortie.push(noeud);
        const graphe = (noeud as Record<string, unknown>)['@graph'];
        if (Array.isArray(graphe)) pile.push(...graphe);
      }
    } catch { /* un bloc casse ne doit pas emporter les autres */ }
  }
  return sortie;
}

/** Le nom : og, puis le JSON-LD, puis le premier titre de la page. */
function extractName(html: string): string | null {
  const meta = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title');
  if (meta) return meta;

  for (const noeud of blocsJsonLd(html)) {
    const n = noeud as Record<string, unknown>;
    if (typeof n.name === 'string' && n.name.trim()) return n.name.trim();
  }

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) {
    const texte = decoderEntites(h1[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (texte) return texte;
  }

  return extractTitle(html);
}

/** L image : og, twitter, link rel=image_src, JSON-LD, itemprop. */
function extractImage(html: string, base: string): string | null {
  const pistes: (string | null)[] = [
    extractMeta(html, 'og:image:secure_url'),
    extractMeta(html, 'og:image'),
    extractMeta(html, 'twitter:image'),
    extractMeta(html, 'twitter:image:src'),
  ];

  const lien = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
  if (lien?.[1]) pistes.push(lien[1]);

  for (const noeud of blocsJsonLd(html)) {
    const image = (noeud as Record<string, unknown>).image;
    if (typeof image === 'string') pistes.push(image);
    else if (Array.isArray(image) && typeof image[0] === 'string') pistes.push(image[0] as string);
    else if (image && typeof image === 'object') {
      const u = (image as Record<string, unknown>).url;
      if (typeof u === 'string') pistes.push(u);
    }
  }

  const itemprop = html.match(/<img[^>]+itemprop=["']image["'][^>]+src=["']([^"']+)["']/i);
  if (itemprop?.[1]) pistes.push(itemprop[1]);

  for (const piste of pistes) {
    const resolue = resoudreUrl(piste ?? null, base);
    if (resolue && /^https?:/i.test(resolue)) return resolue;
  }
  return null;
}

/* « 1 299,00 », « 1,299.00 », « 299.99 » : trois ecritures du meme
   nombre. On tranche par la position du dernier separateur. */
function lireMontant(brut: string): number | null {
  const propre = decoderEntites(brut).replace(/[\s\u00A0\u202F]/g, '').replace(/[^\d.,-]/g, '');
  if (!propre) return null;

  const dernierPoint = propre.lastIndexOf('.');
  const derniereVirgule = propre.lastIndexOf(',');
  let normalise = propre;

  if (dernierPoint >= 0 && derniereVirgule >= 0) {
    normalise = derniereVirgule > dernierPoint
      ? propre.replace(/\./g, '').replace(',', '.')
      : propre.replace(/,/g, '');
  } else if (derniereVirgule >= 0) {
    /* Une virgule suivie de trois chiffres est un separateur de
       milliers, pas des centimes : « 1,299 » vaut mille deux cent
       quatre-vingt-dix-neuf. */
    normalise = /,\d{3}$/.test(propre) ? propre.replace(/,/g, '') : propre.replace(',', '.');
  }

  const n = parseFloat(normalise);
  return Number.isFinite(n) ? n : null;
}

function extractPrice(html: string): { price: number | null; currency: string | null } {
  const montant = extractMeta(html, 'og:price:amount')
    || extractMeta(html, 'product:price:amount')
    || extractMeta(html, 'price');
  const devise = extractMeta(html, 'og:price:currency')
    || extractMeta(html, 'product:price:currency')
    || extractMeta(html, 'priceCurrency');

  if (montant) {
    const n = lireMontant(montant);
    if (n !== null) return { price: n, currency: devise || null };
  }

  for (const noeud of blocsJsonLd(html)) {
    const n = noeud as Record<string, unknown>;
    const offres = n.offers ?? (n.mainEntity as Record<string, unknown> | undefined)?.offers;
    if (!offres) continue;
    const offre = (Array.isArray(offres) ? offres[0] : offres) as Record<string, unknown>;
    const prix = offre?.price ?? offre?.lowPrice;
    if (prix !== undefined && prix !== null) {
      const v = lireMontant(String(prix));
      if (v !== null) {
        return { price: v, currency: (offre.priceCurrency as string) || devise || null };
      }
    }
  }

  const itemprop = html.match(/<[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i);
  if (itemprop?.[1]) {
    const v = lireMontant(itemprop[1]);
    if (v !== null) return { price: v, currency: devise || null };
  }

  return { price: null, currency: null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quotaResp = await checkAiQuota(supabase, "scrape-product", 30, corsHeaders);
    if (quotaResp) return quotaResp;

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // SSRF protection: validate URL before fetching
    if (!isUrlSafe(formattedUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping product URL for user:', claimsData.claims.sub);

    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      /* Le statut amont dit pourquoi, et chaque cas appelle un geste
         different : reessayer, corriger l adresse, ou renoncer. */
      const motif =
        response.status === 403 || response.status === 401
          ? 'site_refuse'
          : response.status === 404 || response.status === 410
            ? 'page_absente'
            : response.status === 429
              ? 'trop_de_demandes'
              : 'site_injoignable';

      console.log('Scrape refuse:', response.status, motif, formattedUrl);

      return new Response(
        JSON.stringify({
          success: false,
          code: motif,
          statut: response.status,
          error: `Failed to fetch: ${response.status}`,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    /* La page finale, apres redirections : c est elle qui sert de
       base aux adresses relatives. */
    const pageFinale = response.url || formattedUrl;

    const name = extractName(html);
    const image_url = extractImage(html, pageFinale);
    const { price, currency } = extractPrice(html);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: name || null,
          image_url: image_url || null,
          price: price,
          currency: currency,
          source_url: nettoyerUrl(pageFinale),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
