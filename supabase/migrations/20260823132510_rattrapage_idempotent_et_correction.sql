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

-- J AI PAYE SEPT SUCCES DEUX FOIS.
--
-- Mon test d idempotence portait sur reference_id = definition.id.
-- Or les versements d avant — avril a aout — portent un reference_id
-- qui ne designe pas la definition, et leur description suit un autre
-- format : « Achievement: todo_first_task ». Ils etaient donc
-- invisibles a ma verification, et le rattrapage les a repayes :
-- 75 + 5 + 5 + 5 + 15 + 5 + 200 = 310 bonds de trop.
--
-- Deux corrections. Le trop-percu est repris, avec sa trace. Et le
-- test reconnait desormais LES DEUX formes — c est ce qu il aurait
-- fallu faire d emblee : verifier ce qui existe avant d ecrire une
-- regle sur ce qu on croit qui existe.

insert into public.bond_transactions
  (user_id, amount, transaction_type, description, reference_type)
select u.id, -310, 'adjustment',
       'Correction : sept succes payes deux fois par le rattrapage', 'achievement'
  from auth.users u
 where u.id = 'cfc6582d-87b2-4942-ab54-2c48bd96fc38'
   and not exists (
     select 1 from public.bond_transactions bt
      where bt.user_id = u.id and bt.transaction_type = 'adjustment'
        and bt.description like 'Correction : sept succes%'
   );

update public.bond_balance
   set balance = coalesce(balance, 0) - 310, updated_at = now()
 where user_id = 'cfc6582d-87b2-4942-ab54-2c48bd96fc38';

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

  /* DEUX FORMES DE TRACE COHABITENT. Les versements recents portent
     reference_id = definition.id ; les anciens portent une description
     « Achievement: <clef> » et une reference qui designe autre chose.
     Ignorer les seconds revient a repayer sept succes — c est
     exactement ce qui vient d arriver. */
  select coalesce(sum(coalesce(d.bond_reward, 0)), 0)::int into v_du
    from user_achievements u
    join achievement_definitions d on d.key = u.achievement_key
   where u.user_id = p_user_id
     and coalesce(d.bond_reward, 0) > 0
     and not exists (
       select 1 from bond_transactions bt
        where bt.user_id = p_user_id
          and bt.reference_type = 'achievement'
          and (bt.reference_id = d.id or bt.description = 'Achievement: ' || d.key)
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
            and (bt.reference_id = d.id or bt.description = 'Achievement: ' || d.key)
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
