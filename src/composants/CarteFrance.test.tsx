import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { silhouette } from '../images.ts'
import { REGIONS, tirables, type Mode } from '../domaine/regions.ts'
import { CarteFrance } from './CarteFrance.tsx'

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
    const { container } = render(<CarteFrance mode={mode} cible={regions[0].id} nom={regions[0].nom.fr} />)
    // une région, un tracé : ni oubli, ni région de l'autre époque
    expect(container.querySelectorAll('path')).toHaveLength(regions.length)
  })

  it('la réponse est en bleu, dessinée en dernier (devant les autres)', () => {
    render(<CarteFrance mode="nouvelles" cible="bretagne" nom="Bretagne" />)
    const carte = screen.getByRole('img', { name: 'Carte de France, la région Bretagne en bleu' })
    const traces = carte.querySelectorAll('path')
    const derniere = traces[traces.length - 1]
    expect(derniere.getAttribute('class')).toContain('fill-francle-fonce')
    expect([...traces].filter((trace) => trace.getAttribute('class')?.includes('fill-francle-fonce'))).toHaveLength(1)
  })
})
