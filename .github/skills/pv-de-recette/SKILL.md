---
name: pv-de-recette
description: "Produit le procès-verbal (PV) de recette en français à partir des résultats Playwright : verdict, cas conformes et non conformes, étapes et preuves. À utiliser après une exécution des tests de recette."
---

# PV de recette

1. Exécutez la recette demandée : `npx playwright test` (toute la recette) ou `npx playwright test tests/recettes/REC-XXX` (une fiche). Les résultats sont écrits dans `rapports/resultats.json`.
2. Générez le PV : `npm run pv`. Il est écrit dans `rapports/pv-recette.md` et affiché dans le terminal.
3. Présentez le verdict, puis pour chaque cas non conforme : la fiche, l'étape, le résultat attendu, le résultat obtenu et les preuves (capture d'écran, vidéo, trace à ouvrir avec `npx playwright show-trace <chemin>`).
4. Ne déclarez jamais un cas conforme sans exécution réelle : le PV fait foi.
5. Un cas marqué « anomalie connue » (`test.fail()`) reste non conforme tant que l'anomalie n'est pas corrigée.
