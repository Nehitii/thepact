import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { SelectItem } from "@/socle/ui/select";
import { supabase } from "@/socle/supabase/client";
import { useCurrency } from "@/socle/contextes/CurrencyContext";
import { toast } from "sonner";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { texteDepuisDateCivile, aujourdHuiCivil } from "@/socle/outils/jour";
import { Panneau, Bouton, ChampTexte, ChampListe } from "@/socle/ds/console-ui";
import { VoletSecurite } from "@/domaines/profil/composants/VoletSecuriteCompte";

const TIMEZONES = [
  "UTC", "Europe/Paris", "Europe/London", "America/New_York", "America/Los_Angeles",
  "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney",
] as const;
const COUNTRIES = ["us", "uk", "fr", "de", "jp", "cn", "au", "ca", "es", "it", "br", "in", "other"] as const;

/* Le minimum impose par Supabase Auth. Le client s y aligne plutot que
   d inventer sa propre regle : rejeter ce que le serveur accepte, ou
   l inverse, produit un message qui ne correspond a rien. */
const LONGUEUR_MINIMALE = 6;

export type VoletCompte = "compte" | "securite";

interface Props {
  userId: string;
  volet: VoletCompte;
  initialData: {
    email: string;
    displayName: string;
    timezone: string;
    language: string;
    currency: string;
    birthday: Date | undefined;
    country: string;
  };
}

/* ─────────────────────────────────────────────────────────────
   LA DATE DE NAISSANCE
   ───────────────────────────────────────────────────────────── */

/* Trois listes bornees a aujourd hui. L ancienne version proposait
   l annee courante avec tous ses mois et tous ses jours : une
   naissance en decembre 2026 etait selectionnable, et ni le client ni
   la base ne s y opposaient. */
