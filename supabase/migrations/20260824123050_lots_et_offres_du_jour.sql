-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-24
-- sans qu un fichier soit ecrit dans le depot. Elle n existait plus
-- que dans « supabase_migrations.schema_migrations », qui garde le SQL
-- de chaque migration en plus de son numero.
--
-- Le contenu ci-dessous est celui du registre, mot pour mot — la prose
-- d origine comprise. Rien n a ete reecrit.
--
-- NE PAS LA REJOUER : elle est deja appliquee. Elle est ici pour que
-- « supabase/migrations » redevienne un compte rendu fidele du schema,
-- et pour qu un environnement neuf puisse etre reconstruit.
-- ═══════════════════════════════════════════════════════════════════

-- LA BOUTIQUE N AVAIT PLUS RIEN A VENDRE.
--
-- Les lots, les offres du jour et leurs fonctions d achat existaient
-- deja, verrouilles et atomiques. Il manquait des lignes. On les cree,
-- et on repare deux defauts trouves en les lisant.

-- ── 1 · LE LOT NE REFUSAIT RIEN ───────────────────────────────────
-- `purchase_bundle` sautait l insertion des articles deja possedes
-- mais debitait le prix plein. Acheter un lot dont on possede tout
-- coutait donc le prix entier pour zero article. On refuse ce cas ;
-- une possession partielle reste normale, c est le principe du lot.
create or replace function public.purchase_bundle(p_bundle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_user_id uuid;
  v_bundle record;
  v_balance_record record;
  v_item jsonb;
  v_item_id uuid;
  v_item_type text;
  v_cosmetic_type text;
  v_already_owned boolean;
  v_nouveaux integer := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_bundle FROM shop_bundles WHERE id = p_bundle_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bundle not found or inactive');
  END IF;

  IF v_bundle.starts_at IS NOT NULL AND v_bundle.starts_at > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bundle not yet available');
  END IF;
  IF v_bundle.ends_at IS NOT NULL AND v_bundle.ends_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bundle has expired');
  END IF;

  -- Compter ce que ce lot apporterait reellement, AVANT de debiter.
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_bundle.items)
  LOOP
    v_item_id := (v_item->>'item_id')::uuid;
    v_item_type := v_item->>'item_type';
    IF v_item_type = 'module' THEN
      SELECT EXISTS (SELECT 1 FROM user_module_purchases WHERE user_id = v_user_id AND module_id = v_item_id) INTO v_already_owned;
    ELSE
      v_cosmetic_type := replace(v_item_type, 'cosmetic_', '');
      SELECT EXISTS (SELECT 1 FROM user_cosmetics WHERE user_id = v_user_id AND cosmetic_id = v_item_id AND cosmetic_type = v_cosmetic_type) INTO v_already_owned;
    END IF;
    IF NOT v_already_owned THEN v_nouveaux := v_nouveaux + 1; END IF;
  END LOOP;

  IF v_nouveaux = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already owned', 'code', 'lot_deja_possede');
  END IF;

  SELECT * INTO v_balance_record FROM bond_balance WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No balance record found');
  END IF;
  IF v_balance_record.balance < v_bundle.price_bonds THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient bonds');
  END IF;

  UPDATE bond_balance
  SET balance = balance - v_bundle.price_bonds,
      total_spent = total_spent + v_bundle.price_bonds,
      updated_at = now()
  WHERE user_id = v_user_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_bundle.items)
  LOOP
    v_item_id := (v_item->>'item_id')::uuid;
    v_item_type := v_item->>'item_type';
    IF v_item_type = 'module' THEN
      INSERT INTO user_module_purchases (user_id, module_id)
      VALUES (v_user_id, v_item_id) ON CONFLICT DO NOTHING;
    ELSE
      v_cosmetic_type := replace(v_item_type, 'cosmetic_', '');
      INSERT INTO user_cosmetics (user_id, cosmetic_id, cosmetic_type)
      VALUES (v_user_id, v_item_id, v_cosmetic_type) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  INSERT INTO bond_transactions (user_id, amount, transaction_type, description, reference_id, reference_type)
  VALUES (v_user_id, -v_bundle.price_bonds, 'spend', 'Purchased bundle: ' || v_bundle.name, p_bundle_id, 'bundle');

  RETURN jsonb_build_object(
    'success', true,
    'price', v_bundle.price_bonds,
    'articles_obtenus', v_nouveaux,
    'new_balance', v_balance_record.balance - v_bundle.price_bonds
  );
