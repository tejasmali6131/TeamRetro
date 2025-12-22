import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Check, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRetroById } from '@/services/api';
import Header from '@/components/Header';
import ParticipantsSidebar from '@/components/ParticipantsSidebar';
import IcebreakerStage from '@/components/retroComponents/IcebreakerStage';
import BrainstormStage from '@/components/retroComponents/BrainstormStage';
import GroupStage from '@/components/retroComponents/GroupStage';
import VoteStage from '@/components/retroComponents/VoteStage';
import DiscussStage from '@/components/retroComponents/DiscussStage';
import ReviewStage from '@/components/retroComponents/ReviewStage';
import ReportStage from '@/components/retroComponents/ReportStage';
import { useRetroWebSocket } from '@/hooks/useRetroWebSocket';
import { RetroStage } from '@/types/retro';

interface RetroData {
  id: string;
  sessionName: string;
  context: string;
  templateId: string;
  status: string;
  creatorId?: string;
  stages?: RetroStage[];
  votingLimit?: number;
  template?: {
    id: string;
    name: string;
    columns: Array<{
      id: string;
      name: string;
      color: string;
      placeholder: string;
    }>;
  };
}

const DEFAULT_STAGES: RetroStage[] = [
  { id: 'icebreaker', name: 'Icebreaker', duration: 0, enabled: true },
  { id: 'brainstorm', name: 'Brainstorm', duration: 0, enabled: true },
  { id: 'group', name: 'Group', duration: 0, enabled: true },
  { id: 'vote', name: 'Vote', duration: 0, enabled: true },
  { id: 'discuss', name: 'Discuss', duration: 0, enabled: true },
  { id: 'review', name: 'Review', duration: 0, enabled: true },
  { id: 'report', name: 'Report', duration: 0, enabled: true },
];

