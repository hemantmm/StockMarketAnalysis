'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentStockPrice, placeTrade, getTradeHistory, getPortfolio, addFunds, Trade, Portfolio } from '../services/tradingAPI';
import UserMenu from '../components/UserMenu';
import { FaHome, FaStar, FaSearch, FaChartPie, FaRocket } from "react-icons/fa";

export default function TradingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<{email: string, token: string} | null>(null);
  const [symbol, setSymbol] = useState('');
  const [qty, setQty] = useState<number | ''>(1);
  const [price, setPrice] = useState<number | ''>(0);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [showHistory, setShowHistory] = useState(false);
  const [fundAmount, setFundAmount] = useState<number>(10000);
  const [showAddFunds, setShowAddFunds] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        
        if (token && email) {
          const userObj = { email, token };
          setUserId(email);
          setUser(userObj);
          
          localStorage.setItem('user', JSON.stringify(userObj));
        } else {
          setMessage('Please login to access trading features');
          setMessageType('error');
          setTimeout(() => router.push('/Login'), 2000);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const [history, port] = await Promise.all([
        getTradeHistory(userId),
        getPortfolio(userId)
      ]);
      setTradeHistory(history);
      setPortfolio(port);
    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage('Failed to load your trading data. Please try again later.');
      setMessageType('error');
    }
    setLoading(false);
  };

  const fetchCurrentPrice = async () => {
    if (!symbol) {
      setMessage('Please enter a stock symbol');
      setMessageType('error');
      return;
    }
    
    setPriceLoading(true);
    setMessage('');
    
    try {
      const fetchedPrice = await getCurrentStockPrice(symbol);
      if (fetchedPrice) {
        setCurrentPrice(fetchedPrice);
        setPrice(fetchedPrice);
        setMessage(`Current price for ${symbol}: ₹${fetchedPrice}`);
        setMessageType('info');
      } else {
        setMessage(`Could not fetch price for ${symbol}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      setMessage('Error fetching stock price');
      setMessageType('error');
    }
    
    setPriceLoading(false);
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setMessage('Please login first');
      setMessageType('error');
      return;
    }

    if (!symbol || !qty || !price || price <= 0 || qty <= 0) {
      setMessage('Please fill all fields with valid values');
      setMessageType('error');
      return;
    }

    if (side === 'sell' && (!portfolio?.positions[symbol] || portfolio.positions[symbol] < qty)) {
      setMessage(`You don't own enough ${symbol} shares to sell`);
      setMessageType('error');
      return;
    }

    if (side === 'buy' && portfolio && price * qty > portfolio.balance) {
      setMessage(`Insufficient funds. You need ₹${(price * qty).toFixed(2)} but have ₹${portfolio.balance.toFixed(2)}`);
      setMessageType('error');
      return;
    }

    if (currentPrice) {
      const lowerLimit = currentPrice * 0.9;
      const upperLimit = currentPrice * 1.1;
      if (price < lowerLimit || price > upperLimit) {
        setMessage(`Price must be within ±10% of current price (₹${lowerLimit.toFixed(2)} - ₹${upperLimit.toFixed(2)})`);
        setMessageType('error');
        return;
      }
    }

    setLoading(true);
    try {
      const result = await placeTrade(userId, { 
        symbol, 
        qty: Number(qty), 
        price: Number(price), 
        side 
      });
      
      if (result.success) {
        setMessage(`${side === 'buy' ? 'Bought' : 'Sold'} ${qty} ${symbol} shares at ₹${price}`);
        setMessageType('success');
        
        setSymbol('');
        setQty(1);
        setPrice(0);
        setCurrentPrice(null);
        
        await loadUserData();
      } else {
        setMessage(result.error || 'Trade failed');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Trade error:', error);
      setMessage('Failed to execute trade');
      setMessageType('error');
    }
    
    setLoading(false);
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setMessage('Please login first');
      setMessageType('error');
      return;
    }

    if (!fundAmount || fundAmount <= 0) {
      setMessage('Please enter a valid amount');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const result = await addFunds(userId, fundAmount);
      
      if (result.success) {
        setMessage(`Successfully added ₹${fundAmount} to your account`);
        setMessageType('success');
        setShowAddFunds(false);
        
        const port = await getPortfolio(userId);
        setPortfolio(port);
      } else {
        setMessage(result.error || 'Failed to add funds');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Add funds error:', error);
      setMessage('Failed to add funds');
      setMessageType('error');
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

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-8 pt-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push("/")}
          className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <FaHome size={24} />
        </button>
        <button
          onClick={() => router.push("/StockSearchs")}
          className="p-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <FaSearch size={24} />
        </button>
        <button
          onClick={() => router.push("/Watchlist")}
          className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          <FaStar size={24} />
        </button>
        <button
          onClick={() => router.push("/ActiveStocks")}
          className="p-2 text-orange-400 hover:text-orange-300 transition-colors"
        >
          <FaRocket size={24} />
        </button>
        <button
          onClick={() => router.push("/Portfolio")}
          className="p-2 text-green-400 hover:text-green-300 transition-colors"
        >
          <FaChartPie size={24} />
        </button>
      </div>
      <h1 className="text-3xl font-bold text-white">Stock Trading</h1>
      {user ? (
        <UserMenu user={user} />
      ) : (
        <button
          onClick={() => router.push('/Login')}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
        >
          Login
        </button>
      )}
    </div>
  );

  const renderErrorMessage = () => {
    if (!message) return null;
    
    return (
      <div className={`p-4 mb-6 rounded-lg ${
        messageType === 'success' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 
        messageType === 'error' ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 
        'bg-blue-600/20 text-blue-400 border border-blue-500/30'
      }`}>
        {message.includes("Cannot connect") ? (
          <div>
            <p className="font-bold mb-2">{message}</p>
            <p className="text-sm">To fix this issue:</p>
            <ol className="list-decimal ml-5 text-sm mt-1">
              <li>Make sure the backend server is running</li>
              <li>Check if you&apos;re running the server on port 3001</li>
              <li>Try refreshing the page</li>
            </ol>
          </div>
        ) : (
          message
        )}
      </div>
    );
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-md w-full text-center">
          <div className="text-3xl font-bold text-white mb-4">Authentication Required</div>
          <p className="text-gray-300 mb-6">Please log in to access the trading platform</p>
          <button 
            onClick={() => router.push('/Login')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {renderHeader()}
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Stock Trading Platform</h1>
        
        {renderErrorMessage()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Account Balance</h2>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-green-400">
                {portfolio ? formatCurrency(portfolio.balance) : 'Loading...'}
              </p>
              <button 
                onClick={() => setShowAddFunds(true)} 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors"
              >
                Add Funds
              </button>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Your Positions</h2>
            <div className="max-h-32 overflow-y-auto">
              {portfolio && Object.entries(portfolio.positions).length > 0 ? (
                Object.entries(portfolio.positions)
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  .filter(([_,qty]) => qty > 0)
                  .map(([stock, quantity]) => (
                    <div key={stock} className="flex justify-between text-white mb-2">
                      <span>{stock}</span>
                      <span className="text-green-400">{quantity} shares</span>
                    </div>
                  ))
              ) : (
                <p className="text-gray-400">No positions</p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleTrade} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
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
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                value={qty === '' ? '' : qty}
                onChange={(e) => setQty(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value)))}
                min="1"
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Price (₹)</label>
              <input
                type="number"
                value={price === '' ? '' : price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Side</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as 'buy' | 'sell')}
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              type="button"
              onClick={fetchCurrentPrice}
              disabled={priceLoading || !symbol}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {priceLoading ? 'Fetching...' : 'Get Current Price'}
            </button>
            
            <button
              type="submit"
              disabled={loading || !symbol || !qty || !price || price <= 0}
              className={`px-6 py-2 ${side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:bg-gray-600 text-white rounded-lg transition-colors`}
            >
              {loading ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${qty || ''} shares`}
            </button>
          </div>
          
          {currentPrice !== null && (
            <div className="mb-4">
              <div className="text-white">
                <strong>Current Price:</strong> {formatCurrency(currentPrice)}
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <div className="text-red-400">
                  Min (-10%): {formatCurrency(currentPrice * 0.9)}
                </div>
                <div className="text-green-400">
                  Max (+10%): {formatCurrency(currentPrice * 1.1)}
                </div>
              </div>
            </div>
          )}
          
          {message && (
            <div className={`p-3 rounded-lg ${
              messageType === 'success' ? 'bg-green-600/20 text-green-400' : 
              messageType === 'error' ? 'bg-red-600/20 text-red-400' : 
              'bg-blue-600/20 text-blue-400'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Trade History</h2>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>
          
          {showHistory && (
            tradeHistory.length > 0 ? (
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
            )
          )}
        </div>

        {showAddFunds && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Add Funds</h3>
              <form onSubmit={handleAddFunds}>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(Math.max(1000, parseFloat(e.target.value) || 0))}
                    min="1000"
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddFunds(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    {loading ? 'Processing...' : 'Add Funds'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
