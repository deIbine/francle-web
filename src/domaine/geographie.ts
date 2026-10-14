import { REGIONS, type Region } from './regions.ts'

const RAYON_TERRE = 6371 // km

// Math.sin et Math.cos attendent des radians, pas des degrés. Mêmes constantes que Math.toRadians et
// Math.toDegrees en Java : (d * PI) / 180 et d * (PI / 180) peuvent différer sur le dernier chiffre
const DEGRES_EN_RADIANS = Math.PI / 180
const RADIANS_EN_DEGRES = 180 / Math.PI

function radians(degres: number): number {
  return degres * DEGRES_EN_RADIANS
}

function degres(radians: number): number {
  return radians * RADIANS_EN_DEGRES
}

// distance à vol d'oiseau entre les deux capitales régionales, en km
// loi des cosinus sphérique : d = R * acos(sin(lat1)*sin(lat2) + cos(lat1)*cos(lat2)*cos(lon1 - lon2))
export function distance(a: Region, b: Region): number {
  const lat1 = radians(a.latitude)
  const lat2 = radians(b.latitude)
  const deltaLon = radians(a.longitude - b.longitude)
  const cosAngle = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(deltaLon)
  // les arrondis peuvent donner 1.0000000000000002, et acos(>1) renvoie NaN
  return Math.acos(Math.min(1, cosAngle)) * RAYON_TERRE
}

// la direction à suivre depuis la région proposée pour aller vers la cible, comme la flèche de Worldle.
// « sur-place » : deux régions différentes peuvent avoir la même capitale (Hauts-de-France et Nord-Pas-de-Calais :
// Lille), et à 0 km aucune direction n'a de sens
export type Direction = 'nord' | 'nord-est' | 'est' | 'sud-est' | 'sud' | 'sud-ouest' | 'ouest' | 'nord-ouest' | 'sur-place'

export const SYMBOLES: Readonly<Record<Direction, string>> = {
  nord: '↑',
  'nord-est': '↗',
  est: '→',
  'sud-est': '↘',
  sud: '↓',
  'sud-ouest': '↙',
  ouest: '←',
  'nord-ouest': '↖',
  'sur-place': '●',
}

// les mêmes flèches en emoji, comme Worldle : affichées dans le tableau des essais, et dans le texte de partage
// (un emoji garde la même allure partout, dans un message comme sur la page)
export const EMOJIS: Readonly<Record<Direction, string>> = {
  nord: '⬆️',
  'nord-est': '↗️',
  est: '➡️',
  'sud-est': '↘️',
  sud: '⬇️',
  'sud-ouest': '↙️',
  ouest: '⬅️',
  'nord-ouest': '↖️',
  'sur-place': '🎉',
}

// les 8 directions de la rose des vents, dans le sens des aiguilles d'une montre à partir du nord
const ROSE: readonly Direction[] = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest']

// la direction pour aller de « depuis » (la proposition) vers « vers » (la cible)
export function direction(depuis: Region, vers: Region): Direction {
  if (distance(depuis, vers) < 1) {
    return 'sur-place'
  }
  return directionDepuisAzimut(azimut(depuis, vers))
}

// azimut initial (le cap à prendre au départ, sur le plus court chemin) de « depuis » vers « vers »,
// en degrés de 0 à 360 : 0 = nord, 90 = est, 180 = sud, 270 = ouest
// formule : θ = atan2(sin Δλ · cos φ2, cos φ1 · sin φ2 − sin φ1 · cos φ2 · cos Δλ), φ = latitude, λ = longitude
export function azimut(depuis: Region, vers: Region): number {
  const lat1 = radians(depuis.latitude)
  const lat2 = radians(vers.latitude)
  const deltaLon = radians(vers.longitude - depuis.longitude)
  const y = Math.sin(deltaLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon)
  // atan2 renvoie un angle entre -180° et 180° : on le ramène entre 0° et 360°
  return (degres(Math.atan2(y, x)) + 360) % 360
}

// chaque direction couvre une part de 45°, centrée sur son angle : le nord va de 337,5° à 22,5°
export function directionDepuisAzimut(azimut: number): Direction {
  // 359° / 45 = 7,98, arrondi à 8 : le modulo 8 ramène ce secteur sur le nord (0)
  return ROSE[Math.round(azimut / 45) % ROSE.length]
}

// pourcentage de proximité : 100 % à 0 km, 0 % pour la région de référence la plus éloignée de la cible.
// Pour une cible en métropole, seules les régions de métropole servent de référence : sinon l'outre-mer,
// à plus de 6000 km, écrase toute la métropole entre 88 % et 98 %.
// (La formule de Worldle, rapportée au tour de la Terre, donnerait 95 à 100 % partout en France.)
export function proximite(cible: Region, distanceEnKm: number): number {
  let distanceMax = 0
  for (const autre of REGIONS) {
    if (cible.zone === 'outre-mer' || autre.zone === 'metropole') {
      distanceMax = Math.max(distanceMax, distance(cible, autre))
    }
  }
  // arrondi et non troncature : 99,9999 doit donner 100 %, pas 99 %
  const pourcentage = Math.round(((distanceMax - distanceEnKm) * 100) / distanceMax)
  // une proposition en outre-mer pour une cible en métropole dépasse la référence : 0 %, pas un pourcentage négatif
  return Math.max(0, pourcentage)
}
