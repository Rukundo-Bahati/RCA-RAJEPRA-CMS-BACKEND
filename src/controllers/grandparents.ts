import { Request, Response } from 'express';
import { query } from '../config/db';
import { Family, FamilyMember } from '../models/Family';

// Get all families (for GrandPereMere dashboard)
export const getFamilies = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT 
                f.id, f.name, f.generation,
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
    const { name, generation, pere, mere, members } = req.body;
    try {
        const familyResult = await query(
            'INSERT INTO families (name, generation) VALUES ($1, $2) RETURNING id',
            [name, generation]
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
    const { name, generation } = req.body;
    try {
        const result = await query(
            'UPDATE families SET name = $1, generation = $2 WHERE id = $3 RETURNING *',
            [name, generation, id]
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
