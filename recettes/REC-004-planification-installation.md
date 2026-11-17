# REC-004 · Planification de l'installation d'une commande validée

| | |
| --- | --- |
| Processus | Back-office : organisation des interventions |
| Applications | CRM des conseillers |
| Profils | Conseiller, Lecture seule |
| Priorité | Haute : sans rendez-vous, pas d'installation ni de facturation |
| Automatisée | ❌ à automatiser |

## Objectif

Garantir qu'un conseiller peut planifier le rendez-vous d'installation d'une commande validée, que les règles de calendrier sont respectées et que l'action est tracée.

## Règles de gestion

- Seule une commande au statut « Validée » peut être planifiée.
- La date du rendez-vous est postérieure à aujourd'hui et ne peut pas être un dimanche.
- Deux créneaux sont proposés : « Matin (8h-12h) » et « Après-midi (14h-18h) ».
- Chaque planification est tracée dans l'historique avec son auteur.
- Le profil Lecture seule ne peut pas planifier.

## Pré-requis

Une commande au statut « Validée » : par exemple une commande Essentiel passée sur le site puis validée par un conseiller.

## Données de test

- Date du rendez-vous : le premier jour hors dimanche situé au moins 2 jours après aujourd'hui.
- Date interdite : le prochain dimanche.

## Étapes et résultats attendus

| # | Étape | Résultat attendu |
| --- | --- | --- |
| 1 | Le conseiller ouvre une commande validée. | Le statut est « Validée », le rendez-vous « Non planifié », et le bloc « Planifier l'installation » est proposé. |
| 2 | Il choisit la date du rendez-vous et le créneau « Matin (8h-12h) », puis clique sur « Confirmer la planification ». | Le message « Installation planifiée le JJ/MM/AAAA (Matin (8h-12h)). » s'affiche ; le statut devient « Installation planifiée » ; le rendez-vous affiche « JJ/MM/AAAA · Matin (8h-12h) » ; l'historique indique la planification et son auteur ; le bloc de planification n'est plus proposé. |
| 3 | Sur une autre commande validée, il choisit un dimanche et le créneau « Après-midi (14h-18h) ». | Le message « Aucune installation n'est possible le dimanche. » s'affiche et le statut reste « Validée ». |
| 4 | Un utilisateur Lecture seule ouvre une commande validée. | Le bloc de planification n'est pas proposé et le message « Accès en lecture seule : aucune action n'est possible avec ce profil. » s'affiche. |
