import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

// Configure transporter from .env
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Direct login without OTP as requested
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                portal: user.role || 'grand_pere_mere'
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Login error', error });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Generate 6-digit OTP for password reset
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await query(
            'UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3',
            [otp, expiry, email]
        );

        // Send email
        const mailOptions = {
            from: `"RCMS Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Code',
            text: `Your password reset code is: ${otp}. This code will expire in 15 minutes.`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Password Reset</h2>
          <p>You requested a password reset. Use the code below to proceed:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            This code will expire in 15 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      `
        };

        console.log(`Attempting to send reset code to ${email}`);
        console.log(`DEBUG: Reset Code for ${email} is ${otp}`);
        await transporter.sendMail(mailOptions);
        console.log(`Reset code successfully sent to ${email}`);

        res.status(200).json({ message: 'Reset code sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Forgot password error', error });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    try {
        const result = await query(
            'SELECT * FROM users WHERE email = $1 AND otp = $2 AND otp_expiry > NOW()',
            [email, otp]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        const user = result.rows[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await query(
            'UPDATE users SET password = $1, otp = NULL, otp_expiry = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Reset password error', error });
    }
};

// ... keep verifyOTP and register as they are or remove if unused ...
export const verifyOTP = async (req: Request, res: Response) => {
    // This was for login MFA, leaving it in case you need it later 
    // but the login logic now skips it.
    res.status(404).json({ message: 'Endpoint disabled' });
};

export const register = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [email, hashedPassword, name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Registration error', error });
    }
};
