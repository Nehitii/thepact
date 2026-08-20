/**
 * LE SCEAU — le geste qui honore un groupe.
 *
 * Un groupe ne s honore pas tout seul : il s arrete au seuil et
 * attend une declaration. Ce bouton est cette declaration, et il ne
 * se contente pas d un clic.
 *
 * On le MAINTIENT. Huit cent cinquante millisecondes pendant
 * lesquelles la charge monte des deux bords vers le centre, la plaque
 * se met a trembler d une amplitude qui suit la charge, et les
 * lettres s ecartent. C est la seule facon d obtenir ce que reussit
 * une attaque chargee : une tension qui monte, puis une detente. Un
 * clic n a pas de duree, donc pas de tension, donc rien a relacher.
 *
 * Le relachement est aussi une securite : l honneur d un groupe ne se
 * donne pas par megarde, et lacher avant la fin ne coute rien.
 *
 * La recompense part AVANT l enregistrement, pas apres : sitot le
 * groupe honore, ce bouton disparait de l ecran. On joue donc l eclat
 * en entier, puis on ecrit.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSound } from "@/contexts/SoundContext";

const DUREE_CHARGE = 850;
const DUREE_ECLAT = 480;

interface Props {
  /** Nombre de membres du groupe, tous franchis. */
  total: number;
  onHonorer: () => void;
  /** Eclat de particules au centre de la plaque. */
  onEclat?: (x: number, y: number, couleur: string) => void;
}

type Phase = "repos" | "charge" | "eclat";

export function BoutonHonneur({ total, onHonorer, onEclat }: Props) {
  const { t } = useTranslation();
  const { play } = useSound();

  const [phase, setPhase] = useState<Phase>("repos");
  const [charge, setCharge] = useState(0);

  const plaqueRef = useRef<HTMLButtonElement>(null);
  const imageRef = useRef<number | null>(null);
  const departRef = useRef(0);
  const phaseRef = useRef<Phase>("repos");
  phaseRef.current = phase;

  const arreterBoucle = () => {
    if (imageRef.current !== null) {
      cancelAnimationFrame(imageRef.current);
      imageRef.current = null;
    }
  };

  useEffect(() => arreterBoucle, []);

  const declencher = useCallback(() => {
    setPhase("eclat");
    setCharge(1);
    play("success", "reward");

    const plaque = plaqueRef.current;
    if (plaque && onEclat) {
      const r = plaque.getBoundingClientRect();
      onEclat(r.left + r.width / 2, r.top + r.height / 2, "#fcee0a");
    }

    /* L eclat se joue en entier avant l ecriture : le bouton quitte
       l ecran des que le groupe est honore. */
    window.setTimeout(onHonorer, DUREE_ECLAT);
  }, [onEclat, onHonorer, play]);

  const commencer = useCallback(() => {
    if (phaseRef.current !== "repos") return;
    setPhase("charge");
    play("progress");
    departRef.current = performance.now();

    const image = (maintenant: number) => {
      const p = Math.min(1, (maintenant - departRef.current) / DUREE_CHARGE);
      setCharge(p);
      if (p >= 1) {
        arreterBoucle();
        declencher();
        return;
      }
      imageRef.current = requestAnimationFrame(image);
    };
    imageRef.current = requestAnimationFrame(image);
  }, [declencher, play]);

  const relacher = useCallback(() => {
    if (phaseRef.current !== "charge") return;
    arreterBoucle();
    setPhase("repos");
    setCharge(0);
    play("ui");
  }, [play]);

  const enEclat = phase === "eclat";

  return (
    <div className="gh">
      <div
        className="gh-cadre cp-cadre"
        data-phase={phase}
        style={{ ["--p" as string]: charge }}
      >
        <button
          ref={plaqueRef}
          type="button"
          className="cp-fond gh-plaque"
          disabled={enEclat}
          onPointerDown={commencer}
          onPointerUp={relacher}
          onPointerLeave={relacher}
          onPointerCancel={relacher}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); commencer(); }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") { e.preventDefault(); relacher(); }
          }}
          aria-label={t("goals.detail.holdToHonour", "Maintenir pour honorer ce groupe")}
        >
          <span className="gh-chevrons" aria-hidden="true"><i /><i /><i /></span>
          <span className="gh-libelle">
            {enEclat
              ? t("goals.detail.honoured", "HONORÉ")
              : t("goals.detail.holdLabel", "MAINTENIR POUR HONORER")}
          </span>
          <span className="gh-chevrons gh-chevrons--droite" aria-hidden="true"><i /><i /><i /></span>

          <i className="gh-charge" aria-hidden="true" />
          <i className="gh-eclair" aria-hidden="true" />
        </button>
      </div>

      {enEclat && <i className="gh-onde" aria-hidden="true" />}

      <p className="gh-note">
        {t("goals.detail.thresholdNote", {
          defaultValue: "Les {{n}} objectifs du groupe sont franchis.",
          n: total,
        })}
      </p>
    </div>
  );
}
