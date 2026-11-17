# Computer use : recette sans script

Computer use permet à GitHub Copilot de piloter des applications **comme un utilisateur** (lecture de l'écran via l'accessibilité ou des captures, clics, saisie, défilement), y compris des logiciels sans API, sans ligne de commande et sans serveur MCP. Fonctionnalité en **public preview** dans GitHub Copilot CLI et le GitHub Copilot app, sur macOS et Windows ([annonce du 1er octobre 2026](https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps/), [documentation](https://docs.github.com/en/copilot/concepts/agents/computer-use)).

## Activer

- GitHub Copilot app : **Settings** > **Computer Use** > **Enable Computer Use**, ou `/computer on`.
- Copilot CLI : `/computer on` (`/computer show` pour l'état, `/computer off` pour couper).
- Copilot demande l'autorisation avant de piloter une application. Arrêt immédiat : **Stop** ou <kbd>Échap</kbd> dans l'app, <kbd>Échap</kbd> deux fois dans la CLI.
- Un administrateur d'entreprise peut désactiver la fonctionnalité par les paramètres gérés.

## Prompts pour la démo

Consultation sans risque, avec le profil Lecture seule (l'application interdit toute modification) :

```text
Utilise computer use. Ouvre Microsoft Edge sur http://localhost:3000/crm et connecte-toi avec l'identifiant l.roux et le mot de passe Lecture-Demo-2026. Ouvre la commande de Karim Haddad, puis dis-moi son statut, son total mensuel et les actions possibles. Ne modifie rien.
```

Recette exploratoire du site public :

```text
Utilise computer use. Dans Microsoft Edge, ouvre http://localhost:3000, choisis l'offre Premium et essaie de souscrire avec des saisies limites (code postal à 4 chiffres, téléphone incomplet, date d'installation un dimanche). Ne valide pas de commande correcte. Dis-moi quels contrôles fonctionnent et ce qui te semble anormal.
```

Enchaînement entre applications (option, plus long) :

```text
Utilise computer use. Relève dans le CRM (http://localhost:3000/crm, identifiant l.roux, mot de passe Lecture-Demo-2026) le numéro, le client et le total mensuel des commandes au statut « Nouvelle », puis recopie-les dans un nouveau classeur Excel.
```

## Playwright ou computer use ?

| | Tests Playwright (générés par l'agent) | Computer use |
| --- | --- | --- |
| Applications | Web (et applications Electron, en expérimental) | Toute application à l'écran, y compris client lourd et logiciels anciens |
| Résultat | Test versionné, rejoué à l'identique en CI | Action ponctuelle, décrite en langage naturel |
| Fiabilité | Déterministe, localisateurs accessibles, traces | Peut se tromper de contrôle ; sensible aux fenêtres et aux temps de réponse |
| Usage recommandé | Non-régression, recette automatisée | Exploration, applications sans autre accès, aide ponctuelle au recetteur |
| Coût d'exécution | Aucun crédit IA à l'exécution : seulement du temps de CI (Playwright est open source) | Consomme des crédits IA à chaque exécution |

La documentation GitHub le dit elle-même : si une API, un serveur MCP, une commande ou un outil de navigateur dédié peut faire la tâche, il donne en général un résultat plus structuré et plus prévisible.

## Précautions

- N'utilisez computer use qu'avec des applications et des contenus que vous acceptez de fournir comme contexte à Copilot : l'écran peut afficher des données personnelles.
- Évitez « Toujours autoriser » pour les applications sensibles ou à fort impact.
- Pour la recette : environnement de recette, comptes de test et données fictives ou anonymisées.
