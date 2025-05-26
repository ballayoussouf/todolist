"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
// Route d'inscription
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await connection_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
        }
        // Hasher le mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Insérer le nouvel utilisateur
        const result = await connection_1.default.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email', [username, email, hashedPassword]);
        const newUser = result.rows[0];
        res.status(201).json({
            success: true,
            data: newUser,
            message: 'Utilisateur créé avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
// Route de connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Trouver l'utilisateur par email
        const result = await connection_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        const user = result.rows[0];
        // Vérifier le mot de passe
        const passwordMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        // Retourner les informations utilisateur (sans le mot de passe)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: userWithoutPassword,
            message: 'Connexion réussie'
        });
    }
    catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
exports.default = router;
