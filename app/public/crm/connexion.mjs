import { appelerApi } from '/commun/outils.mjs';

const formulaire = document.getElementById('connexion');
const erreur = document.getElementById('erreur-connexion');

// Écouteur attaché avant tout appel réseau : un envoi rapide ne doit jamais partir en GET natif.
formulaire.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  erreur.hidden = true;
  const { ok, donnees } = await appelerApi('POST', '/api/crm/connexion', {
    identifiant: formulaire.elements.identifiant.value.trim(),
    motDePasse: formulaire.elements.motDePasse.value,
  });
  if (ok) {
    location.assign('/crm/commandes');
    return;
  }
  erreur.textContent = donnees.message ?? 'Connexion impossible.';
  erreur.hidden = false;
});

const { ok: dejaConnecte } = await appelerApi('GET', '/api/crm/moi');
if (dejaConnecte) location.replace('/crm/commandes');
