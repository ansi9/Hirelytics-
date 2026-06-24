import app from "./app";
import { logger } from "./lib/logger";

// Fallback to port 3000 if Vercel doesn't pass a PORT variable
const port = Number(process.env.PORT) || 3000;

// Only run app.listen if we are NOT on Vercel production
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    logger.info({ port }, "Server listening locally");
  });
}

// Use TypeScript export style instead of module.exports
export default app;
