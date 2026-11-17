// Petits utilitaires partagés par les pages (aucune donnée n'est injectée en HTML brut).

export function el(balise, attributs = {}, ...enfants) {
  const element = document.createElement(balise);
  for (const [cle, valeur] of Object.entries(attributs)) {
    if (valeur === false || valeur === null || valeur === undefined) continue;
    if (cle === 'texte') element.textContent = valeur;
    else if (cle.startsWith('on')) element.addEventListener(cle.slice(2), valeur);
    else element.setAttribute(cle, valeur === true ? '' : String(valeur));
  }
  for (const enfant of enfants.flat()) {
    if (enfant === null || enfant === undefined || enfant === false) continue;
    element.append(enfant instanceof Node ? enfant : document.createTextNode(String(enfant)));
  }
  return element;
}

export async function appelerApi(methode, url, corps) {
  const reponse = await fetch(url, {
    method: methode,
    headers: corps ? { 'Content-Type': 'application/json' } : {},
    body: corps ? JSON.stringify(corps) : undefined,
    credentials: 'same-origin',
  });
  const donnees = await reponse.json().catch(() => ({}));
  return { statut: reponse.status, ok: reponse.ok, donnees };
}

export function formaterDateHeure(iso) {
  const date = new Date(iso);
  const jour = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${jour} à ${heure}`;
}
