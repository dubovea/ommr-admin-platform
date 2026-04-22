import { Router } from "express";
import { fieldsRouter } from "./fields.routes.js";
import { tablesRouter } from "./tables.routes.js";

export const adminRouter = Router();

adminRouter.use("/tables", tablesRouter);
adminRouter.use("/fields", fieldsRouter);
