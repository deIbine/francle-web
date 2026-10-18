// lancé par Vitest avant chaque fichier de test (voir setupFiles dans vite.config.ts)
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// l'horloge des tests est arrêtée le 14 octobre 2026 à midi (la partie n° 2) : sans cela, le jeu prendrait le vrai
// jour, et un test écrit pour la partie n° 2 échouerait dès le lendemain. Seule la date (Date) est truquée : les
// minuteries (setTimeout) restent réelles, user-event en a besoin pour taper. Posée ici une première fois, avant que
// les fichiers de test ne calculent leur région, puis avant chaque test (un test peut avancer l'horloge)
const JOUR_DES_TESTS = new Date(2026, 9, 14, 12)
function arreterHorloge() {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(JOUR_DES_TESTS)
}
arreterHorloge()
beforeEach(arreterHorloge)

// après chaque test, on retire de la page ce que le test y a affiché : sinon les composants s'empileraient d'un test
// à l'autre, et un test trouverait les boutons du précédent
afterEach(cleanup)
// et on efface les parties sauvées (localStorage), pour que chaque test commence sans historique
afterEach(() => localStorage.clear())
// « Comment jouer » s'ouvre à la première visite : sauf dans les tests qui le vérifient (qui effacent cette clé),
// chaque test fait comme si le joueur l'avait déjà vu
beforeEach(() => localStorage.setItem('francle.aide-vue.v1', '1'))
// et on retire le thème sombre qu'un test aurait posé sur <html> (la page, elle, n'est pas effacée par cleanup)
afterEach(() => document.documentElement.classList.remove('dark'))

// jsdom se présente comme un navigateur en anglais (en-US) : les tests jouent en français, sauf ceux qui changent
// la langue exprès (voir Anglais.test.tsx)
Object.defineProperty(navigator, 'languages', { value: ['fr-FR'], configurable: true })
Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true })

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

// jsdom n'a pas de canvas : getContext() y renvoie null, en écrivant chaque fois « Not implemented:
// HTMLCanvasElement's getContext() » dans la sortie des tests (10 fois). C'est axe-core qui l'appelle, dans les tests
// d'accessibilité, pour savoir si un caractère est une icône de police (_isIconLigature). On renvoie le même null,
// sans le message
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
