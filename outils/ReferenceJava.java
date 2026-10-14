package fr.francle.jeu;

import fr.francle.donnees.ModeRegions;
import fr.francle.donnees.RegionFr;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.StringJoiner;

/*
Produit src/domaine/reference-java.json : les valeurs calculées par le Francle Java (deIbine/francle, étiquette phase-6),
que les tests TypeScript doivent retrouver à l'identique.

Ce fichier se compile CONTRE le projet Java : il est dans le paquet fr.francle.jeu pour pouvoir appeler les méthodes
de paquet (Direction.azimut, Partie.pourcentage). Depuis le dossier francle-web, sous PowerShell :

  ..\francle\mvnw.cmd -q -f ..\francle\pom.xml compile
  javac -encoding UTF-8 -cp ..\francle\target\classes -d $env:TEMP\reference-java outils\ReferenceJava.java
  java -cp "..\francle\target\classes;$env:TEMP\reference-java" fr.francle.jeu.ReferenceJava src\domaine\reference-java.json

Les régions sont désignées par le nom de leur image sans « .png » (« bretagne »), qui sert d'identifiant côté web.
Seulement des dates passées pour la région du jour : le fichier ne doit pas donner les réponses des parties à venir.
 */
public final class ReferenceJava {

    // la dernière date incluse : la partie n° 1 (le 13 octobre 2026), déjà jouée quand ce fichier a été produit
    private static final LocalDate DERNIER_JOUR = RegionDuJour.PREMIER_JOUR;
    // environ 80 cycles de 18 jours avant : de quoi passer par beaucoup de graines, dont des cycles négatifs
    private static final int NOMBRE_DE_JOURS = 1500;

    public static void main(String[] args) throws IOException {
        StringBuilder json = new StringBuilder("{\n");

        json.append("  \"paires\": [\n");
        StringJoiner paires = new StringJoiner(",\n");
        for (RegionFr cible : RegionFr.values()) {
            for (RegionFr proposition : RegionFr.values()) {
                double distance = cible.distance(proposition);
                paires.add(String.format(Locale.ROOT,
                        "    {\"cible\": \"%s\", \"proposition\": \"%s\", \"distance\": %s, \"azimut\": %s, "
                                + "\"direction\": \"%s\", \"pourcentage\": %d}",
                        id(cible), id(proposition), Double.toString(distance),
                        Double.toString(Direction.azimut(proposition, cible)),
                        Direction.entre(proposition, cible).name(), Partie.pourcentage(cible, distance)));
            }
        }
        json.append(paires).append("\n  ],\n");

        json.append("  \"jours\": [\n");
        StringJoiner jours = new StringJoiner(",\n");
        for (int i = NOMBRE_DE_JOURS; i >= 0; i--) {
            LocalDate date = DERNIER_JOUR.minusDays(i);
            jours.add(String.format(Locale.ROOT, "    {\"date\": \"%s\", \"numero\": %d, \"region\": \"%s\", \"angle\": %d}",
                    date, RegionDuJour.numero(date), id(RegionDuJour.pour(date)), RegionDuJour.angle(date)));
        }
        json.append(jours).append("\n  ],\n");

        json.append("  \"suggestions\": [\n");
        StringJoiner suggestions = new StringJoiner(",\n");
        for (ModeRegions mode : ModeRegions.values()) {
            for (String saisie : saisies()) {
                StringJoiner ids = new StringJoiner(", ", "[", "]");
                RegionFr.suggestions(saisie, mode).forEach(region -> ids.add("\"" + id(region) + "\""));
                suggestions.add(String.format("    {\"mode\": \"%s\", \"saisie\": \"%s\", \"regions\": %s}",
                        mode.name(), saisie.replace("\"", "\\\""), ids));
            }
        }
        json.append(suggestions).append("\n  ]\n}\n");

        Files.writeString(Path.of(args[0]), json, StandardCharsets.UTF_8);
    }

    // les saisies essayées : chaque lettre, puis tous les débuts de chaque nom et de chaque mot des noms
    private static List<String> saisies() {
        Set<String> saisies = new LinkedHashSet<>();
        for (char lettre = 'a'; lettre <= 'z'; lettre++) {
            saisies.add(String.valueOf(lettre));
        }
        for (RegionFr region : RegionFr.values()) {
            String nom = region.getNom();
            for (int fin = 1; fin <= nom.length(); fin++) {
                saisies.add(nom.substring(0, fin));
            }
            for (String mot : nom.split("[\\s\\-'’]+")) {
                for (int fin = 1; fin <= mot.length(); fin++) {
                    saisies.add(mot.substring(0, fin));
                }
            }
        }
        return new ArrayList<>(saisies);
    }

    private static String id(RegionFr region) {
        return region.getImage().replace(".png", "");
    }
}
