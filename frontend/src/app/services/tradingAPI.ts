import axios from 'axios';
import fetchStockDetails from '../stockNameAPI';

// Use localhost for local testing
const API_BASE = 'https://stockmarketanalysis-api.onrender.com';

export interface Trade {
  userId: string;
  symbol: string;
  qty: number;
  price: number;
  side: 'buy' | 'sell';
  timestamp: string;
}

export interface Portfolio {
  userId: string;
  balance: number;
  positions: Record<string, number>;
}

// Get current price from the stock API
export async function getCurrentStockPrice(symbol: string): Promise<number | null> {
  try {
    if (!symbol) return null;
    const data = await fetchStockDetails(symbol);
    console.log('Stock API response:', data);
    
    if (data && typeof data === 'object') {
      if (data.currentPrice) {
        if (data.currentPrice.BSE && !isNaN(Number(data.currentPrice.BSE))) 
          return Number(data.currentPrice.BSE);
        if (data.currentPrice.NSE && !isNaN(Number(data.currentPrice.NSE))) 
          return Number(data.currentPrice.NSE);
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

// Place a trade (buy/sell)
export async function placeTrade(
  userId: string, 
  trade: { symbol: string, qty: number, price: number, side: 'buy' | 'sell' }
) {
  try {
    const res = await axios.post(`${API_BASE}/trading/trade`, {
      userId,
      ...trade
    });
    return res.data;
  } catch (error) {
    console.error('Trade error:', error);
    
    // Check if it's a connection error
    if (axios.isAxiosError(error) && !error.response) {
      return { 
        success: false, 
        error: 'Cannot connect to the trading server. Please make sure the backend server is running on port 3001.' 
      };
    }
    
    // Handle other types of errors
    return { 
      success: false, 
      error: 'Failed to place trade. Please try again later.' 
    };
  }
}

// Get user's trade history
export async function getTradeHistory(userId: string): Promise<Trade[]> {
  try {
    const res = await axios.get(`${API_BASE}/trading/history/${userId}`);
    return res.data.history || [];
  } catch (error) {
    console.error('Error fetching trade history:', error);
    return [];
  }
}

// Get user's portfolio (balance and positions)
export async function getPortfolio(userId: string): Promise<Portfolio> {
  try {
    const res = await axios.get(`${API_BASE}/trading/portfolio/${userId}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return { userId, balance: 100000, positions: {} };
  }
}

// Add funds to user account
export async function addFunds(userId: string, amount: number) {
  try {
    const res = await axios.post(`${API_BASE}/trading/add-funds`, {
      userId,
      amount
    });
    return res.data;
  } catch (error) {
    console.error('Error adding funds:', error);
    return { success: false, error: 'Failed to add funds' };
  }
}
