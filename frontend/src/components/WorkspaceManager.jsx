import React, { useState } from "react";
import { createWorkspace, getWorkspace, loadWorkspace } from "../api";

export default function WorkspaceManager({ onWorkspaceSet }) {
  const [name, setName] = useState("My Workspace");
  const [workspaceId, setWorkspaceId] = useState("");
  const [status, setStatus] = useState(null);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [visibleRows, setVisibleRows] = useState({}); // Track visible rows per table

  async function handleCreate() {
    setStatus("creating...");
    const payload = { workspaceId: workspaceId || undefined, name, tables: [] };
    const { ok, body } = await createWorkspace(payload);
    if (ok) {
      setStatus("created " + body.workspaceId);
      onWorkspaceSet(body.workspaceId);
      setWorkspaceData(null);
    } else {
      setStatus("error: " + JSON.stringify(body.body || body));
    }
  }

  async function handleLoad() {
    if (!workspaceId) return setStatus("provide workspaceId to load");
    setStatus("loading...");
    const res = await loadWorkspace(workspaceId);
    if (res.ok) {
      setStatus("loaded into Postgres");
      onWorkspaceSet(workspaceId);
    } else {
      setStatus("error: " + JSON.stringify(res.body));
    }
  }

  async function handleFetch() {
    if (!workspaceId) return setStatus("provide workspaceId to fetch");
    setStatus("fetching...");
    const res = await getWorkspace(workspaceId);
    if (res.ok) {
      setWorkspaceData(res.body.workspace);
      setStatus("fetched");
      // Initialize visible rows for each table
      const initialVisibleRows = {};
      res.body.workspace.tables.forEach((_, i) => {
        initialVisibleRows[i] = 10; // Show 10 rows initially
      });
      setVisibleRows(initialVisibleRows);
    } else {
      setStatus("error: " + JSON.stringify(res.body));
    }
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

  function loadMoreRows(tableIndex) {
    setVisibleRows(prev => ({
      ...prev,
      [tableIndex]: prev[tableIndex] + 10
    }));
  }

  function showAllRows(tableIndex) {
    setVisibleRows(prev => ({
      ...prev,
      [tableIndex]: workspaceData.tables[tableIndex].rows.length
    }));
  }

  function ColumnInfo({ columns }) {
    return (
      <div className="mb-4">
        <h6 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Columns & Constraints</span>
        </h6>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {columns.map((col, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-3 border border-gray-600 hover:border-blue-400 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-blue-300 font-medium text-sm truncate">{col.columnName}</span>
                <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded flex-shrink-0 ml-2">{col.dataType}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {col.primaryKey && (
                  <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded" title="Primary Key">PK</span>
                )}
                {col.unique && (
                  <span className="text-xs bg-green-500 text-green-900 px-2 py-1 rounded" title="Unique">Unique</span>
                )}
                {col.notNull && (
                  <span className="text-xs bg-red-500 text-red-900 px-2 py-1 rounded" title="Not Null">NotNull</span>
                )}
                {col.autoIncrement && (
                  <span className="text-xs bg-purple-500 text-purple-900 px-2 py-1 rounded" title="Auto Increment">AutoInc</span>
                )}
              </div>
              {col.defaultValue !== null && (
                <div className="mt-2 text-xs text-gray-400 truncate" title={`Default: ${col.defaultValue}`}>
                  Default: <span className="text-gray-300">{col.defaultValue}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function DataTableView({ table, tableIndex }) {
    const currentVisibleRows = visibleRows[tableIndex] || 10;
    const totalRows = table.rows.length;
    const hasMoreRows = currentVisibleRows < totalRows;

    return (
      <div className="space-y-4">
        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-600">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-700">
                <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-400 border-r border-gray-600">
                  #
                </th>
                {table.columns.map((c, ci) => (
                  <th key={ci} className="border-r border-gray-600 px-3 py-3 text-left last:border-r-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-200">{c.columnName}</span>
                      {c.primaryKey && (
                        <span className="text-xs bg-yellow-500 text-yellow-900 px-1 rounded" title="Primary Key">PK</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-normal mt-1">{c.dataType}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.slice(0, currentVisibleRows).map((row, ri) => (
                <tr key={ri} className="border-t border-gray-600 hover:bg-gray-650 transition-colors group">
                  <td className="border-r border-gray-600 px-3 py-2 text-xs text-gray-500 group-hover:text-gray-400">
                    {ri + 1}
                  </td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border-r border-gray-600 px-3 py-2 last:border-r-0">
                      <div className="flex items-center space-x-2">
                        <span className={cell === null ? "text-gray-500 italic" : "text-gray-200"}>
                          {cell === null ? "NULL" : String(cell)}
                        </span>
                        {cell !== null && String(cell).length > 100 && (
                          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            ({String(cell).length} chars)
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Stats and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-3 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-400">
            Showing <span className="text-blue-400 font-semibold">{Math.min(currentVisibleRows, totalRows)}</span> of{" "}
            <span className="text-green-400 font-semibold">{totalRows}</span> rows •{" "}
            <span className="text-purple-400 font-semibold">{table.columns.length}</span> columns
          </div>
          
          {hasMoreRows && (
            <div className="flex gap-2">
              <button
                onClick={() => loadMoreRows(tableIndex)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Load 10 More</span>
              </button>
              
              {totalRows - currentVisibleRows > 10 && (
                <button
                  onClick={() => showAllRows(tableIndex)}
                  className="bg-gray-600 hover:bg-gray-500 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Show All ({totalRows - currentVisibleRows} remaining)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-blue-400 font-semibold">{table.columns.length}</div>
            <div className="text-gray-400">Columns</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-green-400 font-semibold">{table.rows.length}</div>
            <div className="text-gray-400">Total Rows</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-yellow-400 font-semibold">
              {table.columns.filter(col => col.primaryKey).length}
            </div>
            <div className="text-gray-400">Primary Keys</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-purple-400 font-semibold">
              {table.columns.filter(col => col.unique).length}
            </div>
            <div className="text-gray-400">Unique Columns</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="text-lg font-semibold text-white">Workspace Manager</h3>
      </div>
      
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Workspace ID"
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
        />
        <input
          className="w-48 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          onClick={handleCreate}
        >
          Create Workspace
        </button>
        <button
          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          onClick={handleLoad}
        >
          Load Workspace
        </button>
        <button
          className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          onClick={handleFetch}
        >
          Fetch Data
        </button>
      </div>

      <div className={`p-3 rounded-lg border ${
        status?.includes('error') 
          ? 'bg-red-900/20 border-red-500 text-red-300' 
          : status?.includes('created') || status?.includes('loaded') || status?.includes('fetched')
          ? 'bg-green-900/20 border-green-500 text-green-300'
          : 'bg-blue-900/20 border-blue-500 text-blue-300'
      }`}>
        <span className="font-medium">Status:</span> {status}
      </div>

      {/* Workspace Data Display */}
      {workspaceData && (
        <div className="mt-6 bg-gray-750 border border-gray-600 rounded-xl p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="font-semibold text-lg text-white">
                {workspaceData.name} <span className="text-gray-400">(ID: {workspaceData.workspaceId})</span>
              </h4>
            </div>
            <div className="text-sm text-gray-400">
              {workspaceData.tables.length} table{workspaceData.tables.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-4">
            {workspaceData.tables.map((tbl, i) => (
              <div key={i} className="border border-gray-600 rounded-lg bg-gray-750 hover:bg-gray-700 transition-colors overflow-hidden">
                {/* Table Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleTable(i)}
                >
                  <div className="flex items-center space-x-3">
                    <svg 
                      className={`w-5 h-5 text-blue-400 transition-transform ${expandedTables.has(i) ? 'rotate-90' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <h5 className="font-semibold text-blue-300 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>{tbl.tableName}</span>
                    </h5>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{tbl.columns.length} columns</span>
                      <span>{tbl.rows.length} rows</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {expandedTables.has(i) ? 'Click to collapse' : 'Click to expand'}
                  </div>
                </div>

                {/* Expandable Content */}
                {expandedTables.has(i) && (
                  <div className="border-t border-gray-600 p-4 bg-gray-800 space-y-6">
                    <ColumnInfo columns={tbl.columns} />
                    <DataTableView table={tbl} tableIndex={i} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}