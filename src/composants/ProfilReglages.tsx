/*
Le profil, dans les réglages (web.9.3.1) : le créer (le pseudo sera public, décision 8 de web.9.3, dit avant de le
choisir), noter son code de secours (montré une seule fois), le retrouver avec ce code, ou le supprimer.

Les réglages sont déjà une fenêtre : la confirmation de la suppression s'affiche donc dans la fenêtre, à la place du
bouton, plutôt que dans une seconde fenêtre par-dessus (deux fenêtres l'une sur l'autre se ferment dans le désordre).
 */
import { useId, useState, type FormEvent } from 'react'
import { synchroniser } from '../envoi.ts'
import { creerProfil, estProfil, restaurerProfil, supprimerProfil, useProfil, type ErreurProfil } from '../profil.ts'
import { useTextes } from '../textes.ts'

const BOUTON = 'rounded bg-francle-fonce px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50'
const BOUTON_DISCRET = 'self-start text-sm underline hover:text-texte'
const CHAMP = 'w-full rounded border border-bord bg-fond px-2 py-1.5'

export function ProfilReglages() {
  const textes = useTextes()
  const [etat, setEtat] = useProfil()
  // le code de secours, montré juste après la création, jusqu'à « C'est noté »
  const [secours, setSecours] = useState<string>()
  const [copie, setCopie] = useState(false)
  const [avecSecours, setAvecSecours] = useState(false)
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState<ErreurProfil | 'suppression'>()
  const [patience, setPatience] = useState(false)
  const [confirmation, setConfirmation] = useState(false)
  const champ = useId()

  async function creer(evenement: FormEvent) {
    // un formulaire HTML recharge la page à l'envoi : preventDefault l'en empêche, React s'occupe de tout
    evenement.preventDefault()
    setPatience(true)
    const resultat = avecSecours ? await restaurerProfil(saisie) : await creerProfil(saisie)
    setPatience(false)
    if ('erreur' in resultat) {
      setErreur(resultat.erreur)
      return
    }
    setErreur(undefined)
    setSaisie('')
    if ('secours' in resultat) {
      setEtat(resultat.profil)
      setSecours(resultat.secours)
    } else {
      setEtat(resultat)
      setAvecSecours(false)
    }
    // tout l'historique part au nouveau profil (décision 5 du 14 novembre)
    void synchroniser()
  }

  async function supprimer() {
    if (!estProfil(etat)) {
      return
    }
    setPatience(true)
    const fait = await supprimerProfil(etat)
    setPatience(false)
    setConfirmation(false)
    if (fait) {
      setEtat(undefined)
      setSecours(undefined)
      setErreur(undefined)
    } else {
      setErreur('suppression')
    }
  }

  async function copier(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopie(true)
    } catch {
      // pas de presse-papiers (page non sécurisée) : le code reste affiché, à recopier
    }
  }

  const message =
    erreur === 'suppression' ? textes.profil.erreurSuppression : erreur && textes.profil.erreurs[erreur]

  return (
    <fieldset className="flex flex-col gap-3 border-t border-bord pt-3">
      <legend className="float-left mb-1 font-semibold">{textes.profil.titre}</legend>

      {estProfil(etat) ? (
        <>
          <p>{textes.profil.connecte(etat.pseudo)}</p>
          <p className="text-sm text-discret">{textes.profil.public}</p>
          {secours !== undefined && (
            // role="status" : un lecteur d'écran annonce ce bloc quand il apparaît
            <div role="status" className="flex flex-col gap-2 rounded border-2 border-francle-fonce p-3">
              <p className="font-semibold">{textes.profil.secoursTitre}</p>
              <p className="font-mono text-lg tracking-wider select-all">{secours}</p>
              <p className="text-sm">{textes.profil.secoursAide}</p>
              <div className="flex gap-2">
                <button type="button" className={BOUTON} onClick={() => void copier(secours)}>
                  {copie ? textes.profil.copie : textes.profil.copier}
                </button>
                <button type="button" className={BOUTON} onClick={() => setSecours(undefined)}>
                  {textes.profil.note}
                </button>
              </div>
            </div>
          )}
          {confirmation ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{textes.profil.confirmer}</p>
              <div className="flex gap-2">
                <button type="button" className={`${BOUTON} bg-danger`} disabled={patience} onClick={() => void supprimer()}>
                  {patience ? textes.profil.patience : textes.profil.oui}
                </button>
                <button type="button" className={BOUTON} onClick={() => setConfirmation(false)}>
                  {textes.profil.non}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={BOUTON_DISCRET} onClick={() => setConfirmation(true)}>
              {textes.profil.supprimer}
            </button>
          )}
        </>
      ) : (
        <form onSubmit={(evenement) => void creer(evenement)} className="flex flex-col gap-2">
          {etat !== undefined && <p className="text-sm">{textes.profil.perdu(etat.perdu)}</p>}
          <p className="text-sm">{textes.profil.intro}</p>
          {!avecSecours && <p className="text-sm font-semibold">{textes.profil.public}</p>}
          <label htmlFor={champ} className="text-sm">
            {avecSecours ? textes.profil.codeSecours : textes.profil.pseudo}
          </label>
          <input
            id={champ}
            value={saisie}
            onChange={(evenement) => setSaisie(evenement.target.value)}
            maxLength={avecSecours ? 24 : 20}
            autoComplete="off"
            className={CHAMP}
          />
          <button type="submit" className={`${BOUTON} self-start`} disabled={patience || saisie.trim() === ''}>
            {patience ? textes.profil.patience : avecSecours ? textes.profil.retrouver : textes.profil.creer}
          </button>
          <button
            type="button"
            className={BOUTON_DISCRET}
            onClick={() => {
              setAvecSecours(!avecSecours)
              setErreur(undefined)
              setSaisie('')
            }}
          >
            {avecSecours ? textes.profil.annuler : textes.profil.aiSecours}
          </button>
        </form>
      )}
      {message !== undefined && (
        <p role="alert" className="text-sm text-danger">
          {message}
        </p>
      )}
    </fieldset>
  )
}
