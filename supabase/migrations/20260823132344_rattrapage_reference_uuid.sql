-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-23
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

-- bond_transactions.reference_id est un UUID, pas du texte : la clef
-- d un succes — « todo_50_tasks » — n y entre pas. C est l identifiant
-- de la definition qu on y met, qui en est un, et qui designe la meme
-- chose sans conversion douteuse.

create or replace function public.rattraper_les_succes(p_user_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_ajoutes integer := 0;
  v_du integer := 0;
begin
  insert into public.user_achievements (user_id, achievement_key, unlocked_at, progress, seen)
  select p_user_id, s.cle, now(), 100, false
    from public.succes_du_membre(p_user_id) s
   where s.obtenu and s.obtenu_le is null
  on conflict do nothing;

  get diagnostics v_ajoutes = row_count;

  /* Ce qui n a jamais ete verse — les nouveaux comme les anciens. La
     trace dans bond_transactions fait foi : un second passage ne paie
     pas deux fois. */
  select coalesce(sum(coalesce(d.bond_reward, 0)), 0)::int into v_du
    from user_achievements u
    join achievement_definitions d on d.key = u.achievement_key
   where u.user_id = p_user_id
     and coalesce(d.bond_reward, 0) > 0
     and not exists (
       select 1 from bond_transactions bt
        where bt.user_id = p_user_id
          and bt.reference_type = 'achievement'
          and bt.reference_id = d.id
     );

  if v_du > 0 then
    insert into public.bond_transactions
      (user_id, amount, transaction_type, description, reference_type, reference_id)
    select p_user_id, coalesce(d.bond_reward, 0), 'earned',
           coalesce(d.nom_fr, d.name), 'achievement', d.id
      from user_achievements u
      join achievement_definitions d on d.key = u.achievement_key
     where u.user_id = p_user_id
       and coalesce(d.bond_reward, 0) > 0
       and not exists (
         select 1 from bond_transactions bt
          where bt.user_id = p_user_id
            and bt.reference_type = 'achievement'
            and bt.reference_id = d.id
       );

    insert into public.bond_balance (user_id, balance)
    values (p_user_id, v_du)
    on conflict (user_id) do update
      set balance = coalesce(public.bond_balance.balance, 0) + v_du,
          updated_at = now();
  end if;

  return jsonb_build_object('succes_ajoutes', v_ajoutes, 'bonds_verses', v_du);
end;
$$;