END;
$function$;

-- ── 2 · TROIS LOTS, BATIS SUR LE CATALOGUE REEL ───────────────────
-- Les identifiants sont retrouves par nom : aucun UUID en dur.
insert into shop_bundles (name, description, price_bonds, original_price_bonds, discount_percentage, rarity, display_order, items)
select 'Braise',
       'Tout ce qui brule : deux anneaux ardents, un cadre de flamme et sa banniere.',
       1400, 1900, 26, 'epic', 1,
       jsonb_agg(jsonb_build_object('item_id', id, 'item_type', t))
from (
  select id, 'cosmetic_frame' as t from cosmetic_frames  where name in ('Fire','Brasier Cramoisi','Anneau Ecarlate')
  union all
  select id, 'cosmetic_banner'      from cosmetic_banners where name = 'Ember'
) x;

insert into shop_bundles (name, description, price_bonds, original_price_bonds, discount_percentage, rarity, display_order, items)
select 'Abysse',
       'Le vide et l eau profonde : la parure la plus sombre du catalogue.',
       1900, 2700, 30, 'legendary', 2,
       jsonb_agg(jsonb_build_object('item_id', id, 'item_type', t))
from (
  select id, 'cosmetic_frame' as t from cosmetic_frames  where name in ('Void','Halo Azur')
  union all
  select id, 'cosmetic_banner'      from cosmetic_banners where name in ('Void Purple','Ocean')
) x;

insert into shop_bundles (name, description, price_bonds, original_price_bonds, discount_percentage, rarity, display_order, items)
select 'Couronne',
       'Or, pourpre et deux titres : de quoi se presenter autrement.',
       1800, 2500, 28, 'epic', 3,
       jsonb_agg(jsonb_build_object('item_id', id, 'item_type', t))
from (
  select id, 'cosmetic_frame' as t from cosmetic_frames  where name = 'Royal'
  union all
  select id, 'cosmetic_banner'      from cosmetic_banners where name = 'Royal Gold'
  union all
  select id, 'cosmetic_title'       from cosmetic_titles  where title_text in ('Legend','Unstoppable')
) x;

-- ── 3 · L OFFRE DU JOUR SE FABRIQUE TOUTE SEULE ───────────────────
-- Inserer trois lignes a la main aurait donne une vitrine morte des
-- demain. La selection est tiree de la date elle-meme : elle est donc
-- stable dans la journee, differente le lendemain, et ne demande ni
-- tache planifiee ni hasard — `md5(id || date)` suffit a ordonner.
create or replace function public.assurer_offres_du_jour()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_creees integer := 0;
begin
  if exists (select 1 from shop_daily_deals where deal_date = current_date) then
    return 0;
  end if;

  with candidats as (
    select id, 'cosmetic_frame' as type, price from cosmetic_frames  where is_active and not is_default and price > 0
    union all
    select id, 'cosmetic_banner',        price from cosmetic_banners where is_active and not is_default and price > 0
    union all
    select id, 'cosmetic_title',         price from cosmetic_titles  where is_active and not is_default and price > 0
  ),
  tirage as (
    select id, type,
           row_number() over (order by md5(id::text || current_date::text)) as rang
    from candidats
  )
  insert into shop_daily_deals (item_id, item_type, discount_percentage, deal_date, is_active)
  select id, type,
         case rang when 1 then 40 when 2 then 30 else 20 end,
         current_date, true
  from tirage where rang <= 3;

  get diagnostics v_creees = row_count;
  return v_creees;
end;
$$;

grant execute on function public.assurer_offres_du_jour() to authenticated;

-- Les offres passees ne doivent plus s afficher : le hook du client
-- ne filtrait que sur `is_active`, alors que l achat exige la date du
-- jour. Une offre d hier serait restee visible et inachetable.
update shop_daily_deals set is_active = false where deal_date < current_date;

select public.assurer_offres_du_jour();
