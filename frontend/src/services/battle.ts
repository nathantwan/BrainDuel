import { api } from './auth';
import { AxiosError } from 'axios';
import {
  CreateBattleRequest,
  Battle,
  SubmitAnswerRequest,
  BattleQuestion,
  BattleResult,
  BattleStatus
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
      // Handle nested response structure from backend
      if (response.data && response.data.battle) {
        return response.data.battle;
      }
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

  async getBattleStatus(battleId: string): Promise<BattleStatus> {
    try {
      const response = await api.get(`/battles/${battleId}/status`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to get battle status';
      throw new Error(message);
    }
  },


};