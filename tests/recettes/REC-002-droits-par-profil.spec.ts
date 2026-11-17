// Recette REC-002 : voir recettes/REC-002-droits-par-profil.md
import { expect, test } from '@playwright/test';
import { connecterApi, creerCommandeViaApi } from '../donnees/api';
import { PROFILS } from '../donnees/profils';
import { Crm } from '../pages/crm';

test.describe('REC-002 · Droits par profil sur une commande de plus de 50 € par mois', () => {
  let numero: string;

  test.beforeEach(async ({ request }) => {
    // Premium (49,90 €) + caméra extérieure (5,00 €) = 54,90 € par mois : au-dessus du seuil de 50 €.
    const commande = await creerCommandeViaApi(request, { offre: 'premium', options: ['camera-ext'] });
    expect(commande.totalMensuel).toBe(5490);
    numero = commande.numero;
  });

  test('le conseiller ne peut pas valider : validation superviseur requise', async ({ page }) => {
    const crm = new Crm(page);
    await test.step('Le conseiller ouvre la commande', async () => {
      await crm.seConnecter(PROFILS.conseiller);
      await crm.ouvrirCommandeParSonAdresse(numero);
      await expect(crm.totalMensuel).toHaveText('54,90 € / mois');
    });
    await test.step('La validation lui est refusée avec le motif', async () => {
      await expect(crm.boutonValider).toBeDisabled();
      await expect(page.getByText('Validation superviseur requise (total mensuel supérieur à 50,00 €).')).toBeVisible();
      await expect(crm.boutonRefuser).toBeEnabled();
      await expect(crm.statut).toHaveText('Nouvelle');
    });
  });

  test('le superviseur valide la commande', async ({ page }) => {
    const crm = new Crm(page);
    await test.step('Le superviseur ouvre la commande', async () => {
      await crm.seConnecter(PROFILS.superviseur);
      await crm.ouvrirCommandeParSonAdresse(numero);
    });
    await test.step('Il la valide', async () => {
      await expect(crm.boutonValider).toBeEnabled();
      await crm.validerLaCommande();
      await expect(crm.statut).toHaveText('Validée');
      await expect(crm.historique).toContainText('Commande validée par Sami Benali (Superviseur)');
    });
  });

  test('le profil lecture seule consulte la commande sans pouvoir agir', async ({ page }) => {
    const crm = new Crm(page);
    await crm.seConnecter(PROFILS.lecture);
    await crm.ouvrirCommandeParSonAdresse(numero);
    await expect(page.getByText("Accès en lecture seule : aucune action n'est possible avec ce profil.")).toBeVisible();
    await expect(crm.boutonValider).toBeHidden();
    await expect(crm.boutonRefuser).toBeHidden();
  });

  test("le serveur refuse aussi la validation au conseiller (contrôle côté API, pas seulement à l'écran)", async ({ request }) => {
    await connecterApi(request, PROFILS.conseiller);
    const reponse = await request.post(`/api/crm/commandes/${numero}/valider`);
    expect(reponse.status()).toBe(403);
    expect((await reponse.json()).message).toContain('Validation superviseur requise');
  });
});
