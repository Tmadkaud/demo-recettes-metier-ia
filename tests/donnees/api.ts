// Préparation des données par l'API : plus rapide et plus fiable que l'interface
// quand l'étape n'est pas l'objet du test.
import { expect, type APIRequestContext } from '@playwright/test';
import { clientDeTest, prochainJourHorsDimanche, type Client } from './clients';
import type { Profil } from './profils';

export interface CommandeCreee {
  numero: string;
  statut: string;
  totalMensuel: number;
  prenom: string;
  nom: string;
}

export async function creerCommandeViaApi(
  request: APIRequestContext,
  { offre = 'essentiel', options = [] as string[], client = clientDeTest(), codePromo = '' } = {},
): Promise<CommandeCreee & { client: Client }> {
  const reponse = await request.post('/api/commandes', {
    data: {
      offre,
      options,
      civilite: client.civilite,
      prenom: client.prenom,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse,
      codePostal: client.codePostal,
      ville: client.ville,
      logement: client.logement === 'Maison' ? 'maison' : 'appartement',
      dateInstallation: prochainJourHorsDimanche(7),
      codePromo,
      cgvAcceptees: true,
    },
  });
  expect(reponse.status(), await reponse.text()).toBe(201);
  const { commande } = await reponse.json();
  return { ...commande, client };
}

// Connecte un contexte de requêtes API au CRM avec le profil donné (cookie de session conservé).
export async function connecterApi(request: APIRequestContext, profil: Profil): Promise<void> {
  const reponse = await request.post('/api/crm/connexion', {
    data: { identifiant: profil.identifiant, motDePasse: profil.motDePasse },
  });
  expect(reponse.status(), `connexion de ${profil.identifiant}`).toBe(200);
}

export async function validerCommandeViaApi(request: APIRequestContext, numero: string): Promise<void> {
  const reponse = await request.post(`/api/crm/commandes/${numero}/valider`);
  expect(reponse.status(), await reponse.text()).toBe(200);
}
