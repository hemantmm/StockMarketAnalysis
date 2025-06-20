"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import fetchStockDetails from "../stockNameAPI";
import { FaInfoCircle, FaArrowUp, FaArrowDown, FaRocket, FaSearch, FaChartLine, FaHome, FaChartPie, FaStar } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import fetchStockData from "../stockDataAPI";
import { addToWatchlist, checkInWatchlist } from "../watchlistAPI";
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
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const [isPredicted, setIsPredicted] = useState(false);
  const [userId, setUserId] = useState<string>("user1");
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(false);

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

  const predictPrice = async (pastPrices: number[]): Promise<number | null> => {
    try {
      const res = await fetch("https://stockmarketanalysis-1.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices: pastPrices }),
      });

      if (!res.ok) {
        console.error("Server error:", res.statusText);
        return null;
      }

      const data = await res.json();
      if (data.prediction_price && typeof data.prediction_price === "number") {
        return data.prediction_price;
      } else {
        console.error("Invalid prediction format:", data);
        return null;
      }
    } catch (error) {
      console.error("Prediction error:", error);
      return null;
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

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
    
    setWatchlistLoading(true);
    try {
      console.log('Watchlist toggle for:', {
        userId,
        symbol: stockData.symbol || stockName,
        name: stockData.companyName || stockName
      });
      
      if (isInWatchlist) {
        // Remove from watchlist logic would go here if needed
        // For now we only implement adding to watchlist
        console.log('Stock already in watchlist');
      } else {
        // Add to watchlist
        const response = await addToWatchlist(
          userId,
          stockData.symbol || stockName,
          stockData.companyName || stockName
        );
        console.log('Add to watchlist response:', response);
        if (response.success) {
          setIsInWatchlist(true);
        } else {
          setError(`Failed to add to watchlist: ${response.message}`);
        }
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      setError("Failed to connect to watchlist service. Make sure the backend is running.");
    } finally {
      setWatchlistLoading(false);
    }
  };

  const toggleDetails = () => setShowDetails(!showDetails);

  const handleSearch = useCallback(async (searchTerm?: string, period?: string) => {
    const searchStock = searchTerm || stockName;
    const searchPeriod = period || periodWise;
    
    console.log('Search initiated with:', { searchStock, searchPeriod });
    
    if (searchStock) {
      setLoading(true);
      setError("");
      setPredictedPrice(null);
      setIsPredicted(false);
      try {
        console.log('Fetching stock details...');
        const data = await fetchStockDetails(searchStock);
        console.log('Stock details received:', data);
        
        console.log('Fetching historical data...');
        const historicalData = await fetchStockData(searchStock, searchPeriod);
        console.log('Historical data received:', historicalData);
        
        setStockData(data);
        setStockPriceData(historicalData.datasets[0].values);
        initialLoadRef.current = false;
        
        // Check if this stock is in the watchlist
        await checkWatchlistStatus(data.symbol || searchStock);
      } catch (err) {
        console.error('Error in handleSearch:', err);
        setError("Failed to fetch stock data: " + err);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please enter a stock symbol");
    }
  }, [stockName, periodWise, checkWatchlistStatus]);

  const handleSearchClick = () => {
    handleSearch();
  };

  useEffect(() => {
    if (stockName && stockData && !loading && !initialLoadRef.current) {
      console.log('Period changed, refetching data for:', stockName, periodWise);
      const fetchNewData = async () => {
        setLoading(true);
        setError("");
        setPredictedPrice(null);
        setIsPredicted(false);
        try {
          console.log('Fetching stock details...');
          const data = await fetchStockDetails(stockName);
          console.log('Stock details received:', data);
          
          console.log('Fetching historical data...');
          const historicalData = await fetchStockData(stockName, periodWise);
          console.log('Historical data received:', historicalData);
          
          setStockData(data);
          setStockPriceData(historicalData.datasets[0].values);
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
                      className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                        isInWatchlist 
                          ? "bg-yellow-500/80 text-black" 
                          : "bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300"
                      } border ${isInWatchlist ? "border-yellow-500" : "border-yellow-600/50"}`}
                    >
                      <FaStar className="mr-2" />
                      {watchlistLoading ? "..." : isInWatchlist ? "Added" : "Watchlist"}
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
                      plugins: {
                        legend: {
                          display: true,
                          position: "top",
                          labels: {
                            color: "rgba(255, 255, 255, 0.8)",
                            font: { size: 14 }
                          }
                        },
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

              <div className="flex flex-col items-center space-y-4 sm:space-y-6">
                <button
                  disabled={isPredicted}
                  onClick={async () => {
                    const priceArray = stockPriceData.map(([, price]) => parseFloat(price));
                    const prediction = await predictPrice(priceArray);

                    if (typeof prediction === "number" && !isNaN(prediction)) {
                      setPredictedPrice(prediction);
                      setIsPredicted(true);
                    } else {
                      console.error("Prediction failed or returned invalid value:", prediction);
                      setPredictedPrice(null);
                    }
                  }}
                  className={`group px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-500 transform hover:scale-105 relative overflow-hidden w-full sm:w-auto ${
                    isPredicted 
                      ? "bg-green-600 cursor-default" 
                      : "bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-2xl hover:shadow-purple-500/25"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <FaRocket className="mr-2 sm:mr-3" />
                    {isPredicted ? "Prediction Complete" : "Generate Prediction"}
                  </span>
                  {!isPredicted && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>

                {typeof predictedPrice === "number" && !isNaN(predictedPrice) && (
                  <div className="backdrop-blur-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 sm:p-8 text-center w-full">
                    <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-2">Predicted Future Price</h3>
                    <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      ₹{predictedPrice.toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">Based on historical data analysis</p>
                  </div>
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
