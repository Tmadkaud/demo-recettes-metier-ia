# REC-003 · Contrôles du formulaire de souscription

| | |
| --- | --- |
| Processus | Vente en ligne |
| Applications | Site public de souscription |
| Profils | Client |
| Priorité | Moyenne : qualité des données saisies |
| Automatisée | ✅ `tests/recettes/REC-003-controles-du-formulaire.spec.ts` |

## Objectif

Garantir que le formulaire refuse les saisies invalides avec un message clair et calcule correctement les montants.

## Règles de gestion

- Code postal : 5 chiffres. E-mail et téléphone au format valide.
- Date d'installation : au moins 3 jours après aujourd'hui, jamais un dimanche.
- Les conditions générales de vente doivent être acceptées.
- Total mensuel = prix de l'offre + prix des options, recalculé à chaque changement.
- Le code promo BIENVENUE offre les frais d'installation (99,00 €).

## Données de test (cas invalides)

| Champ | Valeur saisie | Message attendu |
| --- | --- | --- |
| Code postal | 4400 | Le code postal doit comporter 5 chiffres. |
| Adresse e-mail | jean.dupont@ | Adresse e-mail invalide. |
| Téléphone | 06 12 | Numéro de téléphone invalide. |
| Date d'installation souhaitée | demain | La date d'installation doit être au moins 3 jours après aujourd'hui. |
| Date d'installation souhaitée | un dimanche | Aucune installation n'est possible le dimanche. |
| Conditions générales de vente | non cochées | Vous devez accepter les conditions générales de vente. |

## Étapes et résultats attendus

| # | Étape | Résultat attendu |
| --- | --- | --- |
| 1 | Pour chaque cas invalide : remplir un formulaire correct, saisir la valeur invalide et cliquer sur « Valider ma commande ». | Le message attendu s'affiche sous le champ, le résumé indique « Le formulaire contient 1 erreur. » et la commande n'est pas enregistrée. |
| 2 | Choisir l'offre Confort puis cocher « Détecteur de fumée connecté » et « Caméra extérieure ». | Le total mensuel passe de 29,90 € (Essentiel) à 47,90 €. |
| 3 | Saisir le code promo « bienvenue ». | Les frais d'installation passent de 99,00 € à 0,00 € avec la mention « (offerts avec le code BIENVENUE) ». |
