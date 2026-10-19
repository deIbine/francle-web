/*
L'application : l'en-tête (titre, onglets, boutons ❓ ⚙️ FR/EN 📃 📊), « Comment jouer », les réglages, les deux sortes de
partie et le bas de page.

Les deux parties restent affichées en même temps, l'une cachée (attribut hidden) : passer d'un onglet à l'autre ne
fait pas perdre la partie en cours de l'autre.

<PartieDuJour key={numero}> : quand le jour change, la clé change, et React jette l'ancienne partie du jour pour en
créer une neuve. Tout son état repart de zéro pour la nouvelle région.

C'est App qui surveille le changement de jour, que la partie soit finie ou non (voir useJour).
 */
import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { Aide } from './composants/Aide.tsx'
import { Credits } from './composants/Credits.tsx'
import { Fenetre } from './composants/Fenetre.tsx'
import { Reglages } from './composants/Reglages.tsx'
import { numero } from './domaine/regionDuJour.ts'
import { minuitSuivant } from './domaine/temps.ts'
import { PartieDuJour } from './PartieDuJour.tsx'
import { PartieLibre } from './PartieLibre.tsx'
import type { Liste } from './liste.ts'
import { aideVue, langueAffichee, marquerAideVue, useReglages, useTheme } from './reglages.ts'
import { LangueContext, TEXTES } from './textes.ts'

type Onglet = 'jour' | 'libre'
const ONGLETS: readonly Onglet[] = ['jour', 'libre']

