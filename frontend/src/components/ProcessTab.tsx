interface ProcessTabProps {
  icebreakerEnabled: boolean;
  setIcebreakerEnabled: (enabled: boolean) => void;
  groupEnabled: boolean;
  setGroupEnabled: (enabled: boolean) => void;
  voteEnabled: boolean;
  setVoteEnabled: (enabled: boolean) => void;
  discussEnabled: boolean;
  setDiscussEnabled: (enabled: boolean) => void;
  reviewEnabled: boolean;
  setReviewEnabled: (enabled: boolean) => void;
}

export default function ProcessTab({
  icebreakerEnabled,
  setIcebreakerEnabled,
  groupEnabled,
  setGroupEnabled,
  voteEnabled,
  setVoteEnabled,
  discussEnabled,
  setDiscussEnabled,
  reviewEnabled,
  setReviewEnabled,
}: ProcessTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        Configure how your retrospective session will flow and what phases it will include.
      </p>

      {/* Icebreaker */}
      <div
        className={`card border-2 transition-colors ${
          icebreakerEnabled
            ? 'bg-white dark:bg-gray-800 border-kone-blue dark:border-kone-lightBlue'
            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Icebreaker</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fun questions to help team members get to know each other better.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setIcebreakerEnabled(!icebreakerEnabled)}
              aria-label={`${icebreakerEnabled ? 'Disable' : 'Enable'} icebreaker phase`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                icebreakerEnabled ? 'bg-kone-blue dark:bg-kone-lightBlue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                icebreakerEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Brainstorm - Always enabled */}
      <div className="card bg-white dark:bg-gray-800 border-2 border-kone-blue dark:border-kone-lightBlue">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Brainstorm</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Team members share their thoughts and ideas. This phase is required.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-6 bg-kone-blue dark:bg-kone-lightBlue rounded-full flex items-center px-1 cursor-not-allowed opacity-75">
              <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Group */}
      <div className={`card border-2 transition-colors ${
        groupEnabled ? 'bg-white dark:bg-gray-800 border-kone-blue dark:border-kone-lightBlue' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Group</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organize similar ideas together to identify common themes.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setGroupEnabled(!groupEnabled)}
              aria-label={`${groupEnabled ? 'Disable' : 'Enable'} group phase`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                groupEnabled ? 'bg-kone-blue dark:bg-kone-lightBlue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                groupEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Vote */}
      <div className={`card border-2 transition-colors ${
        voteEnabled ? 'bg-white dark:bg-gray-800 border-kone-blue dark:border-kone-lightBlue' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Vote</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Team members vote on the most important topics to discuss.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setVoteEnabled(!voteEnabled)}
              aria-label={`${voteEnabled ? 'Disable' : 'Enable'} vote phase`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                voteEnabled ? 'bg-kone-blue dark:bg-kone-lightBlue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                voteEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Discuss */}
      <div className={`card border-2 transition-colors ${
        discussEnabled ? 'bg-white dark:bg-gray-800 border-kone-blue dark:border-kone-lightBlue' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Discuss</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Team discusses the most voted topics in detail.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setDiscussEnabled(!discussEnabled)}
              aria-label={`${discussEnabled ? 'Disable' : 'Enable'} discuss phase`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                discussEnabled ? 'bg-kone-blue dark:bg-kone-lightBlue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                discussEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Review */}
      <div className={`card border-2 transition-colors ${
        reviewEnabled ? 'bg-white dark:bg-gray-800 border-kone-blue dark:border-kone-lightBlue' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Review</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review action items and key takeaways from the session.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setReviewEnabled(!reviewEnabled)}
              aria-label={`${icebreakerEnabled ? 'Disable' : 'Enable'} icebreaker phase`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                icebreakerEnabled ? 'bg-kone-blue dark:bg-kone-lightBlue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  icebreakerEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Report - Always enabled */}
      <div className="card bg-white dark:bg-gray-800 border-2 border-kone-blue dark:border-kone-lightBlue">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Report</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate a summary report of the retrospective. This phase is required.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-6 bg-kone-blue dark:bg-kone-lightBlue rounded-full flex items-center px-1 cursor-not-allowed opacity-75">
              <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
