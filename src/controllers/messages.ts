import { Request, Response } from 'express';
import { query } from '../config/db';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const getRecipients = async (req: Request, res: Response) => {
    const { portal, department } = req.query;

    try {
        let sql = 'SELECT id, name, email, role, department FROM members';
        const params = [];

        // Logic for role-based filtering
        if (portal === 'president' || portal === 'grand_pere_mere' || portal === 'pastor') {
            // Can see all members or at least many
            // For now, let's allow all
        } else if (department) {
            sql += ' WHERE department = $1';
            params.push(department);
        } else if (portal === 'choir') {
            sql += " WHERE department = 'Choir'";
        } else if (portal === 'usher') {
            sql += " WHERE department = 'Ushers'";
        } else if (portal === 'intercessors') {
            sql += " WHERE department = 'Intercessors'";
        }

        const result = await query(sql, params);

        // Also include other user roles (President, Pastor, etc.)
        const usersResult = await query('SELECT id, name, email, role FROM users');
        const otherRoles = usersResult.rows.map(u => ({
            id: 'u' + u.id,
            name: u.name + ' (' + (u.role || 'Admin') + ')',
            email: u.email,
            isUser: true
        }));

        res.status(200).json({
            members: result.rows,
            users: otherRoles
        });
    } catch (error) {
        console.error('Error fetching recipients:', error);
        res.status(500).json({ message: 'Error fetching recipients', error });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    const { recipients, subject, message, senderName } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ message: 'No recipients selected' });
    }

    try {
        const mailOptions = {
            from: `"${senderName || 'RCA RAJEPRA'}" <${process.env.EMAIL_USER}>`,
            bcc: recipients.join(','), // Use BCC for privacy
            subject: subject,
            text: message,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">${subject}</h2>
                    <p style="white-space: pre-wrap;">${message}</p>
                    <hr style="margin-top: 20px; border: 0; border-top: 1px solid #eee;" />
                    <p style="color: #6b7280; font-size: 12px;">
                        This message was sent from the ${senderName || 'Church Management System'}.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message', error });
    }
};
