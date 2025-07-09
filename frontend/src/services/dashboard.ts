import { api } from './auth';
import { AxiosError } from 'axios';

export interface UserStats {
  totalNotes: number;
  totalBattles: number;
  winRate: number;
  currentStreak: number;
  totalWins: number;
  totalLosses: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
}

export interface RecentActivity {
  id: string;
  type: 'battle_victory' | 'battle_defeat' | 'notes_uploaded' | 'battle_started';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    opponent_username?: string;
    score?: number;
    folder_name?: string;
    file_name?: string;
  };
}

export interface DashboardData {
  stats: UserStats;
  recentActivity: RecentActivity[];
}

export const dashboardService = {
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get('/dashboard/stats');
      
      // Transform snake_case to camelCase to match frontend interface
      const transformedData: UserStats = {
        totalNotes: response.data.total_notes,
        totalBattles: response.data.total_battles,
        winRate: response.data.win_rate,
        currentStreak: response.data.current_streak,
        totalWins: response.data.total_wins,
        totalLosses: response.data.total_losses,
        averageScore: response.data.average_score,
        bestScore: response.data.best_score,
        totalQuestionsAnswered: response.data.total_questions_answered,
        correctAnswers: response.data.correct_answers,
        accuracy: response.data.accuracy
      };
      
      return transformedData;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to fetch user stats';
      throw new Error(message);
    }
  },

  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const response = await api.get('/dashboard/recent-activity');
      
      // Transform the activity data to match frontend interface
      const transformedActivities: RecentActivity[] = response.data.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        metadata: activity.metadata
      }));
      
      return transformedActivities;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to fetch recent activity';
      throw new Error(message);
    }
  },

  async getDashboardData(): Promise<DashboardData> {
    try {
      const [stats, recentActivity] = await Promise.all([
        this.getUserStats(),
        this.getRecentActivity()
      ]);
      
      return {
        stats,
        recentActivity
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to fetch dashboard data';
      throw new Error(message);
    }
  }
}; 