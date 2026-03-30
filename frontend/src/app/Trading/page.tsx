'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentStockPrice, placeTrade, getTradeHistory, getPortfolio, addFunds, Trade, Portfolio } from '../services/tradingAPI';
import UserMenu from '../components/UserMenu';
import { FaHome, FaStar, FaSearch, FaChartPie, FaRocket, FaSpinner, FaArrowRight } from "react-icons/fa";

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
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const [portfolioValueLoading, setPortfolioValueLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState<'OPEN' | 'CLOSED'>('CLOSED');
  const [tradeAnalysis, setTradeAnalysis] = useState<{
    totalTrades: number;
    totalBuy: number;
    totalSell: number;
    mostTraded: string | null;
    profit: number;
    loss: number;
    net: number;
    winRate: number;
    recommendation: string;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        const userStr = localStorage.getItem('user');
        let userObj = null;
        if (userStr) {
          userObj = JSON.parse(userStr);
        }
        if (token && email && userObj) {
          setUserId(userObj.id || userObj._id || userObj.userId || email);
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
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now);
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const day = now.getDay();
      const isWeekday = day >= 1 && day <= 5;
      const isMarketOpen = isWeekday && (hours > 9 || (hours === 9 && minutes >= 15)) && hours < 15;
      setMarketStatus(isMarketOpen ? 'OPEN' : 'CLOSED');
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

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

    if (!symbol || !qty || Number(price) <= 0 || Number(qty) <= 0) {
      setMessage('Please fill all fields with valid values');
      setMessageType('error');
      return;
    }

    if (side === 'sell' && (!portfolio?.positions[symbol] || portfolio.positions[symbol] < Number(qty))) {
      setMessage(`You don't own enough ${symbol} shares to sell`);
      setMessageType('error');
      return;
    }

    if (side === 'buy' && portfolio && Number(price) * Number(qty) > portfolio.balance) {
      setMessage(`Insufficient funds. You need ₹${(Number(price) * Number(qty)).toFixed(2)} but have ₹${portfolio.balance.toFixed(2)}`);
      setMessageType('error');
      return;
    }

    if (currentPrice) {
      const lowerLimit = currentPrice * 0.9;
      const upperLimit = currentPrice * 1.1;
      if (Number(price) < lowerLimit || Number(price) > upperLimit) {
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
    <div className="relative z-20 mb-10 pt-3">
      <div className="backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
              <FaRocket className="text-black text-lg" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Trading Command Center
            </h1>
            <p className="text-xs text-gray-400">Execute, track, and optimize your strategy</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
        <button
          onClick={() => router.push("/")}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-yellow-400 hover:bg-white/10 transition-all"
        >
          <FaHome size={24} />
        </button>
        <button
          onClick={() => router.push("/StockSearchs")}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10 transition-all"
        >
          <FaSearch size={24} />
        </button>
        <button
          onClick={() => router.push("/Watchlist")}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-yellow-300 hover:bg-white/10 transition-all"
        >
          <FaStar size={24} />
        </button>
        <button
          onClick={() => router.push("/ActiveStocks")}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-orange-400 hover:bg-white/10 transition-all"
        >
          <FaRocket size={24} />
        </button>
        <button
          onClick={() => router.push("/Portfolio")}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-400 hover:bg-white/10 transition-all"
        >
          <FaChartPie size={24} />
        </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <div className={`w-2 h-2 rounded-full ${marketStatus === 'OPEN' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-sm font-medium">{marketStatus}</span>
          </div>
          <div className="hidden md:block text-sm text-gray-400">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
          {user ? (
            <UserMenu user={user} />
          ) : (
            <button
              onClick={() => router.push('/Login')}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 transform hover:scale-105"
            >
              Login
            </button>
          )}
        </div>
      </div>
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

  const quickStocks = [
    { symbol: "RELIANCE", name: "Reliance" },
    { symbol: "TCS", name: "TCS" },
    { symbol: "INFY", name: "Infosys" },
    { symbol: "HDFCBANK", name: "HDFC Bank" }
  ];

  const handleQuickBuy = async (stockSymbol: string) => {
    setSymbol(stockSymbol);
    setQty(1);
    setSide('buy');
    setMessage('');
    setPriceLoading(true);
    const fetchedPrice = await getCurrentStockPrice(stockSymbol);
    if (fetchedPrice) {
      setCurrentPrice(fetchedPrice);
      setPrice(fetchedPrice);
      setMessage(`Current price for ${stockSymbol}: ₹${fetchedPrice}`);
      setMessageType('info');
    } else {
      setMessage(`Could not fetch price for ${stockSymbol}`);
      setMessageType('error');
    }
    setPriceLoading(false);
  };

  useEffect(() => {
    const fetchPortfolioValue = async () => {
      if (!portfolio || !portfolio.positions) {
        setPortfolioValue(null);
        return;
      }
      setPortfolioValueLoading(true);
      let total = portfolio.balance;
      for (const [symbol, qty] of Object.entries(portfolio.positions)) {
        if (qty > 0) {
          const price = await getCurrentStockPrice(symbol);
          if (price) total += price * qty;
        }
      }
      setPortfolioValue(total);
      setPortfolioValueLoading(false);
    };
    if (portfolio) fetchPortfolioValue();
  }, [portfolio]);

  const handleExportTradeHistory = async () => {
    if (!userId) return;
    const res = await fetch(`/api/export/tradehistory/${userId}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradehistory_${userId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportTradeHistory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    await fetch(`/api/import/tradehistory/${userId}`, {
      method: 'POST',
      body: formData
    });
    loadUserData();
  };

  useEffect(() => {
    if (!tradeHistory || tradeHistory.length === 0) {
      setTradeAnalysis(null);
      return;
    }
    let totalBuy = 0, totalSell = 0, profit = 0, loss = 0;
    const stockCount: Record<string, number> = {};
    let wins = 0, totalClosed = 0;
    const buyMap: Record<string, { qty: number, price: number }[]> = {};

    tradeHistory.forEach(trade => {
      stockCount[trade.symbol] = (stockCount[trade.symbol] || 0) + 1;
      if (trade.side === 'buy') {
        totalBuy++;
        if (!buyMap[trade.symbol]) buyMap[trade.symbol] = [];
        buyMap[trade.symbol].push({ qty: trade.qty, price: trade.price });
      } else if (trade.side === 'sell') {
        totalSell++;
        let qtyToSell = trade.qty;
        let pl = 0;
        if (buyMap[trade.symbol]) {
          while (qtyToSell > 0 && buyMap[trade.symbol].length > 0) {
            const buy = buyMap[trade.symbol][0];
            const matchedQty = Math.min(qtyToSell, buy.qty);
            pl += matchedQty * (trade.price - buy.price);
            if (trade.price > buy.price) wins++;
            totalClosed++;
            if (matchedQty === buy.qty) {
              buyMap[trade.symbol].shift();
            } else {
              buy.qty -= matchedQty;
            }
            qtyToSell -= matchedQty;
          }
        }
        if (pl >= 0) profit += pl;
        else loss += -pl;
      }
    });

    const mostTraded = Object.entries(stockCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const net = profit - loss;
    const winRate = totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : 0;

    let recommendation = "Keep trading and diversify!";
    if (winRate > 70) recommendation = "Great job! Consider increasing position size on your best stocks.";
    else if (winRate < 40 && totalClosed > 5) recommendation = "Review your strategy. Consider reducing trade frequency or using stop-loss.";
    else if (mostTraded) recommendation = `Focus on analyzing ${mostTraded} for better results.`;

    setTradeAnalysis({
      totalTrades: tradeHistory.length,
      totalBuy,
      totalSell,
      mostTraded,
      profit,
      loss,
      net,
      winRate,
      recommendation
    });
  }, [tradeHistory]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 max-w-md w-full text-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-4">Authentication Required</div>
          <p className="text-gray-300 mb-6">Please log in to access the trading platform</p>
          <button 
            onClick={() => router.push('/Login')}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 relative overflow-hidden text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-72 w-72 bg-yellow-500/10 blur-3xl rounded-full" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 bg-amber-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 bg-orange-500/10 blur-3xl rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {renderHeader()}
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">Stock Trading Platform</span>
        </h1>
        
        {/* --- Trade Analysis Section --- */}
        {tradeAnalysis && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent mb-2">Your Trading Analysis</h2>
            <div className="flex flex-wrap gap-6 text-white text-base">
              <div>Total Trades: <span className="font-bold">{tradeAnalysis.totalTrades}</span></div>
              <div>Buys: <span className="text-green-400 font-bold">{tradeAnalysis.totalBuy}</span></div>
              <div>Sells: <span className="text-red-400 font-bold">{tradeAnalysis.totalSell}</span></div>
              <div>Most Traded: <span className="font-bold">{tradeAnalysis.mostTraded}</span></div>
              <div>Profit: <span className="text-green-400 font-bold">₹{tradeAnalysis.profit.toFixed(2)}</span></div>
              <div>Loss: <span className="text-red-400 font-bold">₹{tradeAnalysis.loss.toFixed(2)}</span></div>
              <div>Net: <span className={tradeAnalysis.net >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>₹{tradeAnalysis.net.toFixed(2)}</span></div>
              <div>Win Rate: <span>{tradeAnalysis.winRate}%</span></div>
            </div>
            <div className="mt-4 text-amber-200 font-semibold">{tradeAnalysis.recommendation}</div>
          </div>
        )}
        {/* --- End Trade Analysis Section --- */}

        <div className="flex flex-wrap justify-center gap-4 mb-8 animate-fade-in">
          {quickStocks.map(stock => (
            <button
              key={stock.symbol}
              onClick={() => handleQuickBuy(stock.symbol)}
              className="group px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform"
            >
              <span className="inline-flex items-center gap-2">
                Quick Buy {stock.name}
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-end items-center mb-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl px-6 py-3 border border-white/10 flex items-center gap-3">
            <span className="text-lg text-white font-semibold">Portfolio Value:</span>
            {portfolioValueLoading ? (
              <FaSpinner className="animate-spin text-yellow-400" size={22} />
            ) : (
              <span className="text-yellow-300 font-bold">{portfolioValue !== null ? formatCurrency(portfolioValue) : "--"}</span>
            )}
          </div>
        </div>

        {renderErrorMessage()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Account Balance</h2>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-green-400">
                {portfolio ? formatCurrency(portfolio.balance) : 'Loading...'}
              </p>
              <button 
                onClick={() => setShowAddFunds(true)} 
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg text-black text-sm font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
              >
                Add Funds
              </button>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
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

        <form onSubmit={handleTrade} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Place Trade</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Stock Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., RELIANCE"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Side</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as 'buy' | 'sell')}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/25 transition-all"
            >
              {priceLoading ? 'Fetching...' : 'Get Current Price'}
            </button>
            
            <button
              type="submit"
              disabled={loading || !symbol || !qty || !price || price <= 0}
              className={`px-6 py-2 ${side === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors`}
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

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8">
          {/* Export/Import buttons */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleExportTradeHistory}
              disabled={!userId}
              aria-label="Export Trade History CSV"
              title={!userId ? "Login required" : "Export Trade History CSV"}
              className={`bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-2 rounded-lg text-black font-semibold ${!userId ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:shadow-yellow-500/25"}`}
            >
              Export Trade History CSV
            </button>
            <label className={`bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 rounded-lg text-black font-semibold cursor-pointer ${!userId ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:shadow-amber-500/25"}`}>
              Import Trade History CSV
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportTradeHistory} disabled={!userId} aria-label="Import Trade History CSV" />
            </label>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Trade History</h2>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors border border-white/10"
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
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Add Funds</h3>
              <form onSubmit={handleAddFunds}>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(Math.max(1000, parseFloat(e.target.value) || 0))}
                    min="1000"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddFunds(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50"
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
