import axios from 'axios';

// Check that the API URL is correct - this could be causing timeouts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://my-python-backend.onrender.com'
  : 'http://localhost:8000';

console.log('Using API base URL:', API_BASE_URL);

// Increase the timeout to 30 seconds to give more time for the request to complete
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,  // Increased from 10000ms to 30000ms
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add debugging for API requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  console.log('Making API request:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    data: config.data
  });
  return config;
});

// Add response debugging
api.interceptors.response.use(
  response => {
    console.log('API response:', {
      status: response.status,
      data: response.data,
      url: response.config.url
    });
    return response;
  },
  error => {
    console.error('API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

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

export const addToWatchlist = async (
  userId: string, 
  stockSymbol: string, 
  stockName: string
): Promise<WatchlistResponse> => {
  let retries = 2;
  
  const attempt = async (): Promise<WatchlistResponse> => {
    try {
      // Check if user is authenticated
      if (!localStorage.getItem('token')) {
        return {
          success: false,
          message: 'Authentication required to add to watchlist'
        };
      }
      
      console.log(`Attempting to add ${stockSymbol} to watchlist for user ${userId}...`);
      
      const response = await api.post(`/watchlist/add`, {
        user_id: userId,
        stock_symbol: stockSymbol,
        stock_name: stockName
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      
      // Handle timeout specifically
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.log('Request timed out. Retrying...');
        
        if (retries > 0) {
          retries--;
          console.log(`Retrying... (${retries} attempts left)`);
          return await attempt();
        }
        
        return {
          success: false,
          message: 'Request timed out. Server might be busy or unreachable.'
        };
      }
      
      if (axios.isAxiosError(error)) {
        console.log('API Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
      
      return {
        success: false,
        message: 'Failed to add stock to watchlist'
      };
    }
  };
  
  return await attempt();
};

export const removeFromWatchlist = async (
  userId: string, 
  stockSymbol: string,
  stockName: string
): Promise<WatchlistResponse> => {
  let retries = 2;
  
  const attempt = async (): Promise<WatchlistResponse> => {
    try {
      // Check if user is authenticated
      if (!localStorage.getItem('token')) {
        return {
          success: false,
          message: 'Authentication required to remove from watchlist'
        };
      }
      
      const response = await api.post(`/watchlist/remove`, {
        user_id: userId,
        stock_symbol: stockSymbol,
        stock_name: stockName
      });
      
      return response.data;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      
      // Handle timeout specifically
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        if (retries > 0) {
          retries--;
          return await attempt();
        }
        
        return {
          success: false,
          message: 'Request timed out. Server might be busy or unreachable.'
        };
      }
      
      if (axios.isAxiosError(error)) {
        console.log('API Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
      
      return {
        success: false,
        message: 'Failed to remove stock from watchlist'
      };
    }
  };
  
  return await attempt();
};

export const getUserWatchlist = async (userId: string): Promise<WatchlistItem[]> => {
  try {
    // Check if user is authenticated
    if (!localStorage.getItem('token')) {
      return [];
    }
    
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
    // Check if user is authenticated
    if (!localStorage.getItem('token')) {
      return false;
    }
    
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

// Add fallback API service if main API is not responding
export const addToWatchlistFallback = async (
  userId: string,
  stockSymbol: string,
  stockName: string
): Promise<WatchlistResponse> => {
  try {
    console.log('Using fallback method to add to watchlist');
    
    // Store in localStorage as a temporary fallback
    const watchlistKey = `watchlist_${userId}`;
    const existingWatchlist = JSON.parse(localStorage.getItem(watchlistKey) || '[]');
    
    // Check if already exists
    if (existingWatchlist.some((item: WatchlistItem) => item.stock_symbol === stockSymbol)) {
      return {
        success: true,
        message: 'Stock already in watchlist (local storage)'
      };
    }
    
    // Add to local storage
    existingWatchlist.push({
      user_id: userId,
      stock_symbol: stockSymbol,
      stock_name: stockName
    });
    
    localStorage.setItem(watchlistKey, JSON.stringify(existingWatchlist));
    
    return {
      success: true,
      message: 'Stock added to watchlist (local storage)'
    };
  } catch (error) {
    console.error('Error with fallback watchlist storage:', error);
    return {
      success: false,
      message: 'Could not add to local storage'
    };
  }
};

// Export function that attempts main API first, then falls back if needed
export const addToWatchlistWithFallback = async (
  userId: string,
  stockSymbol: string,
  stockName: string
): Promise<WatchlistResponse> => {
  try {
    const result = await addToWatchlist(userId, stockSymbol, stockName);
    if (result.success) {
      return result;
    }
    
    // If main API failed, try fallback
    return await addToWatchlistFallback(userId, stockSymbol, stockName);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return await addToWatchlistFallback(userId, stockSymbol, stockName);
  }
};
