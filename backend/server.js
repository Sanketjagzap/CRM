const http = require('http');
const { app } = require('./src/app');
const { connectDatabase } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const { env } = require('./src/config/env');
const { seedDemoData } = require('./src/database/seed');

async function bootstrap() {
  await connectDatabase();
  await seedDemoData();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    console.log(`CRM API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});