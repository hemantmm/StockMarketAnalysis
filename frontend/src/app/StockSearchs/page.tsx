"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import fetchStockDetails from "../stockNameAPI";
import { FaInfoCircle, FaArrowUp, FaArrowDown, FaSearch, FaChartLine, FaHome, FaChartPie, FaStar } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import fetchStockData from "../stockDataAPI";
import { addToWatchlist, checkInWatchlist, removeFromWatchlist, addToWatchlistWithFallback } from "../watchlistAPI";
import {
  Chart as ChartJS,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

ChartJS.register(
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Tooltip,
  Legend
);

interface StockData {
  days: number;
  bsePrice: number;
  nsePrice: number;
}

const periodWiseOptions = ["1m", "6m", "1yr", "3yr", "5yr", "10yr", "max"];

const StockSearchs = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const initialLoadRef = useRef(true);
  const [stockName, setStockName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [stockPriceData, setStockPriceData] = useState<Array<[string, string]>>([]);
  const [periodWise, setPeriodWise] = useState("1m");
  const { user, isAuthenticated } = useAuth();
  const [userId, setUserId] = useState<string>("");
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(false);
  const [stockRecommendation, setStockRecommendation] = useState<{
    recommendation: string;
    confidence: string;
    reason: string;
    period?: string;
    targetPrice?: number;
    supportLevel?: number;
    resistanceLevel?: number;
    riskRating?: string;
    trendStrength?: string;
  } | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  useEffect(() => {
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
      
      const isMobile = window.innerWidth < 768;
      const targetParticleCount = isMobile ? 50 : 100;
      
      while (particles.length > targetParticleCount) {
        particles.pop();
      }
      while (particles.length < targetParticleCount) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
          color: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)],
          type: ['currency', 'graph', 'dot'][Math.floor(Math.random() * 3)] as 'currency' | 'graph' | 'dot'
        });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 50 : 100;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)],
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

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
      ctx.lineWidth = 0.5;
      const gridSize = window.innerWidth < 768 ? 40 : 60;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const gradient = ctx.createRadialGradient(
        mouseRef.current.x, mouseRef.current.y, 0,
        mouseRef.current.x, mouseRef.current.y, 150 
      );
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
      gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        drawParticle(particle);
      });

      connectParticles();
      requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  //   try {
  //     const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://stockmarketanalysis-node.onrender.com';
  //     const res = await fetch(`${API_BASE}/predict`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ prices: pastPrices }),
  //     });

  //     if (!res.ok) {
  //       console.error("Server error:", res.statusText);
  //       return null;
  //     }

  //     const data = await res.json();
  //     if (data.prediction_price && typeof data.prediction_price === "number") {
  //       return data.prediction_price;
  //     } else {
  //       console.error("Invalid prediction format:", data);
  //       return null;
  //     }
  //   } catch (error) {
  //     console.error("Prediction error:", error);
  //     return null;
  //   }
  // };

  const toggleDetails = () => setShowDetails(!showDetails);

  const fetchStockRecommendation = async (symbol: string, prices: number[], period: string) => {
    if (!prices.length) return;
    
    setRecommendationLoading(true);
    try {
      console.log(`Sending recommendation request for ${symbol} with ${prices.length} price points, period: ${period}`);
      
      const res = await fetch('http://127.0.0.1:5000/api/stock-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, prices, period }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to get recommendation: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Received recommendation:", data);
      
      const lastPrice = prices[prices.length - 1];
      let targetPrice;
      
      if (!data.targetPrice) {
        if (data.recommendation === 'Buy') {
          targetPrice = Math.round((lastPrice * 1.05) * 100) / 100;
        } else if (data.recommendation === 'Sell') {
          targetPrice = Math.round((lastPrice * 0.95) * 100) / 100;
        } else {
          targetPrice = Math.round(lastPrice * 100) / 100;
        }
      } else {
        targetPrice = data.targetPrice;
      }
      
      // Enhanced reasoning if not provided
      let enhancedReason = data.reason || '';
      if (data.recommendation === 'Buy' && !enhancedReason) {
        enhancedReason = `Technical indicators suggest an upward trend. Consider buying with a target price of ₹${targetPrice}.`;
      } else if (data.recommendation === 'Sell' && !enhancedReason) {
        enhancedReason = `Technical indicators suggest a downward trend. Consider selling with a target price of ₹${targetPrice}.`;
      } else if (data.recommendation === 'Hold' && !enhancedReason) {
        enhancedReason = `The stock is currently in a neutral trend. Hold with a price target around ₹${targetPrice}.`;
      }
      
      setStockRecommendation({
        recommendation: data.recommendation,
        confidence: data.confidence,
        reason: enhancedReason,
        period: data.period,
        targetPrice: targetPrice
      });
    } catch (error) {
      console.error('Recommendation error:', error);
      
      const lastPrice = prices[prices.length - 1];
      const recentPrices = prices.slice(-20);
      
      const avgFirst = recentPrices.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const avgLast = recentPrices.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const pctChange = ((avgLast - avgFirst) / avgFirst) * 100;
      
      let recommendation, reason, targetPrice;
      
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const supportLevel = Math.round((lastPrice - (lastPrice - minPrice) * 0.3) * 100) / 100;
      const resistanceLevel = Math.round((lastPrice + (maxPrice - lastPrice) * 0.3) * 100) / 100;
      
      const priceChanges = prices.slice(1).map((price, i) => 
        Math.abs((price - prices[i]) / prices[i]) * 100);
      const avgVolatility = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
      const riskRating = avgVolatility < 1 ? "Low" : avgVolatility < 2.5 ? "Medium" : "High";
      
      if (pctChange > 3) {
        recommendation = "Buy";
        targetPrice = Math.round((lastPrice * 1.05) * 100) / 100;
        reason = `The stock shows a positive trend of ${pctChange.toFixed(2)}% recently. Technical analysis indicates potential upside momentum. Consider buying with a target price of ₹${targetPrice}. Support level: ₹${supportLevel}. Current volatility: ${riskRating} risk.`;
      } else if (pctChange < -3) {
        recommendation = "Sell";
        targetPrice = Math.round((lastPrice * 0.95) * 100) / 100;
        reason = `The stock shows a negative trend of ${pctChange.toFixed(2)}% recently. Technical indicators suggest continued downward pressure. Consider selling with a target price of ₹${targetPrice}. Resistance level: ₹${resistanceLevel}. Current volatility: ${riskRating} risk.`;
      } else {
        recommendation = "Hold";
        targetPrice = Math.round(lastPrice * 100) / 100;
        reason = `The stock is showing a neutral trend with ${Math.abs(pctChange).toFixed(2)}% change recently. Price movement appears to be consolidating. Hold with a price target around ₹${targetPrice}. Support: ₹${supportLevel}, Resistance: ₹${resistanceLevel}. Current volatility: ${riskRating} risk.`;
      }
      
      setStockRecommendation({
        recommendation,
        confidence: "Medium",
        reason,
        period,
        targetPrice,
        supportLevel,
        resistanceLevel,
        riskRating,
        trendStrength: Math.abs(pctChange).toFixed(1)
      });
    } finally {
      setRecommendationLoading(false);
    }
  };

  const handleSearch = useCallback(async (searchTerm?: string, period?: string) => {
    const searchStock = searchTerm || stockName;
    const searchPeriod = period || periodWise;
    
    console.log('Search initiated with:', { searchStock, searchPeriod });
    
    if (searchStock) {
      setLoading(true);
      setError("");
      try {
        console.log('Fetching stock details...');
        const data = await fetchStockDetails(searchStock);
        console.log('Stock details received:', data);
        
        console.log('Fetching historical data...');
        const historicalData = await fetchStockData(searchStock, searchPeriod);
        console.log('Historical data received:', historicalData);
        
        setStockData(data);
        setStockPriceData(historicalData.datasets[0].values);
        
        const prices = historicalData.datasets[0].values.map(
          (item: [string, string]) => parseFloat(item[1])
        );
        console.log("Extracted prices:", prices.length);
        
        // Pass the period to the recommendation function
        await fetchStockRecommendation(searchStock, prices, searchPeriod);
        
        initialLoadRef.current = false;
      } catch (err) {
        console.error('Error in handleSearch:', err);
        setError("Failed to fetch stock data: " + err);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please enter a stock symbol");
    }
  }, [stockName, periodWise]);

  const handleSearchClick = () => {
    handleSearch();
  };

  useEffect(() => {
    if (stockName && stockData && !loading && !initialLoadRef.current) {
      console.log('Period changed, refetching data for:', stockName, periodWise);
      const fetchNewData = async () => {
        setLoading(true);
        setError("");
        try {
          console.log('Fetching stock details...');
          const data = await fetchStockDetails(stockName);
          console.log('Stock details received:', data);
          
          console.log('Fetching historical data...');
          const historicalData = await fetchStockData(stockName, periodWise);
          console.log('Historical data received:', historicalData);
          
          setStockData(data);
          setStockPriceData(historicalData.datasets[0].values);
          
          // Also update the recommendation when period changes
          const prices = historicalData.datasets[0].values.map(
            (item: [string, string]) => parseFloat(item[1])
          );
          await fetchStockRecommendation(stockName, prices, periodWise);
        } catch (err) {
          console.error('Error in period change fetch:', err);
          setError("Failed to fetch stock data: " + err);
        } finally {
          setLoading(false);
        }
      };
      fetchNewData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodWise]);

  const checkWatchlistStatus = useCallback(async (symbol: string) => {
    if (!symbol) return;
    
    setWatchlistLoading(true);
    try {
      const isWatchlisted = await checkInWatchlist(userId, symbol);
      setIsInWatchlist(isWatchlisted);
    } catch (error) {
      console.error("Error checking watchlist status:", error);
    } finally {
      setWatchlistLoading(false);
    }
  }, [userId]);

  const handleWatchlistToggle = async () => {
    if (!stockData) return;
    
    if (!isAuthenticated) {
      // Redirect to login if user is not authenticated
      router.push('/Login');
      return;
    }
    
    setWatchlistLoading(true);
    setError(""); // Clear any previous errors
    
    try {
      console.log('Watchlist toggle for:', {
        userId,
        symbol: stockData.symbol || stockName,
        name: stockData.companyName || stockName
      });
      
      if (isInWatchlist) {
        console.log('Stock already in watchlist');
        setError("Stock is already in your watchlist");
        setWatchlistLoading(false);
        return;
      }
      
      // Use the fallback method which will try API first, then localStorage
      const response = await addToWatchlistWithFallback(
        userId,
        stockData.symbol || stockName,
        stockData.companyName || stockName
      );
      
      console.log('Add to watchlist response:', response);
      
      if (response.success) {
        setIsInWatchlist(true);
        // Show success message
        setError(`${stockData.companyName || stockName} added to watchlist`);
      } else {
        setError(`Failed to add to watchlist: ${response.message}`);
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      setError("Failed to connect to watchlist service. Using local storage instead.");
      
      // Fallback to local storage as last resort
      try {
        const response = await addToWatchlistFallback(
          userId,
          stockData.symbol || stockName,
          stockData.companyName || stockName
        );
        
        if (response.success) {
          setIsInWatchlist(true);
          setError(`${stockData.companyName || stockName} added to watchlist (offline mode)`);
        }
      } catch (e) {
        setError("Could not add to watchlist even in offline mode.");
      }
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Update userId when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserId(user.id);
    } else {
      setUserId("");
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (stockData?.symbol) {
      checkWatchlistStatus(stockData.symbol);
    }
  }, [stockData, checkWatchlistStatus]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="relative z-50 px-4 sm:px-6 py-4 backdrop-blur-xl bg-black/20 border-b border-white/10 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <FaSearch className="text-black text-lg sm:text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                MarketSense
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Smart Stock Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={() => router.push('/')}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full font-semibold hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <FaHome className="text-xs sm:text-sm" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={() => router.push('/Portfolio')}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <FaChartPie className="text-xs sm:text-sm" />
              <span className="hidden sm:inline">Portfolio</span>
            </button>
            <button
              onClick={() => router.push('/HoldStock')}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              <span className="sm:hidden">Hold</span>
              <span className="hidden sm:inline">Hold Stock</span>
            </button>
            <button
              onClick={() => router.push('/Watchlist')}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <FaStar className="text-xs sm:text-sm" />
              <span className="hidden sm:inline">Watchlist</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Powered
              </span>
              <br />
              <span className="text-white">Stock Analysis</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4">
              Discover market insights with advanced predictions and real-time data analysis.
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <FaChartLine className="text-cyan-400 text-xl sm:text-2xl" />
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Stock Search & Analysis
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
              <input
                type="text"
                placeholder="Enter stock symbol (e.g., TCS, RELIANCE)"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
                className="lg:col-span-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm text-base sm:text-lg"
              />
              <select
                value={periodWise}
                onChange={(e) => setPeriodWise(e.target.value)}
                className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm text-base sm:text-lg"
              >
                {periodWiseOptions.map((option) => (
                  <option key={option} value={option} className="bg-gray-800 text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSearchClick}
              disabled={loading}
              className="w-full group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:scale-105 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center">
                <FaSearch className="mr-2 sm:mr-3" />
                {loading ? "Analyzing..." : "Analyze Stock"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {loading && (
              <div className="flex items-center justify-center mt-4 sm:mt-6 space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-cyan-400"></div>
                <p className="text-cyan-400 text-sm sm:text-base">Analyzing stock data...</p>
              </div>
            )}
            
            {error && (
              <div className="mt-4 sm:mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <p className="text-red-300 text-center text-sm sm:text-base">{error}</p>
              </div>
            )}
          </div>

          {stockData && !loading && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl">
              {showDetails && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 sm:p-8 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
                    <button
                      className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                      onClick={toggleDetails}
                    >
                      <IoMdClose size={24} />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white pr-8">{stockData.companyName}</h2>
                    <div className="space-y-3 text-gray-300">
                      <p className="text-sm sm:text-base"><strong className="text-cyan-400">Industry:</strong> {stockData.industry}</p>
                      <p className="text-sm sm:text-base leading-relaxed">{stockData.companyProfile.companyDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="backdrop-blur-sm bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-2">Current Price</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <p className="text-2xl sm:text-3xl font-bold text-white">
                        ₹{stockData.currentPrice.NSE}
                      </p>
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium w-fit ${
                        stockData.percentChange > 0 
                          ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}>
                        {stockData.percentChange > 0 ? (
                          <FaArrowUp className="text-xs" />
                        ) : (
                          <FaArrowDown className="text-xs" />
                        )}
                        <span>{Math.abs(stockData.percentChange)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleWatchlistToggle} 
                      disabled={watchlistLoading}
                      className={`p-3 rounded-xl ${isInWatchlist 
                        ? "bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30" 
                        : "bg-white/10 hover:bg-white/20 border-white/20"} 
                        transition-colors border self-start flex items-center justify-center`}
                    >
                      <FaStar size={18} className={`${isInWatchlist ? "text-yellow-400" : "text-gray-400"} sm:text-xl`} />
                      {watchlistLoading && (
                        <div className="ml-1 animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      )}
                    </button>
                    <button 
                      onClick={toggleDetails} 
                      className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20 self-start"
                    >
                      <FaInfoCircle size={18} className="text-cyan-400 sm:text-xl" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-white">Technical Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {stockData.stockTechnicalData.map((item: StockData, index: number) => (
                    <div key={index} className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-gray-400 mb-1">{item.days} Days Avg</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-300">BSE:</span>
                          <span className="text-white font-medium">₹{item.bsePrice}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-300">NSE:</span>
                          <span className="text-white font-medium">₹{item.nsePrice}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stockPriceData.length > 0 && !loading && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Price Chart
              </h3>
              
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="h-64 sm:h-80 lg:h-96">
                  <Line
                    data={{
                      labels: stockPriceData.map(([date]) => date),
                      datasets: [
                        {
                          label: "Stock Price",
                          data: stockPriceData.map(([, price]) => parseFloat(price)),
                          tension: 0.4,
                          fill: true,
                          borderColor: "rgba(6, 182, 212, 1)",
                          backgroundColor: "rgba(6, 182, 212, 0.1)",
                          borderWidth: 3,
                          pointBackgroundColor: "rgba(6, 182, 212, 1)",
                          pointBorderColor: "rgba(255, 255, 255, 0.8)",
                          pointBorderWidth: 2,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: "top",
                          labels: {
                            color: "rgba(255, 255, 255, 0.8)",
                            font: { size: 14, weight: 'bold' }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleFont: { size: 16, weight: 'bold' },
                          bodyFont: { size: 14 },
                          padding: 12,
                          cornerRadius: 6,
                          displayColors: false,
                          callbacks: {
                            label: function(context) {
                              let label = context.dataset.label || '';
                              if (label) {
                                label += ': ';
                              }
                              if (context.parsed.y !== null) {
                                label += '₹' + context.parsed.y.toFixed(2);
                              }
                              return label;
                            },
                            afterLabel: function(context) {
                              const dataIndex = context.dataIndex;
                              const datasetIndex = context.datasetIndex;
                              const data = context.chart.data.datasets[datasetIndex].data;
                              
                              if (dataIndex > 0) {
                                // Ensure we're working with numbers
                                const currentValue = Number(data[dataIndex]);
                                const previousValue = Number(data[dataIndex - 1]);
                                
                                // Only proceed if both values are valid numbers
                                if (!isNaN(currentValue) && !isNaN(previousValue) && previousValue !== 0) {
                                  const change = currentValue - previousValue;
                                  const pctChange = ((change / previousValue) * 100).toFixed(2);
                                  const sign = change >= 0 ? '+' : '';
                                  return `${sign}${change.toFixed(2)} (${sign}${pctChange}% from previous)`;
                                }
                              }
                              return '';
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: "Date",
                            color: "rgba(255, 255, 255, 0.7)",
                            font: { size: 14 }
                          },
                          ticks: { 
                            color: "rgba(255, 255, 255, 0.6)",
                            font: { size: 12 },
                            maxTicksLimit: 8
                          },
                          grid: { color: "rgba(255, 255, 255, 0.1)" }
                        },
                        y: {
                          title: {
                            display: true,
                            text: "Price (₹)",
                            color: "rgba(255, 255, 255, 0.7)",
                            font: { size: 14 }
                          },
                          ticks: { 
                            color: "rgba(255, 255, 255, 0.6)",
                            font: { size: 12 }
                          },
                          grid: { color: "rgba(255, 255, 255, 0.1)" },
                          beginAtZero: false,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {stockData && !loading && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                AI-Powered Recommendation
              </h3>
              
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
                {recommendationLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                    <p className="ml-3 text-cyan-400">Analyzing stock trends...</p>
                  </div>
                ) : stockRecommendation ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className={`px-4 py-2 rounded-lg text-lg font-bold ${
                        stockRecommendation.recommendation === 'Buy' 
                          ? 'bg-green-500/30 text-green-400 border border-green-500/30' 
                          : stockRecommendation.recommendation === 'Sell'
                          ? 'bg-red-500/30 text-red-400 border border-red-500/30'
                          : 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        Recommendation: {stockRecommendation.recommendation}
                      </div>
                      <div className="text-gray-400 text-sm">
                        Confidence: <span className="text-white">{stockRecommendation.confidence}</span>
                        {stockRecommendation.period && <span className="ml-2">({stockRecommendation.period} period)</span>}
                      </div>
                      {stockRecommendation.targetPrice && (
                        <div className="text-white text-sm bg-white/10 px-3 py-1 rounded-lg">
                          Target price: ₹{stockRecommendation.targetPrice}
                        </div>
                      )}
                    </div>

                    {stockRecommendation.supportLevel && stockRecommendation.resistanceLevel && (
                      <div className="my-4 px-2">
                        <div className="text-sm text-white mb-2">Price Range Analysis:</div>
                        <div className="relative h-10 bg-gray-800/50 rounded-lg">
                          {/* Resistance Level */}
                          <div 
                            className="absolute top-0 h-full border-r-2 border-red-400" 
                            style={{ left: '100%' }}
                          >
                            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-6 text-xs text-red-400">
                              Resistance: ₹{Number(stockRecommendation.resistanceLevel).toFixed(2)}
                            </div>
                          </div>
                          
                          {/* Current Price */}
                          {stockData?.currentPrice?.NSE && (
                            <div 
                              className="absolute top-0 h-full border-r-2 border-white" 
                              style={{
                                left: `${(() => {
                                  const currentPrice = Number(stockData.currentPrice.NSE);
                                  const support = Number(stockRecommendation.supportLevel || 0);
                                  const resistance = Number(stockRecommendation.resistanceLevel || support + 1);
                                  const range = resistance - support;
                                  const position = (currentPrice - support) / range * 100;
                                  return Math.min(100, Math.max(0, position));
                                })()}%`
                              }}
                            >
                              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-1 text-xs text-white">
                                Current: ₹{Number(stockData.currentPrice.NSE).toFixed(2)}
                              </div>
                            </div>
                          )}
                          
                          {/* Support Level */}
                          <div 
                            className="absolute top-0 h-full border-r-2 border-green-400" 
                            style={{left: '0%'}}
                          >
                            <div className="absolute top-0 left-0 transform -translate-x-2 -translate-y-6 text-xs text-green-400">
                              Support: ₹{Number(stockRecommendation.supportLevel).toFixed(2)}
                            </div>
                          </div>
                          
                          {/* Target Price */}
                          {stockRecommendation?.targetPrice && (
                            <div 
                              className="absolute top-0 h-full border-r-2 border-cyan-400" 
                              style={{
                                left: `${(() => {
                                  const targetPrice = Number(stockRecommendation.targetPrice);
                                  const support = Number(stockRecommendation.supportLevel || 0);
                                  const resistance = Number(stockRecommendation.resistanceLevel || support + 1);
                                  const range = resistance - support;
                                  const position = (targetPrice - support) / range * 100;
                                  return Math.min(100, Math.max(0, position));
                                })()}%`
                              }}
                            >
                              <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-6 text-xs text-cyan-400">
                                Target: ₹{Number(stockRecommendation.targetPrice).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {stockRecommendation.riskRating && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-sm text-white mb-2">Risk Assessment:</div>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-800/50 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                stockRecommendation.riskRating === 'Low' ? 'bg-green-500 w-1/3' : 
                                stockRecommendation.riskRating === 'Medium' ? 'bg-yellow-500 w-2/3' : 
                                'bg-red-500 w-full'
                              }`}
                            ></div>
                          </div>
                          <span className={`ml-2 text-sm font-medium ${
                            stockRecommendation.riskRating === 'Low' ? 'text-green-400' : 
                            stockRecommendation.riskRating === 'Medium' ? 'text-yellow-400' : 
                            'text-red-400'
                          }`}>
                            {stockRecommendation.riskRating}
                          </span>
                        </div>
                      </div>
                    )}

                    {stockRecommendation.trendStrength && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-sm text-white mb-2">Trend Strength:</div>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-800/50 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                parseFloat(stockRecommendation.trendStrength) < 3 ? 'bg-gray-500' : 
                                stockRecommendation.recommendation === 'Buy' ? 'bg-green-500' : 
                                stockRecommendation.recommendation === 'Sell' ? 'bg-red-500' : 
                                'bg-yellow-500'
                              }`}
                              style={{width: `${Math.min(100, parseFloat(stockRecommendation.trendStrength) * 10)}%`}}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm font-medium text-white">
                            {stockRecommendation.trendStrength}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-gray-300 mt-4">{stockRecommendation.reason}</p>
                    <div className="text-sm text-gray-400 mt-2">
                      This recommendation is based on technical analysis of recent price movements and trends.
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No recommendation available for this stock.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
};

export default StockSearchs;
