import { Router } from 'express';
import {
    login,
    verifyOTP,
    forgotPassword,
    resetPassword,
    register
} from '../controllers/auth';

const router = Router();

router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/register', register); // Helper for demo

export default router;
