import express from 'express';
import cors from 'cors';
import helloRouter from './routes/hello.js';
import cardTypesRouter from './routes/card-types.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api', helloRouter);
  app.use('/api', cardTypesRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
  });

  return app;
}
