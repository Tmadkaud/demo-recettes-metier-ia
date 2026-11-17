import { formaterMontant, OFFRES, STATUTS } from '/commun/regles.mjs';
import { appelerApi, el, formaterDateHeure } from '/commun/outils.mjs';
import { exigerConnexion } from '/crm/bandeau.mjs';

const recherche = document.getElementById('recherche');
const filtreStatut = document.getElementById('filtre-statut');
const lignes = document.getElementById('lignes');
const aucune = document.getElementById('aucune');

for (const [code, libelle] of Object.entries(STATUTS)) filtreStatut.append(el('option', { value: code, texte: libelle }));
document.getElementById('filtres').addEventListener('submit', (evenement) => evenement.preventDefault());

let derniereRequete = 0;
async function charger() {
  const numeroRequete = ++derniereRequete;
  const parametres = new URLSearchParams({ recherche: recherche.value, statut: filtreStatut.value });
  const { ok, statut, donnees } = await appelerApi('GET', `/api/crm/commandes?${parametres}`);
  if (statut === 401) return location.replace('/crm');
  if (!ok || numeroRequete !== derniereRequete) return;

  lignes.replaceChildren(
    ...donnees.commandes.map((commande) =>
      el(
        'tr',
        {},
        el('td', {}, el('a', { href: `/crm/commande?numero=${encodeURIComponent(commande.numero)}`, texte: commande.numero })),
        el('td', { texte: `${commande.prenom} ${commande.nom}` }),
        el('td', { texte: commande.ville }),
        el('td', { texte: OFFRES.find((o) => o.code === commande.offre)?.nom ?? commande.offre }),
        el('td', { texte: formaterMontant(commande.totalMensuel) }),
        el('td', {}, el('span', { class: 'statut', 'data-statut': commande.statut, texte: STATUTS[commande.statut] })),
        el('td', { texte: formaterDateHeure(commande.creeLe) }),
      ),
    ),
  );
  aucune.hidden = donnees.commandes.length > 0;
}

let minuterie;
recherche.addEventListener('input', () => {
  clearTimeout(minuterie);
  minuterie = setTimeout(charger, 200);
});
filtreStatut.addEventListener('change', charger);

await exigerConnexion();
await charger();