function TripletNaissance({
  valeur, onChange, etiquette,
}: { valeur: Date | undefined; onChange: (d: Date) => void; etiquette: string }) {
  const locale = useDateFnsLocale();
  const auj = useMemo(() => aujourdHuiCivil(), []);

  const [annee, setAnnee] = useState<number | undefined>(valeur?.getFullYear());
  const [mois, setMois] = useState<number | undefined>(valeur?.getMonth());
  const [jour, setJour] = useState<number | undefined>(valeur?.getDate());

  useEffect(() => {
    if (!valeur) return;
    setAnnee(valeur.getFullYear());
    setMois(valeur.getMonth());
    setJour(valeur.getDate());
  }, [valeur]);

  const annees = useMemo(
    () => Array.from({ length: 120 }).map((_, i) => auj.getFullYear() - i),
    [auj],
  );

  const dernierMois = annee === auj.getFullYear() ? auj.getMonth() : 11;
  const moisDispo = useMemo(
    () => Array.from({ length: dernierMois + 1 }).map((_, i) => ({
      valeur: i,
      libelle: format(new Date(2000, i, 1), "MMMM", { locale }),
    })),
    [dernierMois, locale],
  );

  const dernierJour =
    annee === auj.getFullYear() && mois === auj.getMonth()
      ? auj.getDate()
      : annee !== undefined && mois !== undefined
        ? new Date(annee, mois + 1, 0).getDate()
        : 31;
  const jours = useMemo(() => Array.from({ length: dernierJour }).map((_, i) => i + 1), [dernierJour]);

  const majSelection = (a?: number, m?: number, j?: number) => {
    const na = a ?? annee;
    let nm = m ?? mois;
    let nj = j ?? jour;

    /* Reculer l annee ou le mois peut rendre le jour impossible — le
       31 d un mois de trente jours, le 29 fevrier d une annee commune,
       ou une date desormais future. On rabat plutot que de laisser une
       selection invalide. */
    if (na !== undefined && nm !== undefined) {
      if (na === auj.getFullYear() && nm > auj.getMonth()) nm = auj.getMonth();
      const max =
        na === auj.getFullYear() && nm === auj.getMonth()
          ? auj.getDate()
          : new Date(na, nm + 1, 0).getDate();
      if (nj !== undefined && nj > max) nj = max;
    }

    setAnnee(na); setMois(nm); setJour(nj);
    if (na !== undefined && nm !== undefined && nj !== undefined) onChange(new Date(na, nm, nj));
  };

  return (
    <div className="rg-editeur" data-pleine="">
      <span className="rg-champ-etiquette">{etiquette}</span>
      <div className="rg-triplet">
        <ChampListe
          etiquette={<span className="sr-only">{etiquette} — jour</span>}
          valeur={jour?.toString() ?? ""}
          onChange={(v) => majSelection(undefined, undefined, Number(v))}
          placeholder="JJ"
        >
          {jours.map((j) => <SelectItem key={j} value={j.toString()}>{String(j).padStart(2, "0")}</SelectItem>)}
        </ChampListe>
        <ChampListe
          etiquette={<span className="sr-only">{etiquette} — mois</span>}
          valeur={mois?.toString() ?? ""}
          onChange={(v) => majSelection(undefined, Number(v), undefined)}
          placeholder="Mois"
        >
          {moisDispo.map((m) => <SelectItem key={m.valeur} value={m.valeur.toString()}>{m.libelle}</SelectItem>)}
        </ChampListe>
        <ChampListe
          etiquette={<span className="sr-only">{etiquette} — année</span>}
          valeur={annee?.toString() ?? ""}
          onChange={(v) => majSelection(Number(v), undefined, undefined)}
          placeholder="Année"
        >
          {annees.map((a) => <SelectItem key={a} value={a.toString()}>{a}</SelectItem>)}
        </ChampListe>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LE VOLET « COMPTE »
   ───────────────────────────────────────────────────────────── */

function VoletIdentite({ userId, initialData }: { userId: string; initialData: Props["initialData"] }) {
  const { t, i18n } = useTranslation();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();
  const qc = useQueryClient();

  const [formData, setFormData] = useState(initialData);
  const [enCours, setEnCours] = useState(false);

  /* `initialData` est reconstruit a chaque rendu du parent : le
     comparer par identite ferait clignoter l etat. On compare le
     contenu, fige dans une chaine. */
  const reference = useMemo(
    () => JSON.stringify({ ...initialData, birthday: texteDepuisDateCivile(initialData.birthday) }),
    [initialData],
  );
  const courant = JSON.stringify({ ...formData, birthday: texteDepuisDateCivile(formData.birthday) });
  const modifie = courant !== reference;

  /* Le formulaire suit la source quand elle change sous lui — apres un
     enregistrement, ou depuis un autre onglet du navigateur. Sans
     cela, le cache et l ecran divergeaient definitivement. */
  useEffect(() => {
    setFormData(initialData);
    /* On depend du *contenu*, pas de l objet : `initialData` est une
       nouvelle reference a chaque rendu du parent, et l inclure ici
       reinitialiserait le formulaire a chaque frappe. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const enregistrer = async () => {
    setEnCours(true);
    const nomEnvoye = formData.displayName.trim() || null;
    try {
      /* `.select()` rend la ligne telle que la base l a acceptee —
         triggers compris. C est le seul moyen de savoir que le pseudo
         a ete reecrit. */
      const { data: apres, error } = await supabase
        .from("profiles")
        .update({
          display_name: nomEnvoye,
          timezone: formData.timezone,
          language: formData.language,
          currency: formData.currency,
          birthday: texteDepuisDateCivile(formData.birthday),
          country: formData.country || null,
        })
        .eq("id", userId)
        .select("display_name")
        .single();
      if (error) throw error;

      if (formData.language !== i18n.language) await i18n.changeLanguage(formData.language);
      updateGlobalCurrency(formData.currency);
      await refreshCurrency();

      /* SANS CETTE INVALIDATION, LA PAGE MENTAIT.
         L ecriture directe laissait le cache de `useProfile` sur les
         anciennes valeurs ; la comparaison restait donc vraie et le
         bouton « Enregistrer » reapparaissait aussitot, indefiniment,
         jusqu au rechargement complet. */
      await qc.invalidateQueries({ queryKey: ["profile", userId] });

      /* LE FORMULAIRE MONTRE CE QUI EST STOCKE, PAS CE QU ON A TAPE.
         « Nehiti␣ » part en base comme « Nehiti » — la coupure des
         blancs se fait a l envoi. Sans cette remise a niveau, le champ
         gardait son espace, la comparaison restait vraie, et l ecran
         annoncait « non enregistre » sur une donnee pourtant ecrite. */
      const nomRecu = apres?.display_name ?? null;
      setFormData((f) => ({ ...f, displayName: nomRecu ?? "" }));

      if (nomRecu !== nomEnvoye) {
        /* Le trigger `pas_d_adresse_en_pseudo` ne refuse pas : il
           remplace, en silence. Un nom vide ou porteur d une arobase
           devient un pseudonyme genere. Le taire laissait
           l utilisateur croire que son nom etait celui qu il voyait. */
        toast.warning(t("profile.nameReplacedTitle", "Nom d’affichage remplacé"), {
          description: t(
            "profile.nameReplacedDesc",
            "Un nom vide ou contenant une adresse e-mail est remplacé par un pseudonyme. Le tien est désormais « {{nom}} ».",
            { nom: nomRecu ?? "" },
          ),
        });
      } else {
        toast.success(t("profile.updatedTitle"), { description: t("profile.updatedDesc") });
      }
    } catch (e) {
      toast.error(t("common.error"), { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <Panneau
        code={t("profile.identityPanel", "Identité")}
        etat={modifie ? t("profile.unsaved", "non enregistré") : t("settings.console.synced", "synchronisé")}
        ton={modifie ? "alerte" : "actif"}
        rang="primaire"
        taille="pleine"
      >
        <div className="rg-champs">
          <ChampTexte
            etiquette={t("common.email")}
            value={formData.email}
            disabled
            readOnly
            aide={t("profile.emailCantChange")}
          />
          <ChampTexte
            etiquette={t("profile.displayName")}
            placeholder={t("profile.displayNamePlaceholder")}
            value={formData.displayName}
            maxLength={40}
            onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
            aide={t("profile.displayNameRule", "Un nom vide ou contenant une adresse e-mail sera remplacé par un pseudonyme.")}
          />
          <TripletNaissance
            etiquette={t("profile.birthday")}
            valeur={formData.birthday}
            onChange={(d) => setFormData((p) => ({ ...p, birthday: d }))}
          />
        </div>
      </Panneau>

      <Panneau
        code={t("profile.regionPanel", "Langue & région")}
        etat={formData.language.toUpperCase()}
        ton="actif"
        taille="pleine"
      >
        <div className="rg-champs">
          <ChampListe
            etiquette={t("profile.country")}
            valeur={formData.country}
            onChange={(v) => setFormData((p) => ({ ...p, country: v }))}
            placeholder={t("profile.countryPlaceholder")}
          >
            {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{t(`profile.countries.${c}`)}</SelectItem>)}
          </ChampListe>
          <ChampListe
            etiquette={t("profile.timezone")}
            valeur={formData.timezone}
            onChange={(v) => setFormData((p) => ({ ...p, timezone: v }))}
            placeholder={t("profile.timezonePlaceholder")}
          >
            {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
          </ChampListe>
          <ChampListe
            etiquette={t("profile.language")}
            valeur={formData.language}
            onChange={(v) => setFormData((p) => ({ ...p, language: v }))}
          >
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </ChampListe>
          <ChampListe
            etiquette={t("profile.currency")}
            valeur={formData.currency}
            onChange={(v) => setFormData((p) => ({ ...p, currency: v }))}
          >
            <SelectItem value="eur">EUR (€)</SelectItem>
            <SelectItem value="usd">USD ($)</SelectItem>
          </ChampListe>
        </div>

        {/* L action au pied de son formulaire, plutot qu une barre
            collante permanente qui annonce « SYSTEM.READY » a vide. */}
        <div className="rg-pied">
          <Bouton role="discret" onClick={() => setFormData(initialData)} disabled={!modifie || enCours}>
            {t("common.cancel", "Annuler")}
          </Bouton>
          <Bouton role="primaire" onClick={enregistrer} disabled={!modifie || enCours}>
            {enCours ? <Loader2 className="animate-spin" /> : <Check />}
            {enCours ? t("common.saving", "Enregistrement…") : t("common.save", "Enregistrer")}
          </Bouton>
        </div>
      </Panneau>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   LE VOLET « SECURITE »
   ───────────────────────────────────────────────────────────── */

/* ───────────────────────────────────────────────────────────── */

export function ProfileAccountSettings({ userId, volet, initialData }: Props) {
  return volet === "securite"
    ? <VoletSecurite userId={userId} />
    : <VoletIdentite userId={userId} initialData={initialData} />;
}
