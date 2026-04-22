import "dotenv/config";
import cors from "cors";
import express from "express";
import { adminRouter } from "./routes/admin/index.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();

const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/admin", adminRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`[api] http://localhost:${port}`);
});
