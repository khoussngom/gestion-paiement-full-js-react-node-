import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

export class ServiceBulletinPDF {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Génère un bulletin de paie en PDF
   */
  async genererBulletinPDF(bulletinId: string): Promise<Buffer> {
    try {
      // Récupérer les données complètes du bulletin
      const bulletin = await this.prisma.bulletinPaie.findUnique({
        where: { id: bulletinId },
        include: {
          employe: true,
          cyclePaie: true,
          entreprise: true
        }
      });

      if (!bulletin) {
        throw new Error('Bulletin de paie non trouvé');
      }

      // Générer le HTML du bulletin
      const htmlContent = this.genererHTMLBulletin(bulletin);

      // Convertir en PDF avec Puppeteer
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  }

  /**
   * Génère le HTML stylisé du bulletin de paie
   */
  private genererHTMLBulletin(bulletin: any): string {
    const dateDebut = new Date(bulletin.cyclePaie.dateDebut).toLocaleDateString('fr-FR');
    const dateFin = new Date(bulletin.cyclePaie.dateFin).toLocaleDateString('fr-FR');
    const dateGeneration = new Date().toLocaleDateString('fr-FR');

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bulletin de Paie</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
          }
          .bulletin-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
          }
          .header .subtitle {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 30px;
          }
          .section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #667eea;
          }
          .section h2 {
            margin: 0 0 15px 0;
            color: #667eea;
            font-size: 18px;
            font-weight: 600;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px dotted #ddd;
          }
          .info-label {
            font-weight: 500;
            color: #555;
          }
          .info-value {
            font-weight: 600;
            color: #333;
          }
          .montant {
            font-size: 16px;
            color: #2d5aa0;
            font-weight: bold;
          }
          .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status.en-attente {
            background: #fff3cd;
            color: #856404;
          }
          .status.paye {
            background: #d4edda;
            color: #155724;
          }
          .status.partiel {
            background: #f8d7da;
            color: #721c24;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            border-top: 1px solid #eee;
            font-size: 12px;
          }
          .signature-section {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          .signature-box {
            text-align: center;
            padding: 20px;
            border: 1px dashed #ddd;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <div class="bulletin-container">
          <div class="header">
            <h1>BULLETIN DE PAIE</h1>
            <div class="subtitle">${bulletin.entreprise.nom}</div>
            <div class="subtitle">Période: ${dateDebut} au ${dateFin}</div>
          </div>
          
          <div class="content">
            <!-- Informations Employé -->
            <div class="section">
              <h2>👤 Informations Employé</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Nom complet:</span>
                  <span class="info-value">${bulletin.employe.nomComplet}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Poste:</span>
                  <span class="info-value">${bulletin.employe.poste}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type de contrat:</span>
                  <span class="info-value">${bulletin.employe.typeContrat}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date d'embauche:</span>
                  <span class="info-value">${new Date(bulletin.employe.dateEmbauche).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>

            <!-- Détails du Cycle -->
            <div class="section">
              <h2>📅 Détails du Cycle de Paie</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Nom du cycle:</span>
                  <span class="info-value">${bulletin.cyclePaie.nom}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type de cycle:</span>
                  <span class="info-value">${bulletin.cyclePaie.typeCycle}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Jours travaillés:</span>
                  <span class="info-value">${bulletin.joursTravailles || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Heures travaillées:</span>
                  <span class="info-value">${bulletin.heuresTravailleurs || 'N/A'}</span>
                </div>
              </div>
            </div>

            <!-- Calculs Salariaux -->
            <div class="section">
              <h2>💰 Détail des Rémunérations</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Salaire brut:</span>
                  <span class="info-value montant">${Number(bulletin.salaireBrut).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Déductions:</span>
                  <span class="info-value montant">-${Number(bulletin.deductions || 0).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div class="info-item" style="border-top: 2px solid #667eea; font-size: 18px;">
                  <span class="info-label"><strong>Salaire net à payer:</strong></span>
                  <span class="info-value montant"><strong>${Number(bulletin.salaireNet).toLocaleString('fr-FR')} FCFA</strong></span>
                </div>
                <div class="info-item">
                  <span class="info-label">Statut du paiement:</span>
                  <span class="status ${bulletin.statut.toLowerCase().replace('_', '-')}">${this.obtenirLibelleStatut(bulletin.statut)}</span>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="signature-section">
              <div class="signature-box">
                <strong>Signature de l'employé</strong>
                <div style="height: 60px;"></div>
                <div>Date: ________________</div>
              </div>
              <div class="signature-box">
                <strong>Signature de l'employeur</strong>
                <div style="height: 60px;"></div>
                <div>Date: ________________</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Bulletin généré le ${dateGeneration}</p>
            <p>Ce bulletin de paie a valeur de reçu de salaire.</p>
            <p>${bulletin.entreprise.nom} - ${bulletin.entreprise.adresse || ''}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Obtient le libellé français du statut
   */
  private obtenirLibelleStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'Non payé';
      case 'PARTIEL': return 'Partiellement payé';
      case 'PAYE': return 'Payé';
      default: return statut;
    }
  }

  /**
   * Marque un bulletin comme payé et crée l'enregistrement de paiement
   */
  async validerPaiementBulletin(bulletinId: string, modePaiement: string, utilisateurId: string): Promise<void> {
    try {
      const bulletin = await this.prisma.bulletinPaie.findUnique({
        where: { id: bulletinId }
      });

      if (!bulletin) {
        throw new Error('Bulletin de paie non trouvé');
      }

      // Marquer le bulletin comme payé
      await this.prisma.bulletinPaie.update({
        where: { id: bulletinId },
        data: { statut: 'PAYE' }
      });

      // Créer l'enregistrement de paiement
      await this.prisma.paiement.create({
        data: {
          bulletinPaieId: bulletinId,
          employeId: bulletin.employeId,
          entrepriseId: bulletin.entrepriseId,
          utilisateurId: utilisateurId,
          montant: bulletin.salaireNet,
          modePaiement: modePaiement as any,
          reference: `BULL-${bulletinId}`,
          notes: `Paiement via bulletin de salaire`
        }
      });
    } catch (error) {
      console.error('Erreur lors de la validation du paiement:', error);
      throw error;
    }
  }
}