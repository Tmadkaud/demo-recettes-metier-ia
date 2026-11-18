# Contoso Protect : démo de recette métier automatisée

Les règles du dépôt sont dans [`AGENTS.md`](../AGENTS.md) (toujours à respecter) et les décisions dans [`docs/adr/`](../docs/adr/README.md). Résumé pour la revue de code :

- La fiche de recette (`recettes/`) fait foi : signale toute assertion de `tests/recettes/` supprimée, affaiblie ou modifiée sans mise à jour de la fiche correspondante dans la même PR.
- Signale tout délai allongé (`timeout`, `test.slow`), toute attente fixe (`waitForTimeout`, `setTimeout`) et tout cas sauté sans `// Raison :`.
- Localisateurs accessibles uniquement (`getByRole`, `getByLabel`, `getByText`, `getByTestId`) : signale les sélecteurs CSS ou XPath.
- Aucun mot de passe ni date en dur dans les tests ; chaque test crée ses propres données.
- Écris en français.
