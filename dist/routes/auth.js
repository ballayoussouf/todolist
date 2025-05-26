"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const result = await connection_1.default.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email', [username, email, hashedPassword]);
        res.json({ success: true, data: result.rows[0] });
    }
    catch (error) {
        res.json({ success: false, error: 'Erreur lors de l\'inscription' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await connection_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.json({ success: false, error: 'Utilisateur non trouvé' });
        }
        const user = result.rows[0];
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.json({ success: false, error: 'Mot de passe incorrect' });
        }
        res.json({
            success: true,
            data: { id: user.id, username: user.username, email: user.email }
        });
    }
    catch (error) {
        res.json({ success: false, error: 'Erreur lors de la connexion' });
    }
});
exports.default = router;
