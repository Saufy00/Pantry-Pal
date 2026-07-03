import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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

// 4. Rate Limiting (Safely restored for Vercel proxies)
app.set("trust proxy", 1); // Trust Vercel's edge proxy so req.ip is populated

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const message = err?.message || "Unknown error";
  const cause = err?.cause?.message || err?.originalError?.message || "No inner cause";
  if (req.log) {
    req.log.error(err, "Unhandled error");
  } else {
    console.error("Unhandled error:", err);
  }
  res.status(500).json({ error: "Internal Server Error", detail: message, cause, fullError: String(err) });
});

export default app;
