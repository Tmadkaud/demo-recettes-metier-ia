// Jeux de données de recette : clients fictifs et dates calculées par rapport au jour d'exécution.
import { randomUUID } from 'node:crypto';

export interface Client {
  civilite: 'Madame' | 'Monsieur';
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  logement: 'Maison' | 'Appartement';
}

// Chaque test crée son propre client (nom unique) : les tests restent indépendants et parallélisables.
export function clientDeTest(surcharges: Partial<Client> = {}): Client {
  const suffixe = randomUUID().slice(0, 6).toUpperCase();
  const nom = surcharges.nom ?? `Dupont-${suffixe}`;
  return {
    civilite: 'Monsieur',
    prenom: 'Jean',
    nom,
    email: `jean.${nom.toLowerCase()}@example.com`,
    telephone: '06 12 34 56 78',
    adresse: '5 rue de la Paix',
    codePostal: '31000',
    ville: 'Toulouse',
    logement: 'Maison',
    ...surcharges,
  };
}

export function jourIso(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mois}-${jour}`;
}

export function dansNJours(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() + jours);
  return jourIso(date);
}

// Premier jour ouvré (hors dimanche) au moins `joursMinimum` jours après aujourd'hui.
export function prochainJourHorsDimanche(joursMinimum: number): string {
  const date = new Date();
  date.setDate(date.getDate() + joursMinimum);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return jourIso(date);
}

export function prochainDimanche(joursMinimum = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + joursMinimum);
  while (date.getDay() !== 0) date.setDate(date.getDate() + 1);
  return jourIso(date);
}

// « 2026-11-25 » → « 25/11/2026 », le format affiché par l'application.
export function auFormatFrancais(isoJour: string): string {
  const [annee, mois, jour] = isoJour.split('-');
  return `${jour}/${mois}/${annee}`;
}
