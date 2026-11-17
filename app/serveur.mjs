// Serveur de la démo Contoso Protect (entreprise fictive) : site public, CRM et API JSON.
// Node.js seul, sans dépendance. Démarrage : `npm start` puis http://localhost:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authentifier, creerMagasin, creerSessions } from './magasin.mjs';
import {
  actionsPossibles,
  CRENEAUX,
  formaterDate,
  OFFRES,
  OPTIONS,
  ROLES,
  SEUIL_VALIDATION_SUPERVISEUR,
  STATUTS,
  validerCommande,
  validerPlanification,
} from './public/commun/regles.mjs';

const PORT = Number(process.env.PORT ?? 3000);
const MODE_TEST = process.env.MODE_TEST === '1';
// Régression simulée pour la démo (`npm run demo:regression`) : le seuil « validation superviseur » saute.
const ANOMALIE =
  process.env.ANOMALIE_DEMO ?? process.argv.find((argument) => argument.startsWith('--anomalie='))?.split('=')[1] ?? '';
const SEUIL_SUPERVISEUR = ANOMALIE === 'seuil-superviseur' ? Number.POSITIVE_INFINITY : SEUIL_VALIDATION_SUPERVISEUR;
const DOSSIER_PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const COOKIE_SESSION = 'crm_session';

const PAGES = {
  '/': 'site/index.html',
  '/souscrire': 'site/souscrire.html',
  '/confirmation': 'site/confirmation.html',
  '/crm': 'crm/connexion.html',
  '/crm/commandes': 'crm/commandes.html',
  '/crm/commande': 'crm/commande.html',
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const magasin = creerMagasin();
const sessions = creerSessions();

class ErreurHttp extends Error {
  constructor(statut, corps) {
    super(corps.message ?? 'Erreur');
    this.statut = statut;
    this.corps = corps;
  }
}

function envoyerJson(reponse, statut, corps, entetes = {}) {
  reponse.writeHead(statut, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...entetes });
  reponse.end(JSON.stringify(corps));
}

async function lireJson(requete) {
  const morceaux = [];
  let taille = 0;
  for await (const morceau of requete) {
    taille += morceau.length;
    if (taille > 100_000) throw new ErreurHttp(413, { message: 'Requête trop volumineuse.' });
    morceaux.push(morceau);
  }
  if (morceaux.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(morceaux).toString('utf8'));
  } catch {
    throw new ErreurHttp(400, { message: 'JSON invalide.' });
  }
}

function lireCookie(requete, nom) {
  const entete = requete.headers.cookie ?? '';
  for (const paire of entete.split(';')) {
    const [cle, ...valeur] = paire.trim().split('=');
    if (cle === nom) return decodeURIComponent(valeur.join('='));
  }
  return null;
}

function utilisateurConnecte(requete) {
  const utilisateur = sessions.lire(lireCookie(requete, COOKIE_SESSION));
  if (!utilisateur) throw new ErreurHttp(401, { message: 'Connexion requise.' });
  return utilisateur;
}

function signature(utilisateur) {
  return `${utilisateur.nom} (${ROLES[utilisateur.role]})`;
}

function commandePourCrm(commande, utilisateur) {
  return { commande, actions: actionsPossibles(utilisateur.role, commande, SEUIL_SUPERVISEUR) };
}

function commandeOuErreur(numero) {
  const commande = magasin.trouver(numero);
  if (!commande) throw new ErreurHttp(404, { message: 'Commande introuvable.' });
  return commande;
}

function exigerAction(utilisateur, commande, action) {
  if (utilisateur.role === 'lecture') throw new ErreurHttp(403, { message: 'Accès en lecture seule.' });
  const possible = actionsPossibles(utilisateur.role, commande, SEUIL_SUPERVISEUR)[action];
  if (!possible) throw new ErreurHttp(409, { message: `Action impossible : la commande est au statut « ${STATUTS[commande.statut]} ».` });
  if (!possible.autorisee) throw new ErreurHttp(403, { message: possible.raison ?? 'Action non autorisée.' });
}

