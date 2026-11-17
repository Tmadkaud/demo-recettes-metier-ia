// Données en mémoire de la démo : comptes du CRM et commandes. Tout est fictif.
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { ajouterJours, aujourdhuiIso, calculerMontants, CRENEAUX, formaterDate } from './public/commun/regles.mjs';

// Les mots de passe se règlent par variables d'environnement ; les valeurs par défaut ne valent que pour la démo.
export const UTILISATEURS = [
  { identifiant: 'c.martin', nom: 'Claire Martin', role: 'conseiller', variable: 'CONTOSO_MDP_CONSEILLER', motDePasseDemo: 'Conseiller-Demo-2026' },
  { identifiant: 's.benali', nom: 'Sami Benali', role: 'superviseur', variable: 'CONTOSO_MDP_SUPERVISEUR', motDePasseDemo: 'Superviseur-Demo-2026' },
  { identifiant: 'l.roux', nom: 'Lina Roux', role: 'lecture', variable: 'CONTOSO_MDP_LECTURE', motDePasseDemo: 'Lecture-Demo-2026' },
];

export function authentifier(identifiant, motDePasse) {
  const utilisateur = UTILISATEURS.find((u) => u.identifiant === identifiant);
  if (!utilisateur || typeof motDePasse !== 'string') return null;
  const attendu = Buffer.from(process.env[utilisateur.variable] || utilisateur.motDePasseDemo);
  const fourni = Buffer.from(motDePasse);
  if (attendu.length !== fourni.length || !timingSafeEqual(attendu, fourni)) return null;
  return { identifiant: utilisateur.identifiant, nom: utilisateur.nom, role: utilisateur.role };
}

export function creerSessions() {
  const sessions = new Map();
  return {
    ouvrir(utilisateur) {
      const jeton = randomBytes(24).toString('hex');
      sessions.set(jeton, utilisateur);
      return jeton;
    },
    lire: (jeton) => (jeton ? sessions.get(jeton) ?? null : null),
    fermer: (jeton) => sessions.delete(jeton),
  };
}

const CLIENTS_INITIAUX = [
  {
    civilite: 'Madame', prenom: 'Élodie', nom: 'Garnier', email: 'elodie.garnier@example.com', telephone: '06 12 34 56 78',
    adresse: '12 rue des Lilas', codePostal: '69003', ville: 'Lyon', logement: 'appartement',
    offre: 'essentiel', options: [], statut: 'nouvelle', recueIlYa: 1,
  },
  {
    civilite: 'Monsieur', prenom: 'Karim', nom: 'Haddad', email: 'karim.haddad@example.com', telephone: '03 20 00 11 22',
    adresse: '3 place du Marché', codePostal: '59000', ville: 'Lille', logement: 'maison',
    offre: 'premium', options: ['camera-ext'], statut: 'nouvelle', recueIlYa: 1,
  },
  {
    civilite: 'Madame', prenom: 'Sophie', nom: 'Lambert', email: 'sophie.lambert@example.com', telephone: '05 56 22 33 44',
    adresse: "8 cours de l'Intendance", codePostal: '33000', ville: 'Bordeaux', logement: 'maison',
    offre: 'confort', options: ['fumee'], statut: 'validee', recueIlYa: 3,
  },
  {
    civilite: 'Monsieur', prenom: 'Julien', nom: 'Morel', email: 'julien.morel@example.com', telephone: '07 55 66 77 88',
    adresse: '21 quai des Bateliers', codePostal: '67000', ville: 'Strasbourg', logement: 'appartement',
    offre: 'essentiel', options: ['badges'], statut: 'installation-planifiee', recueIlYa: 6,
  },
];

export function creerMagasin() {
  let commandes = [];
  let sequence = 100;

  function numeroSuivant() {
    sequence += 1;
    return `CP-${new Date().getFullYear()}-${String(sequence).padStart(6, '0')}`;
  }

  function enregistrer(donnees, { creeLe, par = 'Site web' } = {}) {
    const montants = calculerMontants(donnees);
    const commande = {
      numero: numeroSuivant(),
      creeLe: creeLe ?? new Date().toISOString(),
      statut: 'nouvelle',
      offre: donnees.offre,
      options: [...(donnees.options ?? [])],
      civilite: donnees.civilite,
      prenom: donnees.prenom.trim(),
      nom: donnees.nom.trim(),
      email: donnees.email.trim(),
      telephone: donnees.telephone.trim(),
      adresse: donnees.adresse.trim(),
      codePostal: donnees.codePostal.trim(),
      ville: donnees.ville.trim(),
      logement: donnees.logement,
      dateInstallation: donnees.dateInstallation,
      codePromo: (donnees.codePromo ?? '').trim().toUpperCase(),
      totalMensuel: montants.totalMensuel,
      fraisInstallation: montants.fraisInstallation,
      installation: null,
      motifRefus: null,
      historique: [{ le: creeLe ?? new Date().toISOString(), par, action: 'Commande passée sur le site' }],
    };
    commandes.push(commande);
    return commande;
  }

  function reinitialiser() {
    commandes = [];
    sequence = 100;
    const aujourdhui = aujourdhuiIso();
    for (const client of CLIENTS_INITIAUX) {
      const { statut, recueIlYa, ...donnees } = client;
      const creeLe = new Date(Date.now() - recueIlYa * 86_400_000).toISOString();
      const commande = enregistrer({ ...donnees, dateInstallation: ajouterJours(aujourdhui, 10) }, { creeLe });
      if (statut !== 'nouvelle') {
        commande.statut = 'validee';
        commande.historique.push({ le: creeLe, par: 'Claire Martin (Conseiller)', action: 'Commande validée' });
      }
      if (statut === 'installation-planifiee') {
        commande.statut = 'installation-planifiee';
        commande.installation = { date: ajouterJours(aujourdhui, 4), creneau: 'matin' };
        commande.historique.push({
          le: creeLe,
          par: 'Claire Martin (Conseiller)',
          action: `Installation planifiée le ${formaterDate(commande.installation.date)} (${CRENEAUX.matin})`,
        });
      }
    }
  }

  function rechercher({ recherche = '', statut = '' } = {}) {
    const terme = recherche.trim().toLowerCase();
    return commandes
      .filter((c) => !statut || c.statut === statut)
      .filter((c) => !terme || [c.numero, c.prenom, c.nom, `${c.prenom} ${c.nom}`, c.ville].some((v) => v.toLowerCase().includes(terme)))
      .sort((a, b) => b.creeLe.localeCompare(a.creeLe) || b.numero.localeCompare(a.numero));
  }

  reinitialiser();
  return {
    enregistrer,
    reinitialiser,
    rechercher,
    trouver: (numero) => commandes.find((c) => c.numero === numero) ?? null,
  };
}
