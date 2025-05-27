import express, { Request, Response } from 'express';
import pool from '../db/connection';

const router = express.Router();

// Récupérer toutes les tâches d'un utilisateur
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID utilisateur requis' 
      });
    }

    const result = await pool.query(`
      SELECT t.*, tc.name as category_name, tc.description as category_description
      FROM tasks t
      LEFT JOIN task_categories tc ON t.category_id = tc.id
      WHERE t.user_id = $1 
      ORDER BY t.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Créer une nouvelle tâche
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, priority, due_date, category_id, user_id, location } = req.body;

    if (!title || !user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Titre et ID utilisateur requis' 
      });
    }

    const result = await pool.query(`
      INSERT INTO tasks (user_id, category_id, title, description, priority, due_date, location) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `, [user_id, category_id, title, description, priority || 0, due_date, location]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Tâche créée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Mettre à jour une tâche
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const { title, description, priority, due_date, category_id, completed, location } = req.body;

    const result = await pool.query(`
      UPDATE tasks 
      SET title = $1, description = $2, priority = $3, due_date = $4, 
          category_id = $5, completed = $6, location = $7
      WHERE id = $8 
      RETURNING *
    `, [title, description, priority, due_date, category_id, completed, location, taskId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tâche non trouvée' 
      });
    }

    // Si la tâche est marquée comme terminée, mettre à jour les statistiques
    if (completed) {
      await pool.query(`
        UPDATE productivity_stats 
        SET tasks_completed = tasks_completed + 1, points = points + 10 
        WHERE user_id = (SELECT user_id FROM tasks WHERE id = $1)
      `, [taskId]);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Tâche mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Supprimer une tâche
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;

    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [taskId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tâche non trouvée' 
      });
    }

    res.json({
      success: true,
      message: 'Tâche supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Récupérer toutes les catégories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM task_categories ORDER BY name');

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Récupérer les statistiques d'un utilisateur
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const statsResult = await pool.query(
      'SELECT * FROM productivity_stats WHERE user_id = $1',
      [userId]
    );

    const tasksResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN due_date < NOW() AND completed = false THEN 1 END) as overdue_tasks
      FROM tasks 
      WHERE user_id = $1
    `, [userId]);

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0] || { tasks_completed: 0, points: 0, badges: '', last_week_performance: '' },
        summary: tasksResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Créer un rappel pour une tâche
router.post('/reminders', async (req: Request, res: Response) => {
  try {
    const { task_id, reminder_time, repeat_interval, method } = req.body;

    if (!task_id || !reminder_time) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de tâche et heure de rappel requis' 
      });
    }

    const result = await pool.query(`
      INSERT INTO reminders (task_id, reminder_time, repeat_interval, method) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `, [task_id, reminder_time, repeat_interval, method || 'push_notification']);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Rappel créé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la création du rappel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Récupérer les rappels d'une tâche
router.get('/reminders/:taskId', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId;

    const result = await pool.query(
      'SELECT * FROM reminders WHERE task_id = $1 ORDER BY reminder_time',
      [taskId]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des rappels:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

export default router;