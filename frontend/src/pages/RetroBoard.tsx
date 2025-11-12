import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Link as LinkIcon, Clock, Check, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import Header from '@/components/Header';

interface Participant {
  id: string;
  name: string;
  joinedAt: Date;
}

interface RetroStage {
  id: string;
  name: string;
  duration: number;
  enabled: boolean;
}

interface RetroData {
  id: string;
  sessionName: string;
  context: string;
  templateId: string;
  status: string;
  stages?: RetroStage[];
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

export default function RetroBoard() {
  const { retroId } = useParams<{ retroId: string }>();
  const navigate = useNavigate();
  
  const [retro, setRetro] = useState<RetroData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Default stages if not provided by backend
  const defaultStages: RetroStage[] = [
    { id: 'brainstorm', name: 'Brainstorm', duration: 0, enabled: true },
    { id: 'group', name: 'Group', duration: 0, enabled: true },
    { id: 'vote', name: 'Vote', duration: 0, enabled: true },
    { id: 'discuss', name: 'Discuss', duration: 0, enabled: true },
    { id: 'review', name: 'Review', duration: 0, enabled: true },
    { id: 'report', name: 'Report', duration: 0, enabled: true },
  ];

  // Use stages from retro data if available, otherwise use defaults
  // Filter to only show enabled stages (based on customization in CreateRetroForm)
  const allStages = retro?.stages || defaultStages;
  const enabledStages = allStages.filter(stage => stage.enabled);

  useEffect(() => {
    if (retroId) {
      fetchRetroData();
      fetchParticipants();
    }
  }, [retroId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            toast.success('Time is up for this stage!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

  const fetchRetroData = async () => {
    try {
      const response = await api.get(`/retros/${retroId}`);
      setRetro(response.data);
    } catch (error) {
      toast.error('Failed to load retrospective');
      navigate('/dashboard');
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await api.get(`/retros/${retroId}/participants`);
      setParticipants(response.data);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  const copyRetroLink = () => {
    const link = `${window.location.origin}/retro/${retroId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const startTimer = () => {
    const currentStage = enabledStages[currentStageIndex];
    if (currentStage && currentStage.duration > 0) {
      setTimeRemaining(currentStage.duration);
      setIsTimerRunning(true);
    }
  };

  const goToNextStage = () => {
    if (currentStageIndex < enabledStages.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
      setIsTimerRunning(false);
      setTimeRemaining(0);
    }
  };

  const goToPreviousStage = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex(currentStageIndex - 1);
      setIsTimerRunning(false);
      setTimeRemaining(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStage = enabledStages[currentStageIndex];

  if (!retro) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kone-blue dark:border-kone-lightBlue mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading retrospective...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header from Landing Page */}
      <Header />

      {/* Top Navigation Bar with Stages */}
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
                <div
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    index === currentStageIndex
                      ? 'bg-kone-blue dark:bg-kone-lightBlue text-white shadow-md'
                      : index < currentStageIndex
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {index < currentStageIndex && <Check className="w-4 h-4" />}
                    <span>{stage.name}</span>
                    {index === currentStageIndex && stage.duration > 0 && (
                      <span className="text-xs opacity-90">
                        ({Math.floor(stage.duration / 60)}m)
                      </span>
                    )}
                  </div>
                </div>
                {index < enabledStages.length - 1 && (
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                    index < currentStageIndex ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6">
        {/* Main Board Area */}
        <div className="flex-1 flex flex-col">
          {/* Timer and Controls */}
          {currentStage && currentStage.duration > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock className="w-6 h-6 text-kone-blue dark:text-kone-lightBlue" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {currentStage.name} Phase
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isTimerRunning
                        ? `Time remaining: ${formatTime(timeRemaining)}`
                        : `Duration: ${Math.floor(currentStage.duration / 60)} minutes`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isTimerRunning ? (
                    <button onClick={startTimer} className="btn-primary">
                      Start Timer
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsTimerRunning(false)}
                      className="btn-secondary"
                    >
                      Pause Timer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stage Content Area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {currentStage?.name} Stage
            </h2>

            {/* Brainstorm Stage - Show Template Columns */}
            {currentStage?.id === 'brainstorm' && retro.template && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {retro.template.columns.map((column) => (
                  <div
                    key={column.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[400px]"
                  >
                    {/* Inline styles needed for dynamic template colors from database */}
                    <div
                      className="flex items-center gap-2 mb-4 pb-2 border-b-2"
                      style={{ borderBottomColor: column.color }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: column.color }}
                      ></div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{column.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{column.placeholder}</p>
                    <div className="space-y-2">
                      {/* Cards will be added here */}
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        No cards yet. Add your thoughts!
                      </div>
                    </div>
                    <button className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-kone-blue dark:hover:border-kone-lightBlue hover:text-kone-blue dark:hover:text-kone-lightBlue transition-colors">
                      + Add Card
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Other Stages Placeholder */}
            {currentStage?.id !== 'brainstorm' && (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {currentStage?.name} stage content will be displayed here.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-600">
                  This functionality will be implemented next.
                </p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
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
              disabled={currentStageIndex === enabledStages.length - 1}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Stage →
            </button>
          </div>
        </div>

        {/* Right Sidebar - Participants */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-kone-blue dark:text-kone-lightBlue" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Participants</h3>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {participants.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="w-10 h-10 bg-kone-blue dark:bg-kone-lightBlue text-white rounded-full flex items-center justify-center font-semibold">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{participant.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No participants yet</p>
                  <p className="text-xs mt-1">Share the link to invite others</p>
                </div>
              )}
            </div>

            <button
              onClick={copyRetroLink}
              className="w-full mt-4 btn-secondary flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Invite Participants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
