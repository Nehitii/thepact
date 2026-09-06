import { describe, expect, it } from "vitest";
import { ORDRES_POSSIBLES, ORDRE_PAR_DEFAUT, LETTRES_DU_POURTOUR, rosaceDuPacte } from "./rosace";
import { VERSION_ALPHABET, ecritureDeLaVersion } from "./sigil";

/* LE CERCLE DU PACTE.
 *
 * La figure d avant etait faite d anneaux et de rayons : aucune droite
 * ne traversait le disque, et c est pour cela qu elle se lisait
 * « rouage » plutot que « sceau ». Celle-ci est construite autour d un
 * POLYGONE ETOILE, et les medaillons se posent sur ses sommets.
 *
 * Ce que ces gardes tiennent : que le polygone en soit un, que
 * l inscription lise le nom en entier, que deux pactes ne portent pas
 * le meme sceau, et que la figure se construise declaration par
 * declaration.
 */

const PI = Math.PI;

const NOMS = [
  "Ananta", "Projet Phénix", "kairos", "L atelier", "Overwrite",
  "Le Second Souffle", "z", "Mille jours", "Ainsi soit-il",
];

describe("Le polygone du cercle", () => {
  it("a cinq, six, sept ou huit sommets — et le nom choisit", () => {
    for (const nom of NOMS) {
      expect(ORDRES_POSSIBLES).toContain(rosaceDuPacte(nom).ordre as 5 | 6 | 7 | 8);
    }
  });

  it("EST UNE ETOILE, PAS UN POLYGONE SIMPLE NI TROIS SEGMENTS", () => {
    /* Un {n/k} n est une figure que si le pas vaut au moins deux — a un,
       c est le polygone convexe — et s il reste sous la moitie de
       l ordre : au-dela on redessine le meme trace en sens inverse, et
       a exactement la moitie ({6/3}, {8/4}) ce ne sont que des segments
       qui se croisent au centre. */
    for (const nom of NOMS) {
      const r = rosaceDuPacte(nom);
      expect(r.pas).toBeGreaterThanOrEqual(2);
      expect(r.pas).toBeLessThan(r.ordre / 2);
    }
  });

  it("passe par TOUS ses sommets, en un ou plusieurs traces", () => {
    /* Quand le pas et l ordre ne sont pas premiers entre eux — {6/2} —
       un seul tour ne visite pas tout : il faut repartir des sommets
       qu on n a pas vus. C est ce qui donne l hexagramme, deux triangles
       au lieu d un trace unique. Un sommet oublie serait un trou. */
    for (const nom of NOMS) {
      const { ordre, pas } = rosaceDuPacte(nom);
      const vus = new Set<number>();
      for (let depart = 0; depart < ordre; depart++) {
        let i = depart;
        do { vus.add(i); i = (i + pas) % ordre; } while (i !== depart);
      }
      expect(vus.size).toBe(ordre);
    }
  });

  it("est stable : le meme nom rend toujours la meme figure", () => {
    expect(rosaceDuPacte("Ananta", ["Liberté"])).toEqual(rosaceDuPacte("Ananta", ["Liberté"]));
  });

  it("ne se laisse pas troubler par les accents ni la casse", () => {
    expect(rosaceDuPacte("Kaïros")).toEqual(rosaceDuPacte("kairos"));
  });
});

describe("L inscription du pourtour", () => {
  it("court sur tout le tour", () => {
    expect(rosaceDuPacte("Ananta").inscription).toHaveLength(LETTRES_DU_POURTOUR);
  });

  it("n emploie que les lettres de l ecriture juree", () => {
    const { signes } = ecritureDeLaVersion(VERSION_ALPHABET);
    for (const d of rosaceDuPacte("Ananta").inscription) expect(signes).toContain(d);
    /* Et un pacte jure sous la v1 garde SES lettres. */
    const v1 = rosaceDuPacte("Ananta", [], 1);
    for (const d of v1.inscription) expect(ecritureDeLaVersion(1).signes).toContain(d);
  });

  it("LIT LE NOM JUSQU A SA DERNIERE LETTRE", () => {
    /* Lue consecutivement depuis le debut, l inscription ne couvrait que
       les premiers caracteres : deux pactes ne differant que par leur
       queue portaient le meme sceau. On repartit sur « longueur - 1 »,
       bornes comprises. */
    const base = "chemin-tres-long-pour-le-test";
    expect(rosaceDuPacte(base + "a").inscription.join())
      .not.toEqual(rosaceDuPacte(base + "z").inscription.join());
  });

  it("DEUX MILLE PACTES, DEUX MILLE SCEAUX", () => {
    /* Un sceau qui se repete n identifie plus. On compare la figure
       entiere : l ordre, le pas et l inscription. */
    const vus = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const r = rosaceDuPacte(`pacte-${i.toString(36)}-${(i * 7).toString(36)}`);
      vus.add(`${r.ordre}/${r.pas}:${r.inscription.join()}`);
    }
    expect(vus.size).toBe(2000);
  });
});

