import { queryWithTimeout } from "../db/postgres.js";
import { escapeIdentifier } from "./sqlConverter.js";

export async function listTablesInSchema(schema) {
  const res = await queryWithTimeout(
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = $1 AND table_type = 'BASE TABLE';`,
    [schema]
  );
  return res.rows.map((r) => r.table_name);
}

export async function getColumnsForTable(schema, tableName) {
  const res = await queryWithTimeout(
    `SELECT column_name, data_type 
     FROM information_schema.columns 
     WHERE table_schema = $1 AND table_name = $2 
     ORDER BY ordinal_position;`,
    [schema, tableName]
  );

  return res.rows.map((r) => ({
    columnName: r.column_name,
    dataType: r.data_type,
  }));
}

export async function getRowsForTable(schema, tableName) {
  const res = await queryWithTimeout(
    `SELECT * FROM ${escapeIdentifier(schema)}.${escapeIdentifier(tableName)};`
  );

  return res.rows.map((r) => Object.values(r));
}
