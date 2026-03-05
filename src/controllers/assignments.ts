import { Request, Response } from 'express';
import { query } from '../config/db';

export const getAssignments = async (req: Request, res: Response) => {
    const { portal } = req.query;
    try {
        let sql = `
            SELECT a.*, m.name as member_name 
            FROM assignments a
            JOIN members m ON a.member_id = m.id
        `;
        const params = [];
        if (portal) {
            sql += ' WHERE a.portal = $1';
            params.push(portal);
        }
        sql += ' ORDER BY a.due_date ASC';
        const result = await query(sql, params);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assignments', error });
    }
};

export const createAssignment = async (req: Request, res: Response) => {
    const { member_id, task, due_date, portal, assigned_by } = req.body;
    try {
        const result = await query(
            'INSERT INTO assignments (member_id, task, due_date, portal, assigned_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [member_id, task, due_date, portal, assigned_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating assignment', error });
    }
};

export const updateAssignmentStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await query(
            'UPDATE assignments SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating assignment', error });
    }
};

export const deleteAssignment = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM assignments WHERE id = $1', [id]);
        res.status(200).json({ message: 'Assignment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting assignment', error });
    }
};
