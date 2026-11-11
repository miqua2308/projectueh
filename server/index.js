import dotenv from 'dotenv';
dotenv.config();

import { initDatabase } from './database/db.js';
import { createApp } from './app.js';

const PORT = process.env.PORT || 5000;

function startServer() {
  const db = initDatabase();
  const app = createApp(db);

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

startServer();
