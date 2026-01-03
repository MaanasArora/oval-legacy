import type { VariableComment } from './App';

export const Comment = ({ comment }: { comment: VariableComment }) => {
  return (
    <div className="grid grid-cols-12 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="col-span-3 flex items-center justify-center">
        <span className="text-sm font-medium text-white bg-slate-600 px-2 py-1 rounded-full">
          {comment.score.toPrecision(3)}
        </span>
      </div>
      <p className="col-span-9 text-sm leading-relaxed text-slate-700">
        {comment.text}
      </p>
    </div>
  );
};

export const AnalysisPanel = ({
  comments,
}: {
  comments: VariableComment[];
}) => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="p-4 max-h-full overflow-y-auto">
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <Comment key={index} comment={comment} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No comments available for analysis.</p>
        )}
      </div>
    </div>
  );
};
