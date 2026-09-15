import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { clientRouter } from './routes/client.routes';
import { projectRouter } from './routes/project.routes';
import { timeEntryRouter } from './routes/timeEntry.routes';
import { invoiceRouter } from './routes/invoice.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'UP' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/clients', clientRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/time-entries', timeEntryRouter);
  app.use('/api/invoices', invoiceRouter);
  app.use('/api/dashboard', dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
