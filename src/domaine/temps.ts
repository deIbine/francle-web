// minuit ce soir, chez le joueur : l'heure où la région suivante arrive. Le 31 décembre,
// new Date(2026, 11, 32) donne bien le 1er janvier 2027 : JavaScript fait passer le surplus au mois suivant
export function minuitSuivant(maintenant: Date): Date {
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + 1)
}

// « 03:07:09 » : une durée en heures, minutes, secondes (jamais négative)
export function duree(millisecondes: number): string {
  const secondes = Math.max(0, Math.floor(millisecondes / 1000))
  const deuxChiffres = (n: number) => String(n).padStart(2, '0')
  return [Math.floor(secondes / 3600), Math.floor(secondes / 60) % 60, secondes % 60].map(deuxChiffres).join(':')
}
