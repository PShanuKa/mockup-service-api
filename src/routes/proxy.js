import { Router } from 'express';
import { config } from '../config.js';

// Headers the card-mgt gateway cares about. Everything else (host, connection,
// accept-encoding …) is dropped so undici can set them itself.
const FORWARDED_HEADERS = [
  'authorization',
  'eventtype',
  'locus',
  'performedby',
  'sourcesystem',
  'transactionid',
  'content-type',
  'accept',
];

const router = Router();

/**
 * Passthrough to the real service: everything after /proxy is appended to
 * `config.upstream.baseUrl`. Status, headers and body come back untouched so the real
 * error payloads are visible.
 */
router.all('/*splat', async (req, res) => {
  const target = new URL(req.originalUrl.replace(/^\/proxy/, ''), config.upstream.baseUrl);

  const headers = {};
  for (const name of FORWARDED_HEADERS) {
    // The upstream expects `eventType` even when empty, so send '' rather than skip.
    if (req.headers[name] !== undefined) headers[name] = req.headers[name];
  }

  const startedAt = process.hrtime.bigint();

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(config.upstream.timeoutMs),
    });

    const body = await upstream.text();
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    res.set('x-proxy-target', target.toString());
    res.set('x-proxy-duration-ms', durationMs.toFixed(0));
    res.set('content-type', upstream.headers.get('content-type') || 'text/plain');

    // Verbatim: whatever the upstream said, status and all.
    res.status(upstream.status).send(body);
  } catch (err) {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    res.status(502).json({
      code: '502',
      message: 'Upstream request failed',
      target: target.toString(),
      durationMs: Math.round(durationMs),
      error: {
        name: err.name,
        message: err.message,
        code: err.code ?? err.cause?.code ?? null,
        cause: err.cause ? String(err.cause.message ?? err.cause) : null,
      },
    });
  }
});

export default router;
