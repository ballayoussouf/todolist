import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/connection';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.json({ success: false, error: 'Erreur lors de l\'inscription' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.json({ success: false, error: 'Mot de passe incorrect' });
    }
    
    res.json({ 
      success: true, 
      data: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.json({ success: false, error: 'Erreur lors de la connexion' });
  }
});

export default router;
