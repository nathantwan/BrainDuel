import { useState, useEffect, useCallback } from 'react';
import { battleService } from '../services/battle';
import type { PendingInvite } from '../types/battle';

export const usePendingInvites = () => {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await battleService.getPendingInvites();
      setInvites(data.invites);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissInvite = useCallback(async (inviteId: string) => {
    try {
      await battleService.dismissInvite(inviteId);
      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  return {
    invites,
    loading,
    error,
    fetchInvites,
    dismissInvite,
  };
};
