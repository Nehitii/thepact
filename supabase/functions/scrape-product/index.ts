const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractMeta(html: string, property: string): string | null {
  // Try og: tags first, then name= tags
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() || null;
}

function extractPrice(html: string): { price: number | null; currency: string | null } {
  // Try og:price:amount first
  const amount = extractMeta(html, 'og:price:amount') || extractMeta(html, 'product:price:amount');
  const curr = extractMeta(html, 'og:price:currency') || extractMeta(html, 'product:price:currency');
  if (amount) {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!isNaN(parsed)) return { price: parsed, currency: curr || null };
  }

  // Try JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      try {
        const content = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        const json = JSON.parse(content);
        const offers = json.offers || json?.mainEntity?.offers;
        if (offers) {
          const offer = Array.isArray(offers) ? offers[0] : offers;
          if (offer?.price) {
            const p = parseFloat(String(offer.price).replace(',', '.'));
            if (!isNaN(p)) return { price: p, currency: offer.priceCurrency || null };
          }
        }
      } catch { /* ignore */ }
    }
  }

  return { price: null, currency: null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log('Scraping product URL:', formattedUrl);

    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LovableBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    const name = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || extractTitle(html);
    const image_url = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');
    const { price, currency } = extractPrice(html);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: name || null,
          image_url: image_url || null,
          price: price,
          currency: currency,
          source_url: formattedUrl,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
