-- LES GARDE-FOUS
--
-- La base acceptait tout : un montant negatif, zero, 999 milliards, un
-- nom de quatre mille caracteres, un nom vide. Le seul rempart etait le
-- formulaire — et il avait deja deux portes derobees : la correction
-- « Desormais » du parcours ecrivait un montant a partir de zero la ou
-- le formulaire exige strictement positif, et l ajout depuis le
-- parcours ignorait le plafond de trente lignes.
--
-- Une regle qui ne vit que dans un composant n est pas une regle, c est
-- une habitude. Celles-ci descendent en base, ou aucun chemin d ecriture
-- ne peut les contourner.
--
-- LES BORNES, ET POURQUOI CELLES-LA.
--
-- Zero est admis : une ligne peut legitimement valoir zero un mois
-- donne, et l interdire empecherait de neutraliser une charge sans la
-- supprimer. C est le NEGATIF qui n a pas de sens — une depense se dit
-- par son signe de colonne, pas par celui de son montant, et une
-- depense negative deviendrait un revenu fantome dans tous les totaux.
--
-- Le plafond d un milliard n est pas une opinion sur la richesse de
-- quiconque : c est le seuil au-dela duquel un nombre ne peut etre
-- qu une faute de frappe, et ou les arrondis en centimes commencent a
-- perdre en precision.
--
-- Cent vingt caracteres pour un nom : au-dela, aucune mise en page ne
-- tient, et le nom cesse d etre un nom.

do $$
declare t text;
begin
  foreach t in array array['recurring_expenses', 'recurring_income'] loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_montant_sense');
    execute format($f$alter table public.%I add constraint %I
      check (amount >= 0 and amount <= 1000000000)$f$, t, t || '_montant_sense');

    execute format('alter table public.%I drop constraint if exists %I', t, t || '_total_sense');
    execute format($f$alter table public.%I add constraint %I
      check (montant_total is null or (montant_total >= 0 and montant_total <= 1000000000))$f$, t, t || '_total_sense');

    execute format('alter table public.%I drop constraint if exists %I', t, t || '_nom_sense');
    execute format($f$alter table public.%I add constraint %I
      check (btrim(name) <> '' and char_length(name) <= 120)$f$, t, t || '_nom_sense');
  end loop;
end $$;

-- Le pointage suit les memes bornes : il alimente l historique, et un
-- montant reel absurde y resterait pour toujours.
alter table public.pointages_du_mois drop constraint if exists pointages_montants_senses;
alter table public.pointages_du_mois add constraint pointages_montants_senses
  check (montant_reel >= 0 and montant_reel <= 1000000000
         and montant_prevu >= 0 and montant_prevu <= 1000000000);

alter table public.pointages_du_mois drop constraint if exists pointages_nom_sense;
alter table public.pointages_du_mois add constraint pointages_nom_sense
  check (btrim(nom) <> '' and char_length(nom) <= 120);

-- Un mois valide ne peut pas avoir coute une somme negative.
alter table public.monthly_finance_validations drop constraint if exists validations_totaux_senses;
alter table public.monthly_finance_validations add constraint validations_totaux_senses
  check (
    (actual_total_income is null or (actual_total_income >= 0 and actual_total_income <= 1000000000))
    and (actual_total_expenses is null or (actual_total_expenses >= 0 and actual_total_expenses <= 1000000000))
  );
