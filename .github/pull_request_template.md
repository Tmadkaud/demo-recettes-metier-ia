## Fiche(s) de recette

<!-- Exemple : REC-004 · recettes/REC-004-planification-installation.md -->

## Ce qui change

## Preuves

- [ ] `npm run garde-fous` : vert
- [ ] Recette : `npx playwright test` vert deux fois de suite (PV en pièce jointe ou dans le résumé de la CI)
- [ ] Correctif d’anomalie : test rouge **avant** le correctif (preuve jointe), vert après
- [ ] Échec de recette : enquête jointe (`npm run enquete`, fichier `rapports/enquete.md`)
- [ ] Aucune vérification retirée ou affaiblie sans mise à jour de la fiche (`npm run garde-assertions`)
- [ ] Relecture par l’agent Relecteur, dans une autre session, en lecture seule

## Décision humaine

Cette PR reste en brouillon tant que les preuves ne sont pas complètes. La CI vérifie la forme ; un humain vérifie le sens et merge (ADR 0005).
