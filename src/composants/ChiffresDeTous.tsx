/*
Les chiffres de tous les joueurs du jour, dans la fenêtre des résultats de la partie du jour (web.9.2.2) : combien ont
joué, combien ont trouvé, « tu fais mieux que 72 % », et la répartition des essais de tous, la barre du joueur en bleu.

Tant que les chiffres ne sont pas arrivés, ou si le serveur ne répond pas, rien ne s'affiche : la fenêtre reste celle
d'avant web.9.2, sans message d'erreur ni place réservée.
 */
import { useEffect, useId, useState } from 'react'
import { autantOuMieuxQue, tauxDeVictoire, type ChiffresDuJour } from '../domaine/chiffres.ts'
import { points } from '../domaine/score.ts'
import type { Resultat } from '../domaine/statistiques.ts'
import { chiffresDuJour, synchroniser } from '../envoi.ts'
import { estEnvoyee } from '../sauvegarde.ts'
import { useTextes } from '../textes.ts'

interface Props {
  jour: number
  // la partie du jour du joueur, telle qu'elle est maintenant (finie)
  resultat: Resultat
}

export function ChiffresDeTous({ jour, resultat }: Props) {
  const textes = useTextes()
  const titre = useId()
  const [chiffres, setChiffres] = useState<ChiffresDuJour>()
  // la partie du joueur était-elle déjà reçue par le serveur quand les chiffres sont arrivés ? Alors elle y est
  // comptée, et le joueur ne doit pas se comparer à lui-même (voir autantOuMieuxQue)
  const [compte, setCompte] = useState(false)
  const mesPoints = points(resultat)

  // à chaque changement de la partie (le bonus fini, par exemple) : on envoie d'abord ce qui doit l'être, puis on
  // demande les chiffres, pour que la partie qu'on vient de finir y soit. « annule » : la fenêtre fermée entre-temps
  // (ou la partie changée), la réponse arrivée trop tard est ignorée, au lieu de changer un composant disparu
  useEffect(() => {
    let annule = false
    void synchroniser()
      .then(() => chiffresDuJour(jour))
      .then((recus) => {
        if (!annule) {
          setChiffres(recus)
          setCompte(estEnvoyee(jour))
        }
      })
    return () => {
      annule = true
    }
  }, [jour, resultat.etat, resultat.essais, resultat.bonus?.score, resultat.bonus?.total])

  if (chiffres === undefined || chiffres.joueurs === 0) {
    return null
  }
  const mieux = autantOuMieuxQue(chiffres, mesPoints, compte)
  const plusGrande = Math.max(1, ...chiffres.repartition)
  const essais = resultat.etat === 'gagnee' ? resultat.essais : undefined
  return (
    <section aria-labelledby={titre} className="mb-3 flex flex-col gap-2 border-b border-bord pb-3">
      <h3 id={titre} className="font-semibold">
        {textes.tous.titre}
      </h3>
      <p className="text-sm">{textes.tous.resume(chiffres.joueurs, tauxDeVictoire(chiffres))}</p>
      {/* pas à 0 % (depuis web.9.5.3) : seul dernier, la phrase n'apprendrait rien au joueur, et le découragerait */}
      {mieux !== undefined && mieux > 0 && (
        <p className="text-sm font-semibold">{textes.tous.autantOuMieuxQue(mieux, mesPoints)}</p>
      )}
      {chiffres.victoires > 0 && (
        <ol className="flex flex-col gap-1 text-sm" aria-label={textes.tous.repartition}>
          {chiffres.repartition.map((nombre, index) => {
            const part = Math.round((nombre * 100) / chiffres.victoires)
            return (
              <li key={index} className="flex items-center gap-2">
                <span className="w-3 tabular-nums">{index + 1}</span>
                {/* comme les barres des statistiques : une petite image, que son nom décrit en entier */}
                <span
                  role="img"
                  aria-label={textes.tous.barre(index + 1, part, essais === index + 1)}
                  style={{ width: `${Math.max(8, (nombre * 100) / plusGrande)}%` }}
                  // min-w-fit et whitespace-nowrap : une barre courte s'élargit à la taille de son texte (« 0 % »), au
                  // lieu de le couper (vu à 375 pixels)
                  className={`min-w-fit rounded px-2 text-right font-semibold whitespace-nowrap text-white tabular-nums ${
                    essais === index + 1 ? 'bg-francle-fonce' : 'bg-gray-500'
                  }`}
                >
                  {textes.stats.pourcentage(part)}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
