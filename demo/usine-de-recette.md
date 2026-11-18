# L’usine de recette : bonnes pratiques

Ce document décrit comment ce dépôt organise la recette métier avec des agents, et pourquoi. Les règles opérationnelles sont dans [AGENTS.md](../AGENTS.md) ; les décisions dans [docs/adr/](../docs/adr/README.md).

> « In a world where code generation has become cheap, what has become hard is verification. » Satya Nadella, podcast *The Pragmatic Engineer*, novembre 2026.
>
> La recette métier est la vérification qui coûte le plus aux équipes : c’est elle qu’il faut outiller.

## La chaîne, en neuf étapes

| # | Étape | Qui | Dans ce dépôt |
| --- | --- | --- | --- |
| 1 | Fiche | Humain décide | `recettes/REC-XXX-*.md`, issue « Demande de recette » |
| 2 | Agent | Agent exécute | agent **Recetteur** (`.github/agents/recetteur.agent.md`) |
| 3 | Session isolée | Agent exécute | une session (copie de travail) par fiche dans le GitHub Copilot app |
| 4 | PR en brouillon | Agent exécute | modèle de PR avec la section Preuves |
| 5 | CI | Automate vérifie | garde-fous, tests unitaires, recette en deux lots, PV, enquête |
| 6 | Revue indépendante | Agent exécute | agent **Relecteur**, autre session, lecture seule |
| 7 | Merge | Humain décide | règles de `main` : PR obligatoire, vérifications obligatoires |
| 8 | Non-régression | Automate vérifie | la fiche est rejouée à chaque changement |
| 9 | Terrain | Humain décide | retours de l’équipe recette et des métiers : nouvelles fiches |

**Vous écrivez la fiche, l’agent écrit le test, la CI vérifie, vous décidez.**

## Le socle : des règles, des skills, des outils, des agents, un humain

| Brique | Rôle | Fichiers |
| --- | --- | --- |
| Règles toujours chargées | La mémoire de l’agent, relue à chaque session | `AGENTS.md`, `docs/adr/` |
| Skills chargés à la demande | Savoir-faire précis | `playwright-generate-test`, `pv-de-recette`, `enquete-echec` |
| Outils | Un vrai navigateur pour l’agent | serveur MCP Playwright (`.github/mcp.json`) |
| Agents | Rôles séparés | Recetteur (écrit), Relecteur (relit) |
| Humain | Le sens et la décision | fiche, relecture finale, merge |

C’est ce socle, plus que le prompt, qui rend le résultat reproductible d’un agent à l’autre.

## Un agent automatise, un autre relit

1. **Coordinateur** (humain) : choisit la fiche et ouvre une session dédiée. Une fiche = une session = un agent : plusieurs fiches avancent en parallèle sans conflit.
2. **Recetteur** : explore le parcours dans le navigateur et écrit le test.
3. **Recetteur** : exécute jusqu’au vert, deux fois, puis produit le PV.
4. **Relecteur** : dans une autre session, en lecture seule, confronte le test à la fiche et liste les écarts.
5. **Recetteur** : chaque écart suit le cycle test rouge, correction, vert. Mêmes assertions, aucune tolérance ajoutée.
6. **Humain** : valide les preuves et merge ; la PR reste en brouillon jusque-là.

## La CI vérifie la forme, l’humain vérifie le sens

- **Des garde-fous déterministes** (`npm run garde-fous`, `npm run garde-assertions`) dont les messages sont écrits pour l’agent : le problème, pourquoi, comment corriger. Exemple :

  ```text
  ✗ selecteur-css · tests/pages/site.ts:15
    Sélecteur CSS ou XPath dans la recette.
    Trouvé : this.resumeErreurs = page.locator('#resume-erreurs');
    Pourquoi : il dépend de la structure HTML et non de ce que voit l’utilisateur (ADR 0002).
    Comment corriger : utilise getByRole, getByLabel, getByText ou getByTestId avec le libellé visible.
  ```

- **Une vérification ne disparaît pas sans sa fiche** : sur une PR, retirer ou modifier une assertion de recette sans changer la fiche correspondante bloque la CI.
- **Un seuil de couverture par module** (règles métier, outillage) : une mesure qui empêche la régression, pas une cible à atteindre.
- **Des tests rapides** : la recette tourne en lots parallèles ; chaque minute de CI rallonge le délai entre la fiche et le verdict.
- **Le merge reste humain** : règles de `main` dans `docs/regles-main.json`.

## L’agent enquêteur : la preuve d’abord

Quand un test échoue sur une PR, on ne touche à rien avant d’avoir la preuve. `npm run enquete` rejoue les tests en échec sur la référence (`origin/main`), dans une copie temporaire, même configuration, même navigateur :

- **échoue aussi sur la référence** : la PR n’est pas en cause ; la référence se répare à part ;
- **passe sur la référence** : la PR introduit la régression ; on corrige l’application, jamais l’assertion.

En CI, l’enquête se lance d’elle-même sur une PR dont la recette échoue, et son verdict s’affiche dans la PR.

## Chaque incident devient une règle

Un incident donne une règle dans `AGENTS.md`, puis, dès qu’elle est vérifiable, un garde-fou. Le prochain agent ne refait pas l’erreur. Le journal d’`AGENTS.md` en montre quatre, vécus en construisant cette démo.

## Mesurer ce qui compte

L’activité explique, le délai prouve. Pour un pilote, mesurez avant puis après :

- le délai de recette : de la fiche prête au verdict ;
- le délai de correction : de l’anomalie détectée au correctif livré ;
- la disponibilité métier : heures de recette manuelle libérées ;
- la qualité : anomalies trouvées avant la production ;
- en complément, la part des fiches automatisées (dans le PV) : une mesure, pas un objectif.

## Pour démarrer

1. Partir d’un vrai parcours, utilisé par vos équipes.
2. Écrire `AGENTS.md` avant le premier prompt : chaque bug devient une règle que le prochain agent lira.
3. Rendre la CI impitoyable : des garde-fous déterministes, avec des messages écrits pour l’agent.
4. Une fiche, une session, un agent : le parallélisme sans verrou.
5. Garder le bouton Merge humain : la CI vérifie la forme, l’humain vérifie le sens.
