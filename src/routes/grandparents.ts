import { Router } from 'express';
import {
    getFamilies,
    getFamilyById,
    createFamily,
    updateFamily,
    deleteFamily,
    getDashboardStats,
    getMembers,
    createMember,
    updateMember,
    deleteMember
} from '../controllers/grandparents';

const router = Router();

// Members
router.get('/members', getMembers);
router.post('/members', createMember);
router.put('/members/:id', updateMember);
router.delete('/members/:id', deleteMember);

// Dashboard Stats
router.get('/stats', getDashboardStats);

// GET /api/grandparents
router.get('/', getFamilies);

// GET /api/grandparents/:id
router.get('/:id', getFamilyById);

// POST /api/grandparents
router.post('/', createFamily);

// PUT /api/grandparents/:id
router.put('/:id', updateFamily);

// DELETE /api/grandparents/:id
router.delete('/:id', deleteFamily);

export default router;
