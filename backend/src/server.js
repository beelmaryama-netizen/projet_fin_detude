import 'dotenv/config';
import app from './app.js';
import { startReminders } from './services/reminders.service.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API sur http://localhost:${PORT}`);
  startReminders();
});
