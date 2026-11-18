// Règles métier de Contoso Protect (entreprise fictive), partagées par le serveur et le navigateur.
// Les montants sont en centimes pour éviter les erreurs d'arrondi.

export const OFFRES = [
  {
    code: 'essentiel',
    nom: 'Essentiel',
    prixMensuel: 2990,
    description: 'Alarme connectée et télésurveillance 24h/24, 7j/7.',
  },
  {
    code: 'confort',
    nom: 'Confort',
    prixMensuel: 3990,
    description: 'Essentiel + 2 caméras intérieures et levée de doute vidéo.',
  },
  {
    code: 'premium',
    nom: 'Premium',
    prixMensuel: 4990,
    description: "Confort + intervention d'un agent sur place et détecteurs de fumée.",
  },
];

export const OPTIONS = [
  { code: 'fumee', nom: 'Détecteur de fumée connecté', prixMensuel: 300 },
  { code: 'camera-ext', nom: 'Caméra extérieure', prixMensuel: 500 },
  { code: 'badges', nom: 'Deux badges supplémentaires', prixMensuel: 150 },
];

export const FRAIS_INSTALLATION = 9900;
export const CODE_PROMO_FRAIS_OFFERTS = 'BIENVENUE';

// Au-delà de ce total mensuel, seul un superviseur peut valider la commande.
export const SEUIL_VALIDATION_SUPERVISEUR = 6000;
export const DELAI_MINIMUM_INSTALLATION_JOURS = 3;

export const STATUTS = {
  nouvelle: 'Nouvelle',
  validee: 'Validée',
  'installation-planifiee': 'Installation planifiée',
  refusee: 'Refusée',
};

export const CRENEAUX = {
  matin: 'Matin (8h-12h)',
  'apres-midi': 'Après-midi (14h-18h)',
};

export const ROLES = {
  conseiller: 'Conseiller',
  superviseur: 'Superviseur',
  lecture: 'Lecture seule',
};

export function formaterMontant(centimes) {
  const euros = Math.floor(Math.abs(centimes) / 100);
  const reste = String(Math.abs(centimes) % 100).padStart(2, '0');
  const milliers = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${centimes < 0 ? '-' : ''}${milliers},${reste} €`;
}

export function formaterDate(isoJour) {
  const [annee, mois, jour] = isoJour.split('-');
  return `${jour}/${mois}/${annee}`;
}

export function aujourdhuiIso(maintenant = new Date()) {
  return versIso(maintenant);
}

export function ajouterJours(isoJour, jours) {
  const [annee, mois, jour] = isoJour.split('-').map(Number);
  return versIso(new Date(annee, mois - 1, jour + jours));
}

export function estUnDimanche(isoJour) {
  const [annee, mois, jour] = isoJour.split('-').map(Number);
  return new Date(annee, mois - 1, jour).getDay() === 0;
}

function versIso(date) {
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mois}-${jour}`;
}

export function calculerMontants({ offre, options = [], codePromo = '' }) {
  const offreChoisie = OFFRES.find((o) => o.code === offre);
  const totalOptions = OPTIONS.filter((o) => options.includes(o.code)).reduce((somme, o) => somme + o.prixMensuel, 0);
  const fraisOfferts = String(codePromo).trim().toUpperCase() === CODE_PROMO_FRAIS_OFFERTS;
  return {
    totalMensuel: (offreChoisie ? offreChoisie.prixMensuel : 0) + totalOptions,
    fraisInstallation: fraisOfferts ? 0 : FRAIS_INSTALLATION,
    fraisOfferts,
  };
}

const MOTIF_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOTIF_TELEPHONE = /^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/;
const MOTIF_CODE_POSTAL = /^\d{5}$/;
const MOTIF_JOUR = /^\d{4}-\d{2}-\d{2}$/;

