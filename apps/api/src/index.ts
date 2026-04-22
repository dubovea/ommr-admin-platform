import "dotenv/config";
import cors from "cors";
import express from "express";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "./db/index.js";
import { adminFields, adminTables } from "./db/schema.js";
import {
  createFieldSchema,
  createTableSchema,
  updateFieldSchema,
  updateTableSchema
} from "./validation.js";

const app = express();

const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/admin/tables", async (_req, res, next) => {
  try {
    const tables = await db
      .select({
        id: adminTables.id,
        name: adminTables.name,
        dbName: adminTables.dbName,
        label: adminTables.label,
        description: adminTables.description,
        icon: adminTables.icon,
        status: adminTables.status,
        source: adminTables.source,
        canList: adminTables.canList,
        canCreate: adminTables.canCreate,
        canEdit: adminTables.canEdit,
        canDelete: adminTables.canDelete,
        createdAt: adminTables.createdAt,
        updatedAt: adminTables.updatedAt,
        fieldsCount: sql<number>`cast(count(${adminFields.id}) as int)`,
        requiredFieldsCount: sql<number>`cast(sum(case when ${adminFields.required} then 1 else 0 end) as int)`,
        relationsCount: sql<number>`cast(sum(case when ${adminFields.relation} is not null then 1 else 0 end) as int)`
      })
      .from(adminTables)
      .leftJoin(adminFields, eq(adminTables.id, adminFields.tableId))
      .groupBy(adminTables.id)
      .orderBy(asc(adminTables.sortOrder), asc(adminTables.name));

    res.json({
      data: tables,
      total: tables.length
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/tables/:id", async (req, res, next) => {
  try {
    const [table] = await db
      .select()
      .from(adminTables)
      .where(eq(adminTables.id, req.params.id));

    if (!table) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    const fields = await db
      .select()
      .from(adminFields)
      .where(eq(adminFields.tableId, req.params.id))
      .orderBy(asc(adminFields.sortOrder), asc(adminFields.name));

    res.json({
      data: {
        ...table,
        fields,
        fieldsCount: fields.length,
        requiredFieldsCount: fields.filter((field) => field.required).length,
        relationsCount: fields.filter((field) => field.relation).length
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/tables", async (req, res, next) => {
  try {
    const payload = createTableSchema.parse(req.body);

    const [created] = await db
      .insert(adminTables)
      .values(payload)
      .returning();

    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/tables/:id", async (req, res, next) => {
  try {
    const payload = updateTableSchema.parse(req.body);

    const [updated] = await db
      .update(adminTables)
      .set({
        ...payload,
        updatedAt: new Date()
      })
      .where(eq(adminTables.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/fields", async (req, res, next) => {
  try {
    const payload = createFieldSchema.parse(req.body);

    const [created] = await db
      .insert(adminFields)
      .values(payload)
      .returning();

    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/fields/:id", async (req, res, next) => {
  try {
    const payload = updateFieldSchema.parse(req.body);

    const [updated] = await db
      .update(adminFields)
      .set({
        ...payload,
        updatedAt: new Date()
      })
      .where(eq(adminFields.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Field not found" });
      return;
    }

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/fields/:id", async (req, res, next) => {
  try {
    const [deleted] = await db
      .delete(adminFields)
      .where(eq(adminFields.id, req.params.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Field not found" });
      return;
    }

    res.json({ data: deleted });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);

  res.status(500).json({
    error: error instanceof Error ? error.message : "Internal server error"
  });
});

app.listen(port, () => {
  console.log(`[api] http://localhost:${port}`);
});
