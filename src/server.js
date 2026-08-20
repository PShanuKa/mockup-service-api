import { createApp } from './app.js';

const port = process.env.PORT || 3000;

createApp().listen(port, () => {
  console.log(`Mockup service API listening on http://localhost:${port}`);
});
