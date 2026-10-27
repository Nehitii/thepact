-- ANNULER : rendre `anon` capable d'évaluer les cinq aides de politiques.
--
-- À jouer si l'on découvre qu'une lecture anonyme lève
-- « permission denied for function … » quelque part — c'est-à-dire
-- qu'une politique visant `public` et citant l'une des cinq aides a
-- échappé à l'inventaire du 28/08.
--
-- LE SYMPTÔME EST TRAÎTRE, et c'est tout l'intérêt de ce fichier : il
-- ne se voit pas en `select … limit 1`. La première politique
-- permissive rend vrai, le OU court-circuite, la fonction n'est jamais
-- appelée. Il faut un `count(*)` — ou n'importe quel plan qui force
-- l'évaluation — pour que l'erreur apparaisse. C'est exactement ce qui
-- avait fait conclure « zéro régression » à tort le 27/08.
--
-- REMETTRE L'EXECUTE NE SUFFIT PAS À REVENIR EN ARRIÈRE : il faut
-- aussi rendre aux douze politiques leur portée `public`, sans quoi
-- l'oracle reste fermé mais la table concernée continue de refuser.
-- Les deux moitiés sont ci-dessous ; ne jouer que la première laisse
-- un état intermédiaire cohérent (l'oracle rouvre, rien ne casse).

begin;

-- ── Moitié 1 : rendre l'EXECUTE. Rouvre l'oracle d'énumération des
--    administrateurs. À n'utiliser que le temps de comprendre.

grant execute on function public.has_role(uuid, public.app_role)  to anon;
grant execute on function public.get_guild_role(uuid, uuid)       to anon;
grant execute on function public.is_guild_member(uuid, uuid)      to anon;
grant execute on function public.peut_ecrire_a(uuid)              to anon;
grant execute on function public.a_un_second_facteur()            to anon;

-- ── Moitié 2 : rendre aux politiques leur portée d'origine.
--    `to public` est la valeur par défaut de PostgreSQL ; c'est bien
--    l'état d'avant le 28/08, pas un élargissement.

alter policy "Admins can manage packs"          on public.bond_packs        to public;
alter policy "Admins can manage banners"        on public.cosmetic_banners  to public;
alter policy "Admins can manage frames"         on public.cosmetic_frames   to public;
alter policy "Admins can manage titles"         on public.cosmetic_titles   to public;
alter policy "Admins view cron runs"            on public.mia_cron_runs     to public;
alter policy "Admins can insert notifications"  on public.notifications     to public;
alter policy "Admins can view all promo codes"  on public.promo_codes       to public;
alter policy "Admins can manage promo codes"    on public.promo_codes       to public;
alter policy "season_rewards_admin_manage"      on public.season_rewards    to public;
alter policy "Admins can manage modules"        on public.shop_modules      to public;
alter policy "Admins can manage offers"         on public.special_offers    to public;
alter policy "Users can send messages"          on public.private_messages  to public;

commit;
