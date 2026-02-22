"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FaHome, FaChartPie, FaArrowUp, FaArrowDown, 
  FaRocket, FaSpinner, FaSync, FaChartLine, FaDownload, 
  FaUpload, FaTrophy, FaPercentage, FaWallet, FaCoins
} from "react-icons/fa";
import { getPortfolio, getTradeHistory, getCurrentStockPrice } from "../services/tradingAPI";

interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  totalInvested: number;
  currentPrice: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
}

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalProfit: number;
  profitPercentage: number;
}

const Portfolio = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState("CLOSED");
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    totalInvested: 0,
    currentValue: 0,
    totalProfit: 0,
    profitPercentage: 0
  });
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
    const hour = new Date().getHours();
    setMarketStatus(hour >= 9 && hour < 16 ? "OPEN" : "CLOSED");
    const email = typeof window !== "undefined" ? localStorage.getItem("email") : null;
    setUserId(email);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      const hour = new Date().getHours();
      setMarketStatus(hour >= 9 && hour < 16 ? "OPEN" : "CLOSED");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (userId) fetchPortfolioData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!isClient) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
      type: 'currency' | 'graph' | 'dot';
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'][Math.floor(Math.random() * 6)],
        type: ['currency', 'graph', 'dot'][Math.floor(Math.random() * 3)] as 'currency' | 'graph' | 'dot'
      });
    }

    const drawParticle = (particle: typeof particles[0]) => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      
      if (particle.type === 'currency') {
        ctx.font = `${particle.size * 3}px monospace`;
        const symbols = ['₹', '$', '€', '¥', '£', '₿'];
        ctx.fillText(symbols[Math.floor(Math.random() * symbols.length)], particle.x, particle.y);
      } else if (particle.type === 'graph') {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const x = particle.x + i * 1.5;
          const y = particle.y + Math.sin(Date.now() * 0.001 + i) * 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        drawParticle(particle);
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isClient]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      if (!userId) return;
      const portfolio = await getPortfolio(userId);
      const trades = await getTradeHistory(userId);

      if (portfolio && portfolio.positions) {
        const holdingsData: PortfolioHolding[] = [];
        let totalInvested = 0;
        let totalCurrentValue = 0;

        const avgPrices: Record<string, number> = {};
        const totalQuantities: Record<string, number> = {};
        
        trades.forEach(trade => {
          if (trade.side === 'buy') {
            if (!avgPrices[trade.symbol]) {
              avgPrices[trade.symbol] = 0;
              totalQuantities[trade.symbol] = 0;
            }
            avgPrices[trade.symbol] = ((avgPrices[trade.symbol] * totalQuantities[trade.symbol]) + (trade.price * trade.qty)) / (totalQuantities[trade.symbol] + trade.qty);
            totalQuantities[trade.symbol] += trade.qty;
          }
        });

        for (const [symbol, quantity] of Object.entries(portfolio.positions)) {
          if (quantity > 0) {
            try {
              const currentPrice = await getCurrentStockPrice(symbol) || 0;
              const avgPrice = avgPrices[symbol] || currentPrice * 0.95;
              const invested = quantity * avgPrice;
              const currentValue = quantity * currentPrice;
              const profit = currentValue - invested;
              const profitPercentage = invested > 0 ? (profit / invested) * 100 : 0;

              holdingsData.push({
                symbol,
                quantity,
                avgPrice,
                totalInvested: invested,
                currentPrice,
                currentValue,
                profit,
                profitPercentage
              });

              totalInvested += invested;
              totalCurrentValue += currentValue;
            } catch (error) {
              console.error(`Error fetching price for ${symbol}:`, error);
            }
          }
        }

        const totalProfit = totalCurrentValue - totalInvested;
        const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

        setHoldings(holdingsData);
        setPortfolioSummary({
          totalInvested,
          currentValue: totalCurrentValue,
          totalProfit,
          profitPercentage
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPortfolio = async () => {
    setRefreshing(true);
    await fetchPortfolioData();
    setRefreshing(false);
  };

  const handleExportPortfolio = async () => {
    if (!userId) return;
    const res = await fetch(`/api/export/portfolio/${userId}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${userId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    await fetch(`/api/import/portfolio/${userId}`, {
      method: 'POST',
      body: formData
    });
    fetchPortfolioData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  if (!isClient) return null;
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #0a0e27 30%, #0f172a 60%, #1a1f3a 100%)'
        }}
      />
      <div className="relative z-10">
        <div className="bg-gradient-to-r from-gray-900/60 via-gray-800/60 to-gray-900/60 backdrop-blur-xl border-b border-green-500/20 shadow-lg shadow-green-500/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.push('/')}
                  className="group flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-all duration-300 hover:scale-105"
                >
                  <FaHome className="group-hover:rotate-12 transition-transform duration-300" />
                  <span className="hidden sm:inline font-medium">Home</span>
                </button>
                <button
                  onClick={() => router.push('/Trading')}
                  className="group flex items-center space-x-2 text-gray-300 hover:text-cyan-400 transition-all duration-300 hover:scale-105"
                >
                  <FaChartLine className="group-hover:rotate-12 transition-transform duration-300" />
                  <span className="hidden sm:inline font-medium">Trading</span>
                </button>
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-600">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg shadow-lg">
                    <FaChartPie className="text-white text-xl" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    Portfolio
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <div className="text-gray-200 font-semibold text-lg">{currentTime.toLocaleTimeString()}</div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                    marketStatus === 'OPEN' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    <span className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse" 
                      style={{ backgroundColor: marketStatus === 'OPEN' ? '#4ade80' : '#f87171' }} />
                    {marketStatus}
                  </div>
                </div>
                <button
                  onClick={refreshPortfolio}
                  disabled={refreshing}
                  className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-105"
                >
                  <FaSync className={`${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                  <span className="font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleExportPortfolio}
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
            >
              <FaDownload className="group-hover:-translate-y-1 transition-transform duration-300" />
              <span>Export Portfolio</span>
            </button>
            <label className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-3 rounded-xl text-white font-medium cursor-pointer transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105">
              <FaUpload className="group-hover:translate-y-1 transition-transform duration-300" />
              <span>Import Portfolio</span>
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleImportPortfolio}
              />
            </label>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-br from-gray-800/70 via-gray-800/50 to-gray-900/70 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-3 rounded-xl border border-blue-500/30">
                  <FaWallet className="text-blue-400 text-2xl" />
                </div>
                <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FaCoins className="text-3xl" />
                </div>
              </div>
              <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Amount Invested</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {formatCurrency(portfolioSummary.totalInvested)}
              </div>
            </div>

            <div className="group bg-gradient-to-br from-gray-800/70 via-gray-800/50 to-gray-900/70 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-3 rounded-xl border border-purple-500/30">
                  <FaChartLine className="text-purple-400 text-2xl" />
                </div>
                <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FaRocket className="text-3xl" />
                </div>
              </div>
              <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Current Value</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {formatCurrency(portfolioSummary.currentValue)}
              </div>
            </div>

            <div className={`group bg-gradient-to-br from-gray-800/70 via-gray-800/50 to-gray-900/70 backdrop-blur-xl p-8 rounded-2xl border ${
              portfolioSummary.totalProfit >= 0 
                ? 'border-gray-700/50 hover:border-green-500/50 hover:shadow-green-500/10' 
                : 'border-gray-700/50 hover:border-red-500/50 hover:shadow-red-500/10'
            } transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-2`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-br ${
                  portfolioSummary.totalProfit >= 0 
                    ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' 
                    : 'from-red-500/20 to-rose-500/20 border-red-500/30'
                } p-3 rounded-xl border`}>
                  <FaTrophy className={`${portfolioSummary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'} text-2xl`} />
                </div>
                <div className={`${portfolioSummary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                  <FaPercentage className="text-3xl" />
                </div>
              </div>
              <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Total P&L</div>
              <div className={`text-3xl font-bold flex items-center ${
                portfolioSummary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {portfolioSummary.totalProfit >= 0 ? (
                  <FaArrowUp className="mr-2 animate-bounce" />
                ) : (
                  <FaArrowDown className="mr-2 animate-bounce" />
                )}
                {formatCurrency(Math.abs(portfolioSummary.totalProfit))}
              </div>
              <div className={`text-xl font-semibold mt-2 ${
                portfolioSummary.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatPercentage(portfolioSummary.profitPercentage)}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              <FaRocket className="mr-3 text-green-400" />
              My Holdings
            </h2>
            {holdings.length > 0 && (
              <div className="bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 text-sm">Total: </span>
                <span className="text-white font-bold text-lg">{holdings.length}</span>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <FaSpinner className="animate-spin text-6xl text-green-400" />
                <div className="absolute inset-0 blur-xl bg-green-400/30 animate-pulse" />
              </div>
              <span className="mt-6 text-xl text-gray-300 font-medium">Loading portfolio...</span>
              <div className="mt-4 flex space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : holdings.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl rounded-3xl border border-gray-700/30">
              <div className="relative inline-block">
                <FaChartPie className="text-8xl mx-auto mb-6 opacity-20 text-gray-500" />
                <div className="absolute inset-0 blur-2xl bg-gray-500/10" />
              </div>
              <p className="text-2xl font-bold text-gray-300 mb-2">No Holdings Yet</p>
              <p className="text-gray-500 mb-6">Start trading when the market opens to build your portfolio</p>
              <button
                onClick={() => router.push('/Trading')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-8 py-3 rounded-xl text-white font-medium transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-105"
              >
                Start Trading
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {holdings.map((holding, index) => (
                <div 
                  key={index} 
                  className="group bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/40 hover:border-green-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xl font-bold text-white mb-1 group-hover:text-green-400 transition-colors duration-300">
                        {holding.symbol}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider">Quantity</span>
                        <span className="bg-gray-700/50 px-2 py-1 rounded-lg text-white font-semibold text-sm">
                          {holding.quantity}
                        </span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-xl ${
                      holding.profit >= 0 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}>
                      {holding.profit >= 0 ? (
                        <FaArrowUp className="text-green-400 text-lg" />
                      ) : (
                        <FaArrowDown className="text-red-400 text-lg" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/30">
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Avg Price</div>
                      <div className="text-white font-semibold">{formatCurrency(holding.avgPrice)}</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/30">
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Current</div>
                      <div className="text-white font-semibold">{formatCurrency(holding.currentPrice)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Invested</div>
                      <div className="text-white font-bold text-lg">{formatCurrency(holding.totalInvested)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Current Value</div>
                      <div className="text-white font-bold text-lg">{formatCurrency(holding.currentValue)}</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700/50 my-4" />

                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Profit/Loss</div>
                      <div className={`text-xl font-bold flex items-center ${
                        holding.profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(Math.abs(holding.profit))}
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl font-bold text-lg ${
                      holding.profitPercentage >= 0 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {formatPercentage(holding.profitPercentage)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
