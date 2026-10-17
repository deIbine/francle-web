"""Génère les images SVG du jeu à partir des contours officiels des départements et des régions.

Adapté de outils/generer_images.py du projet Java (deIbine/francle), qui produisait des PNG avec matplotlib. Ici on
écrit le SVG directement, à la main : c'est du texte, et aucune bibliothèque n'est nécessaire (Python 3 seul).

    src/images/regions/<id>.svg     la silhouette de chaque région, départements traces, montrée pendant la partie
    src/images/regions/defaut.svg   la France métropolitaine et un point d'interrogation (mode « image cachée »)
    src/images/cartes/<mode>.json   les contours des régions de chaque époque, pour la carte de fin de partie :
                                    le composant React les dessine et colore la réponse lui-même
    src/images/departements/<id>.json  les contours de chaque département de la région, pour le bonus des
                                    départements : le composant React les dessine, les colore et les rend cliquables
    public/favicon.svg              l'icône du site : la France métropolitaine en bleu Francle

Les départements de chaque région ne sont pas écrits ici : ils sont lus dans src/domaine/departements.json, le
fichier dont se sert aussi le jeu.

Les contours viennent du dépôt https://github.com/gregoiredavid/france-geojson (données IGN et INSEE, licence ouverte
Etalab). Ils ne sont pas dans le dépôt (près de 6 Mo) : les télécharger dans un dossier à part.
    departements-avec-outre-mer.geojson
    regions.geojson
    regions-avant-redecoupage-2015.geojson

Utilisation, depuis la racine du projet :
    py outils/generer_images.py <dossier des contours> src/images public
"""
import json
import math
import sys
from pathlib import Path

# la liste des départements et ceux de chaque région : le même fichier que celui du jeu (src/domaine/departements.ts),
# copié du projet Java. Une seule liste pour le jeu et pour les images : ils ne peuvent pas se contredire
LISTE = Path(__file__).parent.parent / "src" / "domaine" / "departements.json"

# le nom de la région dans les fichiers de contours -> son identifiant, pour les cartes de fin de partie
NOUVELLES = {
    "Hauts-de-France": "hauts-de-france",
    "Normandie": "normandie",
    "Grand Est": "grand-est",
    "Bourgogne-Franche-Comté": "bourgogne-franche-comte",
    "Auvergne-Rhône-Alpes": "auvergne-rhone-alpes",
    "Nouvelle-Aquitaine": "nouvelle-aquitaine",
    "Occitanie": "occitanie",
    "Centre-Val de Loire": "centre-val-de-loire",
    "Bretagne": "bretagne",
    "Pays de la Loire": "pays-de-la-loire",
    "Île-de-France": "ile-de-france",
    "Provence-Alpes-Côte d'Azur": "provence-alpes-cote-dazur",
    "Corse": "corse",
}
ANCIENNES = {
    "Nord-Pas-de-Calais": "nord-pas-de-calais",
    "Picardie": "picardie",
    "Haute-Normandie": "haute-normandie",
    "Basse-Normandie": "basse-normandie",
    "Poitou-Charentes": "poitou-charentes",
    "Centre": "centre",
    "Champagne-Ardenne": "champagne-ardenne",
    "Lorraine": "lorraine",
    "Alsace": "alsace",
    "Bourgogne": "bourgogne",
    "Franche-Comté": "franche-comte",
    "Rhône-Alpes": "rhone-alpes",
    "Auvergne": "auvergne",
    "Limousin": "limousin",
    "Aquitaine": "aquitaine",
    "Midi-Pyrénées": "midi-pyrenees",
    "Languedoc-Roussillon": "languedoc-roussillon",
    # les régions inchangées sont dans les deux époques
    "Bretagne": "bretagne",
    "Pays de la Loire": "pays-de-la-loire",
    "Île-de-France": "ile-de-france",
    "Provence-Alpes-Côte d'Azur": "provence-alpes-cote-dazur",
    "Corse": "corse",
}
# l'outre-mer n'est pas dans les contours des régions : on le prend dans ceux des départements, et on le dessine
# dans des encadrés, comme sur les cartes de France habituelles
OUTRE_MER = {"971": "guadeloupe", "972": "martinique", "973": "guyane", "974": "la-reunion", "976": "mayotte"}

