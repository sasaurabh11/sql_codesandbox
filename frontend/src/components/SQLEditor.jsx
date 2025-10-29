import React, { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { executeSQL } from "../api";

export default function SQLEditor({ workspaceId, onResult }) {
  const [sql, setSql] = useState("SELECT * FROM information_schema.tables;");
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef(null);

  async function run() {
    if (!workspaceId) return setStatus("Set or create a workspace first");
    setIsRunning(true);
    setStatus("Running...");
    const res = await executeSQL(workspaceId, sql);
    if (res.ok) {
      setStatus("✓ Query executed successfully");
      onResult && onResult(res.body);
    } else {
      setStatus("✗ Error: " + JSON.stringify(res.body));
    }
    setIsRunning(false);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={(v) => setSql(v)}
          theme="vs-dark"
          onMount={(editor) => (editorRef.current = editor)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on'
          }}
        />
      </div>
      
      <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className={`text-sm font-medium px-3 py-1 rounded-full ${
            status?.startsWith('✓') 
              ? 'bg-green-900/30 text-green-400 border border-green-800'
              : status?.startsWith('✗')
              ? 'bg-red-900/30 text-red-400 border border-red-800'
              : 'bg-blue-900/30 text-blue-400 border border-blue-800'
          }`}>
            {status}
          </div>
          <button
            onClick={run}
            disabled={isRunning}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center space-x-2"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Running...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Run Query</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}