import { api } from './auth';
import { AxiosError } from 'axios';
import {
  CreateBattleRequest,
  Battle,
  SubmitAnswerRequest,
  BattleQuestion,
  BattleResult,
  PendingInvite
} from '../types/battle';

export const battleService = {
  // Battle Creation
  async createBattle(battleRequest: CreateBattleRequest): Promise<Battle> {
    try {
      const response = await api.post('/battles/create', battleRequest);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to create battle';
      throw new Error(message);
    }
  },

  // Battle Joining
  async joinBattleWithCode(roomCode: string): Promise<Battle> {
    try {
      const response = await api.post(`/battles/join/${roomCode}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to join battle';
      throw new Error(message);
    }
  },

  // Battle Actions
  async submitAnswer(answerRequest: SubmitAnswerRequest): Promise<void> {
    try {
      await api.post('/battles/submit-answer', answerRequest);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to submit answer';
      throw new Error(message);
    }
  },

  async acceptBattle(battleId: string): Promise<Battle> {
    try {
      const response = await api.post(`/battles/${battleId}/accept`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to accept battle';
      throw new Error(message);
    }
  },

  async declineBattle(battleId: string): Promise<Battle> {
    try {
      const response = await api.post(`/battles/${battleId}/decline`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to decline battle';
      throw new Error(message);
    }
  },

  // Battle Data
  async getMyBattles(): Promise<Battle[]> {
    try {
      const response = await api.get('/battles/my-battles');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to fetch battles';
      throw new Error(message);
    }
  },

  async getBattleQuestions(battleId: string): Promise<{ questions: BattleQuestion[] }> {
    try {
      const response = await api.get(`/battles/questions/${battleId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to get battle questions';
      throw new Error(message);
    }
  },

  async getBattleResults(battleId: string): Promise<BattleResult> {
    try {
      const response = await api.get(`/battles/results/${battleId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to fetch battle results';
      throw new Error(message);
    }
  },

  async getBattleById(battleId: string): Promise<Battle> {
    try {
      const response = await api.get(`/battles/${battleId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to get battle';
      throw new Error(message);
    }
  },

  async getPendingInvites(): Promise<PendingInvite[]> {
    try {
      const response = await api.get('/battles/pending-invites');
      
      // Validate response structure
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected array of invites');
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to fetch invites';
      throw new Error(message);
    }
  },

  async dismissInvite(inviteId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/battles/invites/${inviteId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to dismiss invite';
      throw new Error(message);
    }
  },
};