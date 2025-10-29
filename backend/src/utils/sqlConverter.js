function escapeIdentifier(name) {
  // Wrap with double quotes
  return `"${name.replace(/"/g, '""')}"`;
}

function sqlType(dt) {
  return dt ? dt.toUpperCase() : 'TEXT';
}

function createTableSQL(table) {
  const cols = table.columns
    .map(c => `${escapeIdentifier(c.columnName)} ${sqlType(c.dataType)}`)
    .join(', ');

  return `CREATE TABLE IF NOT EXISTS ${escapeIdentifier(table.tableName)} (${cols});`;
}

function insertRowSQL(tableName, row) {
  const placeholders = row.map((_, i) => `$${i + 1}`).join(', ');
  return {
    text: `INSERT INTO ${escapeIdentifier(tableName)} VALUES (${placeholders});`,
    values: row
  };
}

function insertsForTable(table) {
  return (table.rows || []).map(row => insertRowSQL(table.tableName, row));
}

export {
  createTableSQL,
  insertsForTable,
  escapeIdentifier
};
