# Recettes métier automatisées avec Playwright et GitHub Copilot

[![Recette automatisée](https://github.com/Tmadkaud/demo-recettes-metier-ia/actions/workflows/recette-e2e.yml/badge.svg?branch=main)](https://github.com/Tmadkaud/demo-recettes-metier-ia/actions/workflows/recette-e2e.yml)

Démo : une équipe de recette (AMOA) écrit ses scénarios **en français**, un agent GitHub Copilot les transforme en tests Playwright, la CI les rejoue à chaque changement et publie un **PV de recette** lisible par le métier.

L'application testée, **Contoso Protect**, est fictive : un site public de souscription à la télésurveillance et le CRM des conseillers qui valident les commandes et planifient les installations. Toutes les données sont synthétiques.

```text
Fiche de recette (recettes/REC-XXX.md, langage métier)
   └─► agent « Recetteur » + MCP Playwright : explore l'appli comme un utilisateur
         └─► test Playwright (tests/recettes/REC-XXX.spec.ts), relu en pull request
               └─► CI GitHub Actions : rejoue toute la recette ─► PV de recette (✅ / ❌ + preuves)
```

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

## Rejouer la recette

| Commande | Effet |
| --- | --- |
| `npx playwright test` | Toute la recette, navigateur invisible (l'application démarre seule) |
| `npm run test:visible` | Même chose, navigateur visible, un test à la fois |
| `npm run test:ui` | Mode interactif de Playwright (pas à pas, chronologie) |
| `npm run pv` | Génère le PV de recette `rapports/pv-recette.md` |
| `npm run rapport` | Ouvre le rapport HTML de Playwright (captures, vidéos, traces) |
| `npm run test:unitaires` | Tests unitaires des règles métier |
| `npm run demo:regression` | Démarre l'appli avec une **régression simulée** (règle REC-002 cassée) pour montrer un PV non conforme |

## Contenu

| Élément | Emplacement | Rôle |
| --- | --- | --- |
| Application | [`app/`](app) | Serveur Node.js sans dépendance, site, CRM, règles métier partagées |
| Fiches de recette | [`recettes/`](recettes) | Scénarios en langage métier : REC-001 à REC-003 automatisées, REC-004 à automatiser en démo |
| Tests de recette | [`tests/recettes/`](tests/recettes) | Un fichier par fiche, une étape `test.step` par étape de la fiche |
| Pages et données | [`tests/pages/`](tests/pages), [`tests/donnees/`](tests/donnees) | Vocabulaire métier (`SiteSouscription`, `Crm`), profils, clients fictifs, préparation par l'API |
| Agent Copilot | [`.github/agents/recetteur.agent.md`](.github/agents/recetteur.agent.md) | « Recetteur » : fiche ➜ exploration ➜ test ➜ exécution ➜ PV, sans masquer les anomalies |
| Skills Copilot | [`.github/skills/`](.github/skills) | `playwright-generate-test` (repris d'awesome-copilot) et `pv-de-recette` |
| Serveur MCP Playwright | [`.github/mcp.json`](.github/mcp.json), [`.vscode/mcp.json`](.vscode/mcp.json) | Donne à l'agent un navigateur à piloter (`@playwright/mcp`, version figée) |
| CI | [`.github/workflows/recette-e2e.yml`](.github/workflows/recette-e2e.yml) | Recette à chaque push et pull request, PV dans le résumé du job, rapport en artefact |
| Guide de démo | [`demo/`](demo) | Déroulé minuté, computer use, questions fréquentes |

## Utiliser l'agent Recetteur

1. Ouvrez ce dépôt dans le GitHub Copilot app (ou VS Code). Le serveur MCP `playwright` est déclaré par le dépôt.
2. Choisissez l'agent **Recetteur** dans le sélecteur d'agents.
3. Demandez : `Automatise la recette REC-004.`

L'agent lit la fiche, explore le CRM dans un vrai navigateur, écrit `tests/recettes/REC-004-….spec.ts`, l'exécute jusqu'au vert puis produit le PV. Une version de référence du test existe sur la branche `plan-b` (`npm run plan-b` la restaure) : elle n'est volontairement pas sur `main`, pour que l'agent la génère lui-même.

## Sources

- Playwright : https://playwright.dev (licence Apache-2.0) ; serveur MCP Playwright : https://github.com/microsoft/playwright-mcp
- Agent « Playwright Tester Mode » et skill « playwright-generate-test » : https://github.com/github/awesome-copilot (licence MIT)
- Valider une fonctionnalité avec Playwright MCP dans le GitHub Copilot app : https://awesome-copilot.github.com/learning-hub/copilot-workshops/app/6-mcp-playwright/
- Computer use dans le GitHub Copilot app (public preview) : https://docs.github.com/en/copilot/concepts/agents/computer-use

Contoso Protect est une entreprise fictive. Licence [MIT](LICENSE).
