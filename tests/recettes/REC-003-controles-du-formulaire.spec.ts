// Recette REC-003 : voir recettes/REC-003-controles-du-formulaire.md
import { expect, test } from '@playwright/test';
import { clientDeTest, dansNJours, prochainDimanche, prochainJourHorsDimanche } from '../donnees/clients';
import { SiteSouscription } from '../pages/site';

// Cas de saisie invalide : un jeu de données que l'AMOA peut enrichir sans toucher au code du test.
const SAISIES_INVALIDES = [
  { cas: 'un code postal à 4 chiffres', champ: 'Code postal', valeur: '4400', message: 'Le code postal doit comporter 5 chiffres.' },
  { cas: 'une adresse e-mail incomplète', champ: 'Adresse e-mail', valeur: 'jean.dupont@', message: 'Adresse e-mail invalide.' },
  { cas: 'un téléphone trop court', champ: 'Téléphone', valeur: '06 12', message: 'Numéro de téléphone invalide.' },
];

test.describe('REC-003 · Contrôles du formulaire de souscription', () => {
  let site: SiteSouscription;

  test.beforeEach(async ({ page }) => {
    site = new SiteSouscription(page);
    await site.ouvrirLeFormulaire();
    await site.selectionnerOffre('Essentiel');
    await site.renseignerClient(clientDeTest());
    await site.choisirDateInstallation(prochainJourHorsDimanche(7));
    await site.accepterLesCgv();
  });

  for (const saisie of SAISIES_INVALIDES) {
    test(`refuse ${saisie.cas}`, async ({ page }) => {
      await site.saisir(saisie.champ, saisie.valeur);
      await site.validerLaCommande();
      await expect(site.messageErreur(saisie.message)).toBeVisible();
      await expect(site.resumeErreurs).toHaveText('Le formulaire contient 1 erreur.');
      await expect(page).toHaveURL(/\/souscrire/);
    });
  }

  test("impose au moins 3 jours avant la date d'installation", async () => {
    await site.choisirDateInstallation(dansNJours(1));
    await site.validerLaCommande();
    await expect(site.messageErreur("La date d'installation doit être au moins 3 jours après aujourd'hui.")).toBeVisible();
  });

  test("refuse une installation le dimanche", async () => {
    await site.choisirDateInstallation(prochainDimanche(4));
    await site.validerLaCommande();
    await expect(site.messageErreur("Aucune installation n'est possible le dimanche.")).toBeVisible();
  });

  test("exige l'acceptation des conditions générales de vente", async ({ page }) => {
    await page.getByRole('checkbox', { name: "J'accepte les conditions générales de vente" }).uncheck();
    await site.validerLaCommande();
    await expect(site.messageErreur('Vous devez accepter les conditions générales de vente.')).toBeVisible();
  });

  test('recalcule le total mensuel en direct selon l\'offre et les options', async () => {
    await expect(site.totalMensuel).toHaveText('29,90 €');
    await site.selectionnerOffre('Confort');
    await site.ajouterOption('Détecteur de fumée connecté');
    await site.ajouterOption('Caméra extérieure');
    await expect(site.totalMensuel).toHaveText('47,90 €');
  });

  test("offre les frais d'installation avec le code BIENVENUE", async ({ page }) => {
    await expect(site.fraisInstallation).toHaveText('99,00 €');
    await site.saisirCodePromo('bienvenue');
    await expect(site.fraisInstallation).toHaveText('0,00 €');
    await expect(page.getByText('(offerts avec le code BIENVENUE)')).toBeVisible();
  });
});
