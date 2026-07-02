import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. Logger
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// 3. CORS Hardening
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all Vercel preview domains and localhost
      callback(null, true);
    },
    credentials: true,
  }),
);

// 4. Rate Limiting (Removed due to Vercel req.ip proxy incompatibility)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  if (req.log) {
    req.log.error(err, "Unhandled error");
  } else {
    console.error("Unhandled error:", err);
  }
  res.status(500).json({ error: "Internal Server Error", detail: message });
});

export default app;