export default function RetroBoard() {
  const { retroId } = useParams<{ retroId: string }>();
  const navigate = useNavigate();

  const [retro, setRetro] = useState<RetroData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Get enabled stages from retro data
  const allStages = retro?.stages || DEFAULT_STAGES;
  const enabledStages = allStages.filter((stage) => stage.enabled);

  // Use the WebSocket hook for all real-time state
  const {
    ws,
    currentUserId,
    participants,
    cards,
    cardGroups,
    votes,
    actionItems,
    discussedItems,
    stageDoneStatus,
    reactions,
    icebreakerState,
    currentStageIndex,
    setCards,
    setCardGroups,
    setVotes,
    setActionItems,
    setDiscussedItems,
    setCurrentStageIndex,
    sendMessage,
  } = useRetroWebSocket({ retroId, enabledStages });

  const currentStage = enabledStages[currentStageIndex];
  const isRoomCreator = participants.some((p) => p.id === currentUserId && p.isCreator);

  // Fetch retro data on mount
  useEffect(() => {
    if (retroId) {
      getRetroById(retroId)
        .then((data) => setRetro(data))
        .catch(() => {
          toast.error('Failed to load retrospective');
          navigate('/dashboard');
        });
    }
  }, [retroId, navigate]);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          toast.success('Time is up for this stage!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

  // Stage navigation handlers
  const goToNextStage = () => {
    if (currentStageIndex < enabledStages.length - 1) {
      const newIndex = currentStageIndex + 1;
      setCurrentStageIndex(newIndex);
      setIsTimerRunning(false);
      setTimeRemaining(0);
      sendMessage({ type: 'stage-change', stageIndex: newIndex });
    }
  };

  const goToPreviousStage = () => {
    if (currentStageIndex > 0) {
      const newIndex = currentStageIndex - 1;
      setCurrentStageIndex(newIndex);
      setIsTimerRunning(false);
      setTimeRemaining(0);
      sendMessage({ type: 'stage-change', stageIndex: newIndex });
    }
  };

  const startTimer = () => {
    if (currentStage?.duration > 0) {
      setTimeRemaining(currentStage.duration);
      setIsTimerRunning(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if Next button should be disabled
  const isNextDisabled =
    currentStageIndex === enabledStages.length - 1 ||
    ((currentStage?.id === 'brainstorm' || currentStage?.id === 'vote') &&
      (stageDoneStatus[currentStage.id]?.length || 0) < participants.length);

  // Loading state
  if (!retro) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kone-blue dark:border-kone-lightBlue mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading retrospective...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{retro.sessionName}</h1>
            {retro.context && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{retro.context}</p>
            )}
          </div>

          {/* Stage Progress Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {enabledStages.map((stage, index) => (
              <div key={stage.id} className="flex items-center flex-shrink-0">
                <StageButton stage={stage} index={index} currentIndex={currentStageIndex} />
                {index < enabledStages.length - 1 && (
                  <ChevronRight
                    className={`w-5 h-5 flex-shrink-0 ${
                      index < currentStageIndex ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Timer */}
          {currentStage?.duration > 0 && (
            <TimerSection
              stageName={currentStage.name}
              duration={currentStage.duration}
              timeRemaining={timeRemaining}
              isRunning={isTimerRunning}
              onStart={startTimer}
              onPause={() => setIsTimerRunning(false)}
              formatTime={formatTime}
            />
          )}

          {/* Stage Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex-1 overflow-hidden">
            <StageContent
              stageId={currentStage?.id}
              retro={retro}
              retroId={retroId || ''}
              ws={ws}
              currentUserId={currentUserId}
              participants={participants}
              isRoomCreator={isRoomCreator}
              cards={cards}
              setCards={setCards}
              cardGroups={cardGroups}
              setCardGroups={setCardGroups}
              votes={votes}
              setVotes={setVotes}
              actionItems={actionItems}
              setActionItems={setActionItems}
              discussedItems={discussedItems}
              setDiscussedItems={setDiscussedItems}
              stageDoneStatus={stageDoneStatus}
              reactions={reactions}
              icebreakerState={icebreakerState}
            />
          </div>

          {/* Navigation Buttons */}
          {isRoomCreator && (
            <div className="flex justify-between mt-6">
              <button
                onClick={goToPreviousStage}
                disabled={currentStageIndex === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous Stage
              </button>
              <button
                onClick={goToNextStage}
                disabled={isNextDisabled}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  isNextDisabled && currentStage?.id
                    ? `Waiting for ${participants.length - (stageDoneStatus[currentStage.id]?.length || 0)} participants to finish`
                    : undefined
                }
              >
                Next Stage →
              </button>
            </div>
          )}
        </div>

        {/* Participants Sidebar */}
        <ParticipantsSidebar
          participants={participants}
          retroId={retroId || ''}
          currentUserId={currentUserId}
          creatorId={participants.find((p) => p.isCreator)?.id || ''}
          stageDoneStatus={stageDoneStatus}
          currentStageId={currentStage?.id || ''}
        />
      </div>
    </div>
  );
}

// Sub-components for better organization

interface StageButtonProps {
  stage: RetroStage;
  index: number;
  currentIndex: number;
}

function StageButton({ stage, index, currentIndex }: StageButtonProps) {
  const isActive = index === currentIndex;
  const isCompleted = index < currentIndex;

  const className = `px-4 py-2 rounded-lg font-medium transition-all ${
    isActive
      ? 'bg-kone-blue dark:bg-kone-lightBlue text-white shadow-md'
      : isCompleted
      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
  }`;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {isCompleted && <Check className="w-4 h-4" />}
        <span>{stage.name}</span>
        {isActive && stage.duration > 0 && (
          <span className="text-xs opacity-90">({Math.floor(stage.duration / 60)}m)</span>
        )}
      </div>
    </div>
  );
}

interface TimerSectionProps {
  stageName: string;
  duration: number;
  timeRemaining: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  formatTime: (seconds: number) => string;
}

function TimerSection({ stageName, duration, timeRemaining, isRunning, onStart, onPause, formatTime }: TimerSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Clock className="w-6 h-6 text-kone-blue dark:text-kone-lightBlue" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stageName} Phase</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isRunning
                ? `Time remaining: ${formatTime(timeRemaining)}`
                : `Duration: ${Math.floor(duration / 60)} minutes`}
            </p>
          </div>
        </div>
        <button onClick={isRunning ? onPause : onStart} className={isRunning ? 'btn-secondary' : 'btn-primary'}>
          {isRunning ? 'Pause Timer' : 'Start Timer'}
        </button>
      </div>
    </div>
  );
}

