/*
Les pseudos et les codes des profils (web.9.3) : ce qui est permis, ce qui rend deux pseudos « identiques », et les
codes tirés au hasard. Écrit une fois ici, importé par le site (pour prévenir le joueur avant d'envoyer) et par le
serveur (qui seul décide).

Deux pseudos sont identiques s'ils ont la même « clé » : sans majuscules, sans accents, sans espaces ni ponctuation
(décision 11 de web.9.3) : « Clément », « clement » et « Clé-ment » sont le même pseudo. C'est la fonction simplifier()
de la recherche des régions, qui fait déjà exactement cela.

La liste de mots refusés est forcément imparfaite (on ne peut pas tout prévoir, et un mot interdit peut se cacher dans
un mot innocent) : elle arrête le plus grossier, la modération fait le reste (décision 9).
 */
import { simplifier } from './recherche.ts'

export const PSEUDO_MIN = 3
export const PSEUDO_MAX = 20

// la clé d'un pseudo, qui rend deux pseudos identiques ou non
export function clePseudo(pseudo: string): string {
  return simplifier(pseudo)
}

// le pseudo tel qu'il sera gardé : sans espaces au bout, et un seul espace entre deux mots
export function nettoyerPseudo(saisie: string): string {
  return saisie.trim().replace(/\s+/g, ' ')
}

// les mots refusés dans un pseudo, déjà simplifiés. Les mots longs sont cherchés partout dans le pseudo ; les mots
// courts (4 lettres au plus) seulement comme mot entier, sinon « habitant » serait refusé pour un mot de 4 lettres.
// S'y ajoutent les mots qui feraient passer un joueur pour l'équipe du jeu
const GROSSIERS = [
  'connard', 'connasse', 'salope', 'salaud', 'putain', 'encule', 'batard', 'couille', 'merde', 'niquer', 'nique',
  'pute', 'bite', 'cul', 'pd', 'pede', 'tapette', 'negre', 'bougnoul', 'youpin', 'nazi', 'hitler', 'fuck', 'shit',
  'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'whore', 'dick', 'cock', 'pussy', 'asshole',
]
const MOTS_REFUSES = [...GROSSIERS, 'admin', 'moderat', 'francle', 'officiel', 'official']

// les mots permis qui contiennent un mot refusé (depuis web.9.4.1), déjà simplifiés : « nique » se cache dans
// Dominique et technique, « admin » dans badminton. Ils sont effacés du pseudo AVANT la recherche des mots refusés :
// « Dominique » passe, « Dominique Connard » reste refusé. Une liste plutôt qu'une règle plus souple, pour que le
// filtre reste aussi strict ailleurs (décision du 16 novembre 2026 : peu de modération). Un refus injuste signalé par
// un joueur : ajouter le mot ici, et dans le test « accepte les mots courants »
const EXCEPTIONS = [
  // les prénoms
  'dominique', 'monique', 'veronique',
  // les mots en -nique (« communique » couvre aussi « communiquer », qui contient « niquer »)
  'unique', 'technique', 'clinique', 'tunique', 'panique', 'mecanique', 'electronique', 'britannique', 'germanique',
  'hispanique', 'chronique', 'harmonique', 'ironique', 'cynique', 'tonique', 'sonique', 'bionique', 'tectonique',
  'symphonique', 'platonique', 'botanique', 'organique', 'volcanique', 'satanique', 'titanique', 'oceanique',
  'ethnique', 'martinique', 'piquenique', 'communique',
  // les autres
  'badminton', 'pussycat',
].sort((a, b) => b.length - a.length)

// la clé du pseudo, sans ses mots permis. Remplacés par « | » et non effacés : deux morceaux recollés ne doivent pas
// former un mot refusé (« pu » + « dominique » + « te »)
function sansExceptions(cle: string): string {
  return EXCEPTIONS.reduce((reste, mot) => reste.replaceAll(mot, '|'), cle)
}

export type RefusPseudo = 'longueur' | 'caracteres' | 'mot'

// pourquoi un pseudo est refusé, ou undefined s'il est permis. Les lettres de toutes les langues (\p{L}), les
// chiffres, l'espace et - _ . ' sont permis ; il faut au moins trois lettres ou chiffres. max et mots : la longueur
// permise et les mots refusés (depuis web.9.3.2, les mêmes règles servent au nom d'une ligue, voir refusNomLigue)
export function refusPseudo(saisie: string, max = PSEUDO_MAX, mots = MOTS_REFUSES): RefusPseudo | undefined {
  const pseudo = nettoyerPseudo(saisie)
  if ([...pseudo].length < PSEUDO_MIN || [...pseudo].length > max || clePseudo(pseudo).length < PSEUDO_MIN) {
    return 'longueur'
  }
  if (!/^[\p{L}\p{N} _.'’-]+$/u.test(pseudo)) {
    return 'caracteres'
  }
  const cle = sansExceptions(clePseudo(pseudo))
  const decoupe = pseudo.split(/[^\p{L}\p{N}]+/u).map(simplifier)
  const refuse = mots.some((mot) => (mot.length <= 4 ? decoupe.includes(mot) || cle === mot : cle.includes(mot)))
  return refuse ? 'mot' : undefined
}

// le nom d'une ligue (depuis web.9.3.2) : les règles d'un pseudo, jusqu'à 30 caractères, et seulement les mots
// grossiers (« Les Francleurs » est un beau nom de ligue)
export const NOM_LIGUE_MAX = 30
export function refusNomLigue(saisie: string): RefusPseudo | undefined {
  return refusPseudo(saisie, NOM_LIGUE_MAX, GROSSIERS)
}

// l'alphabet des codes à lire ou recopier : sans 0, O, 1, I ni L, qu'on confond à l'œil
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function tirerCaracteres(nombre: number): string {
  // 256 n'est pas un multiple de 31 : on rejette les octets trop grands, pour que chaque caractère ait la même chance
  const limite = 256 - (256 % ALPHABET.length)
  let code = ''
  while (code.length < nombre) {
    for (const octet of crypto.getRandomValues(new Uint8Array(nombre * 2))) {
      if (octet < limite && code.length < nombre) {
        code += ALPHABET[octet % ALPHABET.length]
      }
    }
  }
  return code
}

// le code de secours d'un profil : 16 caractères en quatre groupes, « ABCD-EFGH-JKMN-PQRS » (environ 79 bits de hasard,
// impossible à deviner)
export function tirerSecours(): string {
  return tirerCaracteres(16).match(/.{4}/g)!.join('-')
}

// le code d'une ligue : 6 caractères, à taper à la main ou à recevoir dans un lien (près d'un milliard de codes)
export function tirerCodeLigue(): string {
  return tirerCaracteres(6)
}

// un code saisi à la main, remis en forme : majuscules, sans espaces ni tirets. « abcd efgh-jkmn pqrs » -> « ABCDEFGHJKMNPQRS »
export function normaliserCode(saisie: string): string {
  return saisie.toUpperCase().replace(/[^A-Z0-9]/g, '')
}
