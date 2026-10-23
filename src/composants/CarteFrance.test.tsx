import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { centreDeGravite, morceaux, type Point } from '../contours.ts'
import { silhouette } from '../images.ts'
import anciennes from '../images/cartes/anciennes.json'
import nouvelles from '../images/cartes/nouvelles.json'
import { couleurProximite } from '../domaine/partage.ts'
import { abandonner, nouvellePartie, proposer, type Partie } from '../domaine/partie.ts'
import { REGIONS, parId, tirables, type Mode } from '../domaine/regions.ts'
import { CarteFrance } from './CarteFrance.tsx'

function jouer(cible: string, ...propositions: string[]): Partie {
  let partie = nouvellePartie(parId(cible), 'nouvelles')
  for (const proposition of propositions) {
    partie = proposer(partie, proposition) ?? partie
  }
  return partie
}

// la partie de la maquette : l'Occitanie trouvée en 5 essais
const OCCITANIE = jouer('occitanie', 'Grand Est', 'Pays de la Loire', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie')

// un point est-il dans un morceau ? On tire un trait vers la droite : il coupe le bord un nombre impair de fois
// si le point est dedans (le « lancer de rayon »)
function dedans({ x, y }: Point, morceau: readonly Point[]): boolean {
  let dans = false
  morceau.forEach((a, i) => {
    const b = morceau[(i + morceau.length - 1) % morceau.length]
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      dans = !dans
    }
  })
  return dans
}

function traceDe(carte: HTMLElement, nom: string): SVGPathElement {
  const trace = [...carte.querySelectorAll('path')].find((p) => p.querySelector('title')?.textContent === nom)
  if (trace === undefined) {
    throw new Error(`Pas de tracé pour : ${nom}`)
  }
  return trace
}

describe('Les images', () => {
  it('chaque région a sa silhouette, et il y a une image « defaut »', () => {
    // une adresse de fichier (« /francle-web/assets/bretagne-3fa9c1.svg »), ou l'image elle-même pour les plus
    // petites : Vite écrit directement dans le code les fichiers de moins de 4 Ko (« data:image/svg+xml,… »),
    // ce qui évite au navigateur une requête de plus
    const image = /\.svg$|^data:image\/svg\+xml,/
    for (const region of REGIONS) {
      expect(silhouette(region.id), region.id).toMatch(image)
    }
    expect(silhouette('defaut')).toMatch(image)
  })

  it.each(['nouvelles', 'anciennes'] as const)('la carte « %s » dessine chaque région de son époque', (mode: Mode) => {
    const regions = tirables(mode)
    const { container } = render(<CarteFrance partie={nouvellePartie(regions[0], mode)} />)
    // une région, un tracé : ni oubli, ni région de l'autre époque
    expect(container.querySelectorAll('path')).toHaveLength(regions.length)
  })

  it('la réponse est en bleu, dessinée en dernier (devant les autres)', () => {
    render(<CarteFrance partie={abandonner(jouer('bretagne'))} />)
    const carte = screen.getByRole('img', { name: 'Carte de France, la région Bretagne en bleu' })
    const traces = carte.querySelectorAll('path')
    const derniere = traces[traces.length - 1]
    expect(derniere.getAttribute('class')).toContain('fill-francle-fonce')
    expect([...traces].filter((trace) => trace.getAttribute('class')?.includes('fill-francle-fonce'))).toHaveLength(1)
  })
})

describe('La carte de fin en couleur', () => {
  it('chaque région proposée prend la couleur de sa proximité, la réponse reste en bleu', () => {
    render(<CarteFrance partie={OCCITANIE} />)
    const carte = screen.getByRole('img', { name: /^Carte de France, la région Occitanie en bleu/ })
    OCCITANIE.essais.slice(0, -1).forEach((essai) => {
      // jsdom écrit la couleur en rgb() : on compare à la couleur passée par le même chemin
      const attendu = document.createElement('div')
      attendu.style.fill = couleurProximite(essai.proximite)
      expect(traceDe(carte, essai.region.nom.fr).style.fill, essai.region.id).toBe(attendu.style.fill)
    })
    expect(traceDe(carte, 'Occitanie').getAttribute('class')).toContain('fill-francle-fonce')
    expect(traceDe(carte, 'Occitanie').style.fill).toBe('')
    // les régions jamais proposées restent neutres, sans nom au survol
    expect(carte.querySelectorAll('path.fill-carte-fond')).toHaveLength(18 - 5)
    expect(carte.querySelectorAll('title')).toHaveLength(5)
  })

  it('une pastille numérotée par essai, dans l’ordre', () => {
    const { container } = render(<CarteFrance partie={OCCITANIE} />)
    expect([...container.querySelectorAll('text')].map((t) => t.textContent)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('un lecteur d’écran entend les essais, avec leur numéro et leur proximité', () => {
    render(<CarteFrance partie={jouer('bretagne', 'Normandie', 'Bretagne')} />)
    const proximite = jouer('bretagne', 'Normandie').essais[0].proximite
    expect(
      screen.getByRole('img', {
        name: `Carte de France, la région Bretagne en bleu. Tes essais\u00a0: 1 Normandie, ${proximite}\u00a0%\u00a0; 2 Bretagne, 100\u00a0%`,
      }),
    ).toBeDefined()
  })

  it('la légende ne s’affiche que s’il y a des essais à expliquer', () => {
    const { container, unmount } = render(<CarteFrance partie={jouer('bretagne', 'Bretagne')} />)
    expect(container.querySelector('figcaption')).toBeNull()
    unmount()
    render(<CarteFrance partie={OCCITANIE} />)
    expect(document.querySelector('figcaption')?.textContent).toBe('Proximité0\u00a0%99\u00a0%la réponse')
  })

  it('une partie perdue : les six essais en couleur, la réponse en bleu sans pastille', () => {
    const perdue = jouer('corse', 'Bretagne', 'Normandie', 'Grand Est', 'Occitanie', 'Guyane', 'Mayotte')
    expect(perdue.etat).toBe('perdue')
    const { container } = render(<CarteFrance partie={perdue} />)
    expect(container.querySelectorAll('text')).toHaveLength(6)
    expect(container.querySelectorAll('title')).toHaveLength(7)
  })

  it.each([
    ['nouvelles', nouvelles.regions],
    ['anciennes', anciennes.regions],
  ] as const)('carte « %s » : chaque pastille tombe dans sa région', (_mode, regions: Record<string, string>) => {
    for (const [id, d] of Object.entries(regions)) {
      const point = centreDeGravite(d)
      expect(
        morceaux(d).some((morceau) => dedans(point, morceau)),
        id,
      ).toBe(true)
    }
  })
})
