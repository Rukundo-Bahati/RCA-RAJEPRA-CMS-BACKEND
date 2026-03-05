import { Request, Response } from 'express';
import { query } from '../config/db';
import { Family, FamilyMember } from '../models/Family';

// Get all families (for GrandPereMere dashboard)
export const getFamilies = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT 
                f.id, f.name, f.generation,
                f.total_members, f.total_boys, f.total_girls, f.total_y1, f.total_y2, f.total_y3,
                m.id as member_id, m.name as member_name, m.email as member_email, 
                m.phone as member_phone, m.gender as member_gender, 
                m.class as member_class, m.role as member_role
            FROM families f
            LEFT JOIN members m ON f.id = m.family_id
        `);

        // Group members by family
        const familiesMap = new Map<string, Family>();

        result.rows.forEach((row: any) => {
            if (!familiesMap.has(row.id)) {
                familiesMap.set(row.id, {
                    id: row.id.toString(),
                    name: row.name,
                    generation: row.generation,
                    total_members: row.total_members || 0,
                    total_boys: row.total_boys || 0,
                    total_girls: row.total_girls || 0,
                    total_y1: row.total_y1 || 0,
                    total_y2: row.total_y2 || 0,
                    total_y3: row.total_y3 || 0,
                    members: []
                });
            }

            if (row.member_id) {
                const family = familiesMap.get(row.id)!;
                const member: FamilyMember = {
                    id: row.member_id.toString(),
                    name: row.member_name,
                    email: row.member_email,
                    phone: row.member_phone,
                    gender: row.member_gender,
                    class: row.member_class,
                    role: row.member_role
                };

                if (row.member_role === 'Pere') {
                    family.pere = member;
                } else if (row.member_role === 'Mere') {
                    family.mere = member;
                } else {
                    family.members.push(member);
                }
            }
        });

        res.status(200).json(Array.from(familiesMap.values()));
    } catch (error) {
        console.error('Error fetching families:', error);
        res.status(500).json({ message: 'Error fetching families', error });
    }
};

// Get a specific family by ID
export const getFamilyById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await query(`
            SELECT 
                f.id, f.name, f.generation,
                f.total_members, f.total_boys, f.total_girls, f.total_y1, f.total_y2, f.total_y3,
                m.id as member_id, m.name as member_name, m.email as member_email, 
                m.phone as member_phone, m.gender as member_gender, 
                m.class as member_class, m.role as member_role
            FROM families f
            LEFT JOIN members m ON f.id = m.family_id
            WHERE f.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Family not found' });
        }

        const firstRow = result.rows[0];
        const family: Family = {
            id: firstRow.id.toString(),
            name: firstRow.name,
            generation: firstRow.generation,
            total_members: firstRow.total_members || 0,
            total_boys: firstRow.total_boys || 0,
            total_girls: firstRow.total_girls || 0,
            total_y1: firstRow.total_y1 || 0,
            total_y2: firstRow.total_y2 || 0,
            total_y3: firstRow.total_y3 || 0,
            members: []
        };

        result.rows.forEach((row: any) => {
            if (row.member_id) {
                const member: FamilyMember = {
                    id: row.member_id.toString(),
                    name: row.member_name,
                    email: row.member_email,
                    phone: row.member_phone,
                    gender: row.member_gender,
                    class: row.member_class,
                    role: row.member_role
                };

                if (row.member_role === 'Pere') {
                    family.pere = member;
                } else if (row.member_role === 'Mere') {
                    family.mere = member;
                } else {
                    family.members.push(member);
                }
            }
        });

        res.status(200).json(family);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching family', error });
    }
};

// Create a new family
export const createFamily = async (req: Request, res: Response) => {
    const {
        name, generation, total_members, total_boys, total_girls,
        total_y1, total_y2, total_y3, pere, mere, members
    } = req.body;
    try {
        const familyResult = await query(
            'INSERT INTO families (name, generation, total_members, total_boys, total_girls, total_y1, total_y2, total_y3) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [name, generation, total_members || 0, total_boys || 0, total_girls || 0, total_y1 || 0, total_y2 || 0, total_y3 || 0]
        );
        const familyId = familyResult.rows[0].id;

        const allMembers = [];
        if (pere) allMembers.push({ ...pere, role: 'Pere' });
        if (mere) allMembers.push({ ...mere, role: 'Mere' });
        if (members) members.forEach((m: any) => allMembers.push({ ...m, role: 'Member' }));

        for (const m of allMembers) {
            await query(
                'INSERT INTO members (family_id, name, email, phone, gender, class, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [familyId, m.name, m.email, m.phone, m.gender, m.class, m.role]
            );
        }

        res.status(201).json({ id: familyId, ...req.body });
    } catch (error) {
        console.error('Error creating family:', error);
        res.status(500).json({ message: 'Error creating family', error });
    }
};

// Update an existing family
export const updateFamily = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        name, generation, total_members, total_boys, total_girls,
        total_y1, total_y2, total_y3
    } = req.body;
    try {
        const result = await query(
            `UPDATE families SET 
                name = $1, 
                generation = $2, 
                total_members = $3, 
                total_boys = $4, 
                total_girls = $5, 
                total_y1 = $6, 
                total_y2 = $7, 
                total_y3 = $8 
            WHERE id = $9 RETURNING *`,
            [name, generation, total_members || 0, total_boys || 0, total_girls || 0, total_y1 || 0, total_y2 || 0, total_y3 || 0, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Family not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating family', error });
    }
};

// Delete a family
export const deleteFamily = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await query('DELETE FROM families WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Family not found' });
        }

        res.status(200).json({ message: 'Family deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting family', error });
    }
};

