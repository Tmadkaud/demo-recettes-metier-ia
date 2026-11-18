// Recette REC-004 : voir recettes/REC-004-planification-installation.md
// Version de référence (plan B de la démo, branche plan-b) : `npm run plan-b` la restaure.
import { expect, test } from '@playwright/test';
import { connecterApi, creerCommandeViaApi, validerCommandeViaApi } from '../donnees/api';
import { auFormatFrancais, prochainDimanche, prochainJourHorsDimanche } from '../donnees/clients';
import { PROFILS } from '../donnees/profils';
import { Crm } from '../pages/crm';

test.describe("REC-004 · Planification de l'installation d'une commande validée", () => {
  let numero: string;

  test.beforeEach(async ({ playwright, baseURL }) => {
    // Pré-requis préparé par l'API : une commande Essentiel au statut « Validée ».
    const api = await playwright.request.newContext({ baseURL });
    numero = (await creerCommandeViaApi(api, { offre: 'essentiel' })).numero;
    await connecterApi(api, PROFILS.conseiller);
    await validerCommandeViaApi(api, numero);
    await api.dispose();
  });

  test("le conseiller planifie l'installation sur un créneau du matin", async ({ page }) => {
    const crm = new Crm(page);
    const dateRendezVous = prochainJourHorsDimanche(2);

    await test.step('Le conseiller ouvre la commande validée', async () => {
      await crm.seConnecter(PROFILS.conseiller);
      await crm.ouvrirCommandeParSonAdresse(numero);
      await expect(crm.statut).toHaveText('Validée');
      await expect(crm.rendezVous).toHaveText('Non planifié');
    });

    await test.step('Il choisit une date et le créneau du matin puis confirme', async () => {
      await crm.planifierInstallation(dateRendezVous, 'Matin (8h-12h)');
    });

    await test.step("La commande passe au statut « Installation planifiée » et l'historique est tracé", async () => {
      const date = auFormatFrancais(dateRendezVous);
      await expect(crm.message).toHaveText(`Installation planifiée le ${date} (Matin (8h-12h)).`);
      await expect(crm.statut).toHaveText('Installation planifiée');
      await expect(crm.rendezVous).toHaveText(`${date} · Matin (8h-12h)`);
      await expect(crm.historique).toContainText(`Installation planifiée le ${date} (Matin (8h-12h)) par Claire Martin (Conseiller)`);
      await expect(crm.formulairePlanification).toBeHidden();
    });
  });

  test('refuse un rendez-vous fixé un dimanche', async ({ page }) => {
    const crm = new Crm(page);
    await crm.seConnecter(PROFILS.conseiller);
    await crm.ouvrirCommandeParSonAdresse(numero);
    await crm.planifierInstallation(prochainDimanche(1), 'Après-midi (14h-18h)');
    await expect(page.getByText("Aucune installation n'est possible le dimanche.")).toBeVisible();
    await expect(crm.statut).toHaveText('Validée');
  });

  test('le profil lecture seule ne peut pas planifier', async ({ page }) => {
    const crm = new Crm(page);
    await crm.seConnecter(PROFILS.lecture);
    await crm.ouvrirCommandeParSonAdresse(numero);
    await expect(crm.formulairePlanification).toBeHidden();
    await expect(page.getByText("Accès en lecture seule : aucune action n'est possible avec ce profil.")).toBeVisible();
  });
});
