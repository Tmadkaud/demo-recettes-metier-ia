// Tests unitaires des règles métier (niveau développeur), exécutés avec `npm run test:unitaires`.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  actionsPossibles,
  calculerMontants,
  formaterMontant,
  validerCommande,
  validerPlanification,
} from '../../app/public/commun/regles.mjs';

const AUJOURDHUI = '2026-11-17'; // un mardi

const commandeValide = {
  offre: 'confort',
  options: ['fumee'],
  civilite: 'Madame',
  prenom: 'Anne',
  nom: 'Durand',
  email: 'anne.durand@example.com',
  telephone: '+33 6 12 34 56 78',
  adresse: '1 rue du Port',
  codePostal: '13002',
  ville: 'Marseille',
  logement: 'maison',
  dateInstallation: '2026-11-20',
  cgvAcceptees: true,
};

describe('calculerMontants', () => {
  it('additionne offre et options', () => {
    assert.equal(calculerMontants({ offre: 'confort', options: ['fumee', 'camera-ext'] }).totalMensuel, 4790);
  });
  it("offre les frais d'installation avec le code BIENVENUE, quelle que soit la casse", () => {
    assert.deepEqual(calculerMontants({ offre: 'essentiel', codePromo: ' bienvenue ' }), {
      totalMensuel: 2990,
      fraisInstallation: 0,
      fraisOfferts: true,
    });
  });
});

describe('formaterMontant', () => {
  it('affiche des euros à la française', () => {
    assert.equal(formaterMontant(4490), '44,90 €');
    assert.equal(formaterMontant(123456), '1 234,56 €');
  });
});

describe('validerCommande', () => {
  it('accepte une commande complète', () => {
    assert.deepEqual(validerCommande(commandeValide, AUJOURDHUI), {});
  });
  it("refuse une installation à moins de 3 jours et le dimanche", () => {
    assert.match(validerCommande({ ...commandeValide, dateInstallation: '2026-11-19' }, AUJOURDHUI).dateInstallation, /au moins 3 jours/);
    assert.match(validerCommande({ ...commandeValide, dateInstallation: '2026-11-22' }, AUJOURDHUI).dateInstallation, /dimanche/);
  });
  it('signale chaque champ invalide', () => {
    const erreurs = validerCommande({ ...commandeValide, codePostal: '4400', email: 'x@', cgvAcceptees: false }, AUJOURDHUI);
    assert.deepEqual(Object.keys(erreurs).sort(), ['cgvAcceptees', 'codePostal', 'email']);
  });
});

describe('actionsPossibles', () => {
  const commande = (statut, totalMensuel) => ({ statut, totalMensuel });
  it('réserve au superviseur la validation au-delà de 60 € par mois', () => {
    assert.equal(actionsPossibles('conseiller', commande('nouvelle', 6490)).valider.autorisee, false);
    assert.equal(actionsPossibles('conseiller', commande('nouvelle', 5490)).valider.autorisee, true);
    assert.equal(actionsPossibles('superviseur', commande('nouvelle', 6490)).valider.autorisee, true);
  });
  it("n'autorise aucune action en lecture seule", () => {
    assert.deepEqual(actionsPossibles('lecture', commande('nouvelle', 2990)), {});
  });
  it("ne propose la planification qu'aux commandes validées", () => {
    assert.ok(actionsPossibles('conseiller', commande('validee', 2990)).planifier);
    assert.equal(actionsPossibles('conseiller', commande('nouvelle', 2990)).planifier, undefined);
  });
});

describe('validerPlanification', () => {
  it('exige une date future hors dimanche et un créneau connu', () => {
    assert.deepEqual(validerPlanification({ date: '2026-11-18', creneau: 'matin' }, AUJOURDHUI), {});
    assert.ok(validerPlanification({ date: AUJOURDHUI, creneau: 'matin' }, AUJOURDHUI).date);
    assert.ok(validerPlanification({ date: '2026-11-22', creneau: 'matin' }, AUJOURDHUI).date);
    assert.ok(validerPlanification({ date: '2026-11-18', creneau: 'soir' }, AUJOURDHUI).creneau);
  });
});
