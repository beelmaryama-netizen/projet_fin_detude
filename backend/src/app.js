import express from 'express';
import { prisma } from './config/prisma.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/health/db', async (_req, res) => { try { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ok', database: 'connected' }); } catch { res.status(503).json({ status: 'unavailable' }); } });
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;