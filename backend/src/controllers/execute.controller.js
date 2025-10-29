import { pool } from "../db/postgres.js";
import Workspace from "../models/workspace.model.js";
import {
  listTablesInSchema,
  getColumnsForTable,
  getRowsForTable,
} from "../utils/schemaSerializer.js";

async function dumpSchemaFromPostgres(schema) {
  const tables = [];
  const tableNames = await listTablesInSchema(schema);

  for (const tableName of tableNames) {
    const columns = await getColumnsForTable(schema, tableName);
    const rows = await getRowsForTable(schema, tableName);
    tables.push({ tableName, columns, rows });
  }

  return tables;
}

export async function executeSQL(req, res) {
  const { workspaceId, sql } = req.body;
  const schema = `workspace_${workspaceId}`;

  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${schema};`);

    try {
      await client.query("BEGIN;");
      await client.query(sql);
      await client.query("ROLLBACK;");
    } catch (syntaxErr) {
      await client.query("ROLLBACK;");
      return res.status(400).json({
        ok: false,
        error: `SQL Syntax Error: ${syntaxErr.message}`,
        code: syntaxErr.code,
      });
    }

    const start = Date.now();
    const result = await client.query(sql);
    const duration = Date.now() - start;

    const modifying = /^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)/i.test(
      sql.trim()
    );
    if (modifying) {
      const tables = await dumpSchemaFromPostgres(schema);
      await Workspace.findOneAndUpdate(
        { workspaceId },
        { $set: { tables } },
        { new: true }
      );
    }

    const fields = result.fields
      ? result.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID }))
      : [];

    return res.json({
      ok: true,
      rows: result.rows ?? [],
      rowCount: result.rowCount ?? 0,
      fields,
      duration,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: err.message,
      code: err.code,
    });
  } finally {
    client.release();
  }
}
