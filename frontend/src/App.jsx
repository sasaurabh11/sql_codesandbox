import React, { useState } from 'react'
import WorkspaceManager from './components/WorkspaceManager'
import SchemaBuilder from './components/SchemaBuilder'
import SQLEditor from './components/SQLEditor'
import ResultViewer from './components/ResultViewer'

export default function App(){
  const [workspaceId, setWorkspaceId] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">SQL SandBox</h1>
        </header>

        <WorkspaceManager onWorkspaceSet={setWorkspaceId} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div>
            <SchemaBuilder workspaceId={workspaceId} onSaved={w => console.log('saved', w)} />
            <SQLEditor workspaceId={workspaceId} onResult={(r) => setLastResult(r)} />
          </div>
          <div>
            <ResultViewer result={lastResult} />
          </div>
        </div>
      </div>
    </div>
  )
}