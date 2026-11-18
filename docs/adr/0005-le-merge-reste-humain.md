# ADR 0005 · Le merge reste humain

**Statut** : acceptée le 17/11/2026.

## Contexte

Les agents écrivent et relisent vite, et la CI vérifie beaucoup de choses. Mais ni l’une ni l’autre ne juge si le comportement obtenu est le bon pour le métier.

## Décision

La CI vérifie la forme, l’humain vérifie le sens.

- La branche `main` n’accepte que des pull requests, avec les vérifications obligatoires « Garde-fous et tests unitaires » et « PV de recette » (règles dans `docs/regles-main.json`).
- Une PR reste en brouillon tant que ses preuves ne sont pas complètes.
- Un agent ne merge jamais et n’approuve jamais une PR : un humain relit les preuves et clique sur Merge.

## Conséquences

Les agents peuvent travailler en parallèle sans risque pour `main`. La responsabilité de ce qui part en recette ou en production reste humaine.

## Vérification

Règles de la branche `main` appliquées par `gh api -X POST repos/{propriétaire}/{dépôt}/rulesets --input docs/regles-main.json`.
