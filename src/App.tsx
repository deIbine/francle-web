/*
L'application : l'en-tête (titre, onglets, boutons ❓ ⚙️ FR/EN 📊), « Comment jouer », les réglages, les deux sortes de
partie et le bas de page.

Les deux parties restent affichées en même temps, l'une cachée (attribut hidden) : passer d'un onglet à l'autre ne
fait pas perdre la partie en cours de l'autre.

<PartieDuJour key={numero}> : quand le jour change (à minuit, page ouverte), la clé change, et React jette
l'ancienne partie du jour pour en créer une neuve. Tout son état repart de zéro pour la nouvelle région.
 */
import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { Aide } from './composants/Aide.tsx'
import { Credits } from './composants/Credits.tsx'
import { Fenetre } from './composants/Fenetre.tsx'
import { Reglages } from './composants/Reglages.tsx'
import { numero } from './domaine/regionDuJour.ts'
import { PartieDuJour } from './PartieDuJour.tsx'
import { PartieLibre } from './PartieLibre.tsx'
import { aideVue, langueAffichee, marquerAideVue, useReglages, useTheme } from './reglages.ts'
import { LangueContext, TEXTES } from './textes.ts'

type Onglet = 'jour' | 'libre'
const ONGLETS: readonly Onglet[] = ['jour', 'libre']

// la date est un paramètre pour les tests ; sur le site, il est absent et c'est aujourd'hui
export default function App({ date }: { date?: Date }) {
  // new Date() dans une fonction passée à useState : appelée une seule fois, et non à chaque affichage
  const [jour, setJour] = useState(() => date ?? new Date())
  const [onglet, setOnglet] = useState<Onglet>('jour')
  const [reglages, changerReglages] = useReglages()
  const [fenetreReglages, setFenetreReglages] = useState(false)
  // « Comment jouer » : ouvert d'emblée à la première visite
  const [fenetreAide, setFenetreAide] = useState(() => !aideVue())
  // chaque clic sur 📊 augmente ce compteur : la partie du jour, qui garde la fenêtre des statistiques, l'ouvre
  const [demandeStats, setDemandeStats] = useState(0)
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

  const boutonIcone = 'rounded px-2 text-2xl hover:bg-surface'

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
                onJourSuivant={() => setJour(new Date())}
                reglages={reglages}
                demandeStats={demandeStats}
              />
            ) : (
              <PartieLibre reglages={reglages} />
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
