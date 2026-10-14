import { silhouette } from '../images.ts'
import type { Region } from '../domaine/regions.ts'
import { textes } from '../textes.ts'

// l'image de la région à deviner. Un composant React est une fonction : elle reçoit des « props » (ici la région)
// et renvoie ce qu'il faut afficher
export function Silhouette({ region }: { region: Region }) {
  return (
    <img
      src={silhouette(region.id)}
      alt={textes.silhouette}
      // h-56 : height 14rem ; w-full : width 100 % ; object-contain : l'image garde ses proportions dans ce cadre
      className="mx-auto h-56 w-full object-contain"
    />
  )
}
