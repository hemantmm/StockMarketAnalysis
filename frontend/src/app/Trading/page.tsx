'use client';

import { useState, useEffect} from 'react';
import { placePaperTrade, getPaperTradeHistory, getPaperTradePerformance, getCurrentStockPrice, Trade, Performance } from '../services/paperTradeAPI';

export default function TradingPage() {
  
  const [symbol, setSymbol] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [side, setSide] = useState('buy');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [performance, setPerformance] = useState<Performance>({ balance: 100000, positions: {} });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTradeData();
  }, []);

  const loadTradeData = async () => {
    try {
      const [history, perf] = await Promise.all([
        getPaperTradeHistory(),
        getPaperTradePerformance()
      ]);
      setTradeHistory(history);
      setPerformance(perf);
    } catch (error) {
      console.error('Error loading trade data:', error);
      setMessage('Unable to connect to trading server. Working in offline mode.');
    }
  };

  const fetchCurrentPrice = async () => {
     if (!symbol) return;
    setLoading(true);
    try {
      const fetchedPrice = await getCurrentStockPrice(symbol);
      if (fetchedPrice) {
        setCurrentPrice(fetchedPrice);
        setPrice(fetchedPrice);
        setMessage(`Current price for ${symbol}: ₹${fetchedPrice}`);
      } else {
        setMessage(`Could not fetch price for ${symbol}`);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      setMessage('Error fetching stock price');
    }
    setLoading(false);
  };

  const handleTrade = async () => {
    if (!symbol || qty <= 0 || price <= 0) {
      setMessage('Please fill all fields with valid values');
      return;
    }

    setLoading(true);
    try {
      const result = await placePaperTrade({ symbol, qty, price, side });
      
      if (result.success) {
        setMessage(`${side.toUpperCase()} order placed successfully!`);
        loadTradeData(); // Refresh data
        // Reset form
        setSymbol('');
        setQty(1);
        setPrice(0);
        setCurrentPrice(null);
      } else {
        setMessage(result.error || 'Trade failed');
      }
    } catch (error) {
      console.error('Trade error:', error);
      setMessage('Unable to place trade. Server may be down.');
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Paper Trading</h1>
        
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Portfolio Balance</h2>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(performance.balance)}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Positions</h2>
            <div className="max-h-32 overflow-y-auto">
              {Object.entries(performance.positions).length > 0 ? (
                Object.entries(performance.positions).map(([stock, quantity]) => (
                  <div key={stock} className="flex justify-between text-white mb-2">
                    <span>{stock}</span>
                    <span className={quantity > 0 ? 'text-green-400' : 'text-red-400'}>
                      {quantity} shares
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No positions</p>
              )}
            </div>
          </div>
        </div>

        {/* Trading Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Place Trade</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Stock Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., RELIANCE"
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Side</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={fetchCurrentPrice}
              disabled={loading || !symbol}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {loading ? 'Fetching...' : 'Get Current Price'}
            </button>
            
            <button
              onClick={handleTrade}
              disabled={loading || !symbol || qty <= 0 || price <= 0}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : `${side.toUpperCase()} ${qty} shares`}
            </button>
          </div>
          
          {currentPrice && (
            <div className="text-white mb-4">
              <strong>Current Price:</strong> {formatCurrency(currentPrice)}
            </div>
          )}
          
          {message && (
            <div className={`p-3 rounded-lg ${message.includes('successfully') ? 'bg-green-600/20 text-green-400' : 
              message.includes('Error') || message.includes('failed') ? 'bg-red-600/20 text-red-400' : 
              'bg-blue-600/20 text-blue-400'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Trade History */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-6">Trade History</h2>
          
          {tradeHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2">Symbol</th>
                    <th className="text-left py-2">Side</th>
                    <th className="text-left py-2">Quantity</th>
                    <th className="text-left py-2">Price</th>
                    <th className="text-left py-2">Total</th>
                    <th className="text-left py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.slice().reverse().map((trade, index) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="py-2">{trade.symbol}</td>
                      <td className="py-2">
                        <span className={trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2">{trade.qty}</td>
                      <td className="py-2">{formatCurrency(trade.price)}</td>
                      <td className="py-2">{formatCurrency(trade.qty * trade.price)}</td>
                      <td className="py-2">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No trades yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
