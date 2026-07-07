import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface WatchlistItem {
  user_id: string;
  stock_symbol: string;
  stock_name: string;
}

export interface WatchlistResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    const message = error.response?.data?.message;

    if (typeof message === 'string') return message;
    if (typeof detail === 'string') return detail;
    if (error.code === 'ECONNABORTED') {
      return 'Watchlist service timed out. Make sure the backend is running on port 8000.';
    }
    if (!error.response) {
      return 'Could not reach the watchlist service. Make sure the backend is running on port 8000.';
    }
  }

  return fallback;
};

export const addToWatchlist = async (
  userId: string, 
  stockSymbol: string, 
  stockName: string
): Promise<WatchlistResponse> => {
  try {
    const response = await api.post(`/watchlist/add`, {
      user_id: userId,
      stock_symbol: stockSymbol,
      stock_name: stockName
    });
    return response.data;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    if (axios.isAxiosError(error)) {
      console.log('API Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return {
      success: false,
      message: getApiErrorMessage(error, 'Failed to add stock to watchlist')
    };
  }
};

export const removeFromWatchlist = async (
  userId: string, 
  stockSymbol: string,
  stockName: string
): Promise<WatchlistResponse> => {
  try {
    const response = await api.post(`/watchlist/remove`, {
      user_id: userId,
      stock_symbol: stockSymbol,
      stock_name: stockName
    });
    return response.data;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    if (axios.isAxiosError(error)) {
      console.log('API Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return {
      success: false,
      message: getApiErrorMessage(error, 'Failed to remove stock from watchlist')
    };
  }
};

export const getUserWatchlist = async (userId: string): Promise<WatchlistItem[]> => {
  try {
    const response = await api.get(`/watchlist/list/${userId}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    if (axios.isAxiosError(error)) {
      console.log('API Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return [];
  }
};

export const checkInWatchlist = async (userId: string, stockSymbol: string): Promise<boolean> => {
  try {
    const response = await api.get(`/watchlist/check/${userId}/${stockSymbol}`);
    return response.data.data || false;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    if (axios.isAxiosError(error)) {
      console.log('API Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return false;
  }
};
