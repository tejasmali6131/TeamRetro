import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Retro, CreateRetroData } from '@/types/retro';
import { Template } from '@/types/retro';
import api from '@/services/api';

interface CreateRetroFormProps {
  onSuccess: (retro: Retro) => void;
  onCancel: () => void;
}

type TabType = 'basic' | 'process' | 'options';

export default function CreateRetroForm({ onSuccess, onCancel }: CreateRetroFormProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  
  // Process states
  const [groupEnabled, setGroupEnabled] = useState(true);
  const [voteEnabled, setVoteEnabled] = useState(true);
  const [discussEnabled, setDiscussEnabled] = useState(true);
  const [reviewEnabled, setReviewEnabled] = useState(true);
  
  // Options states (all enabled by default)
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [commentReactionsEnabled, setCommentReactionsEnabled] = useState(true);
  
  const { register, handleSubmit, formState: { errors } } = useForm<CreateRetroData>({
    defaultValues: {
      isAnonymous: false,
      votingLimit: 5,
      timerDuration: 15,
    },
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const onSubmit = async (data: CreateRetroData) => {
    try {
      // Build stages configuration based on user selections
      const stages = [
        { id: 'brainstorm', name: 'Brainstorm', duration: 0, enabled: true }, // Always enabled
        { id: 'group', name: 'Group', duration: 0, enabled: groupEnabled },
        { id: 'vote', name: 'Vote', duration: 0, enabled: voteEnabled },
        { id: 'discuss', name: 'Discuss', duration: 0, enabled: discussEnabled },
        { id: 'review', name: 'Review', duration: 0, enabled: reviewEnabled },
        { id: 'report', name: 'Report', duration: 0, enabled: true }, // Always enabled
      ];

      const retroData = {
        ...data,
        stages,
        reactionsEnabled,
        commentsEnabled,
        commentReactionsEnabled,
      };

      const response = await api.post('/retros', retroData);
      toast.success('Retrospective created successfully!');
      onSuccess(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create retrospective');
    }
  };

  const handleNext = () => {
    if (activeTab === 'basic') {
      setActiveTab('process');
    } else if (activeTab === 'process') {
      setActiveTab('options');
    }
  };

  const handleStartInstantly = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'basic'
              ? 'text-kone-blue dark:text-kone-lightBlue'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Basic Info
          {activeTab === 'basic' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kone-blue dark:bg-kone-lightBlue"></div>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('process')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'process'
              ? 'text-kone-blue dark:text-kone-lightBlue'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Process
          {activeTab === 'process' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kone-blue dark:bg-kone-lightBlue"></div>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('options')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'options'
              ? 'text-kone-blue dark:text-kone-lightBlue'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Options
          {activeTab === 'options' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kone-blue dark:bg-kone-lightBlue"></div>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Session Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Name *
              </label>
              <input
                type="text"
                {...register('sessionName', { required: 'Session name is required' })}
                className="input-field"
                placeholder="e.g., Sprint 42 Retrospective"
              />
              {errors.sessionName && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.sessionName.message}</p>
              )}
            </div>

            {/* Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Context
              </label>
              <textarea
                {...register('context')}
                className="input-field"
                rows={3}
                placeholder="Add any context or goals for this retrospective..."
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template *
              </label>
              <select
                {...register('templateId', { required: 'Template is required' })}
                className="input-field"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {errors.templateId && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.templateId.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Process Tab */}
        {activeTab === 'process' && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Configure how your retrospective session will flow and what phases it will include.
            </p>

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
                  <div className="w-12 h-6 bg-kone-blue rounded-full flex items-center px-1 cursor-not-allowed opacity-75">
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
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      groupEnabled ? 'bg-kone-blue' : 'bg-gray-300 dark:bg-gray-600'
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
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      voteEnabled ? 'bg-kone-blue' : 'bg-gray-300 dark:bg-gray-600'
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
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      discussEnabled ? 'bg-kone-blue' : 'bg-gray-300 dark:bg-gray-600'
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
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      reviewEnabled ? 'bg-kone-blue' : 'bg-gray-300 dark:bg-gray-600'
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
            <div className="card bg-white dark:bg-gray-800 border-2 border-kone-blue dark:border-kone-lightBlue">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Report</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
        )}

        {/* Options Tab */}
        {activeTab === 'options' && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Customize additional settings for your retrospective session.
            </p>

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
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      reactionsEnabled ? 'bg-kone-blue' : 'bg-gray-300 dark:bg-gray-600'
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
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      commentsEnabled ? 'bg-kone-blue' : 'bg-gray-300 dark:bg-gray-600'
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
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      commentReactionsEnabled ? 'bg-kone-blue' : 'bg-gray-300 dark:bg-gray-600'
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
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          {activeTab !== 'options' ? (
            <button
              type="button"
              onClick={handleStartInstantly}
              className="btn-secondary flex-1"
            >
              Start Instantly
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          )}
          {activeTab !== 'options' ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary flex-1"
            >
              Customize More
            </button>
          ) : (
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Start Retrospective
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
