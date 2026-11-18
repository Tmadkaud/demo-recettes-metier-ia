// L’agent enquêteur : la preuve d’abord (npm run enquete [-- --base origin/main] [-- --rapport rapports/resultats.json]).
// Rejoue les tests en échec du dernier rapport sur la référence, dans une copie de travail temporaire,
// avec la même configuration et le même navigateur, puis dit si la PR est en cause.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = process.cwd();

// Aplatit un rapport JSON Playwright : [{ fichier, titres, projet, statut }].
// `fichier` est relatif à la racine du dépôt, avec des « / ».
export function listerTests(rapport, racine) {
  const resultat = [];
  const dossierTests = rapport.config?.rootDir ?? racine;
  const parcourir = (suite, titres, fichier) => {
    const fichierSuite = suite.file ? path.relative(racine, path.resolve(dossierTests, suite.file)).split(path.sep).join('/') : fichier;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        resultat.push({ fichier: fichierSuite, titres: [...titres, spec.title], projet: test.projectName, statut: test.status });
      }
    }
    for (const sousSuite of suite.suites ?? []) parcourir(sousSuite, [...titres, sousSuite.title], fichierSuite);
  };
  for (const suite of rapport.suites ?? []) parcourir(suite, [], null);
  return resultat;
}

const cle = (t) => `${t.fichier}::${t.titres.join(' › ')}::${t.projet}`;

// Compare les tests en échec de la PR à leurs résultats sur la référence.
export function comparer(echecs, testsReference) {
  const reference = new Map(testsReference.map((t) => [cle(t), t.statut]));
  return echecs.map((t) => {
    const statut = reference.get(cle(t));
    let verdict = 'nouveau';
    if (statut === 'unexpected') verdict = 'reference';
    else if (statut === 'expected' || statut === 'flaky') verdict = 'pr';
    else if (statut === 'skipped') verdict = 'indetermine';
    return { ...t, statutReference: statut ?? 'absent', verdict };
  });
}

export function conclure(comparaisons) {
  const n = (v) => comparaisons.filter((c) => c.verdict === v).length;
  if (comparaisons.length === 0) return { code: 'aucun', titre: 'rien à prouver', texte: 'Aucun test en échec dans le rapport.' };
  if (n('reference') === comparaisons.length) {
    return {
      code: 'reference',
      titre: '✅ la PR n’est pas en cause',
      texte:
        'Ces tests échouent déjà sur la référence, avec la même configuration et le même navigateur. Ne modifie pas la PR pour les faire passer ; signale la référence cassée (issue « Anomalie de recette ») et répare-la à part.',
    };
  }
  if (n('pr') === comparaisons.length) {
    return {
      code: 'pr',
      titre: '❌ la PR introduit la régression',
      texte: 'Ces tests passent sur la référence et échouent avec la PR. Corrige l’application, jamais l’assertion (ADR 0004).',
    };
  }
  return {
    code: 'mixte',
    titre: '⚠️ verdict mixte',
    texte: 'Traite chaque test selon sa ligne ci-dessus : référence cassée, régression de la PR ou test nouveau.',
  };
}

const LIBELLES = {
  reference: '❌ échoue aussi sur la référence',
  pr: '✅ passe sur la référence',
  nouveau: '➕ absent de la référence (test nouveau)',
  indetermine: '⏭️ non exécuté sur la référence',
};

export function formaterEnquete({ reference, sha, comparaisons, conclusion }) {
  const lignes = ['# Enquête sur les tests en échec', '', `Référence : \`${reference}\` (\`${sha.slice(0, 7)}\`), même configuration, même navigateur.`, ''];
  if (comparaisons.length > 0) {
    lignes.push('| Test en échec avec la PR | Navigateur | Sur la référence |', '| --- | --- | --- |');
    for (const c of comparaisons) {
      lignes.push(`| ${c.titres.join(' › ').replace(/\|/g, '\\|')} | ${c.projet} | ${LIBELLES[c.verdict]} |`);
    }
    lignes.push('');
  }
  lignes.push(`**Verdict : ${conclusion.titre}.** ${conclusion.texte}`, '');
  return lignes.join('\n');
}

