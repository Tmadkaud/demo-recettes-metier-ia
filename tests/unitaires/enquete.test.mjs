// Tests de l’enquête « la preuve d’abord » (scripts/enquete.mjs), sans exécuter de navigateur.
import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { comparer, conclure, formaterEnquete, listerTests } from '../../scripts/enquete.mjs';

const RACINE = path.resolve('/depot');
const rapport = (statuts) => ({
  config: { rootDir: path.join(RACINE, 'tests', 'recettes') },
  suites: [
    {
      title: 'REC-002-droits.spec.ts',
      file: 'REC-002-droits.spec.ts',
      specs: [],
      suites: [
        {
          title: 'REC-002 · Droits par profil',
          file: 'REC-002-droits.spec.ts',
          specs: Object.entries(statuts).map(([titre, statut]) => ({ title: titre, tests: [{ projectName: 'chromium', status: statut }] })),
        },
      ],
    },
  ],
});

describe('enquête : lecture des rapports Playwright', () => {
  it('liste chaque test avec son fichier relatif au dépôt, ses titres et son statut', () => {
    const [test] = listerTests(rapport({ 'le conseiller ne peut pas valider': 'unexpected' }), RACINE);
    assert.deepEqual(test, {
      fichier: 'tests/recettes/REC-002-droits.spec.ts',
      titres: ['REC-002 · Droits par profil', 'le conseiller ne peut pas valider'],
      projet: 'chromium',
      statut: 'unexpected',
    });
  });
});

describe('enquête : verdict', () => {
  const echecs = listerTests(rapport({ 'cas A': 'unexpected', 'cas B': 'unexpected' }), RACINE);

  it('innocente la PR quand les tests échouent déjà sur la référence', () => {
    const comparaisons = comparer(echecs, listerTests(rapport({ 'cas A': 'unexpected', 'cas B': 'unexpected' }), RACINE));
    assert.equal(conclure(comparaisons).code, 'reference');
  });

  it('désigne la PR quand les tests passent sur la référence', () => {
    const comparaisons = comparer(echecs, listerTests(rapport({ 'cas A': 'expected', 'cas B': 'flaky' }), RACINE));
    assert.equal(conclure(comparaisons).code, 'pr');
    assert.match(conclure(comparaisons).texte, /jamais l’assertion/);
  });

  it('signale un test nouveau et un verdict mixte', () => {
    const comparaisons = comparer(echecs, listerTests(rapport({ 'cas A': 'unexpected' }), RACINE));
    assert.deepEqual(comparaisons.map((c) => c.verdict), ['reference', 'nouveau']);
    assert.equal(conclure(comparaisons).code, 'mixte');
  });

  it('produit une preuve lisible à joindre à la PR', () => {
    const comparaisons = comparer(echecs, listerTests(rapport({ 'cas A': 'expected', 'cas B': 'expected' }), RACINE));
    const texte = formaterEnquete({ reference: 'origin/main', sha: '0123456789abcdef', comparaisons, conclusion: conclure(comparaisons) });
    assert.match(texte, /Référence : `origin\/main` \(`0123456`\)/);
    assert.match(texte, /\| REC-002 · Droits par profil › cas A \| chromium \| ✅ passe sur la référence \|/);
    assert.match(texte, /\*\*Verdict : ❌ la PR introduit la régression\.\*\* Ces tests passent sur la référence/);
  });
});
