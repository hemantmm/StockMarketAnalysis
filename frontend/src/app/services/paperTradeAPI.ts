import axios from 'axios';
import fetchStockDetails from '../stockNameAPI';

const API_BASE =
  process.env.NODE_ENV === 'production'
    ? 'https://stockmarketanalysis-4.onrender.com'
    : 'http://localhost:4000';

// Create API instance with the base URL
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Add auth token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`, config.data);
  return config;
});

// Add response/error handling
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Get current user ID from localStorage with better fallback handling
const getUserId = (): string => {
  const userId = localStorage.getItem('userId') || localStorage.getItem('username');
  if (!userId) {
    console.warn('No user ID found in localStorage, using default');
    return 'default_trader';
  }
  return userId;
};

export async function placePaperTrade({ symbol, qty, price, side }: { symbol: string, qty: number, price: number, side: string }) {
  try {
    const userId = getUserId();
    console.log('Making trade request:', { user_id: userId, symbol, qty, price, side });
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Cannot place trade: User not authenticated');
      return {
        success: false,
        error: 'Authentication required. Please login first.'
      };
    }
    
    // Validate inputs
    if (!symbol || qty <= 0 || price <= 0) {
      console.error('Invalid trade parameters:', { symbol, qty, price });
      return {
        success: false,
        error: 'Invalid trade parameters. All fields are required.'
      };
    }
    
    // FIXED: Use correct URL path - Don't include API_BASE twice
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts <= maxAttempts) {
      try {
        const res = await api.post(`/papertrade/trade`, {
          user_id: userId, 
          symbol, 
          qty, 
          price, 
          side
        });
        
        console.log('Trade executed successfully:', res.data);
        return res.data;
      } catch (err) {
        attempts++;
        if (attempts > maxAttempts) throw err;
        console.log(`Attempt ${attempts} failed, retrying...`);
        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
      }
    }
    
    throw new Error('Failed after maximum retry attempts');
  } catch (error) {
    console.error('Paper trade error:', error);
    
    // Handle specific error cases
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timed out. The server might be busy or unreachable.'
        };
      }
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          success: false,
          error: 'Authentication failed. Please login again.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to place trade'
      };
    }
    
    return {
      success: false,
      error: 'Failed to place trade. Please try again later.'
    };
  }
}

export async function getPaperTradeHistory(): Promise<Trade[]> {
  try {
    const userId = getUserId();
    // FIXED: Use correct URL path - Don't include API_BASE twice
    const res = await api.get(`/papertrade/history/${userId}`);
    return res.data.history;
  } catch (error) {
    console.error('Error fetching trade history:', error);
    return [];
  }
}

export async function getPaperTradePerformance(): Promise<Performance> {
  try {
    const userId = getUserId();
    // FIXED: Use correct URL path - Don't include API_BASE twice
    const res = await api.get(`/papertrade/performance/${userId}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching performance:', error);
    return { balance: 100000, positions: {} };
  }
}

export async function backtestPaperStrategy(prices: number[], initial_balance = 1000000): Promise<BacktestResult> {
  try {
    const res = await api.post(`${API_BASE}/papertrade/backtest`, {
      prices, initial_balance
    });
    return res.data;
  } catch (error) {
    console.error('Error in backtest:', error);
    return {
      initial_balance,
      final_balance: initial_balance,
      profit: 0,
      error: 'Failed to connect to server'
    };
  }
}

export async function getCurrentStockPrice(symbol: string): Promise<number | null> {
  try {
    if (!symbol) return null;
    const data = await fetchStockDetails(symbol);
    console.log('Stock API response:', data);
    // New structure: data.currentPrice.BSE or data.currentPrice.NSE
    if (data && typeof data === 'object') {
      if (data.currentPrice) {
        if (data.currentPrice.BSE && !isNaN(Number(data.currentPrice.BSE))) return Number(data.currentPrice.BSE);
        if (data.currentPrice.NSE && !isNaN(Number(data.currentPrice.NSE))) return Number(data.currentPrice.NSE);
      }
      // fallback to old fields if present
      if (data.bsePrice && !isNaN(Number(data.bsePrice))) return Number(data.bsePrice);
      if (data.nsePrice && !isNaN(Number(data.nsePrice))) return Number(data.nsePrice);
      if (data.price && !isNaN(Number(data.price))) return Number(data.price);
    }
    return null;
  } catch (err) {
    console.error('Error in getCurrentStockPrice:', err);
    return null;
  }
}

export interface Trade {
  symbol: string;
  qty: number;
  price: number;
  side: string;
  timestamp: string;
}

export interface Performance {
  balance: number;
  positions: Record<string, number>;
}

export interface BacktestResult {
  initial_balance: number;
  final_balance: number;
  profit: number;
  error?: string;
}
