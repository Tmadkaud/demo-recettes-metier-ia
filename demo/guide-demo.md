# Guide de la démo « Recettes métier et IA » (60 minutes)

Public visé : direction technique, équipe de recette (AMOA, recetteurs) et développeurs. Objectif : montrer l'état de l'art pour automatiser les recettes métier avec l'IA, puis cadrer un pilote accompagné.

## Préparation (la veille, puis 30 minutes avant)

- [ ] `git pull`, `npm ci`, `npx playwright install chromium`, puis `npx playwright test` : tout doit être vert. `npm run pv` pour vérifier le PV.
- [ ] CI : le badge « Recette automatisée » du README est vert, et le dernier PV est visible dans le résumé du dernier run (onglet **Actions**), à montrer en séquence 7.
- [ ] `git status` propre et **pas** de fichier `tests/recettes/REC-004-*.spec.ts` : l'agent doit le générer en direct.
- [ ] GitHub Copilot app : dépôt ajouté comme projet ; **Customize** > **Installed** : le serveur MCP `playwright` du dépôt apparaît ; l'agent **Recetteur** apparaît dans le sélecteur d'agents.
- [ ] Faire une répétition complète de la séquence 4, puis `git restore . && git clean -fd tests/recettes` pour revenir à l'état initial.
- [ ] Computer use activé : **Settings** > **Computer Use** > **Enable Computer Use** (ou `/computer on`). Lancer une fois le prompt de la séquence 6 pour accepter les autorisations du navigateur.
- [ ] Fermer les fenêtres inutiles et préparer un navigateur dédié : computer use cherche les fenêtres à l'écran, trop de fenêtres le ralentissent.
- [ ] Terminal visible avec `npm start` lancé ; zoom 125 % sur le navigateur et l'éditeur.
- [ ] Teams : lancer la transcription en **français** dès le début (langue parlée de la réunion).

## Déroulé

| Temps | Séquence | Ce qu'on montre | Message clé |
| --- | --- | --- | --- |
| 0-5 | 1. Ouverture | Tour de table, rappel du besoin, objectifs de la séance | On part du besoin métier, pas de l'outil |
| 5-12 | 2. Le constat | Recette métier = goulot : disponibilité des métiers, cycles qui accélèrent, volumes. Trois niveaux de réponse (tableau ci-dessous) | L'IA aide à écrire, exécuter et rejouer la recette |
| 12-20 | 3. Une fiche, un test, un PV | `recettes/REC-001…md` (langage métier) puis `npm run test:visible` : le client commande sur le site, le conseiller valide dans le CRM. `npm run pv` | La fiche métier reste la référence ; le PV est lisible par l'AMOA |
| 20-32 | 4. ★ L'agent automatise une nouvelle fiche | Agent **Recetteur**, fiche REC-004 : exploration du CRM dans le navigateur, écriture du test, exécution, PV (prompt ci-dessous) | L'AMOA décrit, l'agent automatise, l'humain relit |
| 32-37 | 5. Détection d'une régression | `npm run demo:regression` puis `npx playwright test tests/recettes/REC-002` : 2 cas rouges ; `npm run pv` ; `npx playwright show-trace …` | Une règle métier cassée est vue avant la mise en production, avec ses preuves |
| 37-43 | 6. Computer use | Copilot pilote l'écran comme un utilisateur, sans script (prompt ci-dessous) | Pour les applications sans API ni web ; exploratoire, pas pour la non-régression |
| 43-48 | 7. Industrialiser | Pull request ➜ CI GitHub Actions ➜ PV dans le résumé du job, rapport en artefact ; secrets des comptes de test | Toute la recette rejouée à chaque changement, sans mobiliser le métier |
| 48-60 | 8. Démarrer | Pilote accompagné par le partenaire, licences et coûts (voir [FAQ](faq.md)), questions | Commencer petit : 2 ou 3 parcours réels, 3 à 5 personnes |

### Les trois niveaux (séquence 2)

| Niveau | Outil | Pour quoi | Qui |
| --- | --- | --- | --- |
| Recette assistée | Copilot + MCP Playwright ou computer use | Explorer un parcours, reproduire une anomalie, recette exploratoire | Recetteur avec Copilot |
| Recette automatisée | Tests Playwright générés depuis les fiches | Cas stables et répétitifs, versionnés avec le code | AMOA (fiches) + agent (tests) + revue dev |
| Non-régression continue | CI (GitHub Actions ou Azure Pipelines) | Rejouer toute la recette à chaque changement, PV automatique | Personne : c'est la CI |

## Prompts

Séquence 4, agent **Recetteur** sélectionné :

```text
Automatise la recette REC-004. Montre-moi chaque écran pendant l'exploration, puis exécute le test et donne-moi le PV.
```

Relance utile si l'agent s'arrête en route :

```text
Continue : exécute npx playwright test tests/recettes/REC-004, corrige le test si un localisateur est faux, mais ne change aucune assertion de la fiche.
```

Plan B si la génération dépasse 8 minutes : `npm run plan-b`, puis `npx playwright test tests/recettes/REC-004 --headed` et `npm run pv`.

Séquence 6, voir [computer-use.md](computer-use.md).

## Après la séance

- `git restore . && git clean -fd tests/recettes` pour remettre la démo à zéro.
- Partager le dépôt et le PV de la séance si le client le souhaite.
