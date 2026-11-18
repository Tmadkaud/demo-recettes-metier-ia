// Garde-fous déterministes de la recette (npm run garde-fous).
// Chaque message est écrit pour qu’un agent sache corriger seul : le problème, pourquoi, comment corriger.
// Les règles sont décrites dans AGENTS.md et justifiées par les ADR de docs/adr/.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REGLES = {
  'attente-fixe': {
    probleme: 'Attente fixe dans un test.',
    pourquoi: 'une pause est trop courte sur une machine chargée et inutile ailleurs : la recette devient lente et instable.',
    corriger:
      "attends l’état attendu avec une assertion web-first, par exemple `await expect(page.getByRole('status')).toHaveText('Commande validée.')`.",
  },
  'selecteur-css': {
    probleme: 'Sélecteur CSS ou XPath dans la recette.',
    pourquoi: 'il dépend de la structure HTML et non de ce que voit l’utilisateur : il casse au moindre changement de mise en page (ADR 0002).',
    corriger:
      "utilise getByRole, getByLabel, getByText ou getByTestId avec le libellé visible, par exemple `page.getByRole('button', { name: 'Valider la commande' })`.",
  },
  'mot-de-passe-en-dur': {
    probleme: 'Mot de passe en dur dans un test.',
    pourquoi: 'il finirait dans l’historique Git et dans les rapports de recette.',
    corriger:
      'utilise les profils de `tests/donnees/profils.ts` (par exemple `PROFILS.conseiller`), alimentés par des variables d’environnement et des secrets en CI.',
  },
  'date-en-dur': {
    probleme: 'Date en dur dans un test de recette.',
    pourquoi: 'le test deviendra faux quand le calendrier avancera (délai minimal, dimanche, date passée).',
    corriger:
      'calcule la date à partir du jour d’exécution avec `dansNJours()`, `prochainJourHorsDimanche()` ou `prochainDimanche()` (`tests/donnees/clients.ts`).',
  },
  'test-isole': {
    probleme: '`.only` dans un test.',
    pourquoi: 'il désactive silencieusement tout le reste de la recette.',
    corriger: 'supprime `.only`. Pour rejouer un seul cas en local : `npx playwright test tests/recettes/REC-XXX -g "titre du cas"`.',
  },
  'saut-sans-raison': {
    probleme: 'Cas sauté (`test.skip` ou `test.fixme`) sans raison écrite.',
    pourquoi: 'un cas sauté sans explication disparaît du PV sans que personne ne le remarque.',
    corriger: 'écris juste au-dessus `// Raison : <pourquoi, et quand le réactiver>`, ou réactive le cas.',
  },
  'anomalie-sans-motif': {
    probleme: 'Cas marqué `test.fail()` sans description de l’anomalie.',
    pourquoi: 'le PV doit dire quelle anomalie est connue, sinon on ne saura pas quand la retirer (ADR 0004).',
    corriger: 'écris juste au-dessus `// Anomalie : <attendu>, <obtenu>, <issue>`.',
  },
  'tolerance-ajoutee': {
    probleme: 'Délai allongé dans un test de recette.',
    pourquoi:
      'allonger un délai masque une lenteur ou une anomalie au lieu de la corriger : mêmes assertions, aucune tolérance ajoutée (ADR 0004).',
    corriger:
      'trouve la cause (état attendu, donnée manquante, lenteur réelle). Si la lenteur est une vraie anomalie, signale-la et marque le cas `test.fail()` sous `// Anomalie : …`.',
  },
  tracabilite: {
    probleme: 'Fiche de recette et test désynchronisés.',
    pourquoi: 'la fiche fait foi (ADR 0001) : chaque test implémente une fiche, chaque fiche automatisée a son test.',
    corriger:
      'commence le test par `// Recette REC-XXX : voir recettes/REC-XXX-<titre>.md` et indique dans la fiche « | Automatisée | ✅ `tests/recettes/REC-XXX-<titre>.spec.ts` | ».',
  },
  'registre-public': {
    probleme: 'Le fichier de verrouillage pointe vers un registre npm privé.',
    pourquoi: 'la CI ne peut pas installer les dépendances (incident du 17/11/2026, voir le journal d’AGENTS.md).',
    corriger: 'remplace le préfixe des URL `resolved` du `package-lock.json` par `https://registry.npmjs.org/`.',
  },
};

