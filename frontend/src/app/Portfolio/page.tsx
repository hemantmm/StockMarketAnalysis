"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FaHome, FaChartPie, FaArrowUp, FaArrowDown, 
  FaRocket, FaSpinner, FaSync
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
          background: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)'
        }}
      />
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-gray-900/50 backdrop-blur-md border-b border-gray-700/50 p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
              >
                <FaHome />
                <span className="hidden sm:inline">Home</span>
              </button>
              <div className="flex items-center space-x-2">
                <FaChartPie className="text-green-400" />
                <h1 className="text-2xl font-bold">Portfolio</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-gray-300">{currentTime.toLocaleTimeString()}</div>
                <div className={`text-sm ${marketStatus === 'OPEN' ? 'text-green-400' : 'text-red-400'}`}>
                  Market {marketStatus}
                </div>
              </div>
              <button
                onClick={refreshPortfolio}
                disabled={refreshing}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <FaSync className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Export/Import */}
        <div className="p-6 flex flex-col md:flex-row gap-4 mb-4">
          <button
            onClick={handleExportPortfolio}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
          >
            Export Portfolio CSV
          </button>
          <label className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white cursor-pointer">
            Import Portfolio CSV
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleImportPortfolio}
            />
          </label>
        </div>

        {/* Summary Cards */}
        <div className="px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 p-6 rounded-xl flex flex-col items-center">
              <div className="text-gray-400 text-sm mb-2">Amount Invested</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(portfolioSummary.totalInvested)}</div>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-xl flex flex-col items-center">
              <div className="text-gray-400 text-sm mb-2">Current Value</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(portfolioSummary.currentValue)}</div>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-xl flex flex-col items-center">
              <div className="text-gray-400 text-sm mb-2">Total P&L</div>
              <div className={`text-2xl font-bold flex items-center justify-center ${portfolioSummary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolioSummary.totalProfit >= 0 ? <FaArrowUp className="mr-2" /> : <FaArrowDown className="mr-2" />}
                {formatCurrency(Math.abs(portfolioSummary.totalProfit))}
              </div>
              <div className={`text-lg ${portfolioSummary.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(portfolioSummary.profitPercentage)}
              </div>
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div className="px-6">
          <h2 className="text-xl font-semibold text-green-400 flex items-center mb-6">
            <FaRocket className="mr-2" />
            Holdings
          </h2>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <FaSpinner className="animate-spin text-4xl text-green-400" />
              <span className="ml-4 text-xl">Loading portfolio...</span>
            </div>
          ) : holdings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaChartPie className="text-6xl mx-auto mb-4 opacity-50" />
              <p className="text-lg">No stocks</p>
              <p className="text-sm">When market opens add the stock</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {holdings.map((holding, index) => (
                <div key={index} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30 flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-lg font-semibold text-white">{holding.symbol}</div>
                    <div className="text-gray-400 text-sm">Qty: {holding.quantity}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-400">Invested</div>
                      <div className="text-white font-semibold">{formatCurrency(holding.totalInvested)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Current Value</div>
                      <div className="text-white font-semibold">{formatCurrency(holding.currentValue)}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col items-end">
                    <div className={`font-semibold flex items-center justify-end ${holding.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.profit >= 0 ? <FaArrowUp className="mr-1 text-xs" /> : <FaArrowDown className="mr-1 text-xs" />}
                      {formatCurrency(Math.abs(holding.profit))}
                    </div>
                    <div className={`text-sm ${holding.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(holding.profitPercentage)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="relative z-10 mt-20 px-6 py-8 border-t border-white/10 backdrop-blur-xl bg-black/20">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <FaChartPie className="text-green-400" />
              <span className="text-sm text-gray-400">Enterprise-grade security & 24/7 monitoring</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 MarketSense. All rights reserved. | Terms of Service | Privacy Policy
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Portfolio;
