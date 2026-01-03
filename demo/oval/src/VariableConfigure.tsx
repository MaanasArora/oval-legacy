import { useState } from 'react';
import type { Comment } from './Upload';

const SCALE = {
  'Very Low': -2,
  Low: -1,
  Neutral: 0,
  High: 1,
  'Very High': 2,
};

interface CommentVariableMapping {
  comment_id: number;
  score: number;
}

interface RegressVariableRequest {
  variable_name?: string;
  mappings: CommentVariableMapping[];
}

const regressVariableApi = async (request: RegressVariableRequest) => {
  const response = await fetch('http://localhost:8000/regress_variable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to regress variable');
  }

  return response.json();
};

const getVisualizationApi = async (variableName: string) => {
  const response = await fetch(
    `http://localhost:8000/visualize/${variableName}`
  );

  if (!response.ok) {
    throw new Error('Failed to get visualization');
  }

  return response.json();
};

export const variableNameToSnakeCase = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '_');
};

export default function MakeVariable({
  comments,
  variableName,
  onUpdate,
}: {
  comments: Comment[];
  variableName: string;
  onUpdate?: (data: any) => void;
}) {
  const [currentCommentIndex, setCurrentCommentIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<number, number>>({});

  const updateRegression = async () => {
    const request: RegressVariableRequest = {
      variable_name: variableNameToSnakeCase(variableName),
      mappings: Object.entries(responses).map(([commentId, score]) => ({
        comment_id: Number(commentId),
        score,
      })),
    };

    await regressVariableApi(request);

    if (onUpdate) {
      const vizData = await getVisualizationApi(
        variableNameToSnakeCase(variableName)
      );
      onUpdate(vizData);
    }
  };

  const handleResponse = (commentId: number, value: string) => {
    const scaleValue = SCALE[value as keyof typeof SCALE];
    setResponses((prev) => ({ ...prev, [commentId]: scaleValue }));
    setCurrentCommentIndex(currentCommentIndex + 1);
    updateRegression();
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Prompt */}
      <div>
        <h2 className="text-sm font-medium text-slate-700">
          How strongly does this comment express
        </h2>
        <p className="mt-1 text-base font-semibold text-slate-900">
          “{variableName}”
        </p>
      </div>

      {/* Comment card */}
      {currentCommentIndex < comments.length && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-700">
            {comments[currentCommentIndex]['comment-body']}
          </p>
        </div>
      )}

      {/* Rating buttons */}
      <div className="space-y-2">
        {Object.keys(SCALE).map((label) => (
          <button
            key={label}
            onClick={() =>
              handleResponse(comments[currentCommentIndex]['comment-id'], label)
            }
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {label}
          </button>
        ))}
      </div>

      {/* Progress hint (optional but nice) */}
      <p className="text-xs text-slate-400">
        Comment {currentCommentIndex + 1} of {comments.length}
      </p>
    </div>
  );
}
