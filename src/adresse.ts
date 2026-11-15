// l'adresse du serveur (depuis web.9.2.2 ; dans son propre fichier depuis web.9.3.1, parce que l'envoi des parties et
// le profil s'en servent tous deux, et s'importent l'un l'autre). VITE_SERVEUR la remplace pendant le développement
// (par exemple VITE_SERVEUR=http://localhost:8787 npm run dev, avec le serveur lancé en local par « npm run dev » dans
// serveur/)
export const ADRESSE_SERVEUR: string = import.meta.env.VITE_SERVEUR ?? 'https://chiffres.francle.workers.dev'
