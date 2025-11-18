import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Check, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import Header from '@/components/Header';
import ParticipantsSidebar from '@/components/ParticipantsSidebar';
import IcebreakerStage from '@/components/retroComponents/IcebreakerStage';
import BrainstormStage from '@/components/retroComponents/BrainstormStage';
import GroupStage from '@/components/retroComponents/GroupStage';
import VoteStage from '@/components/retroComponents/VoteStage';
import DiscussStage from '@/components/retroComponents/DiscussStage';
import ReviewStage from '@/components/retroComponents/ReviewStage';
import ReportStage from '@/components/retroComponents/ReportStage';

interface Participant {
  id: string;
  name: string;
  joinedAt: Date;
  isCreator?: boolean;
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
  creatorId?: string;
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
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  // Default stages if not provided by backend - Added Icebreaker stage
  const defaultStages: RetroStage[] = [
    { id: 'icebreaker', name: 'Icebreaker', duration: 0, enabled: true },
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
    }
  }, [retroId]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let isCleaning = false;
    
    if (retroId) {
      const wsUrl = `ws://localhost:5000/ws/retro/${retroId}`;
      console.log('Initializing WebSocket connection:', wsUrl);
      
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected successfully');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          switch (data.type) {
            case 'user-joined':
              setCurrentUserId(data.userId);
              if (data.userName) {
                toast.success(`Joined as ${data.userName}`);
              }
              break;
            case 'participants-update':
              setParticipants(data.participants);
              if (data.newParticipant && data.newParticipant.name) {
                // Only show toast for other participants joining
                const isCurrentUser = data.participants.some((p: any) => 
                  p.id === data.newParticipant.id && p.name === data.newParticipant.name
                );
                if (!isCurrentUser) {
                  toast.success(`${data.newParticipant.name} joined`);
                }
              }
              break;
            case 'stage-change':
              setCurrentStageIndex(data.stageIndex);
              toast(`Stage changed to ${enabledStages[data.stageIndex]?.name || 'next stage'}`);
              break;
            case 'creator-assigned':
              if (data.isCreator) {
                toast.success('You are now the room admin!');
              }
              break;
            case 'icebreaker-update':
              // Handled by IcebreakerStage component
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (!isCleaning) {
          toast.error('Connection error. Please refresh the page.');
        }
      };

      socket.onclose = (event) => {
        console.log('WebSocket closed. Code:', event.code, 'Reason:', event.reason);
        // Only show error toast for unexpected closures (not during cleanup)
        if (!isCleaning && event.code !== 1000 && event.code !== 1001) {
          toast.error('Connection lost. Please refresh the page.');
        }
      };

      setWs(socket);
    }

    // Cleanup function to close WebSocket when component unmounts or retroId changes
    return () => {
      isCleaning = true;
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        console.log('Cleaning up WebSocket connection');
        socket.close(1000, 'Component unmounting');
      }
    };
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

  const startTimer = () => {
    const currentStage = enabledStages[currentStageIndex];
    if (currentStage && currentStage.duration > 0) {
      setTimeRemaining(currentStage.duration);
      setIsTimerRunning(true);
    }
  };

  const goToNextStage = () => {
    if (currentStageIndex < enabledStages.length - 1) {
      const newIndex = currentStageIndex + 1;
      setCurrentStageIndex(newIndex);
      setIsTimerRunning(false);
      setTimeRemaining(0);
      
      // Broadcast stage change to all participants
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'stage-change',
          stageIndex: newIndex
        }));
      }
    }
  };

  const goToPreviousStage = () => {
    if (currentStageIndex > 0) {
      const newIndex = currentStageIndex - 1;
      setCurrentStageIndex(newIndex);
      setIsTimerRunning(false);
      setTimeRemaining(0);
      
      // Broadcast stage change to all participants
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'stage-change',
          stageIndex: newIndex
        }));
      }
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
            {currentStage?.id === 'icebreaker' && (
              <IcebreakerStage 
                participants={participants}
                currentUserId={currentUserId}
                isRoomCreator={participants.some(p => p.id === currentUserId && p.isCreator)}
                ws={ws}
              />
            )}

            {currentStage?.id === 'brainstorm' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Brainstorm Stage
                </h2>
                <BrainstormStage template={retro.template} />
              </>
            )}

            {currentStage?.id === 'group' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Group Stage
                </h2>
                <GroupStage />
              </>
            )}

            {currentStage?.id === 'vote' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Vote Stage
                </h2>
                <VoteStage />
              </>
            )}

            {currentStage?.id === 'discuss' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Discuss Stage
                </h2>
                <DiscussStage />
              </>
            )}

            {currentStage?.id === 'review' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Review Stage
                </h2>
                <ReviewStage />
              </>
            )}

            {currentStage?.id === 'report' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Report Stage
                </h2>
                <ReportStage />
              </>
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
        <ParticipantsSidebar 
          participants={participants}
          retroId={retroId || ''}
          currentUserId={currentUserId}
          creatorId={participants.find(p => p.isCreator)?.id || ''}
        />
      </div>
    </div>
  );
}
