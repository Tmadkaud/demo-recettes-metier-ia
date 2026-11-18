# Questions fréquentes

Réponses vérifiées au 17/11/2026. Les prix et conditions commerciales sont à confirmer avec l'équipe commerciale GitHub ou Microsoft.

## Coûts et licences

**Combien coûte Playwright ?**
Rien : Playwright et son serveur MCP sont open source, sous licence Apache-2.0 ([playwright.dev](https://playwright.dev), [playwright-mcp](https://github.com/microsoft/playwright-mcp)).

**Qu'est-ce qui consomme du GitHub Copilot ?**
L'agent : quand il lit une fiche, explore l'application et écrit ou répare un test, il consomme des crédits IA (AI credits). Une fois le test écrit, le **rejouer** (sur un poste ou en CI) ne consomme aucun crédit IA : seulement du temps de CI. Computer use, lui, consomme des crédits à chaque exécution.

**Quels sont les modèles de licence ?** ([docs GitHub](https://docs.github.com/en/copilot/get-started/whats-changing-with-github-enterprise-and-copilot))

| Modèle | Prix par utilisateur et par mois | Crédits IA inclus |
| --- | --- | --- |
| Copilot Business | 19 $ | 1 900 par utilisateur, mutualisés |
| Copilot Enterprise | 39 $ | 3 900 par utilisateur, mutualisés |
| Copilot access (entreprises éligibles) | 0 $ pour les utilisateurs ayant une licence GitHub Enterprise Cloud ; 10 $ en « Copilot Standalone » sinon | Aucun : usage facturé au réel dès la première utilisation |

Le modèle s'applique à toute l'entreprise (pas de mélange Copilot access et Business/Enterprise). Tarifs des modèles : [Models and pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing). Des budgets permettent de plafonner la consommation.

**Qui a besoin d'une licence Copilot ?**
Les personnes qui pilotent l'agent : au départ les recetteurs et l'AMOA porteurs du pilote. Les métiers qui relisent un PV ou une fiche n'en ont pas besoin. La CI qui rejoue les tests non plus.

## Mise en œuvre

**Faut-il savoir coder pour écrire une recette ?**
Non. La fiche se rédige en français à partir du [modèle](../recettes/_modele.md). L'agent écrit le test ; un développeur le relit en pull request. Le GitHub Copilot app offre une interface de discussion qui ne ressemble ni à un IDE ni à un terminal.

**Comment gérer les profils et les droits (conseiller, superviseur, lecture seule) ?**
Un compte de test par profil sur l'environnement de recette. Les mots de passe ne sont jamais dans les fiches ni dans les tests : variables d'environnement alimentées par les secrets de la CI ou un coffre (Azure Key Vault, par exemple). Playwright sait réutiliser une session authentifiée par profil ([authentification](https://playwright.dev/docs/auth)). Avec une authentification unique (SSO) ou une double authentification, le mode de connexion des comptes de test est à cadrer avec la sécurité.

**Les tests cassent-ils dès que l'écran change ?**
Moins qu'avec des sélecteurs techniques : les tests visent ce que voit l'utilisateur (rôles, libellés, textes). Quand un écran évolue, l'agent peut réparer le test à partir d'un nouvel instantané de la page ; la revue en pull request garde l'humain dans la boucle. Un test ne doit jamais être modifié pour masquer un écart avec la fiche : c'est une anomalie.

**Nos applications ne sont pas toutes web.**
Playwright couvre le web (Chromium, Firefox, WebKit) et, en expérimental, les applications Electron. Pour un client lourd ou un logiciel sans API, computer use pilote l'écran comme un utilisateur (public preview) ; il convient à l'exploration plus qu'à la non-régression. Voir [computer-use.md](computer-use.md).

**Où s'exécutent les tests ?**
Sur le poste du recetteur, et en CI : GitHub Actions (exemple dans ce dépôt) ou Azure Pipelines ([Playwright en CI](https://playwright.dev/docs/ci)). Pour atteindre un environnement de recette interne, utilisez des exécuteurs (runners ou agents) hébergés dans votre réseau.

**Peut-on alimenter notre outil de gestion des tests ?**
Oui : en plus du PV et du rapport HTML, Playwright produit du JSON et du JUnit XML ([reporters](https://playwright.dev/docs/test-reporters)), importables dans la plupart des outils de gestion de campagnes.

**Et les données sensibles ?**
Les captures, vidéos et traces montrent les écrans : utilisez un environnement de recette avec des données fictives ou anonymisées, et limitez la durée de conservation des rapports (14 jours dans la CI de ce dépôt).

## Agents et confiance

**Qu'est-ce qui empêche un agent de faire passer un test en l'affaiblissant ?**
Trois verrous. Les règles toujours chargées ([AGENTS.md](../AGENTS.md), [ADR 0004](../docs/adr/0004-une-anomalie-ne-se-masque-jamais.md)) l'interdisent. Les garde-fous de la CI le détectent : délai allongé, cas sauté sans raison, et surtout toute vérification retirée ou modifiée sans mise à jour de sa fiche (`npm run garde-assertions`), ce qui bloque la PR. Enfin, un autre agent relit en lecture seule et un humain merge.

**Un test échoue sur une PR : est-ce la faute de la PR ?**
On le prouve avant de toucher à quoi que ce soit : `npm run enquete` rejoue les tests en échec sur la référence (`main`), même configuration, même navigateur. S'ils échouent aussi, la PR est innocente et la référence se répare à part ; s'ils passent, la PR introduit la régression. En CI, l'enquête se lance d'elle-même et son verdict s'affiche dans la PR.

**Qu'est-ce qu'AGENTS.md ?**
Un fichier Markdown, à la racine du dépôt, que les agents GitHub Copilot lisent comme instructions ([documentation GitHub](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)). On y écrit les règles, les commandes, le processus et le journal des incidents devenus règles. C'est la mémoire de l'agent : écrivez-le avant le premier prompt.

**Plusieurs agents peuvent-ils travailler en même temps ?**
Oui : une fiche, une session, un agent. Dans le GitHub Copilot app, chaque session travaille dans sa propre copie de travail ; plusieurs fiches avancent en parallèle sans se gêner, et la CI vérifie chaque PR.

**Qui décide de la mise en recette ou en production ?**
Un humain. Les règles de la branche `main` ([docs/regles-main.json](../docs/regles-main.json)) imposent une PR et des vérifications vertes ; un agent ne merge jamais. La CI vérifie la forme, l'humain vérifie le sens.

## Démarrer

**Par où commencer ?**
Un pilote court et concret :
1. Choisir 2 ou 3 parcours métier réels et stables (ex. : commande sur le site jusqu'au traitement dans le CRM).
2. Désigner 3 à 5 porteurs (AMOA, recetteurs) et leur ouvrir Copilot.
3. Préparer l'environnement de recette, les comptes de test par profil et des données fictives.
4. Écrire les fiches, les faire automatiser par l'agent, brancher la CI et le PV.
5. Mesurer : temps de recette, disponibilité des métiers économisée, anomalies détectées avant production. Puis démultiplier.