# les couleurs des images du projet Java
BLEU_CLAIR = "#a2d1fb"
BLEU_FONCE = "#3a4bc4"
TRAIT_DEPARTEMENT = "#7f97ad"
GRIS_DEFAUT = "#b7c3cf"

# sur les cartes, la Corse est rapprochée du continent, comme sur les cartes d'origine (en degrés)
DECALAGE_CORSE = (-0.9, 0.7)
# la latitude moyenne de la métropole : projection des cartes de France
LATITUDE_FRANCE = 46.5

# le plus grand côté d'une image, en unités SVG : 1000 permet d'arrondir les coordonnées à l'entier
# sans perte visible, et des entiers prennent bien moins de place dans le fichier
COTE = 1000
# la simplification : on retire les points qui s'écartent de moins de TOLERANCE unités du tracé
TOLERANCE = 1.2


def charger(dossier, fichier):
    with open(dossier / fichier, encoding="utf8") as f:
        return json.load(f)["features"]


def anneaux(geometrie):
    """Les contours extérieurs d'un Polygon ou d'un MultiPolygon, en (longitude, latitude)."""
    polygones = [geometrie["coordinates"]] if geometrie["type"] == "Polygon" else geometrie["coordinates"]
    return [polygone[0] for polygone in polygones]


def projeter(anneau, latitude, decalage=(0, 0)):
    """Projection simple : un degré de longitude est plus court qu'un degré de latitude, d'un facteur cos(latitude).
    La latitude est inversée : en SVG, l'axe des y descend (le haut de l'image est y = 0)."""
    facteur = math.cos(math.radians(latitude))
    dx, dy = decalage
    return [((lon + dx) * facteur, -(lat + dy)) for lon, lat in anneau]


def cadre(formes, marge_relative):
    """Le rectangle (x, y, largeur, hauteur) qui contient les formes, avec une marge."""
    xs = [x for forme in formes for x, _ in forme]
    ys = [y for forme in formes for _, y in forme]
    marge = marge_relative * max(max(xs) - min(xs), max(ys) - min(ys))
    return min(xs) - marge, min(ys) - marge, max(xs) - min(xs) + 2 * marge, max(ys) - min(ys) + 2 * marge


def ramener(formes, rectangle, cote):
    """Déplace et agrandit les formes pour que le rectangle devienne (0, 0) -> plus grand côté = cote."""
    x0, y0, largeur, hauteur = rectangle
    echelle = cote / max(largeur, hauteur)
    formes = [[((x - x0) * echelle, (y - y0) * echelle) for x, y in forme] for forme in formes]
    return formes, round(largeur * echelle), round(hauteur * echelle)


def simplifier(points, tolerance):
    """Algorithme de Douglas-Peucker : garde le premier et le dernier point, cherche le point le plus éloigné du
    segment qui les relie ; s'il est à moins de « tolerance », tout le reste est inutile, sinon on recommence de
    chaque côté de ce point. Écrit avec une pile plutôt que récursif : certains contours ont des milliers de points."""
    if len(points) < 3:
        return points
    garder = [False] * len(points)
    garder[0] = garder[-1] = True
    pile = [(0, len(points) - 1)]
    while pile:
        debut, fin = pile.pop()
        (xa, ya), (xb, yb) = points[debut], points[fin]
        longueur = math.hypot(xb - xa, yb - ya)
        plus_loin, ecart_max = None, tolerance
        for i in range(debut + 1, fin):
            x, y = points[i]
            if longueur == 0:
                ecart = math.hypot(x - xa, y - ya)
            else:
                ecart = abs((xb - xa) * (ya - y) - (xa - x) * (yb - ya)) / longueur
            if ecart > ecart_max:
                plus_loin, ecart_max = i, ecart
        if plus_loin is not None:
            garder[plus_loin] = True
            pile.append((debut, plus_loin))
            pile.append((plus_loin, fin))
    return [point for point, garde in zip(points, garder) if garde]


