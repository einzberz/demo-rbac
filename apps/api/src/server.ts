import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { connectDatabase } from './db';
import { connectRedis, resetAuthorizationCache } from './services/cache';
import { authRouter } from './routes/auth';
import { demoRouter } from './routes/demo';
import { protectedRouter } from './routes/protected';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'demo-auth-rbac-api' }));
app.use('/api/auth', authRouter);
app.use('/api/demo', demoRouter);
app.use('/api', protectedRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

async function start(): Promise<void> {
  await connectDatabase();
  await connectRedis();
  await resetAuthorizationCache();
  app.listen(config.apiPort, () => console.log(`API listening on http://localhost:${config.apiPort}`));
}

start().catch((error) => {
  console.error('Unable to start API', error);
  process.exit(1);
});
