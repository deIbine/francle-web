// lancé par Vitest avant chaque fichier de test (voir setupFiles dans vite.config.ts)
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// après chaque test, on retire de la page ce que le test y a affiché : sinon les composants s'empileraient d'un test
// à l'autre, et un test trouverait les boutons du précédent
afterEach(cleanup)