// Renvoie un objet { champ: message } ; vide si la commande est valide.
export function validerCommande(commande, aujourdhui = aujourdhuiIso()) {
  const erreurs = {};
  const texte = (valeur) => (typeof valeur === 'string' ? valeur.trim() : '');

  if (!OFFRES.some((o) => o.code === commande.offre)) erreurs.offre = 'Choisissez une offre.';
  const options = commande.options ?? [];
  if (!Array.isArray(options) || options.some((code) => !OPTIONS.some((o) => o.code === code))) {
    erreurs.options = 'Option inconnue.';
  }
  if (!['Madame', 'Monsieur'].includes(commande.civilite)) erreurs.civilite = 'Choisissez une civilité.';
  if (!texte(commande.prenom)) erreurs.prenom = 'Le prénom est obligatoire.';
  if (!texte(commande.nom)) erreurs.nom = 'Le nom est obligatoire.';
  if (!MOTIF_EMAIL.test(texte(commande.email))) erreurs.email = 'Adresse e-mail invalide.';
  if (!MOTIF_TELEPHONE.test(texte(commande.telephone))) erreurs.telephone = 'Numéro de téléphone invalide.';
  if (!texte(commande.adresse)) erreurs.adresse = "L'adresse est obligatoire.";
  if (!MOTIF_CODE_POSTAL.test(texte(commande.codePostal))) erreurs.codePostal = 'Le code postal doit comporter 5 chiffres.';
  if (!texte(commande.ville)) erreurs.ville = 'La ville est obligatoire.';
  if (!['maison', 'appartement'].includes(commande.logement)) erreurs.logement = 'Choisissez un type de logement.';

  const date = texte(commande.dateInstallation);
  if (!MOTIF_JOUR.test(date)) {
    erreurs.dateInstallation = "Indiquez une date d'installation.";
  } else if (date < ajouterJours(aujourdhui, DELAI_MINIMUM_INSTALLATION_JOURS)) {
    erreurs.dateInstallation = `La date d'installation doit être au moins ${DELAI_MINIMUM_INSTALLATION_JOURS} jours après aujourd'hui.`;
  } else if (estUnDimanche(date)) {
    erreurs.dateInstallation = "Aucune installation n'est possible le dimanche.";
  }

  if (commande.cgvAcceptees !== true) erreurs.cgvAcceptees = 'Vous devez accepter les conditions générales de vente.';
  return erreurs;
}

// Actions possibles dans le CRM pour un rôle et une commande donnés.
// Chaque action vaut { autorisee: boolean, raison?: string } ; absente si elle n'a pas de sens.
export function actionsPossibles(role, commande, seuilSuperviseur = SEUIL_VALIDATION_SUPERVISEUR) {
  if (role === 'lecture') return {};
  const actions = {};
  if (commande.statut === 'nouvelle') {
    const reserveeAuSuperviseur = commande.totalMensuel > seuilSuperviseur && role !== 'superviseur';
    actions.valider = reserveeAuSuperviseur
      ? {
          autorisee: false,
          raison: `Validation superviseur requise (total mensuel supérieur à ${formaterMontant(seuilSuperviseur)}).`,
        }
      : { autorisee: true };
    actions.refuser = { autorisee: true };
  }
  if (commande.statut === 'validee') actions.planifier = { autorisee: true };
  return actions;
}

export function validerPlanification({ date, creneau }, aujourdhui = aujourdhuiIso()) {
  const erreurs = {};
  if (typeof date !== 'string' || !MOTIF_JOUR.test(date)) {
    erreurs.date = 'Indiquez une date.';
  } else if (date <= aujourdhui) {
    erreurs.date = "La date doit être postérieure à aujourd'hui.";
  } else if (estUnDimanche(date)) {
    erreurs.date = "Aucune installation n'est possible le dimanche.";
  }
  if (!Object.hasOwn(CRENEAUX, creneau)) erreurs.creneau = 'Choisissez un créneau.';
  return erreurs;
}
