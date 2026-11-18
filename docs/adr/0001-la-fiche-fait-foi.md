# ADR 0001 · La fiche de recette fait foi

**Statut** : acceptée le 17/11/2026.

## Contexte

La recette métier vérifie que l’application fait ce que le métier attend. Si le test devient la référence, un comportement erroné peut finir « validé » parce que quelqu’un, humain ou agent, a ajusté le test.

## Décision

La fiche de recette (`recettes/REC-XXX-*.md`), rédigée par l’équipe recette (AMOA) en langage métier, est la référence. Le test Playwright l’implémente : un `test.describe` par fiche, un `test()` par cas, un `test.step()` par étape, avec les mots de la fiche. Le fichier de test commence par `// Recette REC-XXX : voir recettes/REC-XXX-<titre>.md`.

## Conséquences

- Un résultat attendu de la fiche qui n’est pas vérifié est un défaut du test.
- Si le comportement attendu change, la fiche change d’abord, dans la même PR que le test.
- Le PV reprend les titres et les étapes de la fiche : il est lisible par le métier.

## Vérification

Garde-fous `tracabilite` (fiche ↔ test) et `assertion-affaiblie` (une assertion ne change pas sans sa fiche).
