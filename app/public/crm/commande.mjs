import { CRENEAUX, formaterDate, formaterMontant, OFFRES, OPTIONS, STATUTS, validerPlanification } from '/commun/regles.mjs';
import { appelerApi, el, formaterDateHeure } from '/commun/outils.mjs';
import { exigerConnexion } from '/crm/bandeau.mjs';

const numero = new URLSearchParams(location.search).get('numero') ?? '';
const $ = (id) => document.getElementById(id);
const message = $('message');
const erreurAction = $('erreur-action');
const formRefus = $('form-refus');
const formPlanifier = $('form-planifier');

for (const [code, libelle] of Object.entries(CRENEAUX)) $('creneau').append(el('option', { value: code, texte: libelle }));

function afficherMessage(texte) {
  message.textContent = texte;
  message.hidden = false;
  erreurAction.hidden = true;
}

function afficherErreurAction(texte) {
  erreurAction.textContent = texte;
  erreurAction.hidden = false;
  message.hidden = true;
}

function afficherErreurChamp(id, texte) {
  const zone = $(id);
  zone.textContent = texte ?? '';
  zone.hidden = !texte;
}

function afficher(commande, actions, utilisateur) {
  document.title = `Contoso Protect · CRM · ${commande.numero}`;
  $('titre').textContent = `Commande ${commande.numero}`;
  $('statut').textContent = STATUTS[commande.statut];
  $('statut').dataset.statut = commande.statut;

  $('client-nom').textContent = `${commande.civilite} ${commande.prenom} ${commande.nom}`;
  $('client-email').textContent = commande.email;
  $('client-telephone').textContent = commande.telephone;
  $('client-adresse').textContent = `${commande.adresse}, ${commande.codePostal} ${commande.ville}`;
  $('client-logement').textContent = commande.logement === 'maison' ? 'Maison' : 'Appartement';

  const nomsOptions = OPTIONS.filter((o) => commande.options.includes(o.code)).map((o) => o.nom);
  $('offre').textContent = OFFRES.find((o) => o.code === commande.offre)?.nom ?? commande.offre;
  $('options').textContent = nomsOptions.length ? nomsOptions.join(', ') : 'Aucune';
  $('total-mensuel').textContent = `${formaterMontant(commande.totalMensuel)} / mois`;
  $('frais-installation').textContent = formaterMontant(commande.fraisInstallation);
  $('code-promo').textContent = commande.codePromo || 'Aucun';

  $('date-souhaitee').textContent = formaterDate(commande.dateInstallation);
  $('rendez-vous').textContent = commande.installation
    ? `${formaterDate(commande.installation.date)} · ${CRENEAUX[commande.installation.creneau]}`
    : 'Non planifié';

  $('historique').replaceChildren(
    ...commande.historique.map((entree) =>
      el('li', {}, el('span', { class: 'quand', texte: `${formaterDateHeure(entree.le)} · ` }), `${entree.action} par ${entree.par}`),
    ),
  );

  const lectureSeule = utilisateur.role === 'lecture';
  const aDesActions = Object.keys(actions).length > 0;
  $('lecture-seule').hidden = !lectureSeule;
  $('aucune-action').hidden = lectureSeule || aDesActions;

  $('actions-nouvelle').hidden = !actions.valider && !actions.refuser;
  $('bouton-valider').disabled = !actions.valider?.autorisee;
  $('raison-valider').textContent = actions.valider?.raison ?? '';
  $('raison-valider').hidden = !actions.valider?.raison;
  if (!actions.refuser) formRefus.hidden = true;

  formPlanifier.hidden = !actions.planifier;
}

const utilisateur = await exigerConnexion();

async function charger() {
  const { ok, statut, donnees } = await appelerApi('GET', `/api/crm/commandes/${encodeURIComponent(numero)}`);
  if (statut === 401) return location.replace('/crm');
  if (!ok) {
    $('titre').textContent = 'Commande introuvable';
    afficherErreurAction(donnees.message ?? 'Commande introuvable.');
    $('zone-actions').hidden = true;
    return;
  }
  afficher(donnees.commande, donnees.actions, utilisateur);
}

async function agir(action, corps, messageSucces) {
  const { ok, donnees } = await appelerApi('POST', `/api/crm/commandes/${encodeURIComponent(numero)}/${action}`, corps);
  if (ok) {
    afficher(donnees.commande, donnees.actions, utilisateur);
    afficherMessage(messageSucces);
    return {};
  }
  if (donnees.erreurs) return donnees.erreurs;
  afficherErreurAction(donnees.message ?? 'Action impossible.');
  return {};
}

$('bouton-valider').addEventListener('click', () => agir('valider', {}, 'Commande validée.'));

$('bouton-refuser').addEventListener('click', () => {
  formRefus.hidden = false;
  $('motif').focus();
});

formRefus.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  const motif = $('motif').value.trim();
  if (!motif) return afficherErreurChamp('erreur-motif', 'Indiquez le motif du refus.');
  afficherErreurChamp('erreur-motif', '');
  const erreurs = await agir('refuser', { motif }, 'Commande refusée.');
  afficherErreurChamp('erreur-motif', erreurs.motif);
});

formPlanifier.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  const demande = { date: $('date-rdv').value, creneau: $('creneau').value };
  let erreurs = validerPlanification(demande);
  if (Object.keys(erreurs).length === 0) {
    erreurs = await agir('planifier', demande, `Installation planifiée le ${formaterDate(demande.date)} (${CRENEAUX[demande.creneau]}).`);
  }
  afficherErreurChamp('erreur-date', erreurs.date);
  afficherErreurChamp('erreur-creneau', erreurs.creneau);
});

await charger();
