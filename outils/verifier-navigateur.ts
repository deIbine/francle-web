/*
La vérification de l'accessibilité dans un vrai navigateur (web.7.21).

Les tests (npm test) lancent axe dans jsdom, un faux navigateur qui ne dessine rien : axe n'y mesure ni les contrastes
de couleur ni ce qui est visible. Ce script joue une partie dans un vrai navigateur (Microsoft Edge, déjà installé sur
Windows, piloté par Playwright), en thème clair puis en thème sombre, et lance axe sur chaque écran : « Comment jouer »,
une partie en cours, les réglages, le bonus et sa confirmation, la fenêtre des résultats, le bilan, la partie libre,
et la page en anglais.

Lancement, à la main (pas dans la CI pour l'instant, décidé le 9 novembre 2026) :
    npm run verifier:navigateur
La commande construit d'abord le site (vite build), puis ce script le sert en local (vite preview) le temps de la
vérification. Il s'arrête avec le code 1 si axe trouve un problème, et dit lequel, sur quel écran.

Node lit ce fichier TypeScript tel quel (il efface les types, depuis Node 23.6) : pas de compilation à part.
 */
import { createRequire } from 'node:module'
import { chromium, type Browser, type Page } from 'playwright'
import { preview } from 'vite'
import { moisDuNumero, numero, regionDuJour } from '../src/domaine/regionDuJour.ts'

// le chemin d'axe-core dans node_modules, injecté dans chaque page vérifiée
const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js')

// une règle « expérimentale », qu'axe ne lance pas d'office : le nom d'un bouton doit contenir son texte visible. Elle
// ne peut rien conclure dans jsdom (voir Accessibilite.test.tsx), d'où sa place ici
const REGLES = { 'label-content-name-mismatch': { enabled: true } }

type Theme = 'light' | 'dark'

// les problèmes trouvés, pour le résumé de la fin : « thème, écran : règle (impact) : élément »
const problemes: string[] = []
let ecransVerifies = 0

async function verifier(page: Page, theme: Theme, ecran: string): Promise<void> {
  await page.addScriptTag({ path: AXE })
  // ce qui est entre les accolades s'exécute DANS la page, pas dans Node : c'est là qu'axe a été chargé. Ce fichier est
  // vérifié comme du code Node (sans les types du navigateur) : la page est décrite à la main, juste ce qu'il faut
  const violations = await page.evaluate(async (regles) => {
    interface Resultat {
      violations: { id: string; impact: string; nodes: { html: string }[] }[]
    }
    const { axe, document } = globalThis as unknown as {
      axe: { run: (contexte: unknown, options: object) => Promise<Resultat> }
      document: unknown
    }
    const resultat = await axe.run(document, { rules: regles })
    return resultat.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      elements: violation.nodes.map((noeud) => noeud.html.slice(0, 140)),
    }))
  }, REGLES)
  ecransVerifies++
  const nom = `${theme === 'light' ? 'clair' : 'sombre'}, ${ecran}`
  if (violations.length === 0) {
    console.log(`  ok   ${nom}`)
    return
  }
  console.log(`  ÉCHEC ${nom}`)
  for (const violation of violations) {
    for (const element of violation.elements) {
      const ligne = `${nom} : ${violation.id} (${violation.impact}) : ${element}`
      problemes.push(ligne)
      console.log(`       ${violation.id} (${violation.impact}) : ${element}`)
    }
  }
}

// Edge d'abord (déjà sur Windows), puis Chrome, puis le Chromium de Playwright s'il a été téléchargé
// (npx playwright install chromium)
async function ouvrirNavigateur(): Promise<Browser> {
  for (const channel of ['msedge', 'chrome', undefined]) {
    try {
      return await chromium.launch({ channel })
    } catch {
      // celui-ci n'est pas installé : on essaie le suivant
    }
  }
  throw new Error('Aucun navigateur trouvé : installer Edge ou Chrome, ou lancer « npx playwright install chromium ».')
}

