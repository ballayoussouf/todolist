"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const result = await connection_1.default.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    }
    catch (error) {
        res.json({ success: false, error: 'Erreur lors de la récupération des tâches' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { title, description, priority, due_date, category_id } = req.body;
        const result = await connection_1.default.query('INSERT INTO tasks (title, description, priority, due_date, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [title, description, priority, due_date, category_id]);
        res.json({ success: true, data: result.rows[0] });
    }
    catch (error) {
        res.json({ success: false, error: 'Erreur lors de la création de la tâche' });
    }
});
exports.default = router;
