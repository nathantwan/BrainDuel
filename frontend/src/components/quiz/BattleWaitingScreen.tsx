import React, { useState } from 'react';
import { Loader2, Users, Copy, Check } from 'lucide-react';

interface BattleWaitingScreenProps {
  battleId: string;
  opponentUsername?: string;
  roomCode?: string;
  isPublic?: boolean;
  onCancel?: () => void;
  wsConnected?: boolean;
}

const BattleWaitingScreen: React.FC<BattleWaitingScreenProps> = ({
  battleId,
  opponentUsername,
  roomCode,
  isPublic = false,
  onCancel,
  wsConnected = false
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const copyRoomCode = async () => {
    if (roomCode) {
      try {
        await navigator.clipboard.writeText(roomCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error('Failed to copy room code:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 border border-gray-700">
        <div className="text-center">
          {/* Loading Animation */}
          <div className="mb-6">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            Waiting for Opponent
          </h2>
          
          {/* Room Code for Public Battles */}
          {isPublic && roomCode && (
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-200 mb-2">Share this room code with others:</p>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl font-bold font-mono text-blue-300 tracking-wider">
                  {roomCode}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                  title="Copy room code"
                >
                  {copiedCode ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              {copiedCode && (
                <p className="text-sm text-green-400 mt-2">Room code copied!</p>
              )}
            </div>
          )}
          
          {/* Battle Info */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-200">
                Battle #{battleId.slice(0, 8)}
              </span>
            </div>
            {opponentUsername && (
              <p className="text-sm text-gray-300">
                Inviting: <span className="font-medium">{opponentUsername}</span>
              </p>
            )}
          </div>
          
          {/* WebSocket Status */}
          <div className="mb-4">
            <div className={`flex items-center justify-center text-sm ${
              wsConnected ? 'text-green-600' : 'text-yellow-600'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                wsConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              {wsConnected ? 'Connected to real-time updates' : 'Connecting to real-time updates...'}
            </div>
          </div>
          
          {/* Status Message */}
          <p className="text-gray-300 mb-6">
            {isPublic && !opponentUsername 
              ? "Waiting for someone to join with your room code..."
              : opponentUsername 
                ? `Waiting for ${opponentUsername} to accept...`
                : "Your battle invitation has been sent. Waiting for someone to join..."
            }
          </p>
          
          {/* Cancel Button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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