// une partie complète, en français : chaque écran est vérifié au passage
async function partieDuJour(navigateur: Browser, adresse: string, theme: Theme): Promise<void> {
  // un contexte neuf : aucune sauvegarde (« Comment jouer » s'ouvre donc tout seul), le thème du système imité
  // (colorScheme) ; le jeu suit le thème du système tant que le joueur n'en a pas choisi un
  const contexte = await navigateur.newContext({ colorScheme: theme, locale: 'fr-FR', viewport: { width: 375, height: 812 } })
  // le serveur des chiffres de tous (depuis web.9.2.2), imité : Playwright répond lui-même aux requêtes, sans réseau.
  // La fenêtre des résultats montre ainsi ses chiffres, et axe les vérifie (le contraste des barres, entre autres)
  await contexte.route('**/parties', (requete) => requete.fulfill({ json: { rangees: 1, ignorees: 0 } }))
  await contexte.route('**/chiffres/*', (requete) =>
    requete.fulfill({
      json: {
        jour: numero(new Date()),
        joueurs: 10,
        victoires: 8,
        repartition: [1, 3, 3, 1, 0, 0],
        points: [2, 0, 0, 1, 3, 2, 1, 1, 0, 0, 0],
      },
    }),
  )
  // les profils, la ligue et les classements (depuis web.9.3.4), imités de même : un profil créé, une ligue de deux
  // membres, et le même classement pour la ligue et le public
  const mois = moisDuNumero(numero(new Date()))
  const lignes = [
    { id: 'a', pseudo: 'Loutre bretonne', rang: 1, total: 23, parties: 4 },
    { id: 'moi', pseudo: 'Testeur', rang: 2, total: 17, parties: 4 },
  ]
  const ligue = {
    id: 'l',
    nom: 'La famille',
    code: 'ABC234',
    createur: true,
    membres: [
      { id: 'moi', pseudo: 'Testeur', createur: true },
      { id: 'a', pseudo: 'Loutre bretonne', createur: false },
    ],
  }
  await contexte.route('**/profils', (requete) =>
    requete.fulfill({
      status: 201,
      json: { id: 'moi', pseudo: 'Testeur', code: 'c'.repeat(32), secours: 'ABCD-EFGH-JKMN-PQRS' },
    }),
  )
  await contexte.route('**/profil', (requete) =>
    requete.fulfill({ json: { id: 'moi', pseudo: 'Testeur', masque: false, ligue } }),
  )
  await contexte.route('**/profil/parties', (requete) => requete.fulfill({ json: { rangees: 1, ignorees: 0 } }))
  await contexte.route(/\/(ligue\/)?classement\?/, (requete) =>
    requete.fulfill({ json: { mois, lignes, joueurs: 2 } }),
  )
  const page = await contexte.newPage()
  await page.goto(adresse)

  const aide = page.getByRole('dialog', { name: 'Comment jouer' })
  await aide.waitFor()
  await verifier(page, theme, '« Comment jouer »')
  await aide.getByRole('button', { name: 'Jouer', exact: true }).click()

  const panneau = page.getByRole('tabpanel')
  const proposer = async (nom: string) => {
    const champ = panneau.getByRole('combobox')
    await champ.fill(nom)
    await champ.press('Escape')
    await champ.press('Enter')
  }
  const cible = regionDuJour(new Date())
  const autre = cible.id === 'bretagne' ? 'Normandie' : 'Bretagne'
  await proposer(autre)
  await panneau.getByRole('row', { name: new RegExp(autre) }).waitFor()
  // les suggestions ouvertes, comme pendant la saisie
  await panneau.getByRole('combobox').fill('no')
  await verifier(page, theme, 'partie en cours, suggestions ouvertes')
  await panneau.getByRole('combobox').fill('')

  await page.getByRole('button', { name: 'Ouvrir les réglages' }).click()
  await verifier(page, theme, 'réglages')
  await page.getByRole('dialog', { name: 'Réglages' }).getByRole('button', { name: 'Fermer', exact: true }).click()

  // la victoire : le bonus commence, une réponse, puis « Passer » et sa confirmation
  await proposer(cible.nom.fr)
  const carte = panneau.getByRole('group', { name: 'Carte des départements de la région' })
  await carte.waitFor()
  await verifier(page, theme, 'bonus en cours')
  // un département de la carte, et son numéro. En outre-mer (depuis web.7.22 : le script attendait un bouton, et
  // restait bloqué les jours d'outre-mer), la question demande le numéro sans clic : la zone n'est pas un bouton
  const zone = carte.locator('[data-code]').first()
  const code = await zone.getAttribute('data-code')
  if ((await zone.getAttribute('role')) === 'button') {
    await zone.click()
  }
  const reponse = panneau.getByRole('combobox', { name: 'Ta réponse' })
  await reponse.fill(code ?? '')
  await reponse.press('Escape')
  await reponse.press('Enter')
  // en outre-mer, une seule question : le bonus est déjà fini, et la confirmation n'apparaît pas
  const passer = panneau.getByRole('button', { name: 'Passer', exact: true })
  if (await passer.isVisible()) {
    await passer.click()
    await verifier(page, theme, 'bonus, confirmation de « Passer »')
    await panneau.getByRole('button', { name: 'Oui', exact: true }).click()
  }

  const resultats = page.getByRole('dialog', { name: 'Résultats' })
  await resultats.waitFor()
  await resultats.getByRole('region', { name: 'Les joueurs du jour' }).waitFor()
  await verifier(page, theme, 'fenêtre des résultats, avec les chiffres de tous')
  await resultats.getByRole('button', { name: 'Fermer', exact: true }).click()
  await verifier(page, theme, 'bilan de la partie')

  // la page de confidentialité (depuis web.9.2.3), par le bas de page, ses numéros dépliés
  // (le <footer> est dans <main> : un vrai navigateur ne lui donne pas le rôle « contentinfo », on prend le bouton seul)
  await page.getByRole('button', { name: 'Confidentialité', exact: true }).click()
  const confidentialite = page.getByRole('dialog', { name: 'Confidentialité' })
  await confidentialite.getByText('Mes numéros tirés').click()
  await verifier(page, theme, 'page de confidentialité')
  await confidentialite.getByRole('button', { name: 'Fermer', exact: true }).click()

  // le profil (depuis web.9.3.4) : créé dans les réglages, son code de secours affiché
  await page.getByRole('button', { name: 'Ouvrir les réglages' }).click()
  const reglages = page.getByRole('dialog', { name: 'Réglages' })
  await reglages.getByLabel('Ton pseudo').fill('Testeur')
  await reglages.getByRole('button', { name: 'Créer mon profil' }).click()
  await reglages.getByRole('status').waitFor()
  await verifier(page, theme, 'réglages, profil créé et son code de secours')
  await reglages.getByRole('button', { name: 'Fermer', exact: true }).click()

  // la ligue et le classement public, dans l'onglet « Classement » des statistiques
  await page.getByRole('button', { name: 'Voir les statistiques' }).click()
  // la partie du jour est finie : la fenêtre de 📊 s'appelle « Résultats »
  const statistiques = page.getByRole('dialog', { name: 'Résultats' })
  await statistiques.getByRole('tab', { name: 'Classement' }).click()
  await statistiques.getByRole('table').waitFor()
  await verifier(page, theme, 'onglet Classement, la ligue')
  await statistiques.getByRole('button', { name: 'Public', exact: true }).click()
  await statistiques.getByRole('table').waitFor()
  await verifier(page, theme, 'onglet Classement, le classement public')
  await statistiques.getByRole('button', { name: 'Fermer', exact: true }).click()

  await page.getByRole('tab', { name: 'Partie libre' }).click()
  await verifier(page, theme, 'partie libre')

  // en anglais, par le bouton de l'en-tête
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await verifier(page, theme, 'partie libre, en anglais')
  await page.getByRole('tab', { name: 'Daily game' }).click()
  await verifier(page, theme, 'partie du jour finie, en anglais')

  await contexte.close()
}

// le site construit (dist/), servi sur un port libre ; resolvedUrls donne l'adresse, chemin de base compris
const serveur = await preview({ preview: { port: 4173, strictPort: false }, logLevel: 'warn' })
const adresse = serveur.resolvedUrls?.local[0]
if (adresse === undefined) {
  throw new Error('Le serveur local n’a pas donné d’adresse.')
}
const navigateur = await ouvrirNavigateur()
console.log(`Vérification d'accessibilité (axe) dans ${navigateur.browserType().name()} ${navigateur.version()}, sur ${adresse}`)
try {
  for (const theme of ['light', 'dark'] as const) {
    await partieDuJour(navigateur, adresse, theme)
  }
} finally {
  await navigateur.close()
  await serveur.close()
}

console.log(`\n${ecransVerifies} écrans vérifiés, ${problemes.length} problème${problemes.length > 1 ? 's' : ''}.`)
// process.exitCode plutôt que process.exit() : Node finit proprement ce qui reste, puis rend ce code
process.exitCode = problemes.length === 0 ? 0 : 1
