import { useState } from 'react';
import AppShell from './AppShell';
import UploadFiles, { type LoadedData, type Comment } from './Upload';
import MakeVariable from './VariableConfigure';
import ScatterPlot from './Plot';

export default function App() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tentativeVariableName, setTentativeVariableName] =
    useState<string>('');
  const [variableName, setVariableName] = useState<string | null>(null);
  const [visualizationData, setVisualizationData] = useState<any>(null);

  return (
    <AppShell
      sidebar={
        !loaded ? (
          <UploadFiles
            onFinish={(data: LoadedData) => {
              setComments(data.comments);
              setLoaded(true);
            }}
          />
        ) : !variableName ? (
          <div className="flex flex-col p-4">
            <p className="mb-4 text-slate-600">Enter variable to visualize:</p>
            <input
              type="text"
              className="mb-4 w-full rounded border border-slate-300 p-2"
              placeholder="e.g. environmental concern"
              onChange={(e) => setTentativeVariableName(e.target.value)}
            />
            <button
              onClick={() => setVariableName(tentativeVariableName)}
              className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Confirm
            </button>
          </div>
        ) : (
          <MakeVariable
            comments={comments}
            variableName={variableName}
            onUpdate={setVisualizationData}
          />
        )
      }
      canvas={
        visualizationData === null ? (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            No visualization yet.
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ScatterPlot data={visualizationData} />
          </div>
        )
      }
      analysis={<div className="flex h-full w-full items-center justify-center text-slate-400">
        Analysis Panel (Coming Soon)
      </div>}
    />
  );
}
