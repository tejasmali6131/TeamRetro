import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Retro, CreateRetroData, Template } from '@/types/retro';
import { getTemplates, createRetro } from '@/services/api';
import BasicInfoTab from './BasicInfoTab';
import ProcessTab from './ProcessTab';
import OptionsTab from './OptionsTab';

interface CreateRetroFormProps {
  onSuccess: (retro: Retro) => void;
  onCancel: () => void;
}

type TabType = 'basic' | 'process' | 'options';

export default function CreateRetroForm({ onSuccess, onCancel }: CreateRetroFormProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  
  // Process states
  const [icebreakerEnabled, setIcebreakerEnabled] = useState(true);
  const [groupEnabled, setGroupEnabled] = useState(true);
  const [voteEnabled, setVoteEnabled] = useState(true);
  const [discussEnabled, setDiscussEnabled] = useState(true);
  const [reviewEnabled, setReviewEnabled] = useState(true);
  
  // Options states (all enabled by default)
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [commentReactionsEnabled, setCommentReactionsEnabled] = useState(true);
  const [nameDeck, setNameDeck] = useState('random');
  
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
      const templates = await getTemplates();
      setTemplates(templates);
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const onSubmit = async (data: CreateRetroData) => {
    try {
      // Build stages configuration based on user selections
      const stages = [
        { id: 'icebreaker', name: 'Icebreaker', duration: 0, enabled: icebreakerEnabled },
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
        nameDeck,
      };

      const retro = await createRetro(retroData);
      toast.success('Retrospective created successfully!');
      onSuccess(retro);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create retrospective');
    }
  };

  const handleNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
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
    <div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'basic'
              ? 'text-kone-blue dark:text-kone-lightBlue'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
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
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
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
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          Options
          {activeTab === 'options' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kone-blue dark:bg-kone-lightBlue"></div>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Content Area */}
        <div className="h-[320px] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <BasicInfoTab 
                register={register} 
                errors={errors} 
                templates={templates} 
              />
            )}

            {/* Process Tab */}
            {activeTab === 'process' && (
              <ProcessTab
                icebreakerEnabled={icebreakerEnabled}
                setIcebreakerEnabled={setIcebreakerEnabled}
                groupEnabled={groupEnabled}
                setGroupEnabled={setGroupEnabled}
                voteEnabled={voteEnabled}
                setVoteEnabled={setVoteEnabled}
                discussEnabled={discussEnabled}
                setDiscussEnabled={setDiscussEnabled}
                reviewEnabled={reviewEnabled}
                setReviewEnabled={setReviewEnabled}
              />
            )}

            {/* Options Tab */}
            {activeTab === 'options' && (
              <OptionsTab
                reactionsEnabled={reactionsEnabled}
                setReactionsEnabled={setReactionsEnabled}
                commentsEnabled={commentsEnabled}
                setCommentsEnabled={setCommentsEnabled}
                commentReactionsEnabled={commentReactionsEnabled}
                setCommentReactionsEnabled={setCommentReactionsEnabled}
                nameDeck={nameDeck}
                setNameDeck={setNameDeck}
              />
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
          </div>
        </div>
      </form>
    </div>
  );
}
