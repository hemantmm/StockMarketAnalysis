/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useState} from 'react';
import { placePaperTrade, getPaperTradeHistory, getPaperTradePerformance, backtestPaperStrategy, getCurrentStockPrice } from '../services/paperTradeAPI';
import type { Trade, Performance, BacktestResult } from '../services/paperTradeAPI';

const INITIAL_BALANCE = 100000;

export default function PaperTrading() {
  const [symbol, setSymbol] = useState('');
  const [qty, setQty] = useState(0);
  const [price, setPrice] = useState(0);
  const [side, setSide] = useState('buy');
  const [tradeResult, setTradeResult] = useState<null | { success?: boolean; error?: string }>(null);
  const [history, setHistory] = useState<Trade[]>([]);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [backtestPrices, setBacktestPrices] = useState('');
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  // Track if user has manually changed the price
  const [priceManuallyChanged, setPriceManuallyChanged] = useState(false);

  // Temporary default user ID until real auth is implemented
  const userId = 'testuser';

  const fetchCurrentPrice = async (sym: string) => {
    setPriceLoading(true);
    setCurrentPrice(null);
    setPriceError(null);
    if (sym) {
      try {
        const price = await getCurrentStockPrice(sym);
        if (price === null) {
          setPriceError('Price unavailable or API limit reached.');
        } else {
          setPriceError(null); // Clear error if price is found
        }
        setCurrentPrice(price ?? null);
        // Auto-fill price if user hasn't changed it manually
        if (!priceManuallyChanged && price !== null) {
          setPrice(Number(price));
        }
      } catch (err) {
        setCurrentPrice(null);
        setPriceError('Price unavailable or API limit reached.');
      }
    }
    setPriceLoading(false);
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSymbol(value);
    setCurrentPrice(null);
    setPriceLoading(false);
    setPriceError(null);
    setPriceManuallyChanged(false);
    if (value === '') {
      setQty(0);
      setPrice(0);
      setTradeResult(null);
      setAlertMsg(null);
      setBacktestResult(null);
      setShowHistory(false);
      // Clear current price as well
      setCurrentPrice(null);
    } else if (value.length >= 3) {
      fetchCurrentPrice(value);
    }
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || Number(value) < 0) {
      setQty(0);
    } else {
      setQty(Number(value));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceManuallyChanged(true);
    if (value === '' || Number(value) < 0) {
      setPrice(0);
    } else {
      setPrice(Number(value));
    }
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    if (side === 'sell' && (!performance?.positions[symbol] || performance.positions[symbol] < qty)) {
      setAlertMsg('You must buy the stock before selling.');
      return;
    }
    if (currentPrice !== null && price !== 0) {
      const lowerLimit = currentPrice * 0.9;
      const upperLimit = currentPrice * 1.1;
      if (price < lowerLimit || price > upperLimit) {
        setAlertMsg(`Price must be within ±10% of current price (₹${lowerLimit.toFixed(2)} - ₹${upperLimit.toFixed(2)})`);
        return;
      }
    }
    const res = await placePaperTrade({ symbol, qty: Number(qty), price: Number(price), side });
    setTradeResult(res);
    setSymbol("");
    setQty(0);
    setPrice(0);
    setSide("buy");
    setCurrentPrice(null);
    setPriceError(null);
    fetchPerformance();
    fetchHistory();
  };

  const fetchHistory = async () => {
    const h = await getPaperTradeHistory();
    setHistory(h);
  };

  const fetchPerformance = async () => {
    const p = await getPaperTradePerformance();
    if (p && (typeof p.balance !== 'number' || p.balance > 1_000_000 || p.balance === 1_000_000)) {
      p.balance = INITIAL_BALANCE;
    }
    setPerformance(p);
  };

  const handleBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    const prices = backtestPrices.split(',').map(Number).filter(x => !isNaN(x));
    const res = await backtestPaperStrategy(prices);
    setBacktestResult(res);
  };

  React.useEffect(() => {
    fetchPerformance();
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] text-white relative overflow-hidden flex flex-col items-center justify-center">
      <canvas
        className="fixed inset-0 pointer-events-none z-0"
        style={{ width: '100vw', height: '100vh' }}
      />
      <div className="relative z-10 w-full max-w-3xl mx-auto p-8 mt-8 bg-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl border border-white/10 flex flex-col gap-8">
        <h2 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg tracking-tight">Trading Simulator</h2>
        <form onSubmit={handleTrade} className="flex flex-col gap-6 bg-white/10 p-8 rounded-2xl shadow-xl border border-white/10">
          <div className="flex flex-col md:flex-row gap-4">
            <label className="flex-1 font-semibold flex flex-col gap-1">
              <span>Stock Symbol</span>
              <input value={symbol} onChange={handleSymbolChange} placeholder="e.g. TCS" className="border border-cyan-400/40 p-3 rounded-lg bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" required />
            </label>
            <label className="flex-1 font-semibold flex flex-col gap-1">
              <span>Quantity</span>
              <input type="number" value={qty === 0 ? '' : qty} onChange={handleQtyChange} placeholder="e.g. 10" className="border border-cyan-400/40 p-3 rounded-lg bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" required />
            </label>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <label className="flex-1 font-semibold flex flex-col gap-1">
              <span>Price</span>
              <input type="number" value={price === 0 ? '' : price} onChange={handlePriceChange} placeholder="e.g. 3500" className="border border-cyan-400/40 p-3 rounded-lg bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" required />
            </label>
            <button type="button" onClick={() => fetchCurrentPrice(symbol)} className="h-12 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-bold shadow hover:scale-105 transition-transform">Get Current</button>
            <div className="flex flex-col justify-center min-w-[120px]">
              {priceLoading && <span className="text-xs text-gray-300">Fetching...</span>}
              {currentPrice !== null && !priceLoading && <span className="text-sm text-green-300 font-bold">₹{currentPrice}</span>}
              {priceError && <span className="text-xs text-red-400">{priceError}</span>}
            </div>
          </div>
          <label className="font-semibold flex flex-col gap-1">
            <span>Side</span>
            <select value={side} onChange={e => setSide(e.target.value)} className="border border-cyan-400/40 p-3 rounded-lg bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all">
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>
          <button type="submit" className="mt-2 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform tracking-wide">Place Trade</button>
        </form>
        {alertMsg && <div className="mb-2 text-red-400 font-semibold text-center text-lg animate-pulse">{alertMsg}</div>}
        {tradeResult && <div className="mb-4 text-center text-lg">Result: {tradeResult.success ? <span className="text-green-400 font-bold">Success</span> : <span className="text-red-400 font-bold">{tradeResult.error}</span>}</div>}
        <div className="mb-6">
          <h3 className="font-semibold text-2xl mb-2 text-cyan-300 tracking-wide">Performance</h3>
          {performance && (
            <div className="bg-white/5 p-6 rounded-2xl mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow">
              <div className="text-lg">Balance: <span className="font-bold text-cyan-300 text-2xl">₹{performance.balance}</span></div>
              {Object.entries(performance.positions).filter(([_, qty]) => qty > 0).length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">Positions: {Object.entries(performance.positions).filter(([_, qty]) => qty > 0).map(([sym, qty]) => <span key={sym} className="inline-block bg-cyan-900/40 px-3 py-1 rounded-lg text-cyan-200 font-semibold">{sym}: {qty}</span>)}</div>
              )}
            </div>
          )}
        </div>
        <div className="mb-6">
          <button onClick={() => setShowHistory(v => !v)} className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3 rounded-xl mb-2 font-semibold shadow hover:scale-105 transition-transform text-lg">{showHistory ? 'Hide' : 'Show'} Trade History</button>
          {showHistory && (
            <div className="bg-white/5 p-6 rounded-2xl shadow-lg overflow-x-auto">
              <h3 className="font-semibold mb-2 text-cyan-300 text-xl">Trade History</h3>
              <table className="w-full border text-base">
                <thead>
                  <tr className="text-cyan-300"><th>Symbol</th><th>Qty</th><th>Price</th><th>Side</th><th>Time (UTC)</th></tr>
                </thead>
                <tbody>
                  {history.map((t, i) => (
                    <tr key={i} className="border-b border-gray-700 hover:bg-cyan-900/20">
                      <td>{t.symbol}</td>
                      <td>{t.qty}</td>
                      <td>{t.price}</td>
                      <td className={t.side === 'buy' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{t.side}</td>
                      <td>{new Date(t.timestamp).toUTCString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mb-2">
          <h3 className="font-semibold text-2xl mb-2 text-green-300 tracking-wide">Strategy Backtest</h3>
          <form onSubmit={handleBacktest} className="flex flex-col md:flex-row gap-4 mb-2 items-end">
            <input value={backtestPrices} onChange={e => setBacktestPrices(e.target.value)} placeholder="Comma-separated prices (e.g. 100,110,120)" className="border border-green-400/40 p-3 flex-1 rounded-lg bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition-all" />
            <button type="submit" className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 shadow-lg">Run Backtest</button>
          </form>
          {backtestResult && !backtestResult.error && (
            <div className="bg-green-900/30 p-4 rounded-xl mt-2 flex flex-col gap-1">
              <div>Initial: <span className="font-bold">₹{backtestResult.initial_balance}</span></div>
              <div>Final: <span className="font-bold">₹{backtestResult.final_balance}</span></div>
              <div>Profit: <span className="font-bold">₹{backtestResult.profit}</span></div>
            </div>
          )}
          {backtestResult?.error && <div className="text-red-400 mt-2">{backtestResult.error}</div>}
        </div>
      </div>
    </div>
  );
}
