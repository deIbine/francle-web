/*
Les adresses des silhouettes. import.meta.glob est une fonction de Vite : au moment de la construction, il trouve
tous les fichiers qui correspondent au motif et les ajoute au site, chacun avec une empreinte dans son nom
(« bretagne-3fa9c1.svg »). Si une image change, son nom change aussi : le navigateur ne garde pas l'ancienne en cache.

Le résultat est un objet { './images/regions/bretagne.svg': '/francle-web/assets/bretagne-3fa9c1.svg', … }.
 */
const SILHOUETTES = import.meta.glob<string>('./images/regions/*.svg', {
  eager: true, // tout de suite, sans attendre : ce ne sont que des adresses
  query: '?url', // l'adresse du fichier, pas son contenu
  import: 'default',
})

// l'adresse de la silhouette d'une région (son identifiant), ou de l'image « defaut »
export function silhouette(id: string): string {
  const adresse = SILHOUETTES[`./images/regions/${id}.svg`]
  if (adresse === undefined) {
    throw new Error(`Pas de silhouette pour : ${id}`)
  }
  return adresse
}
