// Le CRM des conseillers, décrit avec le vocabulaire métier.
import { expect, type Locator, type Page } from '@playwright/test';
import type { Profil } from '../donnees/profils';

export type Creneau = 'Matin (8h-12h)' | 'Après-midi (14h-18h)';

export class Crm {
  readonly statut: Locator;
  readonly totalMensuel: Locator;
  readonly rendezVous: Locator;
  readonly historique: Locator;
  readonly message: Locator;
  readonly erreur: Locator;
  readonly boutonValider: Locator;
  readonly boutonRefuser: Locator;
  readonly formulairePlanification: Locator;

  constructor(readonly page: Page) {
    this.statut = page.getByTestId('statut');
    this.totalMensuel = page.getByTestId('total-mensuel');
    this.rendezVous = page.getByTestId('rendez-vous');
    this.historique = page.getByRole('list', { name: 'Historique' });
    this.message = page.getByRole('status');
    this.erreur = page.locator('#erreur-action');
    this.boutonValider = page.getByRole('button', { name: 'Valider la commande' });
    this.boutonRefuser = page.getByRole('button', { name: 'Refuser la commande' });
    this.formulairePlanification = page.getByRole('form', { name: "Planifier l'installation" });
  }

  async seConnecter(profil: Profil) {
    await this.page.goto('/crm');
    await this.page.getByLabel('Identifiant').fill(profil.identifiant);
    await this.page.getByLabel('Mot de passe').fill(profil.motDePasse);
    await this.page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(this.page.getByRole('heading', { name: 'Commandes', exact: true })).toBeVisible();
    await expect(this.page.getByTestId('utilisateur')).toHaveText(`${profil.nom} · ${profil.libelleRole}`);
  }

  async rechercher(texte: string) {
    await this.page.getByRole('searchbox', { name: 'Rechercher' }).fill(texte);
  }

  ligneDeCommande(numero: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('link', { name: numero, exact: true }) });
  }

  async ouvrirCommande(numero: string) {
    await this.page.getByRole('link', { name: numero, exact: true }).click();
    await expect(this.page.getByRole('heading', { name: `Commande ${numero}` })).toBeVisible();
  }

  async ouvrirCommandeParSonAdresse(numero: string) {
    await this.page.goto(`/crm/commande?numero=${encodeURIComponent(numero)}`);
    await expect(this.page.getByRole('heading', { name: `Commande ${numero}` })).toBeVisible();
  }

  async validerLaCommande() {
    await this.boutonValider.click();
  }

  async refuserLaCommande(motif: string) {
    await this.boutonRefuser.click();
    await this.page.getByLabel('Motif du refus').fill(motif);
    await this.page.getByRole('button', { name: 'Confirmer le refus' }).click();
  }

  async planifierInstallation(isoJour: string, creneau: Creneau) {
    await this.page.getByLabel('Date du rendez-vous').fill(isoJour);
    await this.page.getByLabel('Créneau').selectOption({ label: creneau });
    await this.page.getByRole('button', { name: 'Confirmer la planification' }).click();
  }
}
