// Garde-fou « assertion-affaiblie » (npm run garde-assertions [référence]).
// Compare la copie de travail à la référence (origin/main par défaut) : une assertion, un cas ou une étape de
// tests/recettes ne peut disparaître ou changer que si la fiche de recette correspondante change aussi (ADR 0001 et 0004).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MOTIF_VERIFICATION = /\bexpect(?:\.soft)?\s*\(|\btest(?:\.step)?\s*\(/;
const normaliser = (texte) => texte.replace(/\s+/g, ' ').trim();
const identifiantRecette = (fichier) => path.posix.basename(fichier).match(/^REC-\d{3}/)?.[0] ?? null;

// Lit un diff unifié (git diff --unified=0) : lignes retirées et ajoutées, par fichier.
export function lireDiff(diff) {
  const retirees = [];
  const ajoutees = [];
  const fichiersModifies = new Set();
  let ancien = null;
  let nouveau = null;
  let ligneAncienne = 0;

  for (const ligne of diff.split(/\r?\n/)) {
    if (ligne.startsWith('--- ')) {
      ancien = ligne === '--- /dev/null' ? null : ligne.replace(/^--- a\//, '');
    } else if (ligne.startsWith('+++ ')) {
      nouveau = ligne === '+++ /dev/null' ? null : ligne.replace(/^\+\+\+ b\//, '');
      for (const fichier of [ancien, nouveau]) if (fichier) fichiersModifies.add(fichier);
    } else if (ligne.startsWith('@@')) {
      ligneAncienne = Number(ligne.match(/^@@ -(\d+)/)?.[1] ?? 0);
    } else if (ligne.startsWith('-')) {
      retirees.push({ fichier: ancien ?? nouveau, ligne: ligneAncienne, texte: ligne.slice(1) });
      ligneAncienne += 1;
    } else if (ligne.startsWith('+')) {
      ajoutees.push({ fichier: nouveau ?? ancien, texte: ligne.slice(1) });
    }
  }
  return { retirees, ajoutees, fichiersModifies };
}

export function analyserDiff(diff) {
  const { retirees, ajoutees, fichiersModifies } = lireDiff(diff);
  const fichesModifiees = new Set(
    [...fichiersModifies].filter((f) => f.startsWith('recettes/')).map(identifiantRecette).filter(Boolean),
  );
  // Une ligne déplacée (retirée puis ajoutée telle quelle) n’affaiblit rien.
  const textesAjoutes = new Set(ajoutees.filter((a) => a.fichier?.startsWith('tests/recettes/')).map((a) => normaliser(a.texte)));

  const constats = [];
  const autorisees = [];
  for (const retiree of retirees) {
    if (!retiree.fichier?.startsWith('tests/recettes/') || !MOTIF_VERIFICATION.test(retiree.texte)) continue;
    if (textesAjoutes.has(normaliser(retiree.texte))) continue;
    const identifiant = identifiantRecette(retiree.fichier);
    const constat = { regle: 'assertion-affaiblie', fichier: retiree.fichier, ligne: retiree.ligne, extrait: normaliser(retiree.texte), identifiant };
    if (identifiant && fichesModifiees.has(identifiant)) autorisees.push(constat);
    else constats.push(constat);
  }
  return { constats, autorisees };
}

export function formaterConstat(constat, reference) {
  return [
    `✗ assertion-affaiblie · ${constat.fichier}:${constat.ligne} (ligne dans ${reference})`,
    `  Une vérification de la recette ${constat.identifiant ?? ''} a été supprimée ou modifiée sans que sa fiche change.`,
    `  Retiré : ${constat.extrait}`,
    '  Pourquoi : la fiche fait foi et une anomalie ne se corrige pas en changeant le test (ADR 0001 et 0004).',
    '  Comment corriger : rétablis la vérification et corrige l’application. Si le comportement attendu a vraiment changé,',
    `  l’équipe recette met d’abord à jour la fiche recettes/${constat.identifiant ?? 'REC-XXX'}-….md dans la même PR.`,
    '  Un test qui échoue sans que la PR soit en cause : lance `npm run enquete` avant toute modification.',
  ].join('\n');
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const reference = process.argv[2] ?? 'origin/main';
  let base;
  try {
    base = git(['merge-base', reference, 'HEAD']).trim();
  } catch {
    console.error(`Référence « ${reference} » introuvable : récupère-la d’abord (git fetch origin main), puis relance.`);
    process.exit(2);
  }
  const diff = git(['diff', '--unified=0', '--no-color', '--no-ext-diff', base, '--', 'tests/recettes', 'recettes']);
  const { constats, autorisees } = analyserDiff(diff);

  for (const a of autorisees) {
    console.log(`ℹ ${a.fichier}:${a.ligne} : vérification modifiée avec sa fiche ${a.identifiant}. À confirmer en revue humaine : « ${a.extrait} ».`);
  }
  if (constats.length === 0) {
    console.log(`✓ Assertions de recette : aucune vérification retirée ou modifiée sans sa fiche par rapport à ${reference}.`);
  } else {
    console.log(`Assertions de recette : ${constats.length} vérification${constats.length > 1 ? 's' : ''} retirée${constats.length > 1 ? 's' : ''} sans mise à jour de la fiche.\n`);
    console.log(constats.map((c) => formaterConstat(c, reference)).join('\n\n'));
    if (process.env.GITHUB_ACTIONS) {
      for (const c of constats) {
        console.log(`::error file=${c.fichier},title=Garde-fou assertion-affaiblie::Vérification retirée sans mise à jour de la fiche ${c.identifiant ?? ''} : ${c.extrait}`);
      }
    }
    process.exitCode = 1;
  }
}
