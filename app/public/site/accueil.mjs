import { formaterMontant, OFFRES } from '/commun/regles.mjs';
import { el } from '/commun/outils.mjs';

const liste = document.getElementById('offres');
for (const offre of OFFRES) {
  liste.append(
    el(
      'li',
      { class: 'offre' },
      el('h3', { texte: offre.nom }),
      el('p', { class: 'prix', texte: `${formaterMontant(offre.prixMensuel)} / mois` }),
      el('p', { texte: offre.description }),
      el('a', { class: 'bouton', href: `/souscrire?offre=${offre.code}`, texte: `Choisir l'offre ${offre.nom}` }),
    ),
  );
}
