const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/auth',  require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
