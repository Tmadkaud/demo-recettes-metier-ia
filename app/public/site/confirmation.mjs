import { formaterDate, formaterMontant, OFFRES, OPTIONS } from '/commun/regles.mjs';

const numero = new URLSearchParams(location.search).get('numero') ?? '';
document.getElementById('numero-commande').textContent = numero;

const commande = JSON.parse(sessionStorage.getItem('derniere-commande') ?? 'null');
if (commande && commande.numero === numero) {
  const nomsOptions = OPTIONS.filter((o) => commande.options.includes(o.code)).map((o) => o.nom);
  document.getElementById('recap-offre').textContent = OFFRES.find((o) => o.code === commande.offre)?.nom ?? commande.offre;
  document.getElementById('recap-options').textContent = nomsOptions.length ? nomsOptions.join(', ') : 'Aucune';
  document.getElementById('recap-total').textContent = `${formaterMontant(commande.totalMensuel)} / mois`;
  document.getElementById('recap-frais').textContent = formaterMontant(commande.fraisInstallation);
  document.getElementById('recap-date').textContent = formaterDate(commande.dateInstallation);
  document.getElementById('recapitulatif').hidden = false;
}