const echapper = (texte) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function portLibre() {
  return new Promise((resoudre, rejeter) => {
    const serveur = net.createServer();
    serveur.unref();
    serveur.on('error', rejeter);
    serveur.listen(0, () => {
      const { port } = serveur.address();
      serveur.close(() => resoudre(port));
    });
  });
}

function lireOptions(argv) {
  const options = { base: 'origin/main', rapport: 'rapports/resultats.json' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--base') options.base = argv[++i];
    else if (argv[i] === '--rapport') options.rapport = argv[++i];
  }
  return options;
}

async function enqueter() {
  const options = lireOptions(process.argv.slice(2));
  const cheminRapport = path.resolve(RACINE, options.rapport);
  if (!existsSync(cheminRapport)) {
    console.error(`Rapport introuvable (${options.rapport}) : lance d’abord la recette avec « npx playwright test ».`);
    process.exit(2);
  }
  const echecs = listerTests(JSON.parse(readFileSync(cheminRapport, 'utf8')), RACINE).filter((t) => t.statut === 'unexpected');
  if (echecs.length === 0) {
    console.log('Aucun test en échec dans le dernier rapport : rien à prouver.');
    return;
  }

  let sha;
  try {
    sha = execFileSync('git', ['rev-parse', '--verify', `${options.base}^{commit}`], { encoding: 'utf8' }).trim();
  } catch {
    console.error(`Référence « ${options.base} » introuvable : récupère-la d’abord (git fetch origin main), puis relance.`);
    process.exit(2);
  }

  console.log(`Enquête : ${echecs.length} test(s) en échec, rejoué(s) sur ${options.base} (${sha.slice(0, 7)}).`);
  const copie = mkdtempSync(path.join(os.tmpdir(), 'enquete-recette-'));
  rmSync(copie, { recursive: true, force: true });
  try {
    execFileSync('git', ['worktree', 'add', '--detach', copie, sha], { stdio: 'ignore' });
    // Sous Windows, npm est un script .cmd : il faut un shell, et donc une commande sans arguments séparés.
    const installation =
      process.platform === 'win32'
        ? spawnSync('npm ci --no-audit --no-fund', { cwd: copie, shell: true, encoding: 'utf8' })
        : spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: copie, encoding: 'utf8' });
    if (installation.status !== 0) throw new Error(`npm ci a échoué sur la référence :\n${installation.stderr}`);

    const fichiers = [...new Set(echecs.map((t) => t.fichier))].filter((f) => existsSync(path.join(copie, f)));
    const testsReference = [];
    if (fichiers.length > 0) {
      const sortie = path.join(copie, 'enquete-resultats.json');
      const titres = [...new Set(echecs.map((t) => t.titres.at(-1)))].map(echapper).join('|');
      const projets = [...new Set(echecs.map((t) => t.projet))].map((p) => `--project=${p}`);
      const cli = path.join(copie, 'node_modules', '@playwright', 'test', 'cli.js');
      const execution = spawnSync(process.execPath, [cli, 'test', ...fichiers, '--reporter=json', `--grep=${titres}`, ...projets], {
        cwd: copie,
        encoding: 'utf8',
        maxBuffer: 200 * 1024 * 1024,
        env: { ...process.env, PORT: String(await portLibre()), PLAYWRIGHT_JSON_OUTPUT_NAME: sortie },
      });
      if (!existsSync(sortie)) throw new Error(`La recette n’a pas pu s’exécuter sur la référence :\n${execution.stderr || execution.stdout}`);
      testsReference.push(...listerTests(JSON.parse(readFileSync(sortie, 'utf8')), copie));
    }

    const comparaisons = comparer(echecs, testsReference);
    const conclusion = conclure(comparaisons);
    const texte = formaterEnquete({ reference: options.base, sha, comparaisons, conclusion });
    mkdirSync(path.join(RACINE, 'rapports'), { recursive: true });
    writeFileSync(path.join(RACINE, 'rapports', 'enquete.md'), texte, 'utf8');
    console.log(`\n${texte}`);
    console.log('Preuve enregistrée dans rapports/enquete.md : joins-la à la PR.');
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', copie], { stdio: 'ignore' });
    rmSync(copie, { recursive: true, force: true });
    spawnSync('git', ['worktree', 'prune'], { stdio: 'ignore' });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  enqueter().catch((erreur) => {
    console.error(erreur.message);
    process.exit(1);
  });
}
