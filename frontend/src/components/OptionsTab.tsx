interface OptionsTabProps {
  reactionsEnabled: boolean;
  setReactionsEnabled: (enabled: boolean) => void;
  commentsEnabled: boolean;
  setCommentsEnabled: (enabled: boolean) => void;
  commentReactionsEnabled: boolean;
  setCommentReactionsEnabled: (enabled: boolean) => void;
  nameDeck: string;
  setNameDeck: (deck: string) => void;
}

export default function OptionsTab({
  reactionsEnabled,
  setReactionsEnabled,
  commentsEnabled,
  setCommentsEnabled,
  commentReactionsEnabled,
  setCommentReactionsEnabled,
  nameDeck,
  setNameDeck,
}: OptionsTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        Customize additional settings for your retrospective session.
      </p>

      {/* Name Deck Selection */}
      <div className="card border-2 border-kone-blue dark:border-kone-lightBlue bg-white dark:bg-gray-800">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Participant Name Theme</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Choose a theme for randomly assigned participant names.
          </p>
          <select
            value={nameDeck}
            onChange={(e) => setNameDeck(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-kone-blue dark:focus:ring-kone-lightBlue"
            aria-label="Select participant name theme"
          >
            <option value="random">Random (All Themes)</option>
            <option value="animals">Animals</option>
            <option value="plants">Plants</option>
            <option value="colors">Colors</option>
            <option value="celestial">Celestial Bodies</option>
            <option value="elements">Elements</option>
          </select>
        </div>
      </div>

      {/* Reactions */}
      <div className="card border-2 border-kone-blue dark:border-kone-lightBlue bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Reactions</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Allow team members to react to cards with emojis.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setReactionsEnabled(!reactionsEnabled)}
              aria-label={`${reactionsEnabled ? 'Disable' : 'Enable'} reactions`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                reactionsEnabled ? 'bg-kone-blue dark:bg-kone-lightBlue' : 'bg-gray-300 dark:bg-gray-600'
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
      <div className="card border-2 border-kone-blue dark:border-kone-lightBlue bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Comments</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Allow team members to comment on cards.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setCommentsEnabled(!commentsEnabled)}
              aria-label={`${commentsEnabled ? 'Disable' : 'Enable'} comments`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                commentsEnabled ? 'bg-kone-blue dark:bg-kone-lightBlue' : 'bg-gray-300 dark:bg-gray-600'
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
      <div className="card border-2 border-kone-blue dark:border-kone-lightBlue bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Comment Reactions</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Allow team members to react to comments with emojis.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setCommentReactionsEnabled(!commentReactionsEnabled)}
              aria-label={`${commentReactionsEnabled ? 'Disable' : 'Enable'} comment reactions`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                commentReactionsEnabled ? 'bg-kone-blue dark:bg-kone-lightBlue' : 'bg-gray-300 dark:bg-gray-600'
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
