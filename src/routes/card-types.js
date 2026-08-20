import { Router } from 'express';
import { createRequire } from 'node:module';
import { paginate } from '../utils/paginate.js';

const require = createRequire(import.meta.url);
const productList = require('../data/product-list.json');

const router = Router();

function filterCardTypes({ search, contactless, bin }) {
  let items = productList.cardTypes;

  if (search) {
    const term = String(search).toLowerCase();
    items = items.filter(
      (c) =>
        c.cardTypeCode.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.bin.includes(term)
    );
  }

  if (contactless) {
    const flag = String(contactless).toUpperCase();
    items = items.filter((c) => (c.contactless || '').toUpperCase() === flag);
  }

  if (bin) {
    items = items.filter((c) => c.bin.startsWith(String(bin)));
  }

  return items;
}

// GET /api/card-types?page=1&pageSize=25&search=visa&contactless=Y&bin=4216
router.get('/card-types', (req, res) => {
  const items = filterCardTypes(req.query);
  const { data, page } = paginate(items, req.query);

  res.json({
    locus: productList.locus,
    cardTypes: data,
    page,
    type: req.query.type ?? productList.type,
  });
});

// GET /api/card-types/:code
router.get('/card-types/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const cardType = productList.cardTypes.find((c) => c.cardTypeCode === code);

  if (!cardType) {
    return res.status(404).json({ error: 'Card type not found', cardTypeCode: code });
  }

  res.json({ locus: productList.locus, type: productList.type, cardType });
});

export default router;