def chemin(formes, tolerance=TOLERANCE):
    """L'attribut « d » d'un <path> SVG : M = aller à (début d'un contour), puis les points reliés par des
    segments (l = relatif au point précédent : des nombres plus petits, donc un fichier plus léger), Z = fermer."""
    morceaux = []
    for forme in formes:
        points = simplifier([(round(x), round(y)) for x, y in forme], tolerance)
        # deux points identiques de suite ne dessinent rien
        points = [p for i, p in enumerate(points) if i == 0 or p != points[i - 1]]
        if len(points) < 3:
            continue  # un îlot réduit à un point ou un trait : invisible à cette taille
        x, y = points[0]
        relatifs = " ".join(f"{bx - ax} {by - ay}" for (ax, ay), (bx, by) in zip(points, points[1:]))
        morceaux.append(f"M{x} {y}l{relatifs}z")
    return "".join(morceaux)


def ecrire(chemin_fichier, texte):
    chemin_fichier.parent.mkdir(parents=True, exist_ok=True)
    chemin_fichier.write_text(texte, encoding="utf8", newline="\n")


def silhouette(fichier, departements):
    """Une région : chaque département est un tracé rempli de bleu, bordé de sa limite. Le trait garde la même
    épaisseur quelle que soit la taille d'affichage (vector-effect, qui ne s'hérite pas : il est sur chaque tracé),
    et couvre les petits jours que la simplification laisse entre deux départements."""
    par_departement = [anneaux(d["geometry"]) for d in departements]
    tous = [anneau for liste in par_departement for anneau in liste]
    # la projection se fait à la latitude de la région : la Guyane est près de l'équateur, le Nord bien plus haut
    latitude = sum(lat for anneau in tous for _, lat in anneau) / sum(len(anneau) for anneau in tous)
    projetes = [[projeter(anneau, latitude) for anneau in liste] for liste in par_departement]
    rectangle = cadre([forme for liste in projetes for forme in liste], 0.06)
    traces = []
    for liste in projetes:
        formes, largeur, hauteur = ramener(liste, rectangle, COTE)
        traces.append(f'<path vector-effect="non-scaling-stroke" d="{chemin(formes)}"/>')
    ecrire(fichier, (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur} {hauteur}">'
        f'<g fill="{BLEU_CLAIR}" stroke="{TRAIT_DEPARTEMENT}" stroke-width="1.2" stroke-linejoin="round">'
        f'{"".join(traces)}</g></svg>\n'
    ))


# les contours des départements, pour le bonus : sur 2000 unités au plus grand côté, et non 1000 comme les
# silhouettes, pour le zoom de l'Île-de-France (Paris y est agrandi quatre fois : à 1000 unités, ses limites
# seraient en marches d'escalier). Les mêmes valeurs que le script du projet Java
COTE_CONTOURS = 2000
TOLERANCE_CONTOURS = 1.0
# l'Île-de-France est vue en entier, plus un zoom sur Paris et la petite couronne, trop petits sinon
ZOOM = {"ile-de-france": ["75", "92", "93", "94"]}


def tous_les_anneaux(geometrie):
    """Tous les contours d'un Polygon ou d'un MultiPolygon, trous compris : l'enclave des Papes (Vaucluse) est un trou
    dans la Drôme. Sans lui, un clic dans l'enclave tomberait dans les deux départements. Le navigateur sait dessiner
    les trous : c'est la règle « evenodd » (un point entouré deux fois est dehors), que le composant React demande."""
    polygones = [geometrie["coordinates"]] if geometrie["type"] == "Polygon" else geometrie["coordinates"]
    return [anneau for polygone in polygones for anneau in polygone]


def aire(points):
    """L'aire d'un polygone (formule du lacet), pour écarter les îlots trop petits pour être vus ou cliqués."""
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(points, points[1:] + points[:1]))) / 2


