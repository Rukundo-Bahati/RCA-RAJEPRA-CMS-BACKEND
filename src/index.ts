import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import grandparentRoutes from './routes/grandparents';
import authRoutes from './routes/auth';
import generalRoutes from './routes/general';
import assignmentsRoutes from './routes/assignments';
import messageRoutes from './routes/messages';
import initDb from './config/initDb';

dotenv.config();

// Initialize Database
initDb().catch(err => console.error('Failed to initialize database:', err));

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/grandparents', grandparentRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', generalRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
