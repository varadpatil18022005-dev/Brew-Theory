require('dotenv').config();
const app = require('./app');
const connectDatabase = require('./config/database');
const seedMenu = require('./seedMenu');

const port = Number(process.env.PORT) || 5000;

connectDatabase()
  .then(seedMenu)
  .then(() => app.listen(port, () => console.log(`Brew Theory API ready at http://localhost:${port}`)))
  .catch((error) => {
    console.error(`Backend could not start: ${error.message}`);
    process.exit(1);
  });
