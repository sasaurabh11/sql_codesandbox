import React, { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { executeSQL } from "../api";

export default function SQLEditor({ workspaceId, onResult }) {
  const [sql, setSql] = useState("SELECT * FROM information_schema.tables;");
  const [status, setStatus] = useState("");
  const editorRef = useRef(null);

  async function run() {
    if (!workspaceId) return setStatus("Set or create a workspace first");
    setStatus("Running...");
    const res = await executeSQL(workspaceId, sql);
    if (res.ok) {
      setStatus("OK");
      onResult && onResult(res.body);
    } else setStatus("Error: " + JSON.stringify(res.body));
  }

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">SQL Editor</h3>
        <div className="flex gap-2">
          <button
            onClick={run}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Run
          </button>
          <div className="text-sm text-gray-600">{status}</div>
        </div>
      </div>
      <div className="editor-container">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={(v) => setSql(v)}
          theme="vs-dark"
          onMount={(editor) => (editorRef.current = editor)}
        />
      </div>
    </div>
  );
}
