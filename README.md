# Recettes métier automatisées avec Playwright et GitHub Copilot

[![Recette automatisée](https://github.com/Tmadkaud/demo-recettes-metier-ia/actions/workflows/recette-e2e.yml/badge.svg?branch=main)](https://github.com/Tmadkaud/demo-recettes-metier-ia/actions/workflows/recette-e2e.yml)

Démo : une équipe de recette (AMOA) écrit ses scénarios **en français**, un agent GitHub Copilot les transforme en tests Playwright, un autre agent les relit, la CI les rejoue à chaque changement et publie un **PV de recette** lisible par le métier. Un humain décide.

L'application testée, **Contoso Protect**, est fictive : un site public de souscription à la télésurveillance et le CRM des conseillers qui valident les commandes et planifient les installations. Toutes les données sont synthétiques.

```text
Fiche (humain) ─► Recetteur (agent, session isolée) ─► PR en brouillon ─► CI : garde-fous, recette en lots, PV, enquête
      ▲                                                                          │
      └── retours du terrain ◄── merge (humain) ◄── Relecteur (agent, lecture seule) ◄┘
```

**Vous écrivez la fiche, l'agent écrit le test, la CI vérifie, vous décidez.** Les bonnes pratiques et leur raison d'être : [demo/usine-de-recette.md](demo/usine-de-recette.md).

## Démarrer

Prérequis : Node.js 20 ou plus, git. Pour la partie agent : le GitHub Copilot app ou VS Code avec GitHub Copilot.

```shell
npm ci
npx playwright install chromium
npm start
```

- Site public : http://localhost:3000
- CRM : http://localhost:3000/crm

| Identifiant | Profil | Mot de passe de démo |
| --- | --- | --- |
| `c.martin` | Conseiller | `Conseiller-Demo-2026` |
| `s.benali` | Superviseur | `Superviseur-Demo-2026` |
| `l.roux` | Lecture seule | `Lecture-Demo-2026` |

Ces mots de passe ne servent qu'à la démo : ils se remplacent par les variables d'environnement `CONTOSO_MDP_CONSEILLER`, `CONTOSO_MDP_SUPERVISEUR` et `CONTOSO_MDP_LECTURE` (secrets du dépôt dans la CI).

## Commandes

| Commande | Effet |
| --- | --- |
| `npx playwright test` | Toute la recette, navigateur invisible (l'application démarre seule) |
| `npm run test:visible` | Même chose, navigateur visible, un test à la fois |
| `npm run test:ui` | Mode interactif de Playwright (pas à pas, chronologie) |
| `npm run pv` | Génère le PV de recette `rapports/pv-recette.md` |
| `npm run rapport` | Ouvre le rapport HTML de Playwright (captures, vidéos, traces) |
| `npm run garde-fous` | Garde-fous déterministes, avec des messages écrits pour l'agent |
| `npm run garde-assertions` | Vérifie qu'aucune assertion de recette n'a disparu sans sa fiche (par rapport à `origin/main`) |
| `npm run enquete` | Rejoue les tests en échec sur `origin/main` et dit si la PR est en cause |
| `npm run test:unitaires` | Tests unitaires, avec un seuil de couverture par module |
| `npm run demo:regression` | Démarre l'appli avec une **régression simulée** (règle REC-002 cassée) pour montrer un PV non conforme |

## Contenu

| Élément | Emplacement | Rôle |
| --- | --- | --- |
| Règles toujours chargées | [`AGENTS.md`](AGENTS.md), [`docs/adr/`](docs/adr/README.md) | La mémoire des agents : règles, processus, journal « chaque incident devient une règle », décisions |
| Application | [`app/`](app) | Serveur Node.js sans dépendance, site, CRM, règles métier partagées |
| Fiches de recette | [`recettes/`](recettes) | Scénarios en langage métier : REC-001 à REC-003 automatisées, REC-004 à automatiser en démo |
| Tests de recette | [`tests/recettes/`](tests/recettes) | Un fichier par fiche, une étape `test.step` par étape de la fiche |
| Pages et données | [`tests/pages/`](tests/pages), [`tests/donnees/`](tests/donnees) | Vocabulaire métier (`SiteSouscription`, `Crm`), profils, clients fictifs, préparation par l'API |
| Agents Copilot | [`.github/agents/`](.github/agents) | **Recetteur** (fiche ➜ test ➜ PV, la preuve d'abord) et **Relecteur** (relecture indépendante, en lecture seule) |
| Skills Copilot | [`.github/skills/`](.github/skills) | `playwright-generate-test` (repris d'awesome-copilot), `pv-de-recette`, `enquete-echec` |
| Serveur MCP Playwright | [`.github/mcp.json`](.github/mcp.json), [`.vscode/mcp.json`](.vscode/mcp.json) | Donne à l'agent un navigateur à piloter (`@playwright/mcp`, version figée) |
| Garde-fous et enquête | [`scripts/`](scripts) | `garde-fous.mjs`, `garde-assertions.mjs`, `enquete.mjs`, `pv-recette.mjs` |
| Modèles | [`.github/pull_request_template.md`](.github/pull_request_template.md), [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE) | PR avec section Preuves, issues « Demande de recette » et « Anomalie de recette » |
| CI | [`.github/workflows/recette-e2e.yml`](.github/workflows/recette-e2e.yml) | Garde-fous, recette en deux lots parallèles, PV dans le résumé et dans la PR, enquête automatique sur une PR en échec |
| Règles de `main` | [`docs/regles-main.json`](docs/regles-main.json) | PR obligatoire, vérifications obligatoires : le merge reste humain |
| Guide de démo | [`demo/`](demo) | Déroulé minuté, usine de recette, computer use, questions fréquentes |

## Utiliser les agents

1. Ouvrez ce dépôt dans le GitHub Copilot app (ou VS Code). Le serveur MCP `playwright` est déclaré par le dépôt.
2. Dans une session dédiée, choisissez l'agent **Recetteur** et demandez : `Automatise la recette REC-004.` L'agent lit la fiche, explore le CRM dans un vrai navigateur, écrit `tests/recettes/REC-004-….spec.ts`, l'exécute jusqu'au vert, met la fiche à jour, passe les garde-fous puis produit le PV.
3. Dans une autre session, choisissez l'agent **Relecteur** et demandez : `Relis le test de la recette REC-004 face à sa fiche.` Il liste les écarts, sans rien modifier.
4. Vous relisez les preuves et décidez du merge.

Une version de référence du test REC-004 existe sur la branche `plan-b` (`npm run plan-b` la restaure) : elle n'est volontairement pas sur `main`, pour que l'agent la génère lui-même. La branche `demo/regression-seuil` contient une régression réelle pour montrer les garde-fous, le PV non conforme et l'enquête.

## Sources

- Playwright : https://playwright.dev (licence Apache-2.0), bonnes pratiques : https://playwright.dev/docs/best-practices ; serveur MCP Playwright : https://github.com/microsoft/playwright-mcp
- Agent « Playwright Tester Mode » et skill « playwright-generate-test » : https://github.com/github/awesome-copilot (licence MIT)
- AGENTS.md et instructions de dépôt pour GitHub Copilot : https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- Agents personnalisés : https://docs.github.com/en/copilot/reference/custom-agents-configuration
- Computer use dans le GitHub Copilot app (public preview) : https://docs.github.com/en/copilot/concepts/agents/computer-use

Contoso Protect est une entreprise fictive. Licence [MIT](LICENSE).
