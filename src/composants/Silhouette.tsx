import { silhouette } from '../images.ts'
import type { Region } from '../domaine/regions.ts'
import { textes } from '../textes.ts'

interface Props {
  region: Region
  // l'angle de rotation en degrés (mode 🌀), 0 sinon
  angle: number
  // mode 🙈 : la France et un point d'interrogation à la place de la silhouette
  cachee: boolean
}

// l'image de la région à deviner. Un composant React est une fonction : elle reçoit des « props » et renvoie ce
// qu'il faut afficher
export function Silhouette({ region, angle, cachee }: Props) {
  if (cachee) {
    return <img src={silhouette('defaut')} alt={textes.silhouetteCachee} className="mx-auto size-56 object-contain" />
  }
  // une image tournée déborde de son cadre carré : tournée de 45°, sa diagonale fait 1,41 fois le côté. On la réduit
  // d'autant : 1 / (|cos| + |sin|) est la plus grande taille qui tient dans le carré, quel que soit l'angle
  const radians = (angle * Math.PI) / 180
  const echelle = 1 / (Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians)))
  return (
    <img
      src={silhouette(region.id)}
      alt={angle === 0 ? textes.silhouette : textes.silhouetteTournee}
      // size-56 : un carré de 14rem ; object-contain : l'image garde ses proportions dans ce carré
      className="mx-auto size-56 object-contain"
      // transform : la rotation et la réduction se calculent, Tailwind ne peut pas les connaître d'avance
      style={angle === 0 ? undefined : { transform: `rotate(${angle}deg) scale(${echelle})` }}
    />
  )
}
