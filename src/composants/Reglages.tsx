import { useId } from 'react'
import type { Reglages as LesReglages, Theme, Unite } from '../reglages.ts'
import { uniteAffichee } from '../reglages.ts'
import { textes } from '../textes.ts'

interface Props {
  reglages: LesReglages
  onChanger: (changement: Partial<LesReglages>) => void
}

// un groupe de boutons radio (un seul choix possible), avec son titre
function Choix<T extends string>(props: {
  titre: string
  valeur: T
  choix: Record<T, string>
  onChoisir: (valeur: T) => void
}) {
  // le même « name » pour tous les boutons du groupe : c'est ce qui les rend exclusifs (cocher l'un décoche l'autre)
  const nom = useId()
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 font-semibold">{props.titre}</legend>
      {/* Object.entries perd le type des clés (il renvoie des string) : on le redonne avec « as » */}
      {(Object.entries(props.choix) as [T, string][]).map(([valeur, libelle]) => (
        <label key={valeur} className="flex items-center gap-2">
          <input
            type="radio"
            name={nom}
            checked={props.valeur === valeur}
            onChange={() => props.onChoisir(valeur)}
            className="accent-francle-fonce"
          />
          {libelle}
        </label>
      ))}
    </fieldset>
  )
}

// une case à cocher, avec une phrase d'explication sous son nom
function Case(props: { libelle: string; aide: string; coche: boolean; onChanger: (coche: boolean) => void }) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={props.coche}
        onChange={(evenement) => props.onChanger(evenement.target.checked)}
        className="mt-1 accent-francle-fonce"
      />
      <span>
        {props.libelle}
        <span className="block text-sm text-discret">{props.aide}</span>
      </span>
    </label>
  )
}

export function Reglages({ reglages, onChanger }: Props) {
  return (
    <div className="flex flex-col gap-4 text-left">
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
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">{textes.reglages.modes}</legend>
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
    </div>
  )
}
