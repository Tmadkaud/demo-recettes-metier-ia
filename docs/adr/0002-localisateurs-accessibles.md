# ADR 0002 · Localisateurs accessibles uniquement

**Statut** : acceptée le 17/11/2026.

## Contexte

Un test qui cible `#id`, `.classe` ou un chemin XPath dépend de la structure HTML : il casse au moindre changement de mise en page, sans que l’utilisateur voie de différence. Les bonnes pratiques Playwright recommandent de tester ce que voit l’utilisateur (https://playwright.dev/docs/best-practices).

## Décision

Les tests et les pages objets n’utilisent que `getByRole`, `getByLabel`, `getByText` et, en dernier recours, `getByTestId`, avec les libellés visibles à l’écran.

## Conséquences

- Les tests survivent aux refontes visuelles.
- Un élément introuvable par son rôle ou son libellé révèle souvent un défaut d’accessibilité de l’application : on corrige l’application.
- L’agent qui explore l’application par le serveur MCP Playwright lit le même arbre d’accessibilité.

## Vérification

Garde-fou `selecteur-css`.
