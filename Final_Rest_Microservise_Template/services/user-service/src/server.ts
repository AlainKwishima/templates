import app from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`[user-service] Running on port ${env.PORT} (${env.NODE_ENV})`);
});

