# AGENTS.md · Règles du dépôt

Ce fichier est la mémoire des agents de ce dépôt : chaque agent le relit à chaque session, avant le premier prompt. Il prime sur les habitudes de l’agent. Les décisions qui le justifient sont dans [`docs/adr/`](docs/adr/README.md). Chaque incident devient une règle ici, puis, dès que possible, un garde-fou automatique.

## Le projet

Application fictive **Contoso Protect** : un site de souscription (`/`) et le CRM des conseillers (`/crm`), servis par `app/serveur.mjs` (Node.js sans dépendance, données en mémoire). Les fiches de recette (`recettes/`) disent en langage métier ce qui doit marcher ; les tests Playwright (`tests/recettes/`) les implémentent. Toutes les données sont synthétiques.

## Commandes

| But | Commande |
| --- | --- |
| Démarrer l’application | `npm start` (http://localhost:3000, santé : `/sante`) |
| Rejouer toute la recette | `npx playwright test` |
| Rejouer une fiche | `npx playwright test tests/recettes/REC-004` |
| Garde-fous, avant chaque PR | `npm run garde-fous` |
| Assertions inchangées par rapport à main | `npm run garde-assertions` |
| Tests unitaires et seuils de couverture | `npm run test:unitaires` |
| PV de recette | `npm run pv` |
| Enquête sur un échec | `npm run enquete` |

## Règles de recette

Chaque règle est vérifiée par `npm run garde-fous` ; l’identifiant du garde-fou est entre crochets.

1. **La fiche fait foi** (ADR 0001). Un test implémente une fiche : `test.describe('REC-XXX · <titre de la fiche>')`, un `test()` par cas, un `test.step()` par étape, avec les mots de la fiche. Première ligne du fichier : `// Recette REC-XXX : voir recettes/REC-XXX-<titre>.md`. Une fiche automatisée porte « ✅ » et le chemin de son test. [tracabilite]
2. **Localisateurs accessibles uniquement** (ADR 0002) : `getByRole`, `getByLabel`, `getByText`, `getByTestId`. Jamais de sélecteur CSS ni XPath. [selecteur-css]
3. **Jamais d’attente fixe** : ni `waitForTimeout`, ni `setTimeout`. Une assertion web-first attend l’état attendu. [attente-fixe]
4. **Chaque test crée ses propres données** (ADR 0003) : client au nom unique, pré-requis préparés par l’API (`tests/donnees/api.ts`). Les dates sont calculées à partir du jour d’exécution, jamais en dur. [date-en-dur]
5. **Aucun mot de passe dans un test** : les profils viennent de `tests/donnees/profils.ts`, alimenté par les variables d’environnement (secrets en CI). [mot-de-passe-en-dur]
6. **Une anomalie ne se masque jamais** (ADR 0004) : ni assertion affaiblie, ni délai allongé, ni test sauté sans raison. Un cas en anomalie est marqué `test.fail()` juste sous un commentaire `// Anomalie : <attendu, obtenu, issue>`. [tolerance-ajoutee] [anomalie-sans-motif] [saut-sans-raison] [assertion-affaiblie]
7. **Pas de `test.only`**. [test-isole]
8. **Le fichier de verrouillage pointe vers le registre public** `https://registry.npmjs.org/`. [registre-public]
9. **Un seuil de couverture par module** (`npm run test:unitaires`) : règles métier ≥ 90 % des lignes, 70 % des branches, 85 % des fonctions ; outillage de recette ≥ 65 %, 75 %, 75 % (mesure du 18/11/2026, arrondie en dessous). Le seuil empêche la régression : c’est une mesure, pas une cible. On ne le relève qu’en ajoutant des tests utiles.

## Processus : une fiche, une session, un agent

1. Une demande de recette = une issue « Demande de recette » qui pointe vers sa fiche.
2. Une session dédiée par fiche (copie de travail isolée) : plusieurs fiches avancent en parallèle, sans conflit.
3. Le **Recetteur** explore le parcours dans le navigateur (serveur MCP Playwright), écrit le test, l’exécute jusqu’au vert deux fois de suite, puis lance `npm run garde-fous` et `npm run pv`.
4. La PR reste **en brouillon** tant que ses preuves ne sont pas complètes (modèle de PR) : PV, garde-fous verts, enquête si un test a échoué.
5. Le **Relecteur** relit la PR dans une autre session, en lecture seule, face à la fiche, et liste les écarts.
6. Chaque écart : d’abord un test rouge (preuve gardée dans la PR), puis la correction, puis le vert. Mêmes assertions, aucune tolérance ajoutée.
7. **Un humain valide les preuves et merge** (ADR 0005). Un agent ne merge jamais et n’approuve jamais une PR.

Rôles : l’humain décide (fiche, revue finale, merge, retours du terrain) ; l’agent exécute (exploration, test, PV, relecture) ; l’automate vérifie (garde-fous, recette, seuils en CI).

## Quand un test échoue : la preuve d’abord

Avant de toucher au test ou à l’application, prouve la cause avec le skill `enquete-echec` : `npm run enquete` rejoue les tests en échec sur la référence (`origin/main`), même configuration, même navigateur.

- **Échoue aussi sur la référence** : la PR n’est pas en cause. Ne modifie pas la PR pour faire passer le test ; signale la référence cassée (issue « Anomalie de recette »).
- **Passe sur la référence** : la PR introduit la régression. Corrige l’application, jamais l’assertion.

## Journal : chaque incident devient une règle

| Date | Incident | Règle | Garde-fou |
| --- | --- | --- | --- |
| 17/11/2026 | Un formulaire masqué par l’attribut `hidden` restait affiché : une règle CSS `display` l’emportait. | Toute feuille de style garde `[hidden] { display: none !important; }`. | REC-004 vérifie que le formulaire de planification disparaît. |
| 17/11/2026 | `node --test <dossier>` passait sous Node.js 26 et échouait sous Node.js 24 en CI. | Toujours un motif explicite : `node --test "tests/unitaires/*.test.mjs"`. | La CI exécute les tests unitaires sous Node.js 24. |
| 17/11/2026 | Le fichier de verrouillage pointait vers un registre npm privé : installation impossible en CI. | Les URL `resolved` du `package-lock.json` pointent vers le registre public. | [registre-public] |
| 18/11/2026 | Trois localisateurs CSS (`#resume-erreurs`, `.erreur`, `#erreur-action`) restaient dans les pages objets, contraires à l’ADR 0002. | Rôles, libellés et textes uniquement, y compris dans `tests/pages/`. | [selecteur-css] |

Pour ajouter une règle : décris l’incident, la règle et, dès qu’elle est vérifiable, ajoute le garde-fou dans `scripts/garde-fous.mjs` avec un message qui dit à l’agent quoi corriger.

## Définition de « terminé » pour une fiche

- [ ] Chaque résultat attendu de la fiche est vérifié par une assertion ; la fiche porte « ✅ » et le chemin du test.
- [ ] `npx playwright test` vert deux fois de suite.
- [ ] `npm run garde-fous` vert.
- [ ] PV joint à la PR, relecture du Relecteur faite, merge par un humain.

## Langue

Français pour les titres de tests, les étapes, les messages, la documentation et les messages de commit.