def contours(fichier, departements, codes_zoom):
    """Les contours des départements d'une région, en JSON : { largeur, hauteur, zoom?, departements: [{ code, d }] },
    d étant l'attribut « d » d'un <path> SVG. Une liste et non un objet { code: d } : en JavaScript, les clés qui
    ressemblent à des nombres (« 971 ») passent devant les autres, et l'ordre du fichier serait perdu.
    Le Java écrit des listes de points ; ici, des chemins SVG relatifs, environ deux fois plus légers."""
    par_code = {d["properties"]["code"]: tous_les_anneaux(d["geometry"]) for d in departements}
    tous = [anneau for liste in par_code.values() for anneau in liste]
    latitude = sum(lat for anneau in tous for _, lat in anneau) / sum(len(anneau) for anneau in tous)
    projetes = {code: [projeter(anneau, latitude) for anneau in liste] for code, liste in par_code.items()}
    rectangle = cadre([anneau for liste in projetes.values() for anneau in liste], 0)
    lignes = []
    points_ecrits = 0
    for code, liste in projetes.items():
        ramenes, largeur, hauteur = ramener(liste, rectangle, COTE_CONTOURS)
        morceaux = []
        for anneau in ramenes:
            # simplifier d'abord, arrondir ensuite (comme le Java) ; le dernier point répète le premier : Z le fera
            points = [(round(x), round(y)) for x, y in simplifier(anneau, TOLERANCE_CONTOURS)[:-1]]
            points = [p for i, p in enumerate(points) if i == 0 or p != points[i - 1]]
            if len(points) < 3 or aire(points) < 4:
                continue  # un îlot de moins de 2 unités sur 2 : invisible, et impossible à viser
            x, y = points[0]
            relatifs = " ".join(f"{bx - ax} {by - ay}" for (ax, ay), (bx, by) in zip(points, points[1:]))
            morceaux.append(f"M{x} {y}l{relatifs}z")
            points_ecrits += len(points)
        lignes.append(json.dumps({"code": code, "d": "".join(morceaux)}, separators=(",", ":")))

    entete = {"largeur": largeur, "hauteur": hauteur}
    if codes_zoom:
        # le cadre qui entoure ces départements, avec une marge
        zoomes = [p for code in codes_zoom for anneau in ramener(projetes[code], rectangle, COTE_CONTOURS)[0]
                  for p in anneau]
        x0, x1 = min(x for x, _ in zoomes), max(x for x, _ in zoomes)
        y0, y1 = min(y for _, y in zoomes), max(y for _, y in zoomes)
        marge = 0.06 * max(x1 - x0, y1 - y0)
        entete["zoom"] = [round(x0 - marge), round(y0 - marge), round(x1 - x0 + 2 * marge), round(y1 - y0 + 2 * marge)]
    # un département par ligne : un fichier lisible, et un diff qui montre quel département a changé
    ecrire(fichier, json.dumps(entete)[:-1] + ',\n"departements":[\n' + ",\n".join(lignes) + "\n]}\n")
    return points_ecrits


def decalage(nom):
    return DECALAGE_CORSE if nom == "Corse" else (0, 0)


def defaut(fichier, regions):
    formes = [projeter(a, LATITUDE_FRANCE, decalage(r["properties"]["nom"])) for r in regions
              for a in anneaux(r["geometry"])]
    formes, largeur, hauteur = ramener(formes, cadre(formes, 0.06), COTE)
    ecrire(fichier, (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur} {hauteur}">'
        f'<path fill="{GRIS_DEFAUT}" stroke="{GRIS_DEFAUT}" stroke-width="3" stroke-linejoin="round" '
        f'd="{chemin(formes)}"/>'
        f'<text x="{largeur * 0.47:.0f}" y="{hauteur * 0.55:.0f}" font-family="system-ui, sans-serif" font-size="420" '
        f'font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">?</text></svg>\n'
    ))


def favicon(fichier, regions):
    """L'icône du site : la métropole en bleu Francle, dans un carré de 64 unités. À 16 ou 32 pixels, les détails de
    la côte sont invisibles : on simplifie bien plus fort, et l'icône pèse moins de 2 Ko."""
    formes = [projeter(a, LATITUDE_FRANCE, decalage(r["properties"]["nom"])) for r in regions
              for a in anneaux(r["geometry"])]
    formes, largeur, hauteur = ramener(formes, cadre(formes, 0.02), 64)
    ecrire(fichier, (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur} {hauteur}">'
        f'<path fill="{BLEU_FONCE}" stroke="{BLEU_FONCE}" stroke-width="1" stroke-linejoin="round" '
        f'd="{chemin(formes, 1)}"/></svg>\n'
    ))


