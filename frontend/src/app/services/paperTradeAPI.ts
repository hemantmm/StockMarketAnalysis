import axios from 'axios';
import { get_stock_info } from '../../backend/indianstock_api';
import fetchStockDetails from '../stockNameAPI';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export async function placePaperTrade({ user_id, symbol, qty, price, side }: { user_id: string, symbol: string, qty: number, price: number, side: string }) {
  const res = await axios.post(`${API_BASE}/papertrade/trade`, {
    user_id, symbol, qty, price, side
  });
  return res.data;
}

export async function getPaperTradeHistory(user_id: string): Promise<Trade[]> {
  const res = await axios.get(`${API_BASE}/papertrade/history/${user_id}`);
  return res.data.history;
}

export async function getPaperTradePerformance(user_id: string): Promise<Performance> {
  const res = await axios.get(`${API_BASE}/papertrade/performance/${user_id}`);
  return res.data;
}

export async function backtestPaperStrategy(prices: number[], initial_balance = 1000000): Promise<BacktestResult> {
  const res = await axios.post(`${API_BASE}/papertrade/backtest`, {
    prices, initial_balance
  });
  return res.data;
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
