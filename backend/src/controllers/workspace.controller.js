import Workspace from "../models/workspace.model.js";
import { transaction } from "../db/postgres.js";
import {
  createTableSQL,
  insertsForTable,
  escapeIdentifier,
} from "../utils/sqlConverter.js";

import {
  listTablesInSchema,
  getColumnsForTable,
  getRowsForTable,
} from "../utils/schemaSerializer.js";

export const createWorkspace = async (req, res) => {
  try {
    const { workspaceId, name = "Workspace", tables = [] } = req.body;
    const schema = `workspace_${workspaceId}`;

    await transaction(async (client) => {
      await client.query(
        `CREATE SCHEMA IF NOT EXISTS ${escapeIdentifier(schema)};`
      );

      await client.query(`SET search_path TO ${escapeIdentifier(schema)};`);

      for (const tbl of tables) {
        await client.query(createTableSQL(tbl));
        const inserts = insertsForTable(tbl);

        for (const ins of inserts) {
          await client.query(ins.text, ins.values);
        }
      }
    });

    await new Workspace({ workspaceId, name, tables }).save();

    res.json({ ok: true, workspaceId, schema });
  } catch (err) {
    console.error("❌ Create Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const getWorkspace = async (req, res) => {
  try {
    const doc = await Workspace.findOne({
      workspaceId: req.workspaceId,
    }).lean();

    if (!doc)
      return res.status(404).json({ ok: false, error: "Workspace not found" });

    res.json({ ok: true, workspace: doc });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const loadWorkspace = async (req, res) => {
  try {
    const { workspaceId, schemaName: schema } = req;
    const doc = await Workspace.findOne({ workspaceId }).lean();

    if (!doc)
      return res.status(404).json({ ok: false, error: "Workspace not found" });

    await transaction(async (client) => {
      await client.query(
        `DROP SCHEMA IF EXISTS ${escapeIdentifier(schema)} CASCADE;`
      );
      await client.query(`CREATE SCHEMA ${escapeIdentifier(schema)};`);
      await client.query(`SET search_path TO ${escapeIdentifier(schema)};`);

      for (const tbl of doc.tables || []) {
        await client.query(createTableSQL(tbl));
        const inserts = insertsForTable(tbl);
        for (const ins of inserts) {
          await client.query(ins.text, ins.values);
        }
      }
    });

    res.json({ ok: true, message: "Workspace loaded into Postgres", schema });
  } catch (err) {
    console.error("❌ Load Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const saveWorkspace = async (req, res) => {
  try {
    const { workspaceId, schemaName: schema } = req;
    const tableNames = await listTablesInSchema(schema);

    const tables = [];
    for (const t of tableNames) {
      const columns = await getColumnsForTable(schema, t);
      const rows = await getRowsForTable(schema, t);
      tables.push({ tableName: t, columns, rows });
    }

    const payload = {
      workspaceId,
      name: req.body.name || `Workspace ${workspaceId}`,
      tables,
    };

    const doc = await Workspace.findOneAndUpdate(
      { workspaceId },
      { $set: payload },
      { upsert: true, new: true }
    );

    res.json({ ok: true, workspace: doc });
  } catch (err) {
    console.error("❌ Save Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
