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

-- UN PARAMETRE DECLARE ET JAMAIS LU EST UN PIEGE.
--
-- `purchase_shop_item` acceptait `p_price` et ne s en servait nulle
-- part : le prix etait relu dans le catalogue, ce qui est exactement
-- le bon comportement. Mais la signature laissait croire que le client
-- fixait le prix. Le jour ou quelqu un « corrige » la fonction pour
-- honorer ce parametre, la protection contre la falsification tombe
-- sans que rien ne le signale. On le retire.
--
-- La version a deux arguments est creee d abord : les deux coexistent
-- le temps que le client bascule, sans ambiguite possible puisque
-- Postgres les distingue par leur nombre d arguments.

create or replace function public.purchase_shop_item(p_item_id uuid, p_item_type text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_user_id uuid;
  v_balance_record record;
  v_actual_price integer;
  v_already_owned boolean := false;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_item_type NOT IN ('frame', 'banner', 'title', 'module') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid item type');
  END IF;

  -- Le prix vient du catalogue, jamais de l appelant.
  IF p_item_type = 'module' THEN
    SELECT price_bonds INTO v_actual_price FROM shop_modules   WHERE id = p_item_id AND is_active = true;
  ELSIF p_item_type = 'frame' THEN
    SELECT price       INTO v_actual_price FROM cosmetic_frames  WHERE id = p_item_id AND is_active = true;
  ELSIF p_item_type = 'banner' THEN
    SELECT price       INTO v_actual_price FROM cosmetic_banners WHERE id = p_item_id AND is_active = true;
  ELSIF p_item_type = 'title' THEN
    SELECT price       INTO v_actual_price FROM cosmetic_titles  WHERE id = p_item_id AND is_active = true;
  END IF;

  IF v_actual_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or inactive');
  END IF;

  IF p_item_type = 'module' THEN
    SELECT EXISTS (
      SELECT 1 FROM user_module_purchases WHERE user_id = v_user_id AND module_id = p_item_id
    ) INTO v_already_owned;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM user_cosmetics WHERE user_id = v_user_id AND cosmetic_id = p_item_id AND cosmetic_type = p_item_type
    ) INTO v_already_owned;
  END IF;

  IF v_already_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already owned');
  END IF;

  SELECT * INTO v_balance_record FROM bond_balance WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No balance record found');
  END IF;

  IF v_balance_record.balance < v_actual_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient bonds');
  END IF;

  UPDATE bond_balance
  SET balance = balance - v_actual_price,
      total_spent = total_spent + v_actual_price,
      updated_at = now()
  WHERE user_id = v_user_id;

  IF p_item_type = 'module' THEN
    INSERT INTO user_module_purchases (user_id, module_id) VALUES (v_user_id, p_item_id);
  ELSE
    INSERT INTO user_cosmetics (user_id, cosmetic_id, cosmetic_type) VALUES (v_user_id, p_item_id, p_item_type);
  END IF;

  INSERT INTO bond_transactions (user_id, amount, transaction_type, description, reference_id, reference_type)
  VALUES (v_user_id, -v_actual_price, 'spend', 'Purchased ' || p_item_type,
          p_item_id, CASE WHEN p_item_type = 'module' THEN 'module' ELSE 'cosmetic' END);

  RETURN jsonb_build_object(
    'success', true,
    'price', v_actual_price,
    'new_balance', v_balance_record.balance - v_actual_price
  );
END;
$function$;

grant execute on function public.purchase_shop_item(uuid, text) to authenticated;
