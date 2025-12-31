import { useState } from 'react';
import AppShell from './AppShell';
import UploadFiles, { type LoadedData, type Comment } from './Upload';
import MakeVariable from './VariableConfigure';
import Plot from 'react-plotly.js';

export default function App() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [variableName, setVariableName] = useState<string>('Variable 1');
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
          <Plot
            data={visualizationData.data}
            layout={visualizationData.layout}
            style={{ width: '100%', height: '100%' }}
          />
        )
      }
    />
  );
}
