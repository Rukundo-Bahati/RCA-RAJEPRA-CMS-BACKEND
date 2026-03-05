import { Request, Response } from 'express';
import { query } from '../config/db';

export const getNotes = async (req: Request, res: Response) => {
    const { portal } = req.query;
    try {
        let sql = 'SELECT * FROM notes';
        const params = [];
        if (portal) {
            sql += ' WHERE portal = $1';
            params.push(portal);
        }
        sql += ' ORDER BY created_at DESC';
        const result = await query(sql, params);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notes', error });
    }
};

export const createNote = async (req: Request, res: Response) => {
    const { title, content, portal, user_id } = req.body;
    try {
        const result = await query(
            'INSERT INTO notes (title, content, portal, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, content, portal, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating note', error });
    }
};

export const updateNote = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, content } = req.body;
    try {
        const result = await query(
            'UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *',
            [title, content, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating note', error });
    }
};

export const deleteNote = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM notes WHERE id = $1', [id]);
        res.status(200).json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting note', error });
    }
};
