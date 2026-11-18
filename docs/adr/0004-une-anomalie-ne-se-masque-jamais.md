# ADR 0004 · Une anomalie ne se masque jamais

**Statut** : acceptée le 17/11/2026.

## Contexte

Quand un test échoue, la tentation est de le faire passer : affaiblir une assertion, allonger un délai, sauter le cas. Un agent qui cherche à « rendre la CI verte » y est particulièrement exposé. La recette perdrait alors toute valeur.

## Décision

- Un test de recette ne change pas pour faire passer une application défaillante : mêmes assertions, aucune tolérance ajoutée.
- Avant toute modification, on prouve la cause de l’échec : `npm run enquete` rejoue les tests sur la référence.
- Une anomalie confirmée est signalée (issue « Anomalie de recette ») et le cas est marqué `test.fail()` sous un commentaire `// Anomalie : …`, jusqu’à sa correction.
- Chaque défaut trouvé suit le cycle : test rouge (preuve gardée), correction, vert.

## Conséquences

Le PV montre les anomalies au lieu de les cacher. Une assertion ne change qu’avec sa fiche (ADR 0001).

## Vérification

Garde-fous `assertion-affaiblie`, `tolerance-ajoutee`, `anomalie-sans-motif` et `saut-sans-raison`.