describe("Les medaillons, sur les sommets", () => {
  const TROIS = ["Excellence", "Apprentissage", "Développement personnel"];

  it("se posent CHACUN sur un sommet, et jamais deux sur le meme", () => {
    for (const nom of NOMS) {
      const r = rosaceDuPacte(nom, TROIS);
      const sommets = r.medaillons.map((m) => m.sommet);
      expect(new Set(sommets).size).toBe(sommets.length);
      for (const s of sommets) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThan(r.ordre);
      }
    }
  });

  it("tombent exactement sur l angle de leur sommet", () => {
    const r = rosaceDuPacte("Ananta", TROIS);
    for (const m of r.medaillons) {
      expect(m.angle).toBeCloseTo(-PI / 2 + (m.sommet / r.ordre) * PI * 2, 9);
    }
  });

  it("le premier est en haut : un sceau se lit depuis son sommet", () => {
    const r = rosaceDuPacte("Ananta", TROIS);
    expect(r.medaillons[0].sommet).toBe(0);
    expect(r.medaillons[0].angle).toBeCloseTo(-PI / 2, 9);
  });

  it("L ORDRE DES VALEURS EST LA DONNEE, pas seulement la liste", () => {
    /* Il place les medaillons sur le tour. Deux porteurs qui ont choisi
       les memes valeurs dans un ordre different n ont pas le meme
       sceau, et ce sceau les suit a vie. */
    const a = rosaceDuPacte("Ananta", ["Liberté", "Discipline"]);
    const b = rosaceDuPacte("Ananta", ["Discipline", "Liberté"]);
    expect(a.medaillons.map((m) => m.d)).not.toEqual(b.medaillons.map((m) => m.d));
  });
});

describe("La figure se construit declaration par declaration", () => {
  it("un pacte sans nom n a ni polygone ni inscription", () => {
    /* Pendant la frappe : mieux vaut un cadre qui attend qu un sceau
       qu on n a pas encore. */
    const vide = rosaceDuPacte("   ");
    expect(vide.ordre).toBe(0);
    expect(vide.pas).toBe(0);
    expect(vide.inscription).toEqual([]);
  });

  it("MAIS SES VALEURS ONT DEJA LEURS MEDAILLONS", () => {
    /* Le nom est la DERNIERE declaration de la forge : un sceau qui
       exige le nom pour montrer les valeurs ne montre jamais les
       valeurs a leur ecran. Sans ordre, elles se posent sur les sommets
       du cadre qui attend. */
    const sansNom = rosaceDuPacte("", ["Liberté", "Discipline", "Clarté"]);
    expect(sansNom.medaillons).toHaveLength(3);
    expect(sansNom.medaillons.map((m) => m.valeur))
      .toEqual(["Liberté", "Discipline", "Clarté"]);
    for (const m of sansNom.medaillons) expect(m.sommet).toBeLessThan(ORDRE_PAR_DEFAUT);
  });

  it("et le nom ne change pas leurs caracteres, seulement leur place", () => {
    const valeurs = ["Liberté", "Discipline", "Clarté"];
    const sansNom = rosaceDuPacte("", valeurs);
    const avecNom = rosaceDuPacte("Ananta", valeurs);
    expect(avecNom.medaillons.map((m) => m.d)).toEqual(sansNom.medaillons.map((m) => m.d));
  });
});

describe("La version est lue, pas seulement recopiee", () => {
  it("un pacte de la v1 garde l ecriture de la v1", () => {
    const v1 = rosaceDuPacte("Ananta", ["Liberté"], 1);
    expect(v1.version).toBe(1);
    expect(ecritureDeLaVersion(1).valeurs).toContain(v1.medaillons[0].d);
  });

  it("sans version demandee, c est celle du jour", () => {
    expect(rosaceDuPacte("Ananta").version).toBe(VERSION_ALPHABET);
  });

  it("une version inconnue retombe sur la v1 plutot que sur un ecran vide", () => {
    const inconnue = rosaceDuPacte("Ananta", ["Liberté"], 99);
    expect(ecritureDeLaVersion(1).signes).toContain(inconnue.inscription[0]);
  });
});
