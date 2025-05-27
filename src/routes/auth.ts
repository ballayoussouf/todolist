
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../db/connection';

const router = express.Router();

// Fonction utilitaire pour hasher avec MD5
const hashWithMD5 = (password: string): string => {
  return crypto.createHash('md5').update(password).digest('hex');
};

// Route d'inscription
router.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('Tentative d\'inscription:', req.body);
    const { username, email, password } = req.body;

    // Validation des données
    if (!username || !email || !password) {
      console.log('Données manquantes:', { username: !!username, email: !!email, password: !!password });
      return res.status(400).json({ 
        success: false, 
        error: 'Tous les champs sont requis' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('Utilisateur existant trouvé pour:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Hasher le mot de passe avec MD5
    const hashedPassword = hashWithMD5(password);
    console.log('Mot de passe hashé avec MD5 avec succès');

    // Insérer le nouvel utilisateur
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );

    const newUser = result.rows[0];
    console.log('Nouvel utilisateur créé:', newUser.id);

    // Créer des statistiques initiales pour l'utilisateur
    await pool.query(
      'INSERT INTO productivity_stats (user_id, tasks_completed, points) VALUES ($1, 0, 0)',
      [newUser.id]
    );

    console.log('Statistiques créées pour l\'utilisateur:', newUser.id);

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        created_at: newUser.created_at
      },
      message: 'Utilisateur créé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur lors de l\'inscription' 
    });
  }
});

// Route de connexion
router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('Tentative de connexion:', { email: req.body.email });
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      console.log('Données manquantes pour la connexion');
      return res.status(400).json({ 
        success: false, 
        error: 'Email et mot de passe requis' 
      });
    }

    // Trouver l'utilisateur par email
    console.log('Recherche de l\'utilisateur avec email:', email);
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('Aucun utilisateur trouvé avec cet email:', email);
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    const user = result.rows[0];
    console.log('Utilisateur trouvé:', user.id, user.username);

    // Vérifier le mot de passe avec MD5
    console.log('Vérification du mot de passe avec MD5');
    const hashedInputPassword = hashWithMD5(password);
    const passwordMatch = hashedInputPassword === user.password_hash;
    
    console.log('Hash du mot de passe saisi:', hashedInputPassword);
    console.log('Hash stocké en base:', user.password_hash);
    console.log('Comparaison des mots de passe:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('Mot de passe incorrect pour:', email);
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    console.log('Mot de passe correct, connexion réussie');

    // Mettre à jour la dernière connexion
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    console.log('Dernière connexion mise à jour');

    // Retourner les informations utilisateur (sans le mot de passe)
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        last_login: new Date()
      },
      message: 'Connexion réussie'
    });

  } catch (error) {
    console.error('Erreur détaillée lors de la connexion:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur lors de la connexion' 
    });
  }
});

export default router;