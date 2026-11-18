// Génère le procès-verbal (PV) de recette en français à partir du rapport JSON de Playwright.
// Usage : node scripts/pv-recette.mjs [rapports/resultats.json]
// Écrit rapports/pv-recette.md et affiche le PV (utilisé pour le résumé du job GitHub Actions).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { lireStatutFiche } from './garde-fous.mjs';

const fichierResultats = process.argv[2] ?? 'rapports/resultats.json';
const fichierPv = path.join(path.dirname(fichierResultats), 'pv-recette.md');

if (!existsSync(fichierResultats)) {
  console.error(`Aucun résultat trouvé (${fichierResultats}). Lancez d'abord la recette : npx playwright test`);
  process.exit(1);
}

const rapport = JSON.parse(readFileSync(fichierResultats, 'utf8'));

const VERDICTS = {
  conforme: { icone: '✅', libelle: 'Conforme' },
  nonConforme: { icone: '❌', libelle: 'Non conforme' },
  anomalieConnue: { icone: '❌', libelle: 'Non conforme (anomalie connue)' },
  instable: { icone: '⚠️', libelle: 'Conforme après relance (instable)' },
  aRevoir: { icone: '⚠️', libelle: "À revoir : l'anomalie connue ne se produit plus" },
  nonExecute: { icone: '⏭️', libelle: 'Non exécuté' },
};

const sansCouleurs = (texte = '') => texte.replace(/\u001b\[[0-9;]*m/g, '');
const duree = (ms) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
const echapper = (texte) => texte.replace(/\|/g, '\\|');
const cheminLisible = (chemin) => path.relative(process.cwd(), chemin).split(path.sep).join('/');

function verdict(test) {
  const attenduEnEchec = test.expectedStatus === 'failed';
  if (test.status === 'skipped') return VERDICTS.nonExecute;
  if (test.status === 'flaky') return VERDICTS.instable;
  if (attenduEnEchec) return test.status === 'expected' ? VERDICTS.anomalieConnue : VERDICTS.aRevoir;
  return test.status === 'expected' ? VERDICTS.conforme : VERDICTS.nonConforme;
}

// Aplatit l'arborescence : fichier > describe (le scénario REC-XXX) > describe imbriqués > tests.
function collecterCas(suite, scenario, prefixe, cas) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      cas.push({ scenario, titre: [...prefixe, spec.title].join(' › '), test });
    }
  }
  for (const sousSuite of suite.suites ?? []) {
    if (!scenario) collecterCas(sousSuite, sousSuite.title, [], cas);
    else collecterCas(sousSuite, scenario, [...prefixe, sousSuite.title], cas);
  }
}

const cas = [];
for (const fichier of rapport.suites ?? []) collecterCas(fichier, null, [], cas);
for (const element of cas) {
  element.scenario ??= 'Hors scénario';
  element.verdict = verdict(element.test);
}

const compter = (liste, ...verdicts) => liste.filter((c) => verdicts.includes(c.verdict)).length;
const nonConformes = compter(cas, VERDICTS.nonConforme, VERDICTS.anomalieConnue);
const conformes = compter(cas, VERDICTS.conforme, VERDICTS.instable);
const nonExecutes = compter(cas, VERDICTS.nonExecute);
const aRevoir = compter(cas, VERDICTS.aRevoir);

const debut = new Date(rapport.stats?.startTime ?? Date.now());
const horodatage = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' }).format(debut);
const navigateurs = [...new Set(cas.map((c) => c.test.projectName))].join(', ') || 'non précisé';
const origine = process.env.GITHUB_RUN_ID
  ? `GitHub Actions, [exécution ${process.env.GITHUB_RUN_ID}](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}), commit \`${(process.env.GITHUB_SHA ?? '').slice(0, 7)}\``
  : 'poste local';

// Couverture de la recette : une mesure, pas une cible.
const fiches = existsSync('recettes')
  ? readdirSync('recettes')
      .filter((nom) => /^REC-\d{3}-.+\.md$/.test(nom))
      .map((nom) => ({ identifiant: nom.slice(0, 7), ...lireStatutFiche(readFileSync(path.join('recettes', nom), 'utf8')) }))
  : [];
const automatisees = fiches.filter((f) => f.automatisee);
const aAutomatiser = fiches.filter((f) => !f.automatisee).map((f) => f.identifiant);
const couverture = fiches.length
  ? `${automatisees.length} sur ${fiches.length} (${Math.round((100 * automatisees.length) / fiches.length)} %)${aAutomatiser.length ? `, à automatiser : ${aAutomatiser.join(', ')}` : ''}`
  : 'non mesurée';

const lignes = [];
lignes.push('# Procès-verbal de recette automatisée', '');
lignes.push('| | |', '| --- | --- |');
lignes.push('| Application | Contoso Protect (démo) : site de souscription et CRM |');
lignes.push(`| Exécution | ${horodatage} (heure de Paris), durée ${duree(rapport.stats?.duration ?? 0)} |`);
lignes.push(`| Navigateur | ${navigateurs} |`);
lignes.push(`| Fiches automatisées | ${couverture} |`);
lignes.push(`| Origine | ${origine} |`, '');

