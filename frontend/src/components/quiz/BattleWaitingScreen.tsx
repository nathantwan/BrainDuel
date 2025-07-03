import React from 'react';
import { Loader2, Users } from 'lucide-react';

interface BattleWaitingScreenProps {
  battleId: string;
  opponentUsername?: string;
  onCancel?: () => void;
}

const BattleWaitingScreen: React.FC<BattleWaitingScreenProps> = ({
  battleId,
  opponentUsername,
  onCancel
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Loading Animation */}
          <div className="mb-6">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Waiting for Opponent
          </h2>
          
          {/* Battle Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Battle #{battleId.slice(0, 8)}
              </span>
            </div>
            {opponentUsername && (
              <p className="text-sm text-gray-600">
                Inviting: <span className="font-medium">{opponentUsername}</span>
              </p>
            )}
          </div>
          
          {/* Status Message */}
          <p className="text-gray-600 mb-6">
            Your battle invitation has been sent. 
            {opponentUsername ? ` Waiting for ${opponentUsername} to accept...` : ' Waiting for someone to join...'}
          </p>
          
          {/* Cancel Button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel Battle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleWaitingScreen; 