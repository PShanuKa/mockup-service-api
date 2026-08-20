import { Router } from 'express';
import { createRequire } from 'node:module';
import { paginate } from '../utils/paginate.js';

const require = createRequire(import.meta.url);
const productList = require('../data/product-list.json');

const router = Router();

/** `fields=cardTypeCode,bin` narrows each item; empty/absent returns everything. */
function project(items, fields) {
  const keys = String(fields ?? '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  if (!keys.length) return items;

  return items.map((item) =>
    Object.fromEntries(keys.filter((k) => k in item).map((k) => [k, item[k]]))
  );
}

// GET /card-mgt/1.1.8/card-mgt/card-types?type=DC&cardUseType=P&fields=&offset=1&limit=100
router.get('/card-types', (req, res) => {
  const { type, fields, offset, limit } = req.query;
  const { data, page, realTotalItems } = paginate(productList.cardTypes, { offset, limit });

  // Not part of the upstream contract — handy while wiring up a mockup.
  res.set('x-mock-total-items', String(realTotalItems));

  res.json({
    locus: req.upstream.locus,
    cardTypes: project(data, fields),
    page,
    type: type ?? productList.type,
  });
});

// GET .../card-types/:code — convenience lookup, not part of the upstream API.
router.get('/card-types/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const cardType = productList.cardTypes.find((c) => c.cardTypeCode === code);

  if (!cardType) {
    return res.status(404).json({
      code: '404',
      message: `Card type ${code} not found`,
      transactionId: req.upstream.transactionId,
    });
  }

  res.json({ locus: req.upstream.locus, cardType, type: req.query.type ?? productList.type });
});

export default router;