def carte(fichier, regions, noms, departements):
    """Les contours des régions d'une époque, ramenés dans un rectangle, en JSON : { largeur, hauteur, regions:
    { id: chemin } }. L'outre-mer est dessiné dans cinq encadrés, dans l'Atlantique, à gauche."""
    formes = {}
    for region in regions:
        nom = region["properties"]["nom"]
        if nom not in noms:
            raise ValueError(f"région inattendue dans les contours : {nom}")
        formes[noms[nom]] = [projeter(a, LATITUDE_FRANCE, decalage(nom)) for a in anneaux(region["geometry"])]
    if len(formes) != len(noms):
        raise ValueError(f"régions absentes des contours : {set(noms.values()) - set(formes)}")
    rectangle = cadre([forme for liste in formes.values() for forme in liste], 0.03)
    chemins = {}
    for identifiant, liste in formes.items():
        ramenees, largeur, hauteur = ramener(liste, rectangle, COTE)
        chemins[identifiant] = chemin(ramenees)

    # les encadrés : chaque département d'outre-mer, à sa propre latitude, ramené dans un carré de cote_encadre
    # sur deux colonnes, en bas à gauche, dans l'océan Atlantique (une seule colonne remonterait jusqu'à la Bretagne)
    cote_encadre, ecart, lignes = 100, 12, 3
    encadres = []
    for numero, (code, identifiant) in enumerate(OUTRE_MER.items()):
        departement = next(d for d in departements if d["properties"]["code"] == code)
        liste = anneaux(departement["geometry"])
        latitude = sum(lat for a in liste for _, lat in a) / sum(len(a) for a in liste)
        projetes = [projeter(a, latitude) for a in liste]
        ramenees, _, _ = ramener(projetes, cadre(projetes, 0.1), cote_encadre)
        colonne, ligne = divmod(numero, lignes)
        x0 = ecart + colonne * (cote_encadre + ecart)
        y0 = hauteur - (lignes - ligne) * (cote_encadre + ecart)
        chemins[identifiant] = chemin([[(x + x0, y + y0) for x, y in forme] for forme in ramenees])
        encadres.append({"x": x0, "y": y0, "cote": cote_encadre})
    ecrire(fichier, json.dumps({"largeur": largeur, "hauteur": hauteur, "encadres": encadres, "regions": chemins},
                               ensure_ascii=False, indent=1) + "\n")


def main():
    dossier, sortie, public = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    departements = charger(dossier, "departements-avec-outre-mer.geojson")
    nouvelles = charger(dossier, "regions.geojson")
    anciennes = charger(dossier, "regions-avant-redecoupage-2015.geojson")

    with open(LISTE, encoding="utf8") as f:
        liste = json.load(f)
    par_code = {d["properties"]["code"]: d for d in departements}

    points = 0
    for identifiant, codes in liste["regions"].items():
        # dans l'ordre de la liste, celui des numéros
        choisis = [par_code[code] for code in codes if code in par_code]
        if len(choisis) != len(codes):
            raise ValueError(f"{identifiant} : département introuvable parmi {codes}")
        for d in choisis:
            if d["properties"]["nom"] != liste["departements"][d["properties"]["code"]]:
                raise ValueError(f"{d['properties']['code']} : le nom diffère de celui de {LISTE.name}")
        silhouette(sortie / "regions" / f"{identifiant}.svg", choisis)
        points += contours(sortie / "departements" / f"{identifiant}.json", choisis, ZOOM.get(identifiant))
    defaut(sortie / "regions" / "defaut.svg", nouvelles)
    carte(sortie / "cartes" / "nouvelles.json", nouvelles, NOUVELLES, departements)
    carte(sortie / "cartes" / "anciennes.json", anciennes, ANCIENNES, departements)
    favicon(public / "favicon.svg", nouvelles)
    print(f"{len(liste['regions']) + 1} silhouettes, 2 cartes, 1 icône, "
          f"{len(liste['regions'])} fichiers de contours ({points} points)")


main()