// le jour de la partie, tenu à jour. Une page peut rester ouverte des jours (un onglet de téléphone mis en veille) :
// on regarde si le jour a changé à minuit, et chaque fois que la page revient à l'écran
function useJour(): Date {
  // new Date() dans une fonction passée à useState : appelée une seule fois, et non à chaque affichage
  const [jour, setJour] = useState(() => new Date())

  useEffect(() => {
    // vrai si le jour a changé (le jour est alors mis à jour)
    function verifier(): boolean {
      const maintenant = new Date()
      const change = numero(maintenant) !== numero(jour)
      if (change) {
        setJour(maintenant)
      }
      return change
    }

    // une minuterie jusqu'à minuit. Si elle sonne un peu trop tôt (un navigateur n'est pas précis à la
    // milliseconde), on en relance une pour le temps qui reste
    let minuterie: ReturnType<typeof setTimeout>
    function programmer() {
      minuterie = setTimeout(() => {
        if (!verifier()) {
          programmer()
        }
      }, minuitSuivant(jour).getTime() - Date.now())
    }
    programmer()

    // un téléphone en veille endort les minuteries : au réveil, la page redevient visible, et on vérifie
    function auRetour() {
      if (document.visibilityState === 'visible') {
        verifier()
      }
    }
    document.addEventListener('visibilitychange', auRetour)

    // le ménage, quand le jour change ou que la page se ferme (comme retirer un listener en Swing)
    return () => {
      clearTimeout(minuterie)
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [jour])

  return jour
}

export default function App() {
  const jour = useJour()
  const [onglet, setOnglet] = useState<Onglet>('jour')
  const [reglages, changerReglages] = useReglages()
  const [fenetreReglages, setFenetreReglages] = useState(false)
  // « Comment jouer » : ouvert d'emblée à la première visite
  const [fenetreAide, setFenetreAide] = useState(() => !aideVue())
  // chaque clic sur 📊 augmente ce compteur : la partie du jour, qui garde la fenêtre des statistiques, l'ouvre
  const [demandeStats, setDemandeStats] = useState(0)
  // de même pour 📃, la liste des régions : un compteur par onglet, et seule la partie affichée ouvre sa liste
  // (celle de son époque)
  const [demandeListe, setDemandeListe] = useState<Record<Onglet, number>>({ jour: 0, libre: 0 })
  // et la liste qu'ouvre 📃 dans chaque onglet : celle des départements pendant le bonus, sinon celle des régions.
  // Chaque partie nous le dit (onListe), pour le nom du bouton
  const [listes, setListes] = useState<Record<Onglet, Liste>>({ jour: 'regions', libre: 'regions' })
  const signalerListe = (nom: Onglet) => (liste: Liste) => setListes((avant) => ({ ...avant, [nom]: liste }))
  const id = useId()
  useTheme(reglages.theme)
  const langue = langueAffichee(reglages)
  const textes = TEXTES[langue]
  // la langue de la page, pour le navigateur et les lecteurs d'écran (qui prononcent alors avec le bon accent)
  useEffect(() => {
    document.documentElement.lang = langue
  }, [langue])

  // le clavier dans les onglets, selon le modèle du W3C : ← et → passent d'un onglet à l'autre
  function toucheOnglet(evenement: KeyboardEvent) {
    if (evenement.key === 'ArrowLeft' || evenement.key === 'ArrowRight') {
      const suivant = ONGLETS[(ONGLETS.indexOf(onglet) + 1) % ONGLETS.length]
      setOnglet(suivant)
      document.getElementById(`${id}-onglet-${suivant}`)?.focus()
    }
  }

  // px-1 sur téléphone, px-2 à partir de 640 pixels (sm:) : avec trois boutons à droite, le titre et son numéro
  // tiennent ainsi sur une ligne même sur un écran de 375 pixels
  const boutonIcone = 'rounded px-1 text-2xl hover:bg-surface sm:px-2'

  return (
    // la langue choisie, transmise à tous les composants en dessous (voir LangueContext dans textes.ts)
    <LangueContext value={langue}>
      {/* max-w-md : 28rem au plus, centré (mx-auto) ; flex flex-col gap-4 : les blocs en colonne, espacés de 1rem */}
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 text-center">
        {/* grid à trois colonnes (1fr auto 1fr) : le titre reste centré, les boutons de part et d'autre */}
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-y-2">
          <div className="flex items-center justify-self-start">
            <button
              type="button"
              onClick={() => setFenetreAide(true)}
              aria-label={textes.aide.ouvrir}
              className={boutonIcone}
            >
              ❓
            </button>
            <button
              type="button"
              onClick={() => setFenetreReglages(true)}
              aria-label={textes.reglages.ouvrir}
              className={boutonIcone}
            >
              ⚙️
            </button>
          </div>
          <h1 className="text-3xl font-bold tracking-wide">
            {textes.titre}
            {onglet === 'jour' && (
              // l'espace hors du span : dans le span, les lecteurs d'écran la perdraient (« Francleno° 3 »)
              <>
                {' '}
                <span className="text-base font-normal text-discret">{textes.numero(numero(jour))}</span>
              </>
            )}
          </h1>
          <div className="flex items-center justify-self-end">
            <button
              type="button"
              onClick={() => changerReglages({ langue: langue === 'fr' ? 'en' : 'fr' })}
              // lang : le nom du bouton est dans l'AUTRE langue (« Switch to English ») : on le dit au lecteur d'écran
              lang={langue === 'fr' ? 'en' : 'fr'}
              aria-label={textes.autreLangue.long}
              className="rounded border border-bord px-1.5 py-0.5 text-xs font-bold hover:bg-surface"
            >
              {textes.autreLangue.court}
            </button>
            {reglages.liste && (
              <button
                type="button"
                onClick={() => setDemandeListe((avant) => ({ ...avant, [onglet]: avant[onglet] + 1 }))}
                aria-label={listes[onglet] === 'departements' ? textes.liste.departements.ouvrir : textes.liste.ouvrir}
                className={boutonIcone}
              >
                📃
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOnglet('jour')
                setDemandeStats((n) => n + 1)
              }}
              aria-label={textes.stats.ouvrir}
              className={boutonIcone}
            >
              📊
            </button>
          </div>
          <p className="col-span-3 text-sm text-discret">{textes.sousTitre}</p>

          {/* les onglets : role="tablist", "tab" et "tabpanel" disent aux lecteurs d'écran comment ils marchent */}
          <div
            role="tablist"
            aria-label={textes.onglets.titre}
            className="col-span-3 grid grid-cols-2 rounded-lg bg-surface p-1"
          >
            {ONGLETS.map((nom) => (
              <button
                key={nom}
                id={`${id}-onglet-${nom}`}
                type="button"
                role="tab"
                aria-selected={onglet === nom}
                aria-controls={`${id}-panneau-${nom}`}
                // seul l'onglet choisi est dans l'ordre de la touche Tab ; les flèches font passer à l'autre
                tabIndex={onglet === nom ? 0 : -1}
                onClick={() => setOnglet(nom)}
                onKeyDown={toucheOnglet}
                className={`rounded-md py-1.5 text-sm font-semibold ${onglet === nom ? 'bg-fond shadow' : 'text-discret'}`}
              >
                {textes.onglets[nom]}
              </button>
            ))}
          </div>
        </header>

        {ONGLETS.map((nom) => (
          <section
            key={nom}
            id={`${id}-panneau-${nom}`}
            role="tabpanel"
            aria-labelledby={`${id}-onglet-${nom}`}
            hidden={onglet !== nom}
            // hidden l'emporte sur flex : la classe ne s'applique que quand le panneau est visible
            className="flex flex-col gap-4 [&[hidden]]:hidden"
          >
            {nom === 'jour' ? (
              <PartieDuJour
                key={numero(jour)}
                jour={jour}
                reglages={reglages}
                demandeStats={demandeStats}
                demandeListe={demandeListe.jour}
                onListe={signalerListe('jour')}
              />
            ) : (
              <PartieLibre reglages={reglages} demandeListe={demandeListe.libre} onListe={signalerListe('libre')} />
            )}
          </section>
        ))}

        <Credits />

        <Fenetre
          ouverte={fenetreAide}
          onFermer={() => {
            setFenetreAide(false)
            marquerAideVue()
          }}
          titre={textes.aide.titre}
        >
          <Aide
            onJouer={() => {
              setFenetreAide(false)
              marquerAideVue()
            }}
          />
        </Fenetre>

        <Fenetre ouverte={fenetreReglages} onFermer={() => setFenetreReglages(false)} titre={textes.reglages.titre}>
          <Reglages reglages={reglages} onChanger={changerReglages} />
        </Fenetre>
      </main>
    </LangueContext>
  )
}
