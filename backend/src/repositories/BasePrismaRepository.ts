import { PrismaClient } from '@prisma/client';

export class BasePrismaRepository {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  protected async obtenirAvecRelations<T>(
    modele: any,
    inclusions: any = {},
    condition: any = {}
  ): Promise<T[]> {
    return await modele.findMany({
      where: condition,
      include: inclusions
    });
  }

  protected async obtenirParId<T>(
    modele: any,
    id: string,
    inclusions: any = {}
  ): Promise<T | null> {
    return await modele.findUnique({
      where: { id },
      include: inclusions
    });
  }

  protected async creerAvecDonnees<T>(
    modele: any,
    donnees: any
  ): Promise<T> {
    return await modele.create({
      data: donnees
    });
  }

  protected async modifierParId<T>(
    modele: any,
    id: string,
    donnees: any
  ): Promise<T> {
    return await modele.update({
      where: { id },
      data: donnees
    });
  }

  protected async supprimerParId(
    modele: any,
    id: string
  ): Promise<void> {
    await modele.delete({
      where: { id }
    });
  }

  async fermerConnexion(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
