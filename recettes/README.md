# Fiches de recette métier

Chaque fiche décrit un scénario de recette **en langage métier**, comme le ferait l'équipe AMOA : objectif, profils, données, étapes et résultats attendus. Aucune connaissance du code n'est nécessaire pour l'écrire.

L'agent **Recetteur** (`.github/agents/recetteur.agent.md`) lit une fiche, déroule le scénario dans le navigateur avec le serveur MCP Playwright, écrit le test automatisé correspondant dans `tests/recettes/`, l'exécute et produit le PV de recette.

| Fiche | Scénario | Automatisée |
| --- | --- | --- |
| [REC-001](REC-001-souscription-et-validation.md) | Souscription en ligne puis validation dans le CRM | ✅ |
| [REC-002](REC-002-droits-par-profil.md) | Droits par profil sur une commande de plus de 50 € par mois | ✅ |
| [REC-003](REC-003-controles-du-formulaire.md) | Contrôles du formulaire de souscription | ✅ |
| [REC-004](REC-004-planification-installation.md) | Planification de l'installation d'une commande validée | ❌ à automatiser |

## Cycle de vie d'une fiche

1. L'AMOA rédige la fiche à partir du [modèle](_modele.md) et ouvre une issue « Demande de recette » qui la désigne.
2. Une session dédiée par fiche : l'agent **Recetteur** explore le parcours, écrit le test, l'exécute jusqu'au vert, passe les garde-fous et ouvre une pull request **en brouillon** avec ses preuves.
3. L'agent **Relecteur**, dans une autre session et en lecture seule, confronte le test à la fiche. Chaque écart repasse par un test rouge, une correction, un vert.
4. La CI rejoue toute la recette en lots parallèles, publie le PV dans la PR et, si un test échoue, rejoue l'échec sur `main` pour prouver si la PR est en cause.
5. Un humain relit les preuves et merge : la fiche devient un test de non-régression.

La fiche fait foi ([ADR 0001](../docs/adr/0001-la-fiche-fait-foi.md)) : une vérification ne change jamais sans sa fiche, et le garde-fou `assertion-affaiblie` bloque la PR sinon.

## Demander l'automatisation d'une fiche

Dans le GitHub Copilot app ou VS Code, choisissez l'agent **Recetteur**, puis :

```text
Automatise la recette REC-004.
```

## Comptes et données

- Profils du CRM : Conseiller, Superviseur, Lecture seule. Les mots de passe ne figurent jamais dans les fiches ni dans les tests : ils viennent de variables d'environnement (secrets de la CI).
- Données : uniquement des clients fictifs, créés par le test lui-même (un nom unique par exécution).
