# REC-002 · Droits par profil sur une commande de plus de 50 € par mois

| | |
| --- | --- |
| Processus | Validation des commandes en back-office |
| Applications | CRM des conseillers |
| Profils | Conseiller, Superviseur, Lecture seule |
| Priorité | Haute : règle de délégation de pouvoir |
| Automatisée | ✅ `tests/recettes/REC-002-droits-par-profil.spec.ts` |

## Objectif

Garantir que seule une personne habilitée peut valider une commande dont le total mensuel dépasse 50 €, et que le profil Lecture seule ne peut rien modifier.

## Règles de gestion

- Une commande dont le total mensuel dépasse 50,00 € ne peut être validée que par un superviseur.
- Le conseiller peut toujours refuser une commande.
- Le profil Lecture seule consulte les commandes sans pouvoir agir.
- La règle est appliquée par le serveur, pas seulement par l'écran.

## Pré-requis

Une commande au statut « Nouvelle » : offre Premium (49,90 €) + option « Caméra extérieure » (5,00 €), soit 54,90 € par mois.

## Étapes et résultats attendus

| # | Étape | Résultat attendu |
| --- | --- | --- |
| 1 | Le conseiller ouvre la commande. | Le total affiché est « 54,90 € / mois ». Le bouton « Valider la commande » est grisé avec le message « Validation superviseur requise (total mensuel supérieur à 50,00 €). ». Le bouton « Refuser la commande » reste disponible. |
| 2 | Le superviseur ouvre la même commande et clique sur « Valider la commande ». | Le statut devient « Validée » et l'historique indique « Commande validée par Sami Benali (Superviseur) ». |
| 3 | L'utilisateur Lecture seule ouvre la commande. | Le message « Accès en lecture seule : aucune action n'est possible avec ce profil. » s'affiche et aucun bouton d'action n'est proposé. |
| 4 | Le conseiller tente de valider la commande directement auprès du serveur (sans passer par l'écran). | Le serveur refuse (accès interdit) avec le motif « Validation superviseur requise ». |
