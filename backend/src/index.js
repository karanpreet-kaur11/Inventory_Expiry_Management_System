import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './db.js';
import productsRouter from './routes/products.js';
import authRouter from './routes/auth.js';
import { requireAuth } from './middleware/requireAuth.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRouter);
app.use('/api/products', requireAuth, productsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Expiry management API listening on http://localhost:${PORT}`);
});
