import { StatutPointage } from '@/enums';
import { IPointage } from '@/interfaces/entities';

export class Pointage implements IPointage {
  id: string;
  employeId: string;
  entrepriseId: string;
  datePointage: Date;
  heurePointage: Date;
  statut: StatutPointage;
  latitude?: string;
  longitude?: string;
  notes?: string;
  dateCreation: Date;

  constructor(donnees: any) {
    this.id = donnees.id || '';
    this.employeId = donnees.employeId || '';
    this.entrepriseId = donnees.entrepriseId || '';
    this.datePointage = donnees.datePointage || new Date();
    this.heurePointage = donnees.heurePointage || new Date();
    this.statut = donnees.statut || StatutPointage.ABSENT;
    this.latitude = donnees.latitude;
    this.longitude = donnees.longitude;
    this.notes = donnees.notes;
    this.dateCreation = donnees.dateCreation || new Date();
  }

  public estPresent(): boolean {
    return this.statut === StatutPointage.PRESENT;
  }

  public estEnRetard(): boolean {
    return this.statut === StatutPointage.RETARD;
  }

  public estAbsent(): boolean {
    return this.statut === StatutPointage.ABSENT;
  }
}
