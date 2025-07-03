import { useEffect } from 'react';
import { useWebSocket } from './use-websocket';
import { useCallback } from 'react';

interface UseBattleWebSocketProps {
  userId: string | null;
  onBattleInvite?: (data: any) => void;
  onBattleAccepted?: (data: any) => void;
  onBattleDeclined?: (data: any) => void;
  onBattleStarted?: (data: any) => void;
  onBattleUpdate?: (data: any) => void;
  onBattleCompleted?: (data: any) => void;
}

export const useBattleWebSocket = ({
  userId,
  onBattleInvite,
  onBattleAccepted,
  onBattleDeclined,
  onBattleStarted,
  onBattleUpdate,
  onBattleCompleted,
}: UseBattleWebSocketProps) => {
  const {
    isConnected,
    lastMessage,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
  } = useWebSocket(userId);

  useEffect(() => {
    // Register message handlers
    if (onBattleInvite) {
      console.log('Registering BATTLE_INVITE and BATTLE_INVITATION handlers');
      addMessageHandler('BATTLE_INVITE', (data) => {
        console.log('BATTLE_INVITE received:', data);
        onBattleInvite(data);
      });
      addMessageHandler('BATTLE_INVITATION', (data) => {
        console.log('BATTLE_INVITATION received:', data);
        onBattleInvite(data);
      });
    }
    if (onBattleAccepted) {
      addMessageHandler('BATTLE_ACCEPTED', onBattleAccepted);
    }
    if (onBattleDeclined) {
      addMessageHandler('BATTLE_DECLINED', onBattleDeclined);
    }
    if (onBattleStarted) {
      addMessageHandler('BATTLE_STARTED', onBattleStarted);
    }
    if (onBattleUpdate) {
      addMessageHandler('BATTLE_UPDATE', onBattleUpdate);
    }
    if (onBattleCompleted) {
      addMessageHandler('BATTLE_COMPLETED', onBattleCompleted);
    }

    return () => {
      // Cleanup handlers
      removeMessageHandler('BATTLE_INVITE');
      removeMessageHandler('BATTLE_INVITATION');
      removeMessageHandler('BATTLE_ACCEPTED');
      removeMessageHandler('BATTLE_DECLINED');
      removeMessageHandler('BATTLE_STARTED');
      removeMessageHandler('BATTLE_UPDATE');
      removeMessageHandler('BATTLE_COMPLETED');
    };
  }, [
    onBattleInvite,
    onBattleAccepted,
    onBattleDeclined,
    onBattleStarted,
    onBattleUpdate,
    onBattleCompleted,
    addMessageHandler,
    removeMessageHandler,
  ]);

  const acceptBattle = useCallback((battleId: string) => {
    sendMessage({
      type: 'ACCEPT_BATTLE',
      battleId,
    });
  }, [sendMessage]);

  const declineBattle = useCallback((battleId: string, challengerId: string) => {
    sendMessage({
      type: 'DECLINE_BATTLE',
      battleId,
      challengerId,
    });
  }, [sendMessage]);

  const sendBattleUpdate = useCallback((battleId: string, participants: string[], data: any) => {
    sendMessage({
      type: 'BATTLE_UPDATE',
      battleId,
      participants,
      ...data,
    });
  }, [sendMessage]);

  return {
    isConnected,
    lastMessage,
    acceptBattle,
    declineBattle,
    sendBattleUpdate,
  };
};