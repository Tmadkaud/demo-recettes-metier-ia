# Contoso Protect : démo de recette métier automatisée

Application **fictive** de télésurveillance : un site public de souscription (`/`) et le CRM des conseillers (`/crm`), servis par `app/serveur.mjs` (Node.js sans dépendance, données en mémoire). Toutes les données sont synthétiques.

## Repères

- Démarrer l'application : `npm start`, puis http://localhost:3000 (santé : `/sante`).
- Règles métier : `app/public/commun/regles.mjs` (partagées par le serveur et le navigateur).
- Fiches de recette rédigées par l'AMOA : `recettes/REC-XXX-*.md`. Tests correspondants : `tests/recettes/REC-XXX-*.spec.ts`.
- Pages décrites en vocabulaire métier : `tests/pages/` (`SiteSouscription`, `Crm`). Données et profils : `tests/donnees/`.
- Lancer la recette : `npx playwright test` ; PV de recette : `npm run pv` (écrit `rapports/pv-recette.md`).

## Conventions des tests de recette

- Un `test.describe('REC-XXX · <titre de la fiche>')` par fiche, un `test()` par cas, un `test.step()` par étape métier, avec les mots de la fiche.
- Localisateurs accessibles uniquement : `getByRole`, `getByLabel`, `getByText`, `getByTestId`. Pas de sélecteur CSS fragile, jamais de `waitForTimeout`.
- Les mots de passe viennent de `PROFILS` (variables d'environnement) : jamais en dur dans un test ou une fiche.
- Chaque test crée ses propres données (client au nom unique, `creerCommandeViaApi`) pour rester indépendant et parallélisable.
- Préparer les pré-requis par l'API quand l'étape n'est pas l'objet du test ; vérifier par l'écran ce que voit l'utilisateur.
- Un test ne doit jamais être modifié pour masquer un écart avec la fiche : un écart est une anomalie à signaler.

## Langue

Français pour les titres de tests, les étapes, les messages, la documentation et les messages de commit.
