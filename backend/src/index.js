import express from 'express';
import cors from 'cors';
import './db.js';
import productsRouter from './routes/products.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/products', productsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Expiry management API listening on http://localhost:${PORT}`);
});
