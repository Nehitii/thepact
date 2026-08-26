import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  useListesWishlist, useCreerListe, useRenommerListe, useSupprimerListe, LISTES_MAX,
} from "@/hooks/useWishlistLists";

/**
 * LES LISTES PERSONNELLES.
 *
 * ═══════════════════════════════════════════════════════════════
 * TROIS AU PLUS, ET LE BOUTON LE DIT AVANT DE LE SUBIR.
 *
 * La limite est tenue par un déclencheur en base : elle ne dépend pas de
 * cet écran, et elle tiendrait même si l'on écrivait ailleurs. Le bouton
 * grisé ne protège donc rien — il annonce. Sans lui, on remplirait un
 * champ pour se voir refuser à l'envoi, ce qui est la pire des façons
 * d'apprendre une règle.
 *
 * TROIS, PARCE QU'UNE LISTE QU'ON NE RELIT PAS N'EST PAS UNE LISTE. La
 * wishlist range déjà par objectif ; ces trois-là sont pour ce qui
 * n'appartient à aucun.
 * ═══════════════════════════════════════════════════════════════
 */
export function GestionDesListes({ userId }: { userId: string | undefined }) {
  const { t } = useTranslation();
  const { data: listes = [] } = useListesWishlist(userId);
  const creer = useCreerListe();
  const renommer = useRenommerListe();
  const supprimer = useSupprimerListe();

  const [nouvelle, setNouvelle] = useState<string | null>(null);
  const [renomme, setRenomme] = useState<{ id: string; nom: string } | null>(null);

  const plein = listes.length >= LISTES_MAX;

  if (!userId) return null;

  return (
    <div className="wl-listes" role="group" aria-label={t("wishlist.listes.aria", "Mes listes")}>
      <span className="wl-listes-nom">{t("wishlist.listes.titre", "Mes listes")}</span>

      {listes.map((l) =>
        renomme?.id === l.id ? (
          <form
            key={l.id}
            className="wl-etiquette-edition"
            onSubmit={(e) => {
              e.preventDefault();
              renommer.mutate({ userId, id: l.id, nom: renomme.nom });
              setRenomme(null);
            }}
          >
            <input
              value={renomme.nom}
              autoFocus
              maxLength={60}
              onChange={(e) => setRenomme({ id: l.id, nom: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Escape") setRenomme(null); }}
              aria-label={t("wishlist.listes.nomAria", "Nom de la liste")}
            />
            <button type="submit" className="wl-etiquette-outil" aria-label={t("common.save", "Enregistrer")}>
              <Check aria-hidden="true" />
            </button>
            <button type="button" className="wl-etiquette-outil" onClick={() => setRenomme(null)}
              aria-label={t("common.cancel", "Annuler")}>
              <X aria-hidden="true" />
            </button>
          </form>
        ) : (
          <span key={l.id} className="wl-etiquette">
            <b>{l.name}</b>
            <button type="button" className="wl-etiquette-outil" onClick={() => setRenomme({ id: l.id, nom: l.name })}
              aria-label={t("wishlist.listes.renommer", "Renommer « {{nom}} »", { nom: l.name })}>
              <Pencil aria-hidden="true" />
            </button>
            {/* Supprimer une liste ne supprime pas ses postes : la clé
                étrangère est en « on delete set null », ils reviennent au
                tas des sans-objectif. Le message de succès le dit, parce
                que personne ne devine ce que devient le contenu. */}
            <button type="button" className="wl-etiquette-outil wl-etiquette-outil--danger"
              onClick={() => supprimer.mutate({ userId, id: l.id, nom: l.name })}
              aria-label={t("wishlist.listes.supprimer", "Supprimer « {{nom}} »", { nom: l.name })}>
              <Trash2 aria-hidden="true" />
            </button>
          </span>
        ),
      )}

      {nouvelle !== null ? (
        <form
          className="wl-etiquette-edition"
          onSubmit={(e) => {
            e.preventDefault();
            creer.mutate({ userId, nom: nouvelle });
            setNouvelle(null);
          }}
        >
          <input
            value={nouvelle}
            autoFocus
            maxLength={60}
            placeholder={t("wishlist.listes.exemple", "Maison, Cadeaux…")}
            onChange={(e) => setNouvelle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setNouvelle(null); }}
            aria-label={t("wishlist.listes.nomAria", "Nom de la liste")}
          />
          <button type="submit" className="wl-etiquette-outil" aria-label={t("common.save", "Enregistrer")}>
            <Check aria-hidden="true" />
          </button>
          <button type="button" className="wl-etiquette-outil" onClick={() => setNouvelle(null)}
            aria-label={t("common.cancel", "Annuler")}>
            <X aria-hidden="true" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="wl-etiquette-ajout"
          disabled={plein}
          onClick={() => setNouvelle("")}
          title={plein
            ? t("wishlist.listes.plein", "Trois listes au plus")
            : t("wishlist.listes.nouvelle", "Nouvelle liste")}
        >
          <Plus aria-hidden="true" />
          {plein
            ? t("wishlist.listes.plein", "Trois listes au plus")
            : t("wishlist.listes.nouvelle", "Nouvelle liste")}
        </button>
      )}
    </div>
  );
}
