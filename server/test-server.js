import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
});

