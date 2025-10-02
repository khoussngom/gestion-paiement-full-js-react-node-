import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

export class ServiceQRCode {
  /**
   * Génère un code QR unique pour un employé
   * @param employeId - ID de l'employé
   * @param entrepriseId - ID de l'entreprise
   * @returns Code unique pour l'employé
   */
  public async genererCodeQR(employeId: string, entrepriseId: string): Promise<string> {
    // Générer un code unique qui inclut l'ID de l'employé et un token aléatoire
    const timestamp = Date.now();
    const randomToken = randomBytes(16).toString('hex');
    const codeUnique = `${entrepriseId}:${employeId}:${timestamp}:${randomToken}`;
    
    // Encoder en base64 pour un QR code plus compact
    const codeQR = Buffer.from(codeUnique).toString('base64');
    
    return codeQR;
  }

  /**
   * Génère l'image du code QR au format data URL
   * @param codeQR - Code QR à convertir en image
   * @returns Data URL de l'image QR
   */
  public async genererImageQR(codeQR: string): Promise<string> {
    try {
      // Générer l'image QR au format data URL
      const imageQR = await QRCode.toDataURL(codeQR, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return imageQR;
    } catch (error) {
      throw new Error('Erreur lors de la génération de l\'image QR: ' + error);
    }
  }

  /**
   * Décode un code QR pour extraire les informations
   * @param codeQR - Code QR à décoder
   * @returns Objet contenant employeId, entrepriseId, timestamp
   */
  public decoderCodeQR(codeQR: string): { employeId: string; entrepriseId: string; timestamp: number } {
    try {
      // Décoder depuis base64
      const decoded = Buffer.from(codeQR, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      
      if (parts.length < 3) {
        throw new Error('Format de code QR invalide');
      }
      
      return {
        entrepriseId: parts[0],
        employeId: parts[1],
        timestamp: parseInt(parts[2], 10)
      };
    } catch (error) {
      throw new Error('Code QR invalide ou corrompu');
    }
  }

  /**
   * Valide un code QR
   * @param codeQR - Code QR à valider
   * @param entrepriseId - ID de l'entreprise à vérifier
   * @returns true si le code est valide
   */
  public validerCodeQR(codeQR: string, entrepriseId: string): boolean {
    try {
      const decoded = this.decoderCodeQR(codeQR);
      
      // Vérifier que le code appartient à la bonne entreprise
      if (decoded.entrepriseId !== entrepriseId) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}
