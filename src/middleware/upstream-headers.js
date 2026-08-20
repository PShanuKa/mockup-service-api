/**
 * Mirrors the header contract of the real card-mgt service.
 *
 * The values are pulled onto `req.upstream` so routes can echo them back,
 * and `transactionId` / `locus` are reflected in the response headers the way
 * the gateway does.
 *
 * Validation is opt-in: flip `config.strictHeaders` to get 400/401 responses
 * for missing headers. Mock consumers usually want it off.
 */
import { config } from '../config.js';

const REQUIRED_HEADERS = ['locus', 'sourceSystem', 'transactionId', 'performedBy'];

export function upstreamHeaders(req, res, next) {
  // Node lowercases incoming header names.
  const get = (name) => req.get(name) ?? '';

  req.upstream = {
    authorization: get('authorization'),
    eventType: get('eventType'),
    locus: get('locus') || 'SL',
    performedBy: get('performedBy'),
    sourceSystem: get('sourceSystem'),
    transactionId: get('transactionId'),
  };

  res.set('transactionId', req.upstream.transactionId);
  res.set('locus', req.upstream.locus);

  if (config.strictHeaders) {
    if (!req.upstream.authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        code: '401',
        message: 'Missing or malformed Authorization header',
        transactionId: req.upstream.transactionId,
      });
    }

    const missing = REQUIRED_HEADERS.filter((h) => !req.get(h));
    if (missing.length) {
      return res.status(400).json({
        code: '400',
        message: `Missing required header(s): ${missing.join(', ')}`,
        transactionId: req.upstream.transactionId,
      });
    }
  }

  next();
}
