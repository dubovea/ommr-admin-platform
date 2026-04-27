import "dotenv/config";
import cors from "cors";
import express from "express";
import { adminRouter } from "./routes/admin/index.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";
const jsonLimit = process.env.JSON_BODY_LIMIT ?? "20mb";

app.use(
  cors({
    origin: "*",
    credentials: false,
  }),
);

app.use(express.json({ limit: jsonLimit }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/admin", adminRouter);

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`[api] http://${host}:${port}`);
});
