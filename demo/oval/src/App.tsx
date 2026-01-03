import { useState } from 'react';
import AppShell from './AppShell';
import UploadFiles, { type LoadedData, type Comment } from './Upload';
import MakeVariable, { variableNameToSnakeCase } from './VariableConfigure';
import ScatterPlot from './Plot';
import { AnalysisPanel } from './Analysis';

export interface VariableComment {
  score: number;
  text: string;
}

const getScoredCommentsApi = async (
  variableName: string
): Promise<VariableComment[]> => {
  const response = await fetch(
    `http://localhost:8000/comments/${variableNameToSnakeCase(variableName)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch scored comments');
  }

  const data = await response.json();
  return data.map((comment: any) => ({
    score: comment.score,
    text: comment['comment-body'],
  })) as VariableComment[];
};

export default function App() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tentativeVariableName, setTentativeVariableName] =
    useState<string>('');
  const [variableName, setVariableName] = useState<string | null>(null);
  const [visualizationData, setVisualizationData] = useState<any>(null);
  const [variableComments, setVariableComments] = useState<VariableComment[]>(
    []
  );

  const update = async (visualizationData: any) => {
    setVisualizationData(visualizationData);
    if (variableName) {
      const scoredComments = await getScoredCommentsApi(variableName);
      setVariableComments(scoredComments);
    }
  };

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
            onUpdate={update}
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
      analysis={
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          <AnalysisPanel comments={variableComments} />
        </div>
      }
    />
  );
}
