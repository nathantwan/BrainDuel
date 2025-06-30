import { useState, useEffect, useCallback } from 'react';
import { battleService } from '../services/battle';
import type { Battle, CreateBattleRequest } from '../types/battle';

export const useBattles = () => {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBattles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await battleService.getMyBattles();
      setBattles(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch battles');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBattle = useCallback(async (battleRequest: CreateBattleRequest) => {
    try {
      setError(null);
      const newBattle = await battleService.createBattle(battleRequest);
      setBattles(prev => [newBattle, ...prev]);
      return newBattle;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const joinBattle = useCallback(async (roomCode: string) => {
    try {
      setError(null);
      const battle = await battleService.joinBattleWithCode(roomCode);
      setBattles(prev => [battle, ...prev]);
      return battle;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const acceptBattle = useCallback(async (battleId: string) => {
    try {
      setError(null);
      const updatedBattle = await battleService.acceptBattle(battleId);
      setBattles(prev => prev.map(b => b.id === battleId ? updatedBattle : b));
      return updatedBattle;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const declineBattle = useCallback(async (battleId: string) => {
    try {
      setError(null);
      await battleService.declineBattle(battleId);
      setBattles(prev => prev.map(b => 
        b.id === battleId ? { ...b, battle_status: 'declined' } : b
      ));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  return {
    battles,
    loading,
    error,
    fetchBattles,
    createBattle,
    joinBattle,
    acceptBattle,
    declineBattle,
  };
};