import { Router } from 'express';

const router = Router();

router.get('/hello', (req, res) => {
  const name = req.query.name ?? 'World';
  res.json({ message: `Hello, ${name}!` });
});

export default router;
