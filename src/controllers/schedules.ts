import { Request, Response } from 'express';
import { query } from '../config/db';

export const getSchedules = async (req: Request, res: Response) => {
    const { portal } = req.query;
    try {
        let sql = 'SELECT * FROM schedules';
        const params = [];
        if (portal) {
            sql += ' WHERE portal = $1';
            params.push(portal);
        }
        sql += ' ORDER BY date ASC, time ASC';
        const result = await query(sql, params);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedules', error });
    }
};

export const createSchedule = async (req: Request, res: Response) => {
    const { title, description, date, time, location, portal, user_id } = req.body;
    try {
        const result = await query(
            'INSERT INTO schedules (title, description, date, time, location, portal, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, description, date, time, location, portal, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating schedule', error });
    }
};

export const deleteSchedule = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM schedules WHERE id = $1', [id]);
        res.status(200).json({ message: 'Schedule deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting schedule', error });
    }
};
