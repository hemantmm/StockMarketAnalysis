"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FaHome, FaChartPie, FaArrowUp, FaArrowDown, 
  FaRocket, FaTrophy, FaSpinner, FaSync
} from "react-icons/fa";
import { getPaperTradePerformance, getCurrentStockPrice, getPaperTradeHistory } from "../services/paperTradeAPI";

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

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
    const hour = new Date().getHours();
    setMarketStatus(hour >= 9 && hour < 16 ? "OPEN" : "CLOSED");
    fetchPortfolioData();
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
      const performance = await getPaperTradePerformance();
      const trades = await getPaperTradeHistory();
      
      if (performance && performance.positions) {
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

        for (const [symbol, quantity] of Object.entries(performance.positions)) {
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
        style={{ background: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)' }}
      />
      
      <div className="relative z-10">
        <div className="bg-gray-900/50 backdrop-blur-md border-b border-gray-700/50 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
              >
                <FaHome />
                <span>Home</span>
              </button>
              <div className="flex items-center space-x-2">
                <FaChartPie className="text-green-400" />
                <h1 className="text-2xl font-bold">Portfolio</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <FaSpinner className="animate-spin text-4xl text-green-400" />
              <span className="ml-4 text-xl">Loading portfolio...</span>
            </div>
          ) : (
            <>
              <div className="bg-gray-900/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-green-400 flex items-center">
                      <FaTrophy className="mr-2" />
                      Portfolio Summary
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-sm">Amount Invested</div>
                        <div className="text-2xl font-bold text-white">
                          {formatCurrency(portfolioSummary.totalInvested)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-sm">Current Value</div>
                        <div className="text-2xl font-bold text-white">
                          {formatCurrency(portfolioSummary.currentValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 text-sm mb-2">Total P&L</div>
                      <div className={`text-4xl font-bold flex items-center justify-center ${
                        portfolioSummary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {portfolioSummary.totalProfit >= 0 ? <FaArrowUp className="mr-2" /> : <FaArrowDown className="mr-2" />}
                        {formatCurrency(Math.abs(portfolioSummary.totalProfit))}
                      </div>
                      <div className={`text-lg ${
                        portfolioSummary.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercentage(portfolioSummary.profitPercentage)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-green-400 flex items-center mb-6">
                  <FaRocket className="mr-2" />
                  Holdings
                </h2>
                
                {holdings.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaChartPie className="text-6xl mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No stocks</p>
                    <p className="text-sm">When market opens add the stock</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {holdings.map((holding, index) => (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div>
                            <div className="text-lg font-semibold text-white">{holding.symbol}</div>
                            <div className="text-gray-400 text-sm">Qty: {holding.quantity}</div>
                          </div>
                          
                          <div className="text-right md:text-left">
                            <div className="text-gray-400 text-sm">Invested</div>
                            <div className="text-white font-semibold">
                              {formatCurrency(holding.totalInvested)}
                            </div>
                          </div>
                          
                          <div className="text-right md:text-left">
                            <div className="text-gray-400 text-sm">Current Value</div>
                            <div className="text-white font-semibold">
                              {formatCurrency(holding.currentValue)}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-gray-400 text-sm">P&L</div>
                            <div className={`font-semibold flex items-center justify-end ${
                              holding.profit >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {holding.profit >= 0 ? <FaArrowUp className="mr-1 text-xs" /> : <FaArrowDown className="mr-1 text-xs" />}
                              {formatCurrency(Math.abs(holding.profit))}
                            </div>
                            <div className={`text-sm ${
                              holding.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatPercentage(holding.profitPercentage)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
