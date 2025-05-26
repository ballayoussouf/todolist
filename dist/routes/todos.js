"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
// Récupérer toutes les todos d'un utilisateur
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'ID utilisateur requis' });
        }
        const result = await connection_1.default.query('SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des todos:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
// Créer une nouvelle todo
router.post('/', async (req, res) => {
    try {
        const { title, description, priority, dueDate, categoryId, userId } = req.body;
        const result = await connection_1.default.query('INSERT INTO todos (title, description, priority, due_date, category_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [title, description, priority, dueDate, categoryId, userId]);
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Todo créée avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de la création de la todo:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
// Mettre à jour une todo
router.put('/:id', async (req, res) => {
    try {
        const todoId = req.params.id;
        const { title, description, priority, dueDate, categoryId, completed } = req.body;
        const result = await connection_1.default.query('UPDATE todos SET title = $1, description = $2, priority = $3, due_date = $4, category_id = $5, completed = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *', [title, description, priority, dueDate, categoryId, completed, todoId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Todo non trouvée' });
        }
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Todo mise à jour avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour de la todo:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
// Supprimer une todo
router.delete('/:id', async (req, res) => {
    try {
        const todoId = req.params.id;
        const result = await connection_1.default.query('DELETE FROM todos WHERE id = $1 RETURNING *', [todoId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Todo non trouvée' });
        }
        res.json({
            success: true,
            message: 'Todo supprimée avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de la suppression de la todo:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
// Récupérer toutes les catégories d'un utilisateur
router.get('/categories', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'ID utilisateur requis' });
        }
        const result = await connection_1.default.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY name', [userId]);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
// Créer une nouvelle catégorie
router.post('/categories', async (req, res) => {
    try {
        const { name, color, userId } = req.body;
        const result = await connection_1.default.query('INSERT INTO categories (name, color, user_id) VALUES ($1, $2, $3) RETURNING *', [name, color, userId]);
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Catégorie créée avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de la création de la catégorie:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
exports.default = router;
