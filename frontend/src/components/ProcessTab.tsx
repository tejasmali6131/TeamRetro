interface ProcessTabProps {
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
      <p className="text-gray-600 text-sm mb-4">
        Configure how your retrospective session will flow and what phases it will include.
      </p>

      {/* Brainstorm - Always enabled */}
      <div className="card bg-white border-2 border-kone-blue">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Brainstorm</h4>
            <p className="text-sm text-gray-600">
              Team members share their thoughts and ideas. This phase is required.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-6 bg-kone-blue rounded-full flex items-center px-1 cursor-not-allowed opacity-75">
              <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Group */}
      <div className={`card border-2 transition-colors ${
        groupEnabled ? 'bg-white border-kone-blue' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Group</h4>
            <p className="text-sm text-gray-600">
              Organize similar ideas together to identify common themes.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setGroupEnabled(!groupEnabled)}
              aria-label={`${groupEnabled ? 'Disable' : 'Enable'} group phase`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                groupEnabled ? 'bg-kone-blue' : 'bg-gray-300'
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
        voteEnabled ? 'bg-white border-kone-blue' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Vote</h4>
            <p className="text-sm text-gray-600">
              Team members vote on the most important topics to discuss.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setVoteEnabled(!voteEnabled)}
              aria-label={`${voteEnabled ? 'Disable' : 'Enable'} vote phase`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                voteEnabled ? 'bg-kone-blue' : 'bg-gray-300'
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
        discussEnabled ? 'bg-white border-kone-blue' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Discuss</h4>
            <p className="text-sm text-gray-600">
              Team discusses the most voted topics in detail.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setDiscussEnabled(!discussEnabled)}
              aria-label={`${discussEnabled ? 'Disable' : 'Enable'} discuss phase`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                discussEnabled ? 'bg-kone-blue' : 'bg-gray-300'
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
        reviewEnabled ? 'bg-white border-kone-blue' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Review</h4>
            <p className="text-sm text-gray-600">
              Review action items and key takeaways from the session.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setReviewEnabled(!reviewEnabled)}
              aria-label={`${reviewEnabled ? 'Disable' : 'Enable'} review phase`}
              className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                reviewEnabled ? 'bg-kone-blue' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                reviewEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Report - Always enabled */}
      <div className="card bg-white border-2 border-kone-blue">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Report</h4>
            <p className="text-sm text-gray-600">
              Generate a summary report of the retrospective. This phase is required.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-6 bg-kone-blue rounded-full flex items-center px-1 cursor-not-allowed opacity-75">
              <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
