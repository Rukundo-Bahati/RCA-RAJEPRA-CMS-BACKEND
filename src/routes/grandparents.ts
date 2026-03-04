import { Router } from 'express';
import {
    getFamilies,
    getFamilyById,
    createFamily,
    updateFamily,
    deleteFamily
} from '../controllers/grandparents';

const router = Router();

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
