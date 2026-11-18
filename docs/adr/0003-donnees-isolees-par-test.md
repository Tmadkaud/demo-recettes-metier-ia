# ADR 0003 · Chaque test crée ses propres données

**Statut** : acceptée le 17/11/2026.

## Contexte

Des tests qui partagent des données dépendent de leur ordre d’exécution : impossible de les paralléliser ou de rejouer un cas seul. Des dates en dur rendent un test faux le jour où le calendrier change.

## Décision

- Chaque test crée ses données : un client fictif au nom unique (`clientDeTest()`), des pré-requis préparés par l’API (`creerCommandeViaApi`, `connecterApi`, `validerCommandeViaApi`).
- Ce que le test vérifie passe par l’écran ; ce qui n’est que pré-requis passe par l’API, plus rapide et plus fiable.
- Les dates sont calculées à partir du jour d’exécution (`dansNJours`, `prochainJourHorsDimanche`, `prochainDimanche`).
- Aucune donnée réelle de client, aucun mot de passe dans un test (profils dans `tests/donnees/profils.ts`, secrets en CI).

## Conséquences

Les tests tournent en parallèle et en lots, dans n’importe quel ordre, sur n’importe quel environnement de recette.

## Vérification

Garde-fous `date-en-dur` et `mot-de-passe-en-dur` ; exécution parallèle (`fullyParallel`) et en lots en CI.
