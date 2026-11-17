// Profils de test du CRM. Les mots de passe viennent de variables d'environnement
// (secrets de la CI ou coffre de l'entreprise) ; les valeurs par défaut ne valent que pour la démo.

export type Role = 'conseiller' | 'superviseur' | 'lecture';

export interface Profil {
  identifiant: string;
  motDePasse: string;
  nom: string;
  role: Role;
  libelleRole: string;
}

export const PROFILS: Record<Role, Profil> = {
  conseiller: {
    identifiant: 'c.martin',
    motDePasse: process.env.CONTOSO_MDP_CONSEILLER || 'Conseiller-Demo-2026',
    nom: 'Claire Martin',
    role: 'conseiller',
    libelleRole: 'Conseiller',
  },
  superviseur: {
    identifiant: 's.benali',
    motDePasse: process.env.CONTOSO_MDP_SUPERVISEUR || 'Superviseur-Demo-2026',
    nom: 'Sami Benali',
    role: 'superviseur',
    libelleRole: 'Superviseur',
  },
  lecture: {
    identifiant: 'l.roux',
    motDePasse: process.env.CONTOSO_MDP_LECTURE || 'Lecture-Demo-2026',
    nom: 'Lina Roux',
    role: 'lecture',
    libelleRole: 'Lecture seule',
  },
};
