import { calculerMontants, formaterMontant, OFFRES, OPTIONS, validerCommande } from '/commun/regles.mjs';
import { appelerApi, el } from '/commun/outils.mjs';

const formulaire = document.getElementById('formulaire');
const resume = document.getElementById('resume-erreurs');
const offreDemandee = new URLSearchParams(location.search).get('offre');

document.getElementById('liste-offres').append(
  ...OFFRES.map((offre) =>
    el(
      'label',
      { class: 'choix' },
      el('input', { type: 'radio', name: 'offre', value: offre.code, checked: offre.code === offreDemandee }),
      `${offre.nom} — ${formaterMontant(offre.prixMensuel)} / mois`,
    ),
  ),
);

document.getElementById('liste-options').append(
  ...OPTIONS.map((option) =>
    el(
      'label',
      { class: 'choix' },
      el('input', { type: 'checkbox', name: 'options', value: option.code }),
      `${option.nom} (+${formaterMontant(option.prixMensuel)} / mois)`,
    ),
  ),
);

function lireFormulaire() {
  const valeur = (nom) => formulaire.elements[nom]?.value ?? '';
  return {
    offre: formulaire.querySelector('input[name="offre"]:checked')?.value ?? '',
    options: [...formulaire.querySelectorAll('input[name="options"]:checked')].map((c) => c.value),
    civilite: valeur('civilite'),
    prenom: valeur('prenom'),
    nom: valeur('nom'),
    email: valeur('email'),
    telephone: valeur('telephone'),
    adresse: valeur('adresse'),
    codePostal: valeur('codePostal'),
    ville: valeur('ville'),
    logement: formulaire.querySelector('input[name="logement"]:checked')?.value ?? '',
    dateInstallation: valeur('dateInstallation'),
    codePromo: valeur('codePromo'),
    cgvAcceptees: document.getElementById('cgvAcceptees').checked,
  };
}

function mettreAJourRecapitulatif() {
  const commande = lireFormulaire();
  const montants = calculerMontants(commande);
  document.getElementById('recap-offre').textContent = OFFRES.find((o) => o.code === commande.offre)?.nom ?? '—';
  document.getElementById('total-mensuel').textContent = formaterMontant(montants.totalMensuel);
  document.getElementById('frais-installation').textContent = formaterMontant(montants.fraisInstallation);
  document.getElementById('frais-offerts').hidden = !montants.fraisOfferts;
}

function afficherErreurs(erreurs) {
  for (const zone of formulaire.querySelectorAll('.erreur')) {
    zone.hidden = true;
    zone.textContent = '';
  }
  for (const champ of formulaire.querySelectorAll('[aria-invalid]')) champ.removeAttribute('aria-invalid');

  const champs = Object.keys(erreurs);
  for (const champ of champs) {
    const zone = document.getElementById(`erreur-${champ}`);
    if (zone) {
      zone.textContent = erreurs[champ];
      zone.hidden = false;
    }
    document.getElementById(champ)?.setAttribute('aria-invalid', 'true');
  }
  resume.hidden = champs.length === 0;
  resume.textContent = champs.length === 1 ? 'Le formulaire contient 1 erreur.' : `Le formulaire contient ${champs.length} erreurs.`;
  if (champs.length > 0) resume.scrollIntoView({ block: 'center' });
}

formulaire.addEventListener('input', mettreAJourRecapitulatif);
formulaire.addEventListener('change', mettreAJourRecapitulatif);
mettreAJourRecapitulatif();

formulaire.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  const commande = lireFormulaire();
  const erreurs = validerCommande(commande);
  afficherErreurs(erreurs);
  if (Object.keys(erreurs).length > 0) return;

  const bouton = formulaire.querySelector('button[type="submit"]');
  bouton.disabled = true;
  const { statut, donnees } = await appelerApi('POST', '/api/commandes', commande);
  bouton.disabled = false;
  if (statut === 201) {
    sessionStorage.setItem('derniere-commande', JSON.stringify(donnees.commande));
    location.assign(`/confirmation?numero=${encodeURIComponent(donnees.commande.numero)}`);
    return;
  }
  afficherErreurs(donnees.erreurs ?? {});
  if (!donnees.erreurs) {
    resume.hidden = false;
    resume.textContent = donnees.message ?? "La commande n'a pas pu être enregistrée. Réessayez.";
  }
});
