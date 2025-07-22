import axios from 'axios';
// import { get_stock_info } from '../../backend/indianstock_api';
import fetchStockDetails from '../stockNameAPI';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://stockmarketanalysis-3.onrender.com';
const DEFAULT_USER_ID = 'default_trader';

export async function placePaperTrade({ symbol, qty, price, side }: { symbol: string, qty: number, price: number, side: string }) {
  try {
    console.log('Making trade request to:', `${API_BASE}/papertrade/trade`);
    console.log('Trade data:', { user_id: DEFAULT_USER_ID, symbol, qty, price, side });
    const res = await axios.post(`${API_BASE}/papertrade/trade`, {
      user_id: DEFAULT_USER_ID, symbol, qty, price, side
    });
    console.log('Trade response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Paper trade error:', error);
    throw error;
  }
}

export async function getPaperTradeHistory(): Promise<Trade[]> {
  try {
    const res = await axios.get(`${API_BASE}/papertrade/history/${DEFAULT_USER_ID}`);
    return res.data.history;
  } catch (error) {
    console.error('Error fetching trade history:', error);
    return [];
  }
}

export async function getPaperTradePerformance(): Promise<Performance> {
  try {
    const res = await axios.get(`${API_BASE}/papertrade/performance/${DEFAULT_USER_ID}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching performance:', error);
    return { balance: 100000, positions: {} };
  }
}

export async function backtestPaperStrategy(prices: number[], initial_balance = 1000000): Promise<BacktestResult> {
  try {
    const res = await axios.post(`${API_BASE}/papertrade/backtest`, {
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
