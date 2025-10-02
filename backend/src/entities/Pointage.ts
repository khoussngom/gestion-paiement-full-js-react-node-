import { IPointage } from '@/interfaces/entities';
import { StatutPresence, TypePointage } from '@/enums';

export class Pointage implements IPointage {
  id: string;
  employeId: string;
  entrepriseId: string;
  date: Date;
  heureArrivee?: Date;
  heureSortie?: Date;
  typePointage: TypePointage;
  statutPresence: StatutPresence;
  tempsTraite: Date;
  adresseIP?: string;
  userAgent?: string;
  notes?: string;
  valideParVigile: boolean;
  vigileId?: string;

  constructor(donnees: Partial<IPointage>) {
    this.id = donnees.id || '';
    this.employeId = donnees.employeId || '';
    this.entrepriseId = donnees.entrepriseId || '';
    this.date = donnees.date || new Date();
    this.heureArrivee = donnees.heureArrivee;
    this.heureSortie = donnees.heureSortie;
    this.typePointage = donnees.typePointage || TypePointage.ENTREE;
    this.statutPresence = donnees.statutPresence || StatutPresence.PRESENT;
    this.tempsTraite = donnees.tempsTraite || new Date();
    this.adresseIP = donnees.adresseIP;
    this.userAgent = donnees.userAgent;
    this.notes = donnees.notes;
    this.valideParVigile = donnees.valideParVigile || false;
    this.vigileId = donnees.vigileId;
  }

  /**
   * Détermine le statut de présence basé sur l'heure d'arrivée
   */
  static determinerStatutPresence(heureArrivee: Date): StatutPresence {
    const heures = heureArrivee.getHours();
    const minutes = heureArrivee.getMinutes();
    const heureEnMinutes = heures * 60 + minutes;
    
    // 8h30 = 510 minutes
    const heureLimite = 8 * 60 + 30;
    
    if (heureEnMinutes <= heureLimite) {
      return StatutPresence.PRESENT;
    } else {
      return StatutPresence.RETARD;
    }
  }

  /**
   * Calcule le temps de travail en minutes
   */
  calculerTempsTravaile(): number {
    if (!this.heureArrivee || !this.heureSortie) {
      return 0;
    }
    
    const diff = this.heureSortie.getTime() - this.heureArrivee.getTime();
    return Math.floor(diff / (1000 * 60)); // Retourne en minutes
  }

  /**
   * Calcule les heures de retard en minutes
   */
  calculerTempsRetard(): number {
    if (!this.heureArrivee || this.statutPresence !== StatutPresence.RETARD) {
      return 0;
    }
    
    const heures = this.heureArrivee.getHours();
    const minutes = this.heureArrivee.getMinutes();
    const heureEnMinutes = heures * 60 + minutes;
    const heureLimite = 8 * 60 + 30; // 8h30
    
    return Math.max(0, heureEnMinutes - heureLimite);
  }

  /**
   * Vérifie si le pointage est valide
   */
  estValide(): boolean {
    return !!this.employeId && !!this.entrepriseId && !!this.date;
  }

  /**
   * Enregistre l'entrée de l'employé
   */
  enregistrerEntree(heure?: Date): void {
    const maintenant = heure || new Date();
    this.heureArrivee = maintenant;
    this.typePointage = TypePointage.ENTREE;
    this.statutPresence = Pointage.determinerStatutPresence(maintenant);
    this.tempsTraite = new Date();
  }

  /**
   * Enregistre la sortie de l'employé
   */
  enregistrerSortie(heure?: Date): void {
    const maintenant = heure || new Date();
    this.heureSortie = maintenant;
    this.typePointage = TypePointage.SORTIE;
    this.tempsTraite = new Date();
  }

  /**
   * Marque le pointage comme validé par un vigile
   */
  validerParVigile(vigileId: string): void {
    this.valideParVigile = true;
    this.vigileId = vigileId;
  }

  /**
   * Ajoute une note au pointage
   */
  ajouterNote(note: string): void {
    this.notes = this.notes ? `${this.notes}\n${note}` : note;
  }

  /**
   * Obtient un résumé formaté du pointage
   */
  obtenirResume(): string {
    const dateStr = this.date.toLocaleDateString('fr-FR');
    const heureArriveeStr = this.heureArrivee ? this.heureArrivee.toLocaleTimeString('fr-FR') : 'Non définie';
    const heureSortieStr = this.heureSortie ? this.heureSortie.toLocaleTimeString('fr-FR') : 'Non définie';
    
    return `Pointage du ${dateStr}: Arrivée ${heureArriveeStr}, Sortie ${heureSortieStr}, Statut: ${this.statutPresence}`;
  }

  /**
   * Vérifie si l'employé est encore au travail
   */
  estEncoreAuTravail(): boolean {
    return !!this.heureArrivee && !this.heureSortie;
  }

  /**
   * Calcule les heures normales (jusqu'à 8h par jour)
   */
  calculerHeuresNormales(): number {
    const tempsTotal = this.calculerTempsTravaile();
    const heuresNormales = Math.min(tempsTotal / 60, 8);
    return Math.max(0, heuresNormales);
  }

  /**
   * Calcule les heures supplémentaires (au-delà de 8h)
   */
  calculerHeuresSupplementaires(): number {
    const tempsTotal = this.calculerTempsTravaile();
    const heuresSupp = (tempsTotal / 60) - 8;
    return Math.max(0, heuresSupp);
  }

  /**
   * Marque l'employé comme absent (pour les processus automatiques)
   */
  marquerAbsent(): void {
    this.statutPresence = StatutPresence.ABSENT;
    this.notes = 'Marqué automatiquement comme absent - Aucun pointage avant 16h00';
  }

  /**
   * Vérifie si le pointage nécessite une attention particulière
   */
  necessiteAttention(): boolean {
    return this.statutPresence === StatutPresence.ABSENT ||
           this.statutPresence === StatutPresence.RETARD ||
           this.calculerTempsRetard() > 60 || // Plus d'1h de retard
           (this.calculerTempsTravaile() / 60) < 4; // Moins de 4h de travail
  }

  /**
   * Obtient la couleur associée au statut (pour l'interface)
   */
  obtenirCouleurStatut(): string {
    switch (this.statutPresence) {
      case StatutPresence.PRESENT:
        return '#10B981'; // Vert
      case StatutPresence.RETARD:
        return '#F59E0B'; // Orange
      case StatutPresence.ABSENT:
        return '#EF4444'; // Rouge
      case StatutPresence.CONGE:
        return '#3B82F6'; // Bleu
      case StatutPresence.MALADIE:
        return '#8B5CF6'; // Violet
      default:
        return '#6B7280'; // Gris
    }
  }
}