import type { VariableComment } from './App';

export const Comment = ({ comment }: { comment: VariableComment }) => {
  // Color code based on score value (assuming -1 to 1 scale, adjust if needed)
  const getScoreColor = (score: number) => {
    if (score > 0.33)
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score < -0.33) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="flex items-start gap-4 rounded border border-slate-200 bg-white p-4 text-sm">
      {/* Score Badge */}
      <div
        className={`flex items-center justify-center rounded border px-3 py-1.5 font-mono text-xs font-medium ${getScoreColor(
          comment.score
        )}`}>
        {comment.score.toFixed(2)}
      </div>

      {/* Comment Text */}
      <p className="flex-1 text-slate-700 leading-relaxed">{comment.text}</p>
    </div>
  );
};

export const AnalysisPanel = ({
  comments,
}: {
  comments: VariableComment[];
}) => {
  const stats = {
    total: comments.length,
    positive: comments.filter((c) => c.score > 0.33).length,
    negative: comments.filter((c) => c.score < -0.33).length,
    neutral: comments.filter((c) => c.score >= -0.33 && c.score <= 0.33).length,
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <div className="w-full max-w-4xl p-6 max-h-full overflow-y-auto">
        {comments.length > 0 ? (
          <div className="space-y-4">
            {/* Header Stats */}
            <div className="bg-white rounded border border-slate-200 p-4">
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div className="border-r border-slate-200 pr-4">
                  <div className="text-slate-500 uppercase tracking-wide mb-1">
                    Total
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {stats.total}
                  </div>
                </div>
                <div className="border-r border-slate-200 pr-4">
                  <div className="text-slate-500 uppercase tracking-wide mb-1">
                    Positive
                  </div>
                  <div className="text-lg font-semibold text-emerald-700">
                    {stats.positive}
                  </div>
                </div>
                <div className="border-r border-slate-200 pr-4">
                  <div className="text-slate-500 uppercase tracking-wide mb-1">
                    Neutral
                  </div>
                  <div className="text-lg font-semibold text-slate-700">
                    {stats.neutral}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase tracking-wide mb-1">
                    Negative
                  </div>
                  <div className="text-lg font-semibold text-rose-700">
                    {stats.negative}
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-2">
              {comments.map((comment, index) => (
                <Comment key={index} comment={comment} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">
              No comments available for analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
