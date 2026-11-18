// Tests des garde-fous de la recette (scripts/garde-fous.mjs et scripts/garde-assertions.mjs).
import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { analyserDiff } from '../../scripts/garde-assertions.mjs';
import { analyserFichierTest, analyserLockfile, analyserTracabilite, verifierDepot } from '../../scripts/garde-fous.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const regles = (constats) => constats.map((c) => c.regle).sort();

describe('garde-fous : fichiers de test', () => {
  it('signale attente fixe, sélecteur CSS, .only, mot de passe, date en dur et délai allongé', () => {
    const contenu = [
      "test.only('cas', async ({ page }) => {",
      '  await page.waitForTimeout(2000);',
      "  await page.locator('#valider').click();",
      "  await connexion({ motDePasse: 'secret' });",
      "  await choisirDate('2026-12-01');",
      "  await expect(message).toBeVisible({ timeout: 30000 });",
      '});',
    ].join('\n');
    assert.deepEqual(regles(analyserFichierTest('tests/recettes/REC-009-exemple.spec.ts', contenu)), [
      'attente-fixe',
      'date-en-dur',
      'mot-de-passe-en-dur',
      'selecteur-css',
      'test-isole',
      'tolerance-ajoutee',
    ]);
  });

  it('accepte un cas sauté ou en anomalie quand la raison est écrite juste au-dessus', () => {
    const conforme = ['// Raison : environnement de paiement indisponible jusqu’au 30/11', "test.skip('paiement', async () => {});", '// Anomalie : attendu « Validée », obtenu « Nouvelle », issue #12', 'test.fail();'].join('\n');
    assert.deepEqual(analyserFichierTest('tests/recettes/REC-009-exemple.spec.ts', conforme), []);
    const sansRaison = ["test.skip('paiement', async () => {});", 'test.fail();'].join('\n');
    assert.deepEqual(regles(analyserFichierTest('tests/recettes/REC-009-exemple.spec.ts', sansRaison)), ['anomalie-sans-motif', 'saut-sans-raison']);
  });

  it('ignore les commentaires et autorise le mot de passe de démonstration dans les profils', () => {
    assert.deepEqual(analyserFichierTest('tests/recettes/REC-009-exemple.spec.ts', '// jamais de waitForTimeout ni de page.locator(…)'), []);
    assert.deepEqual(analyserFichierTest('tests/donnees/profils.ts', "motDePasse: process.env.X || 'Conseiller-Demo-2026',"), []);
  });

  it('écrit chaque message pour qu’un agent sache corriger', async () => {
    const { REGLES } = await import('../../scripts/garde-fous.mjs');
    for (const [identifiant, regle] of Object.entries(REGLES)) {
      assert.ok(regle.probleme && regle.pourquoi && regle.corriger, `règle ${identifiant} incomplète`);
    }
  });
});

describe('garde-fous : traçabilité fiche ↔ test', () => {
  const fiche = (statut) => ({ chemin: 'recettes/REC-004-planification.md', contenu: `# REC-004\n\n| Automatisée | ${statut} |\n` });
  const spec = { chemin: 'tests/recettes/REC-004-planification.spec.ts', contenu: '// Recette REC-004 : voir recettes/REC-004-planification.md\n' };

  it('accepte une fiche automatisée qui désigne son test', () => {
    assert.deepEqual(analyserTracabilite([fiche('✅ `tests/recettes/REC-004-planification.spec.ts`')], [spec]), []);
    assert.deepEqual(analyserTracabilite([fiche('❌ à automatiser')], []), []);
  });

  it('demande de mettre la fiche à jour quand le test vient d’être écrit', () => {
    const [constat] = analyserTracabilite([fiche('❌ à automatiser')], [spec]);
    assert.equal(constat.regle, 'tracabilite');
    assert.match(constat.extrait, /mets-la à « ✅/);
  });

  it('signale un test sans en-tête et une fiche « ✅ » sans test', () => {
    const sansEntete = { chemin: 'tests/recettes/REC-004-planification.spec.ts', contenu: "import { test } from '@playwright/test';\n" };
    assert.equal(analyserTracabilite([fiche('❌ à automatiser')], [sansEntete]).length, 1);
    assert.equal(analyserTracabilite([fiche('✅ `tests/recettes/REC-004-planification.spec.ts`')], []).length, 1);
  });
});

describe('garde-fous : registre public', () => {
  it('refuse un fichier de verrouillage qui pointe vers un registre privé', () => {
    const verrou = ['"resolved": "https://registry.npmjs.org/a/-/a-1.0.0.tgz",', '"resolved": "https://miroir.exemple.local/npm/b/-/b-1.0.0.tgz",'].join('\n');
    const constats = analyserLockfile(verrou);
    assert.equal(constats.length, 1);
    assert.equal(constats[0].ligne, 2);
  });
});

describe('garde-fous : le dépôt respecte ses propres règles', () => {
  it('ne trouve aucun problème dans ce dépôt', () => {
    const { constats } = verifierDepot(RACINE);
    assert.deepEqual(constats, []);
  });
});

describe('garde-assertions : une vérification ne disparaît pas sans sa fiche', () => {
  const diff = (fiches = '') =>
    [
      'diff --git a/tests/recettes/REC-002-droits.spec.ts b/tests/recettes/REC-002-droits.spec.ts',
      '--- a/tests/recettes/REC-002-droits.spec.ts',
      '+++ b/tests/recettes/REC-002-droits.spec.ts',
      '@@ -27 +27 @@',
      '-      await expect(crm.boutonValider).toBeDisabled();',
      '+      await expect(crm.boutonValider).toBeEnabled();',
      fiches,
    ].join('\n');

  it('refuse une assertion modifiée sans mise à jour de la fiche', () => {
    const { constats } = analyserDiff(diff());
    assert.equal(constats.length, 1);
    assert.equal(constats[0].identifiant, 'REC-002');
    assert.equal(constats[0].ligne, 27);
  });

  it('accepte la modification quand la fiche change dans la même PR, à confirmer en revue', () => {
    const fiche = ['--- a/recettes/REC-002-droits.md', '+++ b/recettes/REC-002-droits.md', '@@ -20 +20 @@', '-| 1 | … | grisé |', '+| 1 | … | actif |'].join('\n');
    const { constats, autorisees } = analyserDiff(diff(fiche));
    assert.deepEqual(constats, []);
    assert.equal(autorisees.length, 1);
  });

  it('accepte une assertion simplement déplacée et ignore les autres lignes', () => {
    const deplacement = [
      '--- a/tests/recettes/REC-001-a.spec.ts',
      '+++ b/tests/recettes/REC-001-a.spec.ts',
      '@@ -10 +0,0 @@',
      "-    await expect(crm.statut).toHaveText('Validée');",
      '@@ -20,0 +20 @@',
      "+    await expect(crm.statut).toHaveText('Validée');",
      '@@ -30 +30 @@',
      '-    const client = clientDeTest();',
      "+    const client = clientDeTest({ prenom: 'Léa' });",
    ].join('\n');
    assert.deepEqual(analyserDiff(deplacement).constats, []);
  });

  it('refuse la suppression d’un fichier de test entier sans sa fiche', () => {
    const suppression = ['--- a/tests/recettes/REC-003-controles.spec.ts', '+++ /dev/null', '@@ -1,3 +0,0 @@', '-// Recette REC-003', "-test('cas', async () => {", '-  await expect(a).toBeVisible();'].join('\n');
    assert.equal(analyserDiff(suppression).constats.length, 2);
  });
});
