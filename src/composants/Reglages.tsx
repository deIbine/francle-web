import { useId } from 'react'
import type { Langue } from '../domaine/regions.ts'
import type { Reglages as LesReglages, Theme, Unite } from '../reglages.ts'
import { langueAffichee, uniteAffichee } from '../reglages.ts'
import { useTextes } from '../textes.ts'

interface Props {
  reglages: LesReglages
  onChanger: (changement: Partial<LesReglages>) => void
}

// un groupe de boutons radio (un seul choix possible), avec son titre. Depuis web.7.16.4, les choix sont dessinés
// côte à côte, comme des boutons groupés, le choix actif en bleu Francle. Ce sont toujours de vrais boutons radio
// (sr-only : invisibles, mais présents) : le clavier (flèches) et les lecteurs d'écran marchent comme avant.
// has-[:checked] : le style du libellé dépend de la case qu'il contient (le sélecteur CSS :has)
function Choix<T extends string>(props: {
  titre: string
  valeur: T
  choix: Record<T, string>
  onChoisir: (valeur: T) => void
}) {
  // le même « name » pour tous les boutons du groupe : c'est ce qui les rend exclusifs (cocher l'un décoche l'autre)
  const nom = useId()
  return (
    <fieldset className="flex items-center justify-between gap-2">
      {/* float-left : une <legend> se place d'habitude sur le bord du cadre ; ainsi, elle se range dans la ligne */}
      <legend className="float-left font-semibold">{props.titre}</legend>
      <div className="flex rounded-lg bg-surface p-0.5 text-sm">
        {/* Object.entries perd le type des clés (il renvoie des string) : on le redonne avec « as » */}
        {(Object.entries(props.choix) as [T, string][]).map(([valeur, libelle]) => (
          <label
            key={valeur}
            className="cursor-pointer rounded-md px-3 py-1 text-discret has-[:checked]:bg-francle-fonce has-[:checked]:font-semibold has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-francle-fonce"
          >
            <input
              type="radio"
              name={nom}
              checked={props.valeur === valeur}
              onChange={() => props.onChoisir(valeur)}
              className="sr-only"
            />
            {libelle}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// une case à cocher, dessinée en interrupteur, avec une phrase d'explication sous son nom. La vraie case reste là,
// invisible (sr-only) : « peer » permet au dessin qui la suit de changer d'apparence quand elle est cochée
// (peer-checked:) ou qu'elle a le focus du clavier (peer-focus-visible:)
function Case(props: { libelle: string; aide: string; coche: boolean; onChanger: (coche: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>
        {props.libelle}
        <span className="block text-sm text-discret">{props.aide}</span>
      </span>
      <input
        type="checkbox"
        checked={props.coche}
        onChange={(evenement) => props.onChanger(evenement.target.checked)}
        className="peer sr-only"
      />
      {/* l'interrupteur : un rail, et un rond (after:) qui glisse à droite quand la case est cochée */}
      <span
        aria-hidden="true"
        className="relative h-6 w-10 shrink-0 rounded-full bg-bord transition-colors peer-checked:bg-francle-fonce peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-francle-fonce after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  )
}

export function Reglages({ reglages, onChanger }: Props) {
  const textes = useTextes()
  return (
    <div className="flex flex-col gap-4 text-left">
      <Choix<Langue>
        titre={textes.reglages.langue}
        valeur={langueAffichee(reglages)}
        choix={textes.reglages.langues}
        onChoisir={(langue) => onChanger({ langue })}
      />
      <Choix<Theme>
        titre={textes.reglages.theme}
        valeur={reglages.theme}
        choix={textes.reglages.themes}
        onChoisir={(theme) => onChanger({ theme })}
      />
      <Choix<Unite>
        titre={textes.reglages.unite}
        // l'unité affichée, même si le joueur ne l'a jamais choisie (elle suit alors la langue)
        valeur={uniteAffichee(reglages)}
        choix={textes.reglages.unites}
        onChoisir={(unite) => onChanger({ unite })}
      />
      <fieldset className="flex flex-col gap-3 border-t border-bord pt-3">
        <legend className="float-left mb-1 font-semibold">{textes.reglages.modes}</legend>
        <Case
          libelle={textes.reglages.rotation}
          aide={textes.reglages.rotationAide}
          coche={reglages.rotation}
          onChanger={(rotation) => onChanger({ rotation })}
        />
        <Case
          libelle={textes.reglages.cachee}
          aide={textes.reglages.cacheeAide}
          coche={reglages.cachee}
          onChanger={(cachee) => onChanger({ cachee })}
        />
        <p className="text-sm text-discret">{textes.reglages.plusTard}</p>
      </fieldset>
      <fieldset className="flex flex-col gap-3 border-t border-bord pt-3">
        <legend className="float-left mb-1 font-semibold">{textes.reglages.liste}</legend>
        <Case
          libelle={textes.reglages.listeBouton}
          aide={textes.reglages.listeAide}
          coche={reglages.liste}
          onChanger={(liste) => onChanger({ liste })}
        />
      </fieldset>
      <fieldset className="flex flex-col gap-3 border-t border-bord pt-3">
        <legend className="float-left mb-1 font-semibold">{textes.reglages.bonus}</legend>
        <Case
          libelle={textes.reglages.departementsDifficiles}
          aide={textes.reglages.departementsDifficilesAide}
          coche={reglages.departementsDifficiles}
          onChanger={(departementsDifficiles) => onChanger({ departementsDifficiles })}
        />
      </fieldset>
    </div>
  )
}
