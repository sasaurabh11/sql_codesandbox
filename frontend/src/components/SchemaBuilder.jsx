import React, { useState } from "react";
import { saveWorkspace } from "../api";

function defaultColumn() {
  return {
    columnName: `col_${Date.now() % 1000000}`,
    dataType: "TEXT",
    primaryKey: false,
    unique: false,
    notNull: false,
    defaultValue: null,
    autoIncrement: false,
  };
}

function defaultRow(columns) {
  return columns.map(() => null);
}

export default function SchemaBuilder({ workspaceId, onSaved }) {
  const [tables, setTables] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState(null);
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [activeTab, setActiveTab] = useState("schema"); // "schema" or "data"

  function addTable() {
    setTables((prev) => {
      const cols = [defaultColumn()];
      const newTableIndex = prev.length;
      setExpandedTables(prev => new Set(prev).add(newTableIndex));
      return [
        ...prev,
        {
          tableName: `table_${prev.length + 1}`,
          columns: cols,
          rows: [defaultRow(cols)],
        },
      ];
    });
  }

  function toggleTable(index) {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }

  function updateTable(idx, patch) {
    setTables((t) =>
      t.map((tbl, i) => (i === idx ? { ...tbl, ...patch } : tbl))
    );
  }

  function setColumnProp(tableIdx, colIdx, patch) {
    setTables((t) =>
      t.map((tbl, ti) => {
        if (ti !== tableIdx) return tbl;
        const cols = tbl.columns.map((c, ci) =>
          ci === colIdx ? { ...c, ...patch } : c
        );
        if (patch.primaryKey) {
          for (let i = 0; i < cols.length; i++) {
            if (i !== colIdx) cols[i].primaryKey = false;
          }
        }
        if (patch.autoIncrement) {
          cols[colIdx].dataType = "INTEGER";
        }
        return { ...tbl, columns: cols };
      })
    );
  }

  function addColumn(tableIdx) {
    setTables((prev) =>
      prev.map((tbl, i) => {
        if (i !== tableIdx) return tbl;
        const newCols = [...tbl.columns, defaultColumn()];
        const newRows = tbl.rows.map((r) => [...r, null]);
        return { ...tbl, columns: newCols, rows: newRows };
      })
    );
  }

  function removeColumn(tableIdx, colIdx) {
    setTables((prev) =>
      prev.map((tbl, i) => {
        if (i !== tableIdx) return tbl;
        const newCols = tbl.columns.filter((_, j) => j !== colIdx);
        const newRows = tbl.rows.map((r) => r.filter((_, j) => j !== colIdx));
        return { ...tbl, columns: newCols, rows: newRows };
      })
    );
  }

  function addRow(tableIdx) {
    setTables((prev) =>
      prev.map((tbl, i) => {
        if (i !== tableIdx) return tbl;
        return { ...tbl, rows: [...tbl.rows, defaultRow(tbl.columns)] };
      })
    );
  }

  function removeRow(tableIdx, rowIdx) {
    setTables((prev) =>
      prev.map((tbl, i) => {
        if (i !== tableIdx) return tbl;
        const newRows = tbl.rows.filter((_, ri) => ri !== rowIdx);
        return { ...tbl, rows: newRows };
      })
    );
  }

  function setCell(tableIdx, rowIdx, colIdx, value) {
    setTables((prev) =>
      prev.map((tbl, ti) => {
        if (ti !== tableIdx) return tbl;
        const rows = tbl.rows.map((r, ri) =>
          ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? value : c)) : r
        );
        return { ...tbl, rows };
      })
    );
  }

  function setColumnName(tableIdx, colIdx, name) {
    setColumnProp(tableIdx, colIdx, { columnName: name });
  }

  function setColumnType(tableIdx, colIdx, type) {
    setColumnProp(tableIdx, colIdx, { dataType: type });
  }

  function setDefaultValue(tableIdx, colIdx, def) {
    setColumnProp(tableIdx, colIdx, { defaultValue: def === "" ? null : def });
  }

  function toggleConstraintSimple(tableIdx, colIdx, key) {
    setTables((t) =>
      t.map((tbl, ti) => {
        if (ti !== tableIdx) return tbl;
        const cols = tbl.columns.map((c, ci) => {
          if (ci !== colIdx) return c;
          return { ...c, [key]: !c[key] };
        });
        if (key === "primaryKey") {
          for (let i = 0; i < cols.length; i++)
            if (i !== colIdx) cols[i].primaryKey = false;
        }
        if (key === "autoIncrement" && cols[colIdx].autoIncrement)
          cols[colIdx].dataType = "INTEGER";
        return { ...tbl, columns: cols };
      })
    );
  }

  async function handleSave() {
    if (!workspaceId) return setStatus("Set or create a workspace first");
    const payload = { name: name || `Workspace ${workspaceId}`, tables };
    setStatus("Saving...");
    try {
      const res = await saveWorkspace(workspaceId, payload);
      if (res.ok) {
        setStatus("Saved");
        onSaved && onSaved(res.body.workspace);
      } else {
        setStatus("Error: " + JSON.stringify(res.body));
      }
    } catch (e) {
      setStatus("Unexpected error: " + e.message);
    }
  }

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Schema Builder</h3>
            <p className="text-sm text-gray-400">Design your database tables and data</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center space-x-2"
            onClick={addTable}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Table</span>
          </button>
          <button
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center space-x-2"
            onClick={handleSave}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Save Schema</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <input
          placeholder="Workspace Name (optional)"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {status && (
        <div className={`p-3 rounded-lg mb-6 border ${
          status.includes('Error') 
            ? 'bg-red-900/20 border-red-500 text-red-300' 
            : status.includes('Saved')
            ? 'bg-green-900/20 border-green-500 text-green-300'
            : 'bg-blue-900/20 border-blue-500 text-blue-300'
        }`}>
          {status}
        </div>
      )}

      {tables.length === 0 ? (
        <div className="text-center py-12 bg-gray-750 rounded-xl border-2 border-dashed border-gray-600">
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-400 mb-2">No tables created yet</h3>
          <p className="text-gray-500 mb-4">Start by creating your first table</p>
          <button
            onClick={addTable}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Create First Table
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tables.map((tbl, ti) => (
            <div key={ti} className="bg-gray-750 rounded-xl border border-gray-600 overflow-hidden">
              {/* Table Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => toggleTable(ti)}
              >
                <div className="flex items-center space-x-3">
                  <svg 
                    className={`w-5 h-5 text-blue-400 transition-transform ${expandedTables.has(ti) ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <input
                    value={tbl.tableName}
                    onChange={(e) => updateTable(ti, { tableName: e.target.value })}
                    className="bg-transparent border-none text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{tbl.columns.length} columns</span>
                    <span>{tbl.rows.length} rows</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded-lg transition-colors"
                    onClick={(e) => { e.stopPropagation(); addColumn(ti); }}
                    title="Add Column"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-600 rounded-lg transition-colors"
                    onClick={(e) => { e.stopPropagation(); addRow(ti); }}
                    title="Add Row"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expandable Content */}
              {expandedTables.has(ti) && (
                <div className="border-t border-gray-600 p-4">
                  {/* Tab Navigation */}
                  <div className="flex space-x-1 mb-4 p-1 bg-gray-700 rounded-lg w-fit">
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === "schema" 
                          ? "bg-gray-600 text-white shadow" 
                          : "text-gray-400 hover:text-white"
                      }`}
                      onClick={() => setActiveTab("schema")}
                    >
                      Schema
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === "data" 
                          ? "bg-gray-600 text-white shadow" 
                          : "text-gray-400 hover:text-white"
                      }`}
                      onClick={() => setActiveTab("data")}
                    >
                      Data ({tbl.rows.length} rows)
                    </button>
                  </div>

                  {activeTab === "schema" && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-700">
                            <th className="px-4 py-3 text-left text-gray-200 font-semibold">Column Name</th>
                            <th className="px-4 py-3 text-left text-gray-200 font-semibold">Data Type</th>
                            <th className="px-4 py-3 text-center text-gray-200 font-semibold">PK</th>
                            <th className="px-4 py-3 text-center text-gray-200 font-semibold">Unique</th>
                            <th className="px-4 py-3 text-center text-gray-200 font-semibold">Not Null</th>
                            <th className="px-4 py-3 text-left text-gray-200 font-semibold">Default</th>
                            <th className="px-4 py-3 text-center text-gray-200 font-semibold">Auto Inc</th>
                            <th className="px-4 py-3 text-center text-gray-200 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tbl.columns.map((c, ci) => (
                            <tr key={ci} className="border-t border-gray-600 hover:bg-gray-700 transition-colors">
                              <td className="px-4 py-3">
                                <input
                                  value={c.columnName}
                                  onChange={(e) => setColumnName(ti, ci, e.target.value)}
                                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={c.dataType}
                                  onChange={(e) => setColumnType(ti, ci, e.target.value)}
                                  className="bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option>TEXT</option>
                                  <option>INTEGER</option>
                                  <option>BOOLEAN</option>
                                  <option>DATE</option>
                                  <option>REAL</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!c.primaryKey}
                                  onChange={() => toggleConstraintSimple(ti, ci, "primaryKey")}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!c.unique}
                                  onChange={() => toggleConstraintSimple(ti, ci, "unique")}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!c.notNull}
                                  onChange={() => toggleConstraintSimple(ti, ci, "notNull")}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={c.defaultValue === null ? "" : c.defaultValue}
                                  onChange={(e) => setDefaultValue(ti, ci, e.target.value)}
                                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Default value"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!c.autoIncrement}
                                  onChange={() => toggleConstraintSimple(ti, ci, "autoIncrement")}
                                  disabled={c.dataType !== "INTEGER"}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-600 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                                  onClick={() => removeColumn(ti, ci)}
                                  title="Remove Column"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "data" && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-700">
                            {tbl.columns.map((c, ci) => (
                              <th key={ci} className="px-4 py-3 text-left text-gray-200 font-semibold">
                                {c.columnName}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-center text-gray-200 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tbl.rows.map((r, ri) => (
                            <tr key={ri} className="border-t border-gray-600 hover:bg-gray-700 transition-colors">
                              {r.map((cell, ci) => (
                                <td key={ci} className="px-4 py-3">
                                  <input
                                    value={cell === null ? "" : cell}
                                    onChange={(e) => setCell(ti, ri, ci, parseValue(e.target.value))}
                                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </td>
                              ))}
                              <td className="px-4 py-3 text-center">
                                <button
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                                  onClick={() => removeRow(ti, ri)}
                                  title="Delete Row"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function parseValue(v) {
  if (v === "") return null;
  if (!isNaN(v) && v.trim() !== "") return Number(v);
  if (v.toLowerCase && v.toLowerCase() === "true") return true;
  if (v.toLowerCase && v.toLowerCase() === "false") return false;
  return v;
}