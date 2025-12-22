import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Calendar, Clock, Info, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import Header from '@/components/Header';

interface RetroData {
  id: string;
  sessionName: string;
  context: string;
  templateId: string;
  status: string;
  createdAt: Date;
  template?: {
    id: string;
    name: string;
    description: string;
    columns: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
  participants?: Array<{
    id: string;
    name: string;
  }>;
}

export default function JoinRetro() {
  const { retroId } = useParams<{ retroId: string }>();
  const navigate = useNavigate();
  
  const [retro, setRetro] = useState<RetroData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (retroId) {
      fetchRetroData();
    }
  }, [retroId]);

  const fetchRetroData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/retros/${retroId}`);
      setRetro(response.data);
    } catch (error: any) {
      console.error('Error fetching retro:', error);
      if (error.response?.status === 404) {
        toast.error('Retrospective not found');
      } else {
        toast.error('Failed to load retrospective details');
      }
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRetro = () => {
    if (!retroId) return;
    
    setIsJoining(true);
    // Navigate to the actual retro board which will establish WebSocket connection
    navigate(`/retro/${retroId}/board`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-kone-blue dark:text-kone-lightBlue mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading retrospective details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!retro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Retrospective not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header Card */}
          <div className="card mb-6 bg-gradient-to-r from-kone-blue to-kone-darkBlue dark:from-kone-darkBlue dark:to-kone-blue text-white">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Join Retrospective</h1>
              <p className="text-blue-100">You've been invited to participate in a team retrospective</p>
            </div>
          </div>

          {/* Retro Details Card */}
          <div className="card mb-6 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {retro.sessionName}
            </h2>

            {retro.context && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-kone-blue dark:text-kone-lightBlue flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Context</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{retro.context}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Template Info */}
              {retro.template && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-kone-blue dark:bg-kone-lightBlue rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">T</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Template</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{retro.template.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{retro.template.description}</p>
                  
                  {/* Template Columns */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {retro.template.columns.map((column) => (
                      <span
                        key={column.id}
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: column.color }}
                      >
                        {column.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-kone-blue dark:text-kone-lightBlue" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Participants</h3>
                </div>
                <p className="text-2xl font-bold text-kone-blue dark:text-kone-lightBlue">
                  {retro.participants?.length || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {retro.participants?.length === 0 ? 'No one has joined yet' : 
                   retro.participants?.length === 1 ? 'person already joined' : 
                   'people already joined'}
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(retro.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="capitalize">{retro.status}</span>
              </div>
            </div>

            {/* Join Button */}
            <div className="mt-6">
              <button
                onClick={handleJoinRetro}
                disabled={isJoining}
                className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Retrospective
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-kone-blue dark:text-kone-lightBlue flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold mb-1">What to expect:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You'll be assigned a random name for the session</li>
                  <li>You can share ideas, vote, and collaborate with your team</li>
                  <li>All contributions are valuable and encouraged</li>
                  <li>The session may have multiple stages to complete</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
