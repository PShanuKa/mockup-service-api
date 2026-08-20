import express from 'express';
import cors from 'cors';
import helloRouter from './routes/hello.js';
import cardTypesRouter from './routes/card-types.js';
import proxyRouter from './routes/proxy.js';
import { upstreamHeaders } from './middleware/upstream-headers.js';

const CARD_MGT_BASE = '/card-mgt/1.1.8/card-mgt';

export function createApp() {
  const app = express();

  app.use(
    cors({
      exposedHeaders: ['transactionId', 'locus', 'x-mock-total-items', 'x-proxy-target', 'x-proxy-duration-ms'],
    })
  );
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api', helloRouter);

  // Passthrough to the real service (see routes/proxy.js).
  app.use('/proxy', proxyRouter);

  // Same router on the real upstream path and on a short alias.
  app.use(CARD_MGT_BASE, upstreamHeaders, cardTypesRouter);
  app.use('/api', upstreamHeaders, cardTypesRouter);

  app.use((req, res) => {
    res.status(404).json({ code: '404', message: 'Not Found', path: req.originalUrl });
  });

  return app;
}