async function traiterApi(requete, reponse, url) {
  const { pathname } = url;
  const methode = requete.method;

  if (methode === 'GET' && pathname === '/api/offres') return envoyerJson(reponse, 200, { offres: OFFRES, options: OPTIONS });

  if (methode === 'POST' && pathname === '/api/commandes') {
    const donnees = await lireJson(requete);
    const erreurs = validerCommande(donnees);
    if (Object.keys(erreurs).length > 0) return envoyerJson(reponse, 400, { message: 'Commande invalide.', erreurs });
    return envoyerJson(reponse, 201, { commande: magasin.enregistrer(donnees) });
  }

  if (methode === 'POST' && pathname === '/api/crm/connexion') {
    const { identifiant, motDePasse } = await lireJson(requete);
    const utilisateur = authentifier(identifiant, motDePasse);
    if (!utilisateur) return envoyerJson(reponse, 401, { message: 'Identifiant ou mot de passe incorrect.' });
    const jeton = sessions.ouvrir(utilisateur);
    return envoyerJson(reponse, 200, { utilisateur }, { 'Set-Cookie': `${COOKIE_SESSION}=${jeton}; HttpOnly; SameSite=Lax; Path=/` });
  }

  if (methode === 'POST' && pathname === '/api/crm/deconnexion') {
    sessions.fermer(lireCookie(requete, COOKIE_SESSION));
    return envoyerJson(reponse, 200, { ok: true }, { 'Set-Cookie': `${COOKIE_SESSION}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0` });
  }

  if (methode === 'GET' && pathname === '/api/crm/moi') {
    return envoyerJson(reponse, 200, { utilisateur: utilisateurConnecte(requete) });
  }

  if (methode === 'GET' && pathname === '/api/crm/commandes') {
    utilisateurConnecte(requete);
    const commandes = magasin.rechercher({
      recherche: url.searchParams.get('recherche') ?? '',
      statut: url.searchParams.get('statut') ?? '',
    });
    return envoyerJson(reponse, 200, { commandes });
  }

  const routeCommande = pathname.match(/^\/api\/crm\/commandes\/([A-Z0-9-]+)(?:\/(valider|refuser|planifier))?$/);
  if (routeCommande) {
    const utilisateur = utilisateurConnecte(requete);
    const [, numero, action] = routeCommande;
    const commande = commandeOuErreur(numero);

    if (methode === 'GET' && !action) return envoyerJson(reponse, 200, commandePourCrm(commande, utilisateur));
    if (methode !== 'POST' || !action) throw new ErreurHttp(405, { message: 'Méthode non autorisée.' });

    const donnees = await lireJson(requete);
    exigerAction(utilisateur, commande, action);
    const maintenant = new Date().toISOString();

    if (action === 'valider') {
      commande.statut = 'validee';
      commande.historique.push({ le: maintenant, par: signature(utilisateur), action: 'Commande validée' });
    }
    if (action === 'refuser') {
      const motif = typeof donnees.motif === 'string' ? donnees.motif.trim() : '';
      if (!motif) return envoyerJson(reponse, 400, { message: 'Refus incomplet.', erreurs: { motif: 'Indiquez le motif du refus.' } });
      commande.statut = 'refusee';
      commande.motifRefus = motif;
      commande.historique.push({ le: maintenant, par: signature(utilisateur), action: `Commande refusée : ${motif}` });
    }
    if (action === 'planifier') {
      const erreurs = validerPlanification(donnees);
      if (Object.keys(erreurs).length > 0) return envoyerJson(reponse, 400, { message: 'Planification invalide.', erreurs });
      commande.statut = 'installation-planifiee';
      commande.installation = { date: donnees.date, creneau: donnees.creneau };
      commande.historique.push({
        le: maintenant,
        par: signature(utilisateur),
        action: `Installation planifiée le ${formaterDate(donnees.date)} (${CRENEAUX[donnees.creneau]})`,
      });
    }
    return envoyerJson(reponse, 200, commandePourCrm(commande, utilisateur));
  }

  if (MODE_TEST && methode === 'POST' && pathname === '/api/test/reinitialiser') {
    magasin.reinitialiser();
    return envoyerJson(reponse, 200, { ok: true });
  }

  throw new ErreurHttp(404, { message: 'Ressource introuvable.' });
}

async function servirFichier(reponse, cheminRelatif) {
  const chemin = path.resolve(DOSSIER_PUBLIC, cheminRelatif);
  if (!chemin.startsWith(DOSSIER_PUBLIC + path.sep)) throw new ErreurHttp(404, { message: 'Page introuvable.' });
  let contenu;
  try {
    contenu = await readFile(chemin);
  } catch {
    throw new ErreurHttp(404, { message: 'Page introuvable.' });
  }
  reponse.writeHead(200, { 'Content-Type': TYPES[path.extname(chemin)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
  reponse.end(contenu);
}

const serveur = createServer(async (requete, reponse) => {
  const url = new URL(requete.url ?? '/', `http://${requete.headers.host ?? 'localhost'}`);
  try {
    if (url.pathname === '/sante') {
      reponse.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return reponse.end('ok');
    }
    if (url.pathname.startsWith('/api/')) return await traiterApi(requete, reponse, url);
    if (requete.method !== 'GET' && requete.method !== 'HEAD') throw new ErreurHttp(405, { message: 'Méthode non autorisée.' });
    const page = PAGES[url.pathname.replace(/\/$/, '') || '/'];
    return await servirFichier(reponse, page ?? decodeURIComponent(url.pathname).replace(/^\/+/, ''));
  } catch (erreur) {
    if (erreur instanceof ErreurHttp) {
      if (url.pathname.startsWith('/api/')) return envoyerJson(reponse, erreur.statut, erreur.corps);
      reponse.writeHead(erreur.statut, { 'Content-Type': 'text/plain; charset=utf-8' });
      return reponse.end(erreur.corps.message);
    }
    console.error(erreur);
    return envoyerJson(reponse, 500, { message: 'Erreur interne.' });
  }
});

serveur.listen(PORT, () => {
  console.log(`Contoso Protect (démo) : site http://localhost:${PORT}  ·  CRM http://localhost:${PORT}/crm${MODE_TEST ? '  ·  mode test' : ''}`);
  if (SEUIL_SUPERVISEUR !== SEUIL_VALIDATION_SUPERVISEUR) {
    console.warn('⚠️  Régression simulée active : un conseiller peut valider une commande de plus de 50 € par mois (règle REC-002 cassée).');
  }
});
