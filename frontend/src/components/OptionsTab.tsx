interface OptionsTabProps {
  reactionsEnabled: boolean;
  setReactionsEnabled: (enabled: boolean) => void;
  commentsEnabled: boolean;
  setCommentsEnabled: (enabled: boolean) => void;
  commentReactionsEnabled: boolean;
  setCommentReactionsEnabled: (enabled: boolean) => void;
}

export default function OptionsTab({
  reactionsEnabled,
  setReactionsEnabled,
  commentsEnabled,
  setCommentsEnabled,
  commentReactionsEnabled,
  setCommentReactionsEnabled,
}: OptionsTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm mb-4">
        Customize additional settings for your retrospective session.
      </p>

      {/* Reactions */}
      <div className="card border-2 border-kone-blue bg-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Reactions</h4>
            <p className="text-sm text-gray-600">
              Allow team members to react to cards with emojis.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setReactionsEnabled(!reactionsEnabled)}
              aria-label={`${reactionsEnabled ? 'Disable' : 'Enable'} reactions`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                reactionsEnabled ? 'bg-kone-blue' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                reactionsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="card border-2 border-kone-blue bg-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Comments</h4>
            <p className="text-sm text-gray-600">
              Allow team members to comment on cards.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setCommentsEnabled(!commentsEnabled)}
              aria-label={`${commentsEnabled ? 'Disable' : 'Enable'} comments`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                commentsEnabled ? 'bg-kone-blue' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                commentsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Comment Reactions */}
      <div className="card border-2 border-kone-blue bg-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Comment Reactions</h4>
            <p className="text-sm text-gray-600">
              Allow team members to react to comments with emojis.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setCommentReactionsEnabled(!commentReactionsEnabled)}
              aria-label={`${commentReactionsEnabled ? 'Disable' : 'Enable'} comment reactions`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                commentReactionsEnabled ? 'bg-kone-blue' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                commentReactionsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
