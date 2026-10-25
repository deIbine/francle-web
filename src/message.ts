// un message sous une saisie (voir composants/Message.tsx) : une explication (« Alsace : une ancienne région… »,
// « déjà proposée »), ou une vraie erreur (« Cette région n'existe pas »). À part du composant : un fichier qui
// exporte un composant React ne doit exporter que des composants (sinon le rechargement à chaud de Vite le recharge en
// entier)

export type Sorte = 'info' | 'erreur'

export interface LeMessage {
  readonly texte: string
  readonly sorte: Sorte
}

// aucun message
export const AUCUN: LeMessage = { texte: '', sorte: 'info' }
