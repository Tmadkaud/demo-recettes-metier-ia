# REC-001 · Souscription en ligne puis validation dans le CRM

| | |
| --- | --- |
| Processus | Vente en ligne, puis traitement en back-office |
| Applications | Site public de souscription, CRM des conseillers |
| Profils | Client (site), Conseiller (CRM) |
| Priorité | Haute : parcours de vente principal |
| Automatisée | ✅ `tests/recettes/REC-001-souscription-et-validation.spec.ts` |

## Objectif

Garantir qu'une commande passée par un client sur le site arrive dans le CRM avec les bonnes informations et qu'un conseiller peut la valider.

## Données de test

- Offre Confort (39,90 € par mois) avec l'option « Caméra extérieure » (+5,00 € par mois).
- Un nouveau client fictif, civilité Madame (nom unique à chaque exécution).
- Date d'installation souhaitée : dans 7 jours, hors dimanche.

## Étapes et résultats attendus

| # | Étape | Résultat attendu |
| --- | --- | --- |
| 1 | Sur le site, le client clique sur « Choisir l'offre Confort » et coche l'option « Caméra extérieure ». | Le total mensuel affiché est 44,90 € et les frais d'installation 99,00 €. |
| 2 | Il renseigne ses coordonnées et son adresse, la date d'installation souhaitée, accepte les conditions générales de vente et clique sur « Valider ma commande ». | La page « Merci, votre commande est enregistrée » affiche un numéro de commande au format CP-AAAA-NNNNNN. |
| 3 | Le conseiller se connecte au CRM et recherche le client par son nom. | La commande apparaît avec le statut « Nouvelle ». Sa fiche affiche le nom du client, le total « 44,90 € / mois » et la date souhaitée. |
| 4 | Le conseiller clique sur « Valider la commande ». | Le message « Commande validée. » s'affiche, le statut devient « Validée » et l'historique indique « Commande validée par Claire Martin (Conseiller) ». |