interface StageContentProps {
  stageId: string | undefined;
  retro: RetroData;
  retroId: string;
  ws: WebSocket | null;
  currentUserId: string;
  participants: any[];
  isRoomCreator: boolean;
  cards: any[];
  setCards: any;
  cardGroups: any[];
  setCardGroups: any;
  votes: any;
  setVotes: any;
  actionItems: any[];
  setActionItems: any;
  discussedItems: Set<string>;
  setDiscussedItems: any;
  stageDoneStatus: any;
  reactions: any;
  icebreakerState: any;
}

function StageContent({
  stageId,
  retro,
  retroId,
  ws,
  currentUserId,
  participants,
  isRoomCreator,
  cards,
  setCards,
  cardGroups,
  setCardGroups,
  votes,
  setVotes,
  actionItems,
  setActionItems,
  discussedItems,
  setDiscussedItems,
  stageDoneStatus,
  reactions,
  icebreakerState,
}: StageContentProps) {
  const stageComponents: Record<string, JSX.Element> = {
    icebreaker: (
      <IcebreakerStage
        participants={participants}
        currentUserId={currentUserId}
        isRoomCreator={isRoomCreator}
        ws={ws}
        initialState={icebreakerState || undefined}
      />
    ),
    brainstorm: (
      <>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Brainstorm Stage</h2>
        <BrainstormStage
          template={retro.template}
          currentUserId={currentUserId}
          ws={ws}
          retroId={retroId}
          cards={cards}
          setCards={setCards}
          stageId="brainstorm"
          isDone={stageDoneStatus['brainstorm']?.includes(currentUserId) || false}
        />
      </>
    ),
    group: (
      <>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Group Stage</h2>
        <GroupStage
          template={retro.template}
          currentUserId={currentUserId}
          ws={ws}
          retroId={retroId}
          cards={cards}
          setCards={setCards}
          cardGroups={cardGroups}
          setCardGroups={setCardGroups}
          reactions={reactions}
        />
      </>
    ),
    vote: (
      <>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Vote Stage</h2>
        <VoteStage
          template={retro.template}
          currentUserId={currentUserId}
          ws={ws}
          retroId={retroId}
          cards={cards}
          cardGroups={cardGroups}
          votingLimit={retro.votingLimit || 5}
          votes={votes}
          setVotes={setVotes}
          stageId="vote"
          isDone={stageDoneStatus['vote']?.includes(currentUserId) || false}
        />
      </>
    ),
    discuss: (
      <>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Discuss Stage</h2>
        <DiscussStage
          template={retro.template}
          currentUserId={currentUserId}
          ws={ws}
          retroId={retroId}
          cards={cards}
          cardGroups={cardGroups}
          votes={votes}
          isRoomCreator={isRoomCreator}
          discussedItems={discussedItems}
          setDiscussedItems={setDiscussedItems}
        />
      </>
    ),
    review: (
      <>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Review Stage</h2>
        <ReviewStage
          template={retro.template}
          currentUserId={currentUserId}
          ws={ws}
          retroId={retroId}
          cards={cards}
          cardGroups={cardGroups}
          votes={votes}
          participants={participants}
          isRoomCreator={isRoomCreator}
          actionItems={actionItems}
          setActionItems={setActionItems}
        />
      </>
    ),
    report: (
      <>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Report Stage</h2>
        <ReportStage
          template={retro.template}
          retroId={retroId}
          retroName={retro.sessionName}
          retroContext={retro.context}
          cards={cards}
          cardGroups={cardGroups}
          votes={votes}
          participants={participants}
          actionItems={actionItems}
        />
      </>
    ),
  };

  return stageId ? stageComponents[stageId] || null : null;
}