const DOSSIERS_DE_TESTS = ['tests/recettes', 'tests/pages', 'tests/donnees'];
const FICHIERS_AUTORISES_MOT_DE_PASSE = new Set(['tests/donnees/profils.ts']);

const estCommentaire = (ligne) => /^\s*(\/\/|\/?\*)/.test(ligne);

// Analyse un fichier de test ; `chemin` est relatif à la racine, avec des « / ».
export function analyserFichierTest(chemin, contenu) {
  const constats = [];
  const lignes = contenu.split(/\r?\n/);
  const dansRecettes = chemin.startsWith('tests/recettes/');
  const ajouter = (regle, index, extrait) => constats.push({ regle, fichier: chemin, ligne: index + 1, extrait: extrait.trim() });

  lignes.forEach((ligne, index) => {
    const precedente = index > 0 ? lignes[index - 1] : '';
    if (!estCommentaire(ligne)) {
      if (/\bwaitForTimeout\s*\(|\bsetTimeout\s*\(/.test(ligne)) ajouter('attente-fixe', index, ligne);
      if (/\.locator\s*\(|\$\$?\s*\(\s*['"`]|['"`](?:css|xpath)=/.test(ligne)) ajouter('selecteur-css', index, ligne);
      if (/\b(?:test|describe)(?:\.describe)?\.only\s*\(/.test(ligne)) ajouter('test-isole', index, ligne);
      if (/\btest(?:\.describe)?\.(?:skip|fixme)\s*\(/.test(ligne) && !/\/\/\s*Raison\s*:/.test(precedente)) {
        ajouter('saut-sans-raison', index, ligne);
      }
      if (/\btest\.fail\s*\(/.test(ligne) && !/\/\/\s*Anomalie\s*:/.test(precedente)) ajouter('anomalie-sans-motif', index, ligne);
      if (!FICHIERS_AUTORISES_MOT_DE_PASSE.has(chemin) && /-Demo-\d{4}|motDePasse\s*:\s*['"`]/.test(ligne)) {
        ajouter('mot-de-passe-en-dur', index, ligne);
      }
      if (dansRecettes || chemin.startsWith('tests/pages/')) {
        if (/['"`]\d{4}-\d{2}-\d{2}/.test(ligne)) ajouter('date-en-dur', index, ligne);
      }
      if (dansRecettes && /\btimeout\s*:|\btest\.setTimeout\s*\(|\btest\.slow\s*\(|\.setDefault(?:Navigation)?Timeout\s*\(/.test(ligne)) {
        ajouter('tolerance-ajoutee', index, ligne);
      }
    }
  });
  return constats;
}

// Lit la ligne « | Automatisée | … | » d’une fiche : { automatisee, chemin }.
export function lireStatutFiche(contenu) {
  const ligne = contenu.split(/\r?\n/).find((l) => /^\|\s*Automatisée\s*\|/.test(l)) ?? '';
  return {
    automatisee: ligne.includes('✅'),
    chemin: ligne.match(/`([^`]+\.spec\.ts)`/)?.[1] ?? null,
    trouvee: ligne !== '',
  };
}

// fiches : [{ chemin: 'recettes/REC-001-x.md', contenu }], specs : [{ chemin: 'tests/recettes/REC-001-x.spec.ts', contenu }]
export function analyserTracabilite(fiches, specs) {
  const constats = [];
  const ajouter = (fichier, extrait) => constats.push({ regle: 'tracabilite', fichier, ligne: 1, extrait });
  const cheminsFiches = new Set(fiches.map((f) => f.chemin));

  for (const spec of specs) {
    const identifiant = path.posix.basename(spec.chemin).match(/^REC-\d{3}/)?.[0];
    const entete = spec.contenu.split(/\r?\n/)[0] ?? '';
    const reference = entete.match(/^\/\/ Recette (REC-\d{3}) : voir (recettes\/\S+\.md)\s*$/);
    if (!identifiant) {
      ajouter(spec.chemin, 'Le nom du fichier doit commencer par l’identifiant de sa fiche (REC-XXX-…).');
    } else if (!reference) {
      ajouter(spec.chemin, `Première ligne attendue : « // Recette ${identifiant} : voir recettes/${identifiant}-<titre>.md ».`);
    } else if (reference[1] !== identifiant || !cheminsFiches.has(reference[2])) {
      ajouter(spec.chemin, `L’en-tête désigne ${reference[2]}, introuvable ou d’un autre identifiant que ${identifiant}.`);
    } else {
      const fiche = fiches.find((f) => f.chemin === reference[2]);
      const statut = lireStatutFiche(fiche.contenu);
      if (!statut.automatisee) {
        ajouter(fiche.chemin, `La fiche est encore marquée « à automatiser » alors que ${spec.chemin} existe : mets-la à « ✅ \`${spec.chemin}\` ».`);
      } else if (statut.chemin !== spec.chemin) {
        ajouter(fiche.chemin, `La fiche annonce « ${statut.chemin ?? 'aucun chemin'} » au lieu de « ${spec.chemin} ».`);
      }
    }
  }

  for (const fiche of fiches) {
    const statut = lireStatutFiche(fiche.contenu);
    if (!statut.trouvee) {
      ajouter(fiche.chemin, 'La fiche n’a pas de ligne « | Automatisée | … | » (voir recettes/_modele.md).');
    } else if (statut.automatisee && !specs.some((s) => s.chemin === statut.chemin)) {
      ajouter(fiche.chemin, `La fiche est marquée « ✅ » mais son test « ${statut.chemin ?? 'non précisé'} » est introuvable.`);
    }
  }
  return constats;
}

export function analyserLockfile(contenu) {
  const constats = [];
  contenu.split(/\r?\n/).forEach((ligne, index) => {
    const url = ligne.match(/"resolved"\s*:\s*"([^"]+)"/)?.[1];
    if (url && !url.startsWith('https://registry.npmjs.org/')) {
      constats.push({ regle: 'registre-public', fichier: 'package-lock.json', ligne: index + 1, extrait: url });
    }
  });
  return constats;
}

function lister(racine, dossier, filtre) {
  const absolu = path.join(racine, dossier);
  if (!existsSync(absolu)) return [];
  return readdirSync(absolu)
    .flatMap((nom) => {
      const relatif = `${dossier}/${nom}`;
      return statSync(path.join(racine, relatif)).isDirectory() ? lister(racine, relatif, filtre) : [relatif];
    })
    .filter(filtre);
}

export function verifierDepot(racine) {
  const lire = (relatif) => readFileSync(path.join(racine, relatif), 'utf8');
  const fichiersDeTests = DOSSIERS_DE_TESTS.flatMap((d) => lister(racine, d, (f) => /\.(ts|mjs|js)$/.test(f)));
  const fiches = lister(racine, 'recettes', (f) => /\/REC-\d{3}-[^/]+\.md$/.test(f)).map((chemin) => ({ chemin, contenu: lire(chemin) }));
  const specs = lister(racine, 'tests/recettes', (f) => f.endsWith('.spec.ts')).map((chemin) => ({ chemin, contenu: lire(chemin) }));

  const constats = [
    ...fichiersDeTests.flatMap((chemin) => analyserFichierTest(chemin, lire(chemin))),
    ...analyserTracabilite(fiches, specs),
    ...(existsSync(path.join(racine, 'package-lock.json')) ? analyserLockfile(lire('package-lock.json')) : []),
  ];
  return { constats, nombreFichiers: fichiersDeTests.length + fiches.length + 1 };
}

export function formaterConstat(constat) {
  const regle = REGLES[constat.regle];
  return [
    `✗ ${constat.regle} · ${constat.fichier}:${constat.ligne}`,
    `  ${regle.probleme}`,
    `  Trouvé : ${constat.extrait}`,
    `  Pourquoi : ${regle.pourquoi}`,
    `  Comment corriger : ${regle.corriger}`,
  ].join('\n');
}

function annotationGitHub(constat) {
  const regle = REGLES[constat.regle];
  const message = `${regle.probleme} ${constat.extrait} Comment corriger : ${regle.corriger}`.replace(/\r?\n/g, ' ').replace(/%/g, '%25');
  return `::error file=${constat.fichier},line=${constat.ligne},title=Garde-fou ${constat.regle}::${message}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { constats, nombreFichiers } = verifierDepot(process.cwd());
  if (constats.length === 0) {
    console.log(`✓ Garde-fous de la recette : aucun problème (${nombreFichiers} fichiers analysés).`);
  } else {
    console.log(`Garde-fous de la recette : ${constats.length} problème${constats.length > 1 ? 's' : ''} à corriger.\n`);
    console.log(constats.map(formaterConstat).join('\n\n'));
    console.log('\nRègles et décisions : AGENTS.md et docs/adr/.');
    if (process.env.GITHUB_ACTIONS) constats.forEach((c) => console.log(annotationGitHub(c)));
    process.exitCode = 1;
  }
}
