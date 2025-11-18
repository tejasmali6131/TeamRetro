import { Users, Link as LinkIcon, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

interface Participant {
  id: string;
  name: string;
  joinedAt: Date;
  isCreator?: boolean;
}

interface ParticipantsSidebarProps {
  participants: Participant[];
  retroId: string;
  currentUserId: string;
  creatorId: string;
}

export default function ParticipantsSidebar({ 
  participants, 
  retroId, 
  currentUserId,
  creatorId 
}: ParticipantsSidebarProps) {
  const isCurrentUserCreator = currentUserId === creatorId;

  const copyRetroLink = () => {
    const link = `${window.location.origin}/retro/${retroId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  return (
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
            participants.map((participant) => {
              const isCreator = participant.id === creatorId;
              const isCurrentUser = participant.id === currentUserId;
              
              return (
                <div
                  key={participant.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrentUser
                      ? 'bg-kone-blue/10 dark:bg-kone-lightBlue/10 border-2 border-kone-blue dark:border-kone-lightBlue'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className={`w-10 h-10 text-white rounded-full flex items-center justify-center font-semibold ${
                    isCreator 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                      : 'bg-kone-blue dark:bg-kone-lightBlue'
                  }`}>
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {participant.name}
                        {isCurrentUser && ' (You)'}
                      </p>
                      {isCurrentUserCreator && isCreator && (
                        <Crown className="w-4 h-4 text-yellow-500" aria-label="Room Creator" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isCreator && isCurrentUserCreator ? 'Admin' : 'Online'}
                    </p>
                  </div>
                </div>
              );
            })
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

        {isCurrentUserCreator && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <Crown className="w-4 h-4" />
              <p className="text-xs font-medium">You are the room creator</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
