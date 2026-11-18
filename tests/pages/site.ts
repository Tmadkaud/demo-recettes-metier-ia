// Le site public de souscription, décrit avec le vocabulaire métier.
import { expect, type Locator, type Page } from '@playwright/test';
import type { Client } from '../donnees/clients';

export type NomOffre = 'Essentiel' | 'Confort' | 'Premium';

export class SiteSouscription {
  readonly totalMensuel: Locator;
  readonly fraisInstallation: Locator;
  readonly resumeErreurs: Locator;

  constructor(readonly page: Page) {
    this.totalMensuel = page.getByTestId('total-mensuel');
    this.fraisInstallation = page.getByTestId('frais-installation');
    // Le résumé des erreurs est annoncé aux lecteurs d’écran (rôle alert).
    this.resumeErreurs = page.getByRole('alert');
  }

  async ouvrirLesOffres() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'Nos offres' })).toBeVisible();
  }

  async choisirOffre(offre: NomOffre) {
    await this.page.getByRole('link', { name: `Choisir l'offre ${offre}` }).click();
    await expect(this.page.getByRole('heading', { name: 'Souscrire à la télésurveillance' })).toBeVisible();
    await expect(this.page.getByRole('radio', { name: new RegExp(`^${offre} —`) })).toBeChecked();
  }

  async ouvrirLeFormulaire() {
    await this.page.goto('/souscrire');
    await expect(this.page.getByRole('heading', { name: 'Souscrire à la télésurveillance' })).toBeVisible();
  }

  async selectionnerOffre(offre: NomOffre) {
    await this.page.getByRole('radio', { name: new RegExp(`^${offre} —`) }).check();
  }

  async ajouterOption(option: string) {
    await this.page.getByRole('checkbox', { name: new RegExp(`^${option} \\(`) }).check();
  }

  async renseignerClient(client: Client) {
    await this.page.getByLabel('Civilité').selectOption(client.civilite);
    await this.page.getByLabel('Prénom', { exact: true }).fill(client.prenom);
    await this.page.getByLabel('Nom', { exact: true }).fill(client.nom);
    await this.page.getByLabel('Adresse e-mail').fill(client.email);
    await this.page.getByLabel('Téléphone').fill(client.telephone);
    await this.page.getByLabel('Adresse', { exact: true }).fill(client.adresse);
    await this.page.getByLabel('Code postal').fill(client.codePostal);
    await this.page.getByLabel('Ville').fill(client.ville);
    await this.page.getByRole('radio', { name: client.logement }).check();
  }

  async saisir(libelle: string, valeur: string) {
    await this.page.getByLabel(libelle, { exact: true }).fill(valeur);
  }

  async choisirDateInstallation(isoJour: string) {
    await this.page.getByLabel("Date d'installation souhaitée").fill(isoJour);
  }

  async saisirCodePromo(code: string) {
    await this.page.getByLabel('Code promo (facultatif)').fill(code);
  }

  async accepterLesCgv() {
    await this.page.getByRole('checkbox', { name: "J'accepte les conditions générales de vente" }).check();
  }

  async validerLaCommande() {
    await this.page.getByRole('button', { name: 'Valider ma commande' }).click();
  }

  // Lit le numéro affiché sur la page de confirmation (format CP-AAAA-NNNNNN).
  async numeroDeCommande(): Promise<string> {
    await expect(this.page.getByRole('heading', { name: 'Merci, votre commande est enregistrée' })).toBeVisible();
    const numero = this.page.getByTestId('numero-commande');
    await expect(numero).toHaveText(/^CP-\d{4}-\d{6}$/);
    return (await numero.textContent()) ?? '';
  }

  messageErreur(texte: string): Locator {
    return this.page.getByText(texte, { exact: true });
  }
}
