import express from 'express';
import cors from 'cors';
import path from 'path';
import routeurPrincipal from '@/routes';
import { MESSAGES_ERREUR } from '@/enums/messages';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de base
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (logos uploadés)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes principales
app.use('/api', routeurPrincipal);

// Route racine
app.get('/', (req, res) => {
  res.json({
    succes: true,
    message: 'API de Gestion des Salaires Multi-Entreprises',
    version: '1.0.0',
    documentation: '/api/docs',
    sante: '/api/sante'
  });
});

// Middleware de gestion d'erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    succes: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`,
    suggestion: 'Vérifiez la documentation de l\'API'
  });
});

// Middleware de gestion d'erreurs globales
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur serveur:', error);
  
  // Erreur de validation Zod
  if (error.name === 'ZodError') {
    return res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors.map((err: any) => ({
        champ: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Erreur Prisma
  if (error.code === 'P2002') {
    return res.status(409).json({
      succes: false,
      message: 'Cette ressource existe déjà',
      details: error.meta
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      succes: false,
      message: MESSAGES_ERREUR.ELEMENT_INTROUVABLE
    });
  }

  // Erreur générique
  res.status(500).json({
    succes: false,
    message: MESSAGES_ERREUR.ERREUR_SERVEUR,
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`💼 Environnement: ${process.env.NODE_ENV || 'development'}`);
  
  // Affichage des informations de base de données
  if (process.env.DATABASE_URL) {
    console.log(`🗄️  Base de données: Connectée`);
  } else {
    console.warn(`⚠️  Attention: DATABASE_URL non définie`);
  }
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Arrêt du serveur...');
  process.exit(0);
});

export default app;
