---
name: enquete-echec
description: "Enquêter sur un test de recette en échec avant de toucher au code : rejouer les mêmes tests sur la référence (origin/main), même configuration et même navigateur, pour prouver si la PR est en cause. À utiliser dès qu’un test de recette échoue."
---

# Enquête sur un échec de recette : la preuve d’abord

Ne modifie ni le test ni l’application avant d’avoir le verdict.

1. Assure-toi que le dernier rapport contient l’échec : `npx playwright test` (ou `npx playwright test tests/recettes/REC-XXX`) écrit `rapports/resultats.json`.
2. Lance `npm run enquete` (référence par défaut : `origin/main` ; autre référence : `npm run enquete -- --base origin/ma-branche`). Le script crée une copie temporaire de la référence, y installe les dépendances, rejoue uniquement les tests en échec avec la même configuration et le même navigateur, puis supprime la copie.
3. Lis le verdict dans `rapports/enquete.md` :
   - **échoue aussi sur la référence** : la PR n’est pas en cause. Ne la modifie pas pour faire passer le test ; propose une issue « Anomalie de recette » sur la référence, à réparer à part.
   - **passe sur la référence** : la PR introduit la régression. Corrige l’application, jamais l’assertion (ADR 0004).
   - **absent de la référence** : le test est nouveau ; analyse la trace (`npx playwright show-trace <chemin>`).
4. Joins `rapports/enquete.md` aux preuves de la PR et cite le verdict dans ta réponse.
