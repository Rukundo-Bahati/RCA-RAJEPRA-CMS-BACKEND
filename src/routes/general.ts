import { Router } from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/notes';
import { getSchedules, createSchedule, deleteSchedule } from '../controllers/schedules';
import { getAssignments, createAssignment, updateAssignmentStatus, deleteAssignment } from '../controllers/assignments';

const router = Router();

// Notes
router.get('/notes', getNotes);
router.post('/notes', createNote);
router.put('/notes/:id', updateNote);
router.delete('/notes/:id', deleteNote);

// Schedules
router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);
router.delete('/schedules/:id', deleteSchedule);

// Assignments
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.patch('/assignments/:id/status', updateAssignmentStatus);
router.delete('/assignments/:id', deleteAssignment);

export default router;