// Get all members
export const getMembers = async (req: Request, res: Response) => {
    const { familyId, is_committee } = req.query;
    try {
        let sql = 'SELECT * FROM members';
        const params = [];
        if (familyId) {
            sql += ' WHERE family_id = $1';
            params.push(familyId);
        }
        if (is_committee !== undefined) {
            sql += params.length > 0 ? ' AND is_committee = $' + (params.length + 1) : ' WHERE is_committee = $1';
            params.push(is_committee === 'true');
        }
        const result = await query(sql, params);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching members', error });
    }
};

// Get dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
    const { timeRange } = req.query; // 'week', 'month', 'year'
    try {
        let interval = '1 month';
        if (timeRange === 'week') interval = '1 week';
        if (timeRange === 'year') interval = '1 year';

        const totalFamilies = await query('SELECT COUNT(*) FROM families');
        const totalMembers = await query('SELECT COUNT(*) FROM members');
        const totalBoys = await query('SELECT COUNT(*) FROM members WHERE gender = $1', ['M']);
        const totalGirls = await query('SELECT COUNT(*) FROM members WHERE gender = $1', ['F']);

        const y1Count = await query('SELECT COUNT(*) FROM members WHERE class = $1', ['Y1']);
        const y2Count = await query('SELECT COUNT(*) FROM members WHERE class = $1', ['Y2']);
        const y3Count = await query('SELECT COUNT(*) FROM members WHERE class = $1', ['Y3']);

        // Recent activities (notes, schedules, assignments)
        const recentActivities = await query(`
            (SELECT 'note' as type, title as content, created_at FROM notes ORDER BY created_at DESC LIMIT 2)
            UNION ALL
            (SELECT 'schedule' as type, title as content, created_at FROM schedules ORDER BY created_at DESC LIMIT 2)
            UNION ALL
            (SELECT 'member' as type, name as content, created_at FROM members ORDER BY created_at DESC LIMIT 2)
            ORDER BY created_at DESC LIMIT 5
        `);

        // Families distribution details (boys/girls per family)
        const familyDistribution = await query(`
            SELECT 
                f.name, 
                COUNT(m.id) FILTER (WHERE m.gender = 'M') as boys,
                COUNT(m.id) FILTER (WHERE m.gender = 'F') as girls,
                COUNT(m.id) as total
            FROM families f
            LEFT JOIN members m ON f.id = m.family_id
            GROUP BY f.id, f.name
        `);

        // Growth data based on time range
        const growthData = await query(`
            SELECT 
                DATE_TRUNC('day', created_at) as date,
                COUNT(*) as count
            FROM members
            WHERE created_at >= NOW() - CAST($1 AS interval)
            GROUP BY date
            ORDER BY date ASC
        `, [interval]);

        // Upcoming events (schedules from today onwards)
        const upcomingEvents = await query(`
            SELECT id, title, date, location 
            FROM schedules 
            WHERE date >= CURRENT_DATE 
            ORDER BY date ASC 
            LIMIT 3
        `);

        res.status(200).json({
            stats: {
                totalFamilies: parseInt(totalFamilies.rows[0].count),
                totalMembers: parseInt(totalMembers.rows[0].count),
                totalBoys: parseInt(totalBoys.rows[0].count),
                totalGirls: parseInt(totalGirls.rows[0].count),
                y1: parseInt(y1Count.rows[0].count),
                y2: parseInt(y2Count.rows[0].count),
                y3: parseInt(y3Count.rows[0].count),
            },
            recentActivities: recentActivities.rows,
            upcomingEvents: upcomingEvents.rows,
            familyDistribution: familyDistribution.rows,
            growthData: growthData.rows
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};

// Create a member
export const createMember = async (req: Request, res: Response) => {
    const { family_id, name, email, phone, gender, class: memberClass, role, department, status, is_committee, year, voice } = req.body;
    try {
        const result = await query(
            'INSERT INTO members (family_id, name, email, phone, gender, class, role, department, status, is_committee, year, voice) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [family_id, name, email, phone, gender, memberClass, role || 'Member', department, status || 'active', is_committee || false, year, voice]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).json({ message: 'Error creating member', error });
    }
};

// Update a member
export const updateMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { family_id, name, email, phone, gender, class: memberClass, role, department, status, is_committee, year, voice } = req.body;
    try {
        const result = await query(
            'UPDATE members SET family_id = $1, name = $2, email = $3, phone = $4, gender = $5, class = $6, role = $7, department = $8, status = $9, is_committee = $10, year = $11, voice = $12 WHERE id = $13 RETURNING *',
            [family_id, name, email, phone, gender, memberClass, role, department, status, is_committee, year, voice, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ message: 'Error updating member', error });
    }
};

// Delete a member
export const deleteMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM members WHERE id = $1', [id]);
        res.status(200).json({ message: 'Member deleted' });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ message: 'Error deleting member', error });
    }
};
