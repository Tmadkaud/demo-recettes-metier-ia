// Recette REC-001 : voir recettes/REC-001-souscription-et-validation.md
import { expect, test } from '@playwright/test';
import { clientDeTest, prochainJourHorsDimanche, auFormatFrancais } from '../donnees/clients';
import { PROFILS } from '../donnees/profils';
import { Crm } from '../pages/crm';
import { SiteSouscription } from '../pages/site';

test.describe('REC-001 · Souscription en ligne puis validation dans le CRM', () => {
  test('une commande passée sur le site arrive dans le CRM et un conseiller la valide', async ({ page, browser }) => {
    const client = clientDeTest({ civilite: 'Madame', prenom: 'Camille' });
    const dateInstallation = prochainJourHorsDimanche(7);
    const site = new SiteSouscription(page);
    let numero = '';

    await test.step("Le client choisit l'offre Confort avec l'option « Caméra extérieure »", async () => {
      await site.ouvrirLesOffres();
      await site.choisirOffre('Confort');
      await site.ajouterOption('Caméra extérieure');
      await expect(site.totalMensuel).toHaveText('44,90 €');
      await expect(site.fraisInstallation).toHaveText('99,00 €');
    });

    await test.step('Le client renseigne ses coordonnées et valide sa commande', async () => {
      await site.renseignerClient(client);
      await site.choisirDateInstallation(dateInstallation);
      await site.accepterLesCgv();
      await site.validerLaCommande();
      numero = await site.numeroDeCommande();
      await expect(page.getByText('Un conseiller Contoso Protect va vérifier votre commande')).toBeVisible();
    });

    // Le conseiller travaille dans sa propre session, indépendante de celle du client.
    const contexteConseiller = await browser.newContext();
    const crm = new Crm(await contexteConseiller.newPage());

    await test.step('Le conseiller retrouve la nouvelle commande dans le CRM', async () => {
      await crm.seConnecter(PROFILS.conseiller);
      await crm.rechercher(client.nom);
      const ligne = crm.ligneDeCommande(numero);
      await expect(ligne).toContainText(`${client.prenom} ${client.nom}`);
      await expect(ligne).toContainText('Nouvelle');
      await crm.ouvrirCommande(numero);
      await expect(crm.statut).toHaveText('Nouvelle');
      await expect(crm.page.getByText(`Madame ${client.prenom} ${client.nom}`)).toBeVisible();
      await expect(crm.totalMensuel).toHaveText('44,90 € / mois');
      await expect(crm.page.getByText(auFormatFrancais(dateInstallation))).toBeVisible();
    });

    await test.step('Le conseiller valide la commande', async () => {
      await crm.validerLaCommande();
      await expect(crm.message).toHaveText('Commande validée.');
      await expect(crm.statut).toHaveText('Validée');
      await expect(crm.historique).toContainText('Commande validée par Claire Martin (Conseiller)');
    });

    await contexteConseiller.close();
  });
});
