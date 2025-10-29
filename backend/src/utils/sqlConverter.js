function escapeIdentifier(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

function quoteDefault(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  const v = String(val);
  if (v.startsWith("'") && v.endsWith("'")) return v;
  return `'${v.replace(/'/g, "''")}'`;
}

function normalizeType(dt) {
  if (!dt) return "TEXT";
  return String(dt).toUpperCase();
}

function createTableSQL(table) {
  const cols = [];
  const pkCols = [];

  for (const col of table.columns || []) {
    const name = escapeIdentifier(col.columnName);
    let type = normalizeType(col.dataType || "TEXT");

    let colDefType = type;
    if (col.autoIncrement && /INT/i.test(type)) {
      colDefType = "SERIAL";
    }

    const constraints = [];

    if (col.notNull) constraints.push("NOT NULL");
    if (col.unique) constraints.push("UNIQUE");
    if (col.defaultValue !== null && col.defaultValue !== undefined) {
      const q = quoteDefault(col.defaultValue);
      if (q !== null) constraints.push(`DEFAULT ${q}`);
    }

    if (col.primaryKey) pkCols.push(name);

    cols.push(`${name} ${colDefType} ${constraints.join(" ")}`.trim());
  }

  let pkClause = "";
  if (pkCols.length > 0) {
    const chosen = pkCols.slice(0, 1);
    pkClause = `, PRIMARY KEY (${chosen.join(", ")})`;
  }

  const sql = `CREATE TABLE IF NOT EXISTS ${escapeIdentifier(
    table.tableName
  )} (${cols.join(", ")}${pkClause});`;
  return sql;
}

function insertsForTable(table) {
  const cols = table.columns || [];

  return (table.rows || []).map((row) => {
    const placeholders = [];
    const values = [];
    let paramIndex = 1;

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const val = row[i];

      if (
        (val === null || val === undefined) &&
        ((col.defaultValue !== null && col.defaultValue !== undefined) ||
          col.autoIncrement)
      ) {
        placeholders.push("DEFAULT");
        continue;
      }

      placeholders.push(`$${paramIndex}`);
      values.push(val);
      paramIndex++;
    }

    const colNames = cols.map((c) => escapeIdentifier(c.columnName)).join(", ");
    const text = `INSERT INTO ${escapeIdentifier(
      table.tableName
    )} (${colNames}) VALUES (${placeholders.join(
      ", "
    )}) ON CONFLICT DO NOTHING;`;

    return { text, values };
  });
}

export { createTableSQL, insertsForTable, escapeIdentifier, normalizeType };
