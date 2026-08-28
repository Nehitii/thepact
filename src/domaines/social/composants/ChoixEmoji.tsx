import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Smile } from "lucide-react";
import { useTranslation } from "react-i18next";

/* UN MENU D EMOJI, SANS DEPENDANCE.
 *
 * Les bibliotheques du genre pesent plusieurs centaines de kilo-octets
 * — l ensemble Unicode, ses traductions et ses images. Pour un
 * composeur de publication, une selection tenue a la main suffit
 * largement et ne coute que ce qu elle affiche.
 *
 * Les mots-cles sont en francais parce que c est la langue du
 * produit ; la recherche ignore les accents, comme celle des
 * objectifs. */

interface Groupe {
  cle: string;
  repli: string;
  emojis: [string, string][];
}

const GROUPES: Groupe[] = [
  {
    cle: "humeur", repli: "Humeur",
    emojis: [
      ["😀", "sourire content joie"], ["😄", "rire joie"], ["🙂", "sourire calme"],
      ["😊", "sourire timide content"], ["😅", "rire gene sueur"], ["😂", "rire larmes"],
      ["🥲", "sourire larme emu"], ["😌", "soulage calme apaise"], ["🤔", "reflexion doute"],
      ["😐", "neutre sans avis"], ["😴", "fatigue sommeil dormir"], ["😮‍💨", "souffle soupir"],
      ["😤", "determination colere effort"], ["😭", "pleurs triste"], ["😱", "peur choc"],
      ["🤯", "explose depasse"], ["🥴", "epuise vase"], ["😎", "fier assure"],
      ["🥳", "fete celebration"], ["🫡", "salut respect"],
    ],
  },
  {
    cle: "effort", repli: "Effort",
    emojis: [
      ["💪", "force muscle effort"], ["🔥", "feu serie motivation"], ["⚡", "eclair energie"],
      ["🎯", "cible objectif"], ["🏆", "trophee victoire"], ["🥇", "medaille premier"],
      ["🚀", "fusee lancement progres"], ["📈", "hausse progression"], ["📉", "baisse recul"],
      ["✅", "fait valide coche"], ["☑️", "coche case"], ["❌", "echec rate non"],
      ["⏳", "temps attente sablier"], ["⏰", "reveil heure"], ["🗓️", "calendrier date"],
      ["🧗", "escalade effort"], ["🏃", "course sport"], ["🧘", "calme meditation"],
      ["🛌", "repos sommeil"], ["🩹", "soin blessure"],
    ],
  },
  {
    cle: "esprit", repli: "Esprit",
    emojis: [
      ["🧠", "cerveau mental reflexion"], ["💡", "idee eclair"], ["📚", "livres apprendre"],
      ["✍️", "ecrire note"], ["🔍", "chercher loupe"], ["🧩", "piece puzzle"],
      ["🪞", "miroir introspection"], ["🌱", "pousse debut croissance"], ["🌊", "vague flux"],
      ["🌙", "lune nuit"], ["☀️", "soleil jour"], ["🧭", "boussole direction"],
      ["⚖️", "equilibre balance"], ["🕯️", "bougie calme"], ["🪨", "pierre obstacle"],
      ["🧱", "mur blocage"], ["🔑", "cle solution"], ["🚧", "travaux obstacle"],
      ["🌗", "phase changement"], ["♾️", "infini"],
    ],
  },
  {
    cle: "lien", repli: "Lien",
    emojis: [
      ["❤️", "coeur amour"], ["🧡", "coeur orange"], ["💚", "coeur vert soutien"],
      ["💙", "coeur bleu"], ["💜", "coeur violet"], ["🤝", "poignee main accord"],
      ["🙏", "merci priere"], ["👏", "applaudir bravo"], ["👍", "pouce accord bien"],
      ["👎", "pouce contre"], ["🫂", "etreinte soutien"], ["🎉", "fete bravo"],
      ["🥂", "trinquer celebration"], ["🫶", "coeur mains affection"], ["✨", "etincelles"],
      ["🌟", "etoile"], ["💬", "message parole"], ["📣", "annonce porte voix"],
      ["🆘", "aide secours"], ["🔔", "cloche rappel"],
    ],
  },
];

function sansAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function ChoixEmoji({ onChoisir }: { onChoisir: (emoji: string) => void }) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const boite = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLInputElement>(null);

  const resultats = useMemo(() => {
    const q = sansAccents(recherche.trim());
    if (!q) return null;
    return GROUPES.flatMap((g) => g.emojis).filter(([, mots]) => sansAccents(mots).includes(q));
  }, [recherche]);

  useEffect(() => {
    if (!ouvert) { setRecherche(""); return; }
    champ.current?.focus();
    const dehors = (e: MouseEvent) => {
      if (boite.current && !boite.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  const poser = (emoji: string) => {
    onChoisir(emoji);
    setOuvert(false);
  };

  return (
    <div className="co-choix" ref={boite}>
      <button
        type="button"
        className="co-puce"
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={t("community.create.emoji", "Emoji")}
        onClick={() => setOuvert((v) => !v)}
      >
        <Smile aria-hidden="true" />
      </button>

      {ouvert && (
        <div className="co-choix-panneau co-emojis">
          <div className="co-choix-recherche">
            <Search aria-hidden="true" />
            <input
              ref={champ}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t("community.create.searchEmoji", "Chercher un émoji…")}
              aria-label={t("community.create.searchEmoji", "Chercher un émoji…")}
            />
          </div>

          <div className="co-choix-liste">
            {resultats ? (
              resultats.length === 0 ? (
                <p className="co-choix-message">{t("community.create.noEmoji", "Aucun émoji ne correspond")}</p>
              ) : (
                <div className="co-emojis-grille">
                  {resultats.map(([e, mots]) => (
                    <button key={e} type="button" className="co-emoji" title={mots} onClick={() => poser(e)}>
                      {e}
                    </button>
                  ))}
                </div>
              )
            ) : (
              GROUPES.map((g) => (
                <section key={g.cle}>
                  <h3 className="co-emojis-titre">{t(`community.emojis.${g.cle}`, g.repli)}</h3>
                  <div className="co-emojis-grille">
                    {g.emojis.map(([e, mots]) => (
                      <button key={e} type="button" className="co-emoji" title={mots} onClick={() => poser(e)}>
                        {e}
                      </button>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
