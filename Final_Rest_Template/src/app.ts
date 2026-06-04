import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { sendError } from './utils/response';
import apiRoutes from './routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());

if (!env.DISABLE_SWAGGER) {
  try {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  } catch (error) {
    console.warn('[swagger] Failed to initialise Swagger UI:', error);
  }
}

app.use('/api/v1', apiRoutes);

app.use((_req, res) => {
  sendError(res, 'Route not found', 404);
});

app.use(errorHandler);

export default app;
