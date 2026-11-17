// Bandeau commun des pages du CRM : utilisateur connecté et déconnexion.
import { ROLES } from '/commun/regles.mjs';
import { appelerApi } from '/commun/outils.mjs';

export async function exigerConnexion() {
  const { ok, donnees } = await appelerApi('GET', '/api/crm/moi');
  if (!ok) {
    location.replace('/crm');
    throw new Error('Connexion requise');
  }
  const utilisateur = donnees.utilisateur;
  document.getElementById('utilisateur').textContent = `${utilisateur.nom} · ${ROLES[utilisateur.role]}`;
  document.getElementById('deconnexion').addEventListener('click', async () => {
    await appelerApi('POST', '/api/crm/deconnexion');
    location.assign('/crm');
  });
  return utilisateur;
}
