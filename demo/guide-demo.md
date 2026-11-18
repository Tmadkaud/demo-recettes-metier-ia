# Guide de la démo « Recette métier : l’IA en renfort » (60 minutes)

Public visé : direction technique, équipe de recette (AMOA, recetteurs) et développeurs. Objectif : montrer l’état de l’art pour automatiser la recette métier avec des agents, avec des garde-fous, puis cadrer un pilote accompagné. Le support de présentation suit le même ordre.

## Préparation (la veille, puis 30 minutes avant)

- [ ] `git pull`, `npm ci`, `npx playwright install chromium`, puis `npx playwright test` : tout doit être vert. `npm run garde-fous` et `npm run pv` aussi.
- [ ] CI : le badge « Recette automatisée » du README est vert ; le dernier PV est visible dans le résumé du dernier run (onglet **Actions**).
- [ ] La PR de démonstration « Démo : les conseillers valident jusqu’à 60 € par mois » (branche `demo/regression-seuil`) est ouverte en brouillon : vérification « PV de recette » rouge, commentaire « PV de recette » avec l’enquête automatique, bouton Merge bloqué.
- [ ] `git status` propre et **pas** de fichier `tests/recettes/REC-004-*.spec.ts` : l’agent doit le générer en direct.
- [ ] GitHub Copilot app : dépôt ajouté comme projet ; **Customize** > **Installed** : le serveur MCP `playwright` du dépôt apparaît ; les agents **Recetteur** et **Relecteur** apparaissent dans le sélecteur d’agents.
- [ ] Faire une répétition complète des séquences B et C, puis `git restore . && git clean -fd tests/recettes` pour revenir à l’état initial.
- [ ] Computer use activé : **Settings** > **Computer Use** > **Enable Computer Use** (ou `/computer on`). Lancer une fois le prompt de la séquence E pour accepter les autorisations du navigateur.
- [ ] Fermer les fenêtres inutiles ; terminal visible avec `npm start` lancé ; zoom 125 % sur le navigateur et l’éditeur.
- [ ] Teams : lancer la transcription en **français** dès le début.

## Déroulé

| Temps | Séquence | Ce qu’on montre | Message clé |
| --- | --- | --- | --- |
| 0-5 | Ouverture | Tour de table, rappel du besoin (diapos 1 à 3) | On part du besoin métier, pas de l’outil |
| 5-10 | Cadrage | La vérification devient le goulot ; trois niveaux ; l’usine de recette en 9 étapes (diapos 2, 4, 5) | Vous écrivez la fiche, l’agent écrit le test, la CI vérifie, vous décidez |
| 10-16 | A. Une fiche, un test, un PV | `recettes/REC-001…md`, puis `npm run test:visible -- tests/recettes/REC-001` : le client commande sur le site, la conseillère valide dans le CRM. `npm run pv` | La fiche fait foi ; le PV reprend ses mots |
| 16-27 | B. ★ L’agent automatise une nouvelle fiche | Session dédiée, agent **Recetteur**, fiche REC-004 : exploration du CRM dans le navigateur, test, exécution, garde-fous (il met la fiche à « ✅ »), PV | Une fiche, une session, un agent |
| 27-32 | C. Un autre agent relit | Nouvelle session, agent **Relecteur** (lecture seule) : critiques numérotées face à la fiche | Celui qui écrit n’est pas celui qui relit |
| 32-40 | D. Une régression, la cause prouvée | PR de démonstration : garde-fous verts, PV rouge sur REC-002, enquête « passe sur la référence : la PR introduit la régression », Merge bloqué. Puis, en local, modifier une assertion de REC-002 et lancer `npm run garde-assertions` : refusé | La CI vérifie la forme, l’humain vérifie le sens ; l’agent apporte la preuve |
| 40-44 | E. Computer use | Copilot pilote l’écran comme un utilisateur, sans script ([computer-use.md](computer-use.md)) | Pour explorer ou piloter une application sans API ; pas pour la non-régression |
| 44-50 | Le socle | `AGENTS.md` (règles, journal « chaque incident devient une règle »), `docs/adr/`, messages des garde-fous, règles de `main` (diapos 7 à 11) | Écrire AGENTS.md avant le premier prompt |
| 50-60 | Démarrer | Indicateurs, pilote accompagné par Magellan, licences ([FAQ](faq.md)), questions (diapos 12, 13, annexes) | Commencer petit : 2 ou 3 parcours réels, 3 à 5 porteurs |

## Prompts

Séquence B, nouvelle session, agent **Recetteur** :

```text
Automatise la recette REC-004. Montre-moi chaque écran pendant l’exploration, puis exécute le test, passe les garde-fous et donne-moi le PV.
```

Relance utile si l’agent s’arrête en route :

```text
Continue : exécute npx playwright test tests/recettes/REC-004, corrige le test si un localisateur est faux, mais ne change aucune assertion de la fiche. Termine par npm run garde-fous.
```

Plan B si la génération dépasse 8 minutes : `npm run plan-b`, puis `npx playwright test tests/recettes/REC-004 --headed` et `npm run pv`.

Séquence C, autre session sur la même branche, agent **Relecteur** :

```text
Relis le test de la recette REC-004 face à sa fiche. Liste les écarts avec leur gravité, sans rien modifier.
```

Séquence D, en local sur la branche de la PR (environ une minute) :

```text
git switch demo/regression-seuil
npx playwright test tests/recettes/REC-002
npm run enquete
```

Puis, pour montrer qu’une vérification ne disparaît pas sans sa fiche : remplacer `toBeDisabled()` par `toBeEnabled()` dans `tests/recettes/REC-002-droits-par-profil.spec.ts`, lancer `npm run garde-assertions`, lire le message écrit pour l’agent, puis `git restore tests/recettes` et `git switch main`.

Prompt possible pour l’agent, sur la branche de la PR :

```text
La recette REC-002 échoue sur cette branche. Prouve d’abord si la branche est en cause, puis propose la suite.
```

## Après la séance

- `git switch main && git restore . && git clean -fd tests/recettes` pour remettre la démo à zéro.
- Partager le dépôt, le support et le PV de la séance si le client le souhaite.
