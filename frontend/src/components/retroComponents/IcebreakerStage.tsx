import { useState, useEffect } from 'react';
import { Sparkles, Edit2, Check, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface Participant {
  id: string;
  name: string;
}

interface IcebreakerStageProps {
  participants: Participant[];
  currentUserId: string;
  isRoomCreator: boolean;
  ws: WebSocket | null;
}

const defaultQuestions = [
  "How would you describe your current mood?",
  "What is one movie or series that you'd watch again and again?",
  "What's your favorite way to spend a weekend?",
  "What's one skill you'd love to learn?",
  "What's your go-to comfort food?",
  "If you could have dinner with anyone, dead or alive, who would it be?"
];

export default function IcebreakerStage({ participants, currentUserId, isRoomCreator, ws }: IcebreakerStageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>(defaultQuestions);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [answeredParticipants, setAnsweredParticipants] = useState<Set<string>>(new Set());
  const [participantAnswer, setParticipantAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentQuestionIndex];
  const remainingParticipants = participants.filter(p => !answeredParticipants.has(p.id));

  // Listen for WebSocket messages
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'icebreaker-update') {
          switch (data.action) {
            case 'answering-started':
              setIsAnswering(true);
              if (!isRoomCreator) {
                toast.success('Time to answer the question!');
              }
              break;
            case 'answer-completed':
              setAnsweredParticipants(prev => new Set([...prev, data.participantId]));
              if (data.answer) {
                setAnswers(prev => ({ ...prev, [data.participantId]: data.answer }));
              }
              if (data.participantId === currentUserId) {
                setParticipantAnswer('');
              }
              if (data.participantId !== currentUserId) {
                toast.success(`${data.participantName} finished answering!`);
              }
              break;
            case 'question-changed':
              setCurrentQuestionIndex(data.questionIndex);
              setAnsweredParticipants(new Set());
              setIsAnswering(false);
              setAnswers({});
              setParticipantAnswer('');
              break;
            case 'question-edited':
              const updatedQuestions = [...questions];
              updatedQuestions[data.questionIndex] = data.newQuestion;
              setQuestions(updatedQuestions);
              break;
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, currentUserId]);

  const handleEditQuestion = () => {
    setEditedQuestion(currentQuestion);
    setIsEditingQuestion(true);
  };

  const handleSaveQuestion = () => {
    if (editedQuestion.trim()) {
      // Broadcast question edit to all participants
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'icebreaker-update',
          action: 'question-edited',
          questionIndex: currentQuestionIndex,
          newQuestion: editedQuestion.trim()
        }));
      }
      
      setIsEditingQuestion(false);
      toast.success('Question updated!');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingQuestion(false);
    setEditedQuestion('');
  };

  const handleGetAnswers = () => {
    setIsAnswering(true);
    
    // Broadcast answering started to all participants
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'icebreaker-update',
        action: 'answering-started'
      }));
    }
    
    toast.success('Everyone can now answer!');
  };

  const handleDoneAnswering = () => {
    const currentParticipant = participants.find(p => p.id === currentUserId);
    if (currentParticipant) {
      setAnsweredParticipants(prev => new Set([...prev, currentUserId]));
      
      // Broadcast answer completion to all participants
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'icebreaker-update',
          action: 'answer-completed',
          participantId: currentUserId,
          participantName: currentParticipant.name,
          answer: participantAnswer
        }));
      }
      
      toast.success('Answer recorded!');
      setParticipantAnswer('');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      
      // Broadcast question change to all participants (including self)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'icebreaker-update',
          action: 'question-changed',
          questionIndex: newIndex
        }));
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      
      // Broadcast question change to all participants (including self)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'icebreaker-update',
          action: 'question-changed',
          questionIndex: newIndex
        }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-kone-blue dark:text-kone-lightBlue" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Icebreaker Time!</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Let's get to know each other better before we start the retrospective
        </p>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-2 border-kone-blue dark:border-kone-lightBlue">
        <div className="flex items-center justify-between mb-4">
          {isRoomCreator && (
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="text-kone-blue dark:text-kone-lightBlue hover:text-kone-darkBlue dark:hover:text-kone-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous question"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="text-kone-blue dark:text-kone-lightBlue hover:text-kone-darkBlue dark:hover:text-kone-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next question"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          {isRoomCreator && !isEditingQuestion && (
            <button
              onClick={handleEditQuestion}
              className="text-kone-blue dark:text-kone-lightBlue hover:text-kone-darkBlue dark:hover:text-kone-blue transition-colors"
              aria-label="Edit question"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {isEditingQuestion ? (
          <div className="space-y-4">
            <textarea
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-kone-blue dark:focus:ring-kone-lightBlue resize-none"
              rows={3}
              placeholder="Enter your custom question..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-4 py-2 bg-kone-blue dark:bg-kone-lightBlue text-white rounded-lg hover:bg-kone-darkBlue dark:hover:bg-kone-blue transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center py-4 mb-3">
            {currentQuestion}
          </p>
        )}
      </div>

      {/* Answer Input Section */}
      {isAnswering && !answeredParticipants.has(currentUserId) && (
        <div className="bg-gradient-to-r from-kone-blue to-kone-lightBlue dark:from-kone-lightBlue dark:to-kone-blue rounded-xl shadow-lg p-8">
          <div className="space-y-4">
            <p className="text-white text-lg font-semibold text-center">Your Answer</p>
            <textarea
              value={participantAnswer}
              onChange={(e) => setParticipantAnswer(e.target.value)}
              placeholder="Type your answer here (optional)..."
              className="w-full px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-800/90 border-2 border-white/50 focus:outline-none focus:border-white resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-center">
              <button
                onClick={handleDoneAnswering}
                className="bg-white text-kone-blue dark:text-kone-darkBlue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
              >
                Submit Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Get Answers Button (Admin Only) */}
      {!isAnswering && isRoomCreator && (
        <div className="flex justify-center">
          <button
            onClick={handleGetAnswers}
            className="bg-kone-blue dark:bg-kone-lightBlue text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-kone-darkBlue dark:hover:bg-kone-blue transition-all transform hover:scale-105 shadow-lg"
          >
            Get Answers
          </button>
        </div>
      )}

      {/* Waiting Message (Non-Admin) */}
      {!isAnswering && !isRoomCreator && (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Waiting for admin to start answering...
          </p>
        </div>
      )}

      {/* Remaining Participants */}
      {remainingParticipants.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Remaining Participants ({remainingParticipants.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {remainingParticipants.map((participant) => (
              <div
                key={participant.id}
                className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium shadow-sm"
              >
                {participant.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Already Answered */}
      {answeredParticipants.size > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3">
            Already Answered ({answeredParticipants.size})
          </h3>
          <div className="space-y-3">
            {participants
              .filter((p) => answeredParticipants.has(p.id))
              .map((participant) => (
                <div
                  key={participant.id}
                  className="bg-green-100 dark:bg-green-800 p-4 rounded-lg border border-green-200 dark:border-green-600"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-700 dark:text-green-300" />
                    <span className="font-medium text-green-800 dark:text-green-200">{participant.name}</span>
                  </div>
                  {answers[participant.id] && (
                    <p className="text-sm text-green-700 dark:text-green-300 pl-6 italic">
                      "{answers[participant.id]}"
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  );
}