if (cas.length === 0) {
  lignes.push('## Verdict : ⏭️ aucun cas exécuté', '');
} else if (nonConformes > 0) {
  lignes.push(`## Verdict : ❌ NON CONFORME (${nonConformes} cas non conforme${nonConformes > 1 ? 's' : ''} sur ${cas.length})`, '');
} else {
  lignes.push(`## Verdict : ✅ CONFORME (${conformes} cas conforme${conformes > 1 ? 's' : ''} sur ${cas.length})`, '');
}
if (aRevoir > 0) lignes.push(`> ⚠️ ${aRevoir} cas marqué${aRevoir > 1 ? 's' : ''} « anomalie connue » passe${aRevoir > 1 ? 'nt' : ''} désormais : vérifiez la correction et retirez le marquage.`, '');
if (nonExecutes > 0) lignes.push(`> ⏭️ ${nonExecutes} cas non exécuté${nonExecutes > 1 ? 's' : ''}.`, '');
for (const erreur of rapport.errors ?? []) lignes.push(`> ❌ Erreur hors test : ${sansCouleurs(erreur.message).split('\n')[0]}`, '');

lignes.push('## Synthèse par scénario', '');
lignes.push('| Scénario | Cas | ✅ Conformes | ❌ Non conformes | ⏭️ Non exécutés |', '| --- | ---: | ---: | ---: | ---: |');
const scenarios = [...new Set(cas.map((c) => c.scenario))].sort();
for (const scenario of scenarios) {
  const duScenario = cas.filter((c) => c.scenario === scenario);
  lignes.push(
    `| ${echapper(scenario)} | ${duScenario.length} | ${compter(duScenario, VERDICTS.conforme, VERDICTS.instable)} | ${compter(duScenario, VERDICTS.nonConforme, VERDICTS.anomalieConnue)} | ${compter(duScenario, VERDICTS.nonExecute)} |`,
  );
}
lignes.push('');

lignes.push('## Détail des cas', '');
for (const scenario of scenarios) {
  lignes.push(`### ${scenario}`, '');
  for (const { titre, test, verdict: v } of cas.filter((c) => c.scenario === scenario)) {
    const resultat = test.results.at(-1) ?? { duration: 0, steps: [], errors: [], attachments: [] };
    lignes.push(`- ${v.icone} **${titre}** : ${v.libelle} (${duree(resultat.duration)})`);
    resultat.steps?.forEach((etape, index) => {
      lignes.push(`  ${index + 1}. ${etape.error ? '❌' : '✅'} ${etape.title}`);
    });
    const enEchec = test.results.find((r) => r.status !== 'passed' && r.status !== 'skipped');
    if (enEchec && v !== VERDICTS.conforme) {
      const message = sansCouleurs(enEchec.errors?.[0]?.message ?? '').trim().split('\n');
      const finUtile = message.findIndex((ligne) => ligne.startsWith('Call log'));
      const extrait = message.slice(0, finUtile === -1 ? 8 : Math.min(finUtile, 8)).filter((l, i, t) => l.trim() || i < t.length - 1);
      if (extrait.length && extrait[0]) {
        lignes.push('', '  ```text', ...extrait.map((l) => `  ${l}`), '  ```');
      }
      const preuves = (enEchec.attachments ?? []).filter((a) => a.path);
      if (preuves.length) {
        const NOMS_PREUVES = { screenshot: "capture d'écran", video: 'vidéo', trace: 'trace', 'error-context': "contexte de l'erreur" };
        if (process.env.GITHUB_ACTIONS) {
          const noms = [...new Set(preuves.map((a) => NOMS_PREUVES[a.name] ?? a.name))].join(', ');
          lignes.push(`  Preuves : ${noms}, dans le rapport HTML de l’artefact « recette-${process.env.GITHUB_RUN_NUMBER ?? ''} ».`);
        } else {
          lignes.push(`  Preuves : ${preuves.map((a) => `${NOMS_PREUVES[a.name] ?? a.name} \`${cheminLisible(a.path)}\``).join(', ')}`);
          if (preuves.some((a) => a.name === 'trace')) lignes.push('  (ouvrir une trace : `npx playwright show-trace <chemin>`)');
        }
      }
      lignes.push('');
    }
  }
  lignes.push('');
}

lignes.push('---', '');
lignes.push(
  "PV généré par `scripts/pv-recette.mjs` à partir de `" + fichierResultats.split(path.sep).join('/') + "`. Un cas est conforme quand tous les résultats attendus de sa fiche de recette (dossier `recettes/`) ont été vérifiés par le test automatisé.",
);

const pv = lignes.join('\n') + '\n';
mkdirSync(path.dirname(fichierPv), { recursive: true });
writeFileSync(fichierPv, pv, 'utf8');
process.stdout.write(pv);
