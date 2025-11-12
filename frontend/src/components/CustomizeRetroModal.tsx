import { useState } from 'react';

interface CustomizeRetroModalProps {
  onClose: () => void;
  onSave: () => void;
}

type TabType = 'process' | 'options';

export default function CustomizeRetroModal({ onClose, onSave }: CustomizeRetroModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('process');
  
  // Process states
  const [groupEnabled, setGroupEnabled] = useState(false);
  const [voteEnabled, setVoteEnabled] = useState(false);
  const [discussEnabled, setDiscussEnabled] = useState(false);
  const [reviewEnabled, setReviewEnabled] = useState(false);
  
  // Duration states
  const [groupDuration, setGroupDuration] = useState(10);
  const [voteDuration, setVoteDuration] = useState(5);
  const [discussDuration, setDiscussDuration] = useState(15);
  const [reviewDuration, setReviewDuration] = useState(10);
  
  // Options states (all enabled by default)
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [commentReactionsEnabled, setCommentReactionsEnabled] = useState(true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Customize Retrospective</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('process')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'process'
                  ? 'text-kone-blue'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Process
              {activeTab === 'process' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kone-blue"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'options'
                  ? 'text-kone-blue'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Options
              {activeTab === 'options' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kone-blue"></div>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'process' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Settings</h3>
                <p className="text-gray-600 mb-6">
                  Configure how your retrospective session will flow and what phases it will include.
                </p>
                
                {/* Process Steps */}
                <div className="space-y-4">
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

                  {/* Group - Optional with toggle and slider */}
                  <div className={`card border-2 transition-colors ${
                    groupEnabled ? 'bg-white border-kone-blue' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Group</h4>
                        <p className="text-sm text-gray-600">
                          Organize similar ideas together to identify common themes.
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <button
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
                    
                    {groupEnabled && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration: {groupDuration} minutes
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          step="5"
                          value={groupDuration}
                          onChange={(e) => setGroupDuration(parseInt(e.target.value))}
                          aria-label="Group phase duration in minutes"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-kone-blue"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>5 min</span>
                          <span>30 min</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vote - Optional with toggle and slider */}
                  <div className={`card border-2 transition-colors ${
                    voteEnabled ? 'bg-white border-kone-blue' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Vote</h4>
                        <p className="text-sm text-gray-600">
                          Team members vote on the most important topics to discuss.
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <button
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
                    
                    {voteEnabled && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration: {voteDuration} minutes
                        </label>
                        <input
                          type="range"
                          min="3"
                          max="15"
                          step="1"
                          value={voteDuration}
                          onChange={(e) => setVoteDuration(parseInt(e.target.value))}
                          aria-label="Vote phase duration in minutes"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-kone-blue"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>3 min</span>
                          <span>15 min</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Discuss - Optional with toggle and slider */}
                  <div className={`card border-2 transition-colors ${
                    discussEnabled ? 'bg-white border-kone-blue' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Discuss</h4>
                        <p className="text-sm text-gray-600">
                          Team discusses the most voted topics in detail.
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <button
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
                    
                    {discussEnabled && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration: {discussDuration} minutes
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="30"
                          step="5"
                          value={discussDuration}
                          onChange={(e) => setDiscussDuration(parseInt(e.target.value))}
                          aria-label="Discuss phase duration in minutes"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-kone-blue"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>10 min</span>
                          <span>30 min</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Review - Optional with toggle and slider */}
                  <div className={`card border-2 transition-colors ${
                    reviewEnabled ? 'bg-white border-kone-blue' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Review</h4>
                        <p className="text-sm text-gray-600">
                          Review action items and key takeaways from the session.
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <button
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
                    
                    {reviewEnabled && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration: {reviewDuration} minutes
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="20"
                          step="5"
                          value={reviewDuration}
                          onChange={(e) => setReviewDuration(parseInt(e.target.value))}
                          aria-label="Review phase duration in minutes"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-kone-blue"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>5 min</span>
                          <span>20 min</span>
                        </div>
                      </div>
                    )}
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
              </div>
            </div>
          )}

          {activeTab === 'options' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Options Settings</h3>
                <p className="text-gray-600 mb-6">
                  Customize additional settings for your retrospective session.
                </p>
                
                {/* Options toggles */}
                <div className="space-y-4">
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
              </div>
            </div>
          )}
        </div>

        {/* Footer with Action Buttons */}
        <div className="p-6 border-t border-gray-200 bg-white sticky bottom-0">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="btn-primary flex-1"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
