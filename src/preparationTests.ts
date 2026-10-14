// lancé par Vitest avant chaque fichier de test (voir setupFiles dans vite.config.ts)
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// après chaque test, on retire de la page ce que le test y a affiché : sinon les composants s'empileraient d'un test
// à l'autre, et un test trouverait les boutons du précédent
afterEach(cleanup)
// et on efface les parties sauvées (localStorage), pour que chaque test commence sans historique
afterEach(() => localStorage.clear())
// et on retire le thème sombre qu'un test aurait posé sur <html> (la page, elle, n'est pas effacée par cleanup)
afterEach(() => document.documentElement.classList.remove('dark'))

// jsdom (le faux navigateur des tests) connaît la balise <dialog> mais pas encore ses méthodes showModal() et
// close() : on les imite. Ouvrir = poser l'attribut « open » ; fermer = l'enlever et prévenir avec l'évènement
// « close », comme le fait un vrai navigateur
if (typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal === undefined) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (this.hasAttribute('open')) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
}
