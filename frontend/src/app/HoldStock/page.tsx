"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import fetchStockData from "../stockDataAPI";
import fetchStockDetails from "../stockNameAPI";
import { FaChartLine, FaThLarge, FaClock, FaRupeeSign, FaHome, FaSearch, FaHeart, FaTrophy, FaSpinner, FaBullseye, FaArrowUp, FaArrowDown, FaChartPie, FaShieldAlt, FaLightbulb, FaChartBar, FaInfoCircle, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const HoldStock = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState("OPEN");
  const [form, setForm] = useState({
    stock: "",
    price: "",
    period: ""
  });
  const [result, setResult] = useState<string | null>(null);
  const [targetPrices, setTargetPrices] = useState<{short_term?: number, medium_term?: number, long_term?: number} | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [stockName, setStockName] = useState<string>("");
  const [profitLoss, setProfitLoss] = useState<{amount: number, percentage: number} | null>(null);

  useEffect(() => {
    setIsClient(true);
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
        color: ['#FFD700', '#FDB931', '#FFBF00', '#F59E0B', '#D97706', '#B45309'][Math.floor(Math.random() * 6)],
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
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.1 * (1 - distance / 100)})`;
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
      
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.03)';
      ctx.lineWidth = 0.5;
      const gridSize = 60;
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
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
      gradient.addColorStop(0.5, 'rgba(218, 165, 32, 0.08)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
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

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getPeriodWiseFromDays = (days: number) => {
    if (days <= 30) return "1m";
    if (days <= 180) return "6m";
    if (days <= 365) return "1yr";
    if (days <= 3 * 365) return "3yr";
    if (days <= 5 * 365) return "5yr";
    if (days <= 10 * 365) return "10yr";
    return "max";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setTargetPrices(null);
    setRecommendation(null);
    setCurrentPrice(null);
    setProfitLoss(null);
    setStockName("");
    
    try {
      const periodWise = getPeriodWiseFromDays(parseInt(form.period, 10));
      const historical = await fetchStockData(form.stock, periodWise);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prices = historical?.data?.map((item: any) => item.close) || [];
      
      const stockDetails = await fetchStockDetails(form.stock);
      const fetchedPrice = stockDetails?.currentPrice?.NSE || stockDetails?.currentPrice?.BSE || 0;
      setCurrentPrice(fetchedPrice);
      setStockName(stockDetails?.info?.shortName || form.stock);
      
      // Calculate profit/loss
      const buyPrice = parseFloat(form.price);
      const plAmount = fetchedPrice - buyPrice;
      const plPercentage = ((plAmount / buyPrice) * 100);
      setProfitLoss({ amount: plAmount, percentage: plPercentage });
      
      const response = await fetch(`https://stockmarketanalysis-1.onrender.com/hold-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: form.stock,
          buy_price: buyPrice,
          current_price: fetchedPrice,
          holding_period: parseInt(form.period, 10),
          prices: prices
        })
      });
      const data = await response.json();
      setResult(data.advice || "No advice returned.");
      setTargetPrices(data.target_prices || null);
      setRecommendation(data.recommendation || null);
    } catch (error) {
      setResult("Error fetching recommendation."+error);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <header className="relative z-50 px-6 py-4 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <FaHeart className="text-black text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Hold Stock
              </h1>
              <p className="text-xs text-gray-400">Smart Investment Advice</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className={`w-2 h-2 rounded-full ${marketStatus === 'OPEN' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium">{marketStatus}</span>
            </div>
            <div className="text-sm text-gray-400">
              {currentTime.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <button
              onClick={() => router.push("/Login")}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 transform hover:scale-105"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      <nav className="relative z-40 backdrop-blur-xl bg-black/10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <FaHome className="text-cyan-400" />
              <span className="hidden sm:inline text-sm">Home</span>
            </button>
            <button
              onClick={() => router.push("/StockSearchs")}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <FaSearch className="text-yellow-400" />
              <span className="hidden sm:inline text-sm">Stock Search</span>
            </button>
            <button
              onClick={() => router.push("/ActiveStocks")}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <FaChartLine className="text-orange-400" />
              <span className="hidden sm:inline text-sm">Active Stocks</span>
            </button>
            <button
              onClick={() => router.push("/Portfolio")}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <FaChartPie className="text-emerald-400" />
              <span className="hidden sm:inline text-sm">Portfolio</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 backdrop-blur-sm mb-8 shadow-lg">
              <FaShieldAlt className="text-yellow-400 mr-3 text-lg" />
              <span className="text-sm font-semibold bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
                AI-Powered Investment Advisory
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8">
              <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-lg">
                Hold or Sell?
              </span>
              <br />
              <span className="text-white drop-shadow-md">Make Smarter Decisions</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-6">
              Get data-driven recommendations on your stock investments with AI-powered analysis and target price projections.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
              <div className="flex items-center space-x-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <FaArrowUp className="text-green-400" />
                <span className="text-sm text-gray-300">Market Analysis</span>
              </div>
              <div className="flex items-center space-x-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <FaLightbulb className="text-yellow-400" />
                <span className="text-sm text-gray-300">Smart Insights</span>
              </div>
              <div className="flex items-center space-x-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <FaChartBar className="text-blue-400" />
                <span className="text-sm text-gray-300">Price Targets</span>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-10 mb-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FaBullseye className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                      Investment Analysis
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Enter your stock details for personalized advice</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3 group">
                      <label className="flex items-center text-sm font-bold text-gray-200 group-hover:text-yellow-400 transition-colors duration-300">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-3">
                          <FaChartLine className="text-yellow-400" />
                        </div>
                        Stock Symbol
                      </label>
                      <input
                        type="text"
                        name="stock"
                        value={form.stock}
                        onChange={handleChange}
                        placeholder="e.g., RELIANCE, TCS"
                        className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 hover:border-yellow-400/50 text-lg font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-3 group">
                      <label className="flex items-center text-sm font-bold text-gray-200 group-hover:text-green-400 transition-colors duration-300">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                          <FaRupeeSign className="text-green-400" />
                        </div>
                        Buy Price (₹)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="Purchase price"
                        className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-400/50 text-lg font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-3 group">
                      <label className="flex items-center text-sm font-bold text-gray-200 group-hover:text-blue-400 transition-colors duration-300">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                          <FaClock className="text-blue-400" />
                        </div>
                        Holding Period (Days)
                      </label>
                      <input
                        type="number"
                        name="period"
                        value={form.period}
                        onChange={handleChange}
                        placeholder="Days held"
                        className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400/50 text-lg font-medium"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full group px-10 py-5 bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-yellow-500/40 transition-all duration-500 transform hover:scale-[1.02] relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <FaSpinner className="mr-3 animate-spin text-2xl" />
                          <span className="flex flex-col items-start">
                            <span>Analyzing Your Investment</span>
                            <span className="text-xs font-normal text-yellow-200">Please wait while we process...</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <FaThLarge className="mr-3 text-2xl" />
                          Get Expert Investment Advice
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-700 via-amber-700 to-yellow-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </form>
              </div>
            </div>

            {result && (
              <div className="space-y-8 animate-fadeIn">
                {/* Stock Overview Card */}
                {currentPrice && (
                  <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-1">{stockName || form.stock}</h3>
                        <p className="text-gray-400 text-sm">Stock Symbol: {form.stock}</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <FaChartLine className="text-3xl text-white" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <FaRupeeSign className="text-blue-400" />
                          <p className="text-sm text-gray-400 font-medium">Buy Price</p>
                        </div>
                        <p className="text-3xl font-bold text-white">₹{parseFloat(form.price).toFixed(2)}</p>
                      </div>
                      
                      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <FaArrowUp className="text-green-400" />
                          <p className="text-sm text-gray-400 font-medium">Current Price</p>
                        </div>
                        <p className="text-3xl font-bold text-white">₹{currentPrice.toFixed(2)}</p>
                      </div>
                      
                      {profitLoss && (
                        <div className={`backdrop-blur-sm border-2 rounded-2xl p-6 ${profitLoss.amount >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                          <div className="flex items-center space-x-2 mb-3">
                            {profitLoss.amount >= 0 ? (
                              <FaArrowUp className="text-green-400" />
                            ) : (
                              <FaArrowDown className="text-red-400" />
                            )}
                            <p className="text-sm text-gray-400 font-medium">Profit/Loss</p>
                          </div>
                          <p className={`text-3xl font-bold ${profitLoss.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ₹{Math.abs(profitLoss.amount).toFixed(2)}
                          </p>
                          <p className={`text-sm font-semibold mt-1 ${profitLoss.amount >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {profitLoss.amount >= 0 ? '+' : '-'}{Math.abs(profitLoss.percentage).toFixed(2)}%
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 flex items-center space-x-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                      <FaInfoCircle className="text-blue-400" />
                      <p className="text-sm text-gray-300">
                        You&apos;ve been holding this stock for <span className="font-bold text-white">{form.period} days</span>
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Recommendation Card */}
                <div className={`backdrop-blur-xl border-2 rounded-3xl p-10 shadow-2xl relative overflow-hidden ${
                  recommendation === "Hold" 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/40' 
                    : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/40'
                }`}>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-2xl ${
                        recommendation === "Hold" 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      }`}>
                        {recommendation === "Hold" ? (
                          <FaCheckCircle className="text-4xl text-white" />
                        ) : (
                          <FaExclamationTriangle className="text-4xl text-white" />
                        )}
                      </div>
                      
                      <h3 className="text-3xl font-bold mb-4 text-white">AI Investment Recommendation</h3>
                      
                      <div className="inline-flex items-center px-8 py-4 rounded-2xl bg-white/15 border-2 border-white/30 backdrop-blur-sm shadow-lg mb-6">
                        <span className={`text-4xl font-extrabold ${
                          recommendation === "Hold" ? 'text-green-300' : 'text-yellow-300'
                        }`}>
                          {result.replace('Recommendation: ', '')}
                        </span>
                      </div>
                      
                      {recommendation === "Hold" ? (
                        <p className="text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
                          Based on our analysis, we recommend <span className="font-bold text-green-300">holding</span> this stock. 
                          The market indicators and price projections suggest continued growth potential.
                        </p>
                      ) : (
                        <p className="text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
                          Based on our analysis, you may want to consider <span className="font-bold text-yellow-300">selling</span> this stock. 
                          Market conditions indicate it might be a good time to realize your gains or minimize losses.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Prices Card */}
                {recommendation === "Hold" && targetPrices && (
                  <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-3xl p-10 shadow-2xl">
                    <div className="text-center mb-10">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full mb-6 shadow-2xl">
                        <FaBullseye className="text-3xl text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-3">Target Price Projections</h3>
                      <p className="text-gray-300 text-lg">AI-powered price targets based on comprehensive market analysis</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {targetPrices.short_term && (
                        <div className="backdrop-blur-sm bg-white/10 border-2 border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:border-blue-400/40 transition-all duration-300 group hover:scale-105 transform">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-300">
                              <FaClock className="text-white text-2xl" />
                            </div>
                            <h4 className="text-xl font-bold text-blue-400 mb-2">Short Term</h4>
                            <p className="text-xs text-gray-400 mb-5 font-medium">1-3 months horizon</p>
                            <div className="text-4xl font-extrabold text-white mb-4 drop-shadow-lg">₹{targetPrices.short_term}</div>
                            <div className="flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20">
                              {targetPrices.short_term > parseFloat(form.price) ? (
                                <>
                                  <FaArrowUp className="text-green-400 text-xl" />
                                  <span className="text-lg font-bold text-green-400">
                                    +{((targetPrices.short_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                                  </span>
                                </>
                              ) : (
                                <>
                                  <FaArrowDown className="text-red-400 text-xl" />
                                  <span className="text-lg font-bold text-red-400">
                                    {((targetPrices.short_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {targetPrices.medium_term && (
                        <div className="backdrop-blur-sm bg-white/10 border-2 border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:border-yellow-400/40 transition-all duration-300 group hover:scale-105 transform">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl group-hover:shadow-yellow-500/50 transition-all duration-300">
                              <FaChartLine className="text-white text-2xl" />
                            </div>
                            <h4 className="text-xl font-bold text-yellow-400 mb-2">Medium Term</h4>
                            <p className="text-xs text-gray-400 mb-5 font-medium">3-6 months horizon</p>
                            <div className="text-4xl font-extrabold text-white mb-4 drop-shadow-lg">₹{targetPrices.medium_term}</div>
                            <div className="flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20">
                              {targetPrices.medium_term > parseFloat(form.price) ? (
                                <>
                                  <FaArrowUp className="text-green-400 text-xl" />
                                  <span className="text-lg font-bold text-green-400">
                                    +{((targetPrices.medium_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                                  </span>
                                </>
                              ) : (
                                <>
                                  <FaArrowDown className="text-red-400 text-xl" />
                                  <span className="text-lg font-bold text-red-400">
                                    {((targetPrices.medium_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {targetPrices.long_term && (
                        <div className="backdrop-blur-sm bg-white/10 border-2 border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:border-green-400/40 transition-all duration-300 group hover:scale-105 transform">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl group-hover:shadow-green-500/50 transition-all duration-300">
                              <FaTrophy className="text-white text-2xl" />
                            </div>
                            <h4 className="text-xl font-bold text-green-400 mb-2">Long Term</h4>
                            <p className="text-xs text-gray-400 mb-5 font-medium">6+ months horizon</p>
                            <div className="text-4xl font-extrabold text-white mb-4 drop-shadow-lg">₹{targetPrices.long_term}</div>
                            <div className="flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20">
                              {targetPrices.long_term > parseFloat(form.price) ? (
                                <>
                                  <FaArrowUp className="text-green-400 text-xl" />
                                  <span className="text-lg font-bold text-green-400">
                                    +{((targetPrices.long_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                                  </span>
                                </>
                              ) : (
                                <>
                                  <FaArrowDown className="text-red-400 text-xl" />
                                  <span className="text-lg font-bold text-red-400">
                                    {((targetPrices.long_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-start space-x-3">
                        <FaLightbulb className="text-yellow-400 text-xl mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="text-lg font-bold text-white mb-2">Investment Insight</h4>
                          <p className="text-gray-300 leading-relaxed">
                            These target prices are calculated using advanced AI algorithms that analyze historical price patterns, 
                            market trends, volatility, and multiple technical indicators. Remember that all investments carry risk, 
                            and past performance doesn&apos;t guarantee future results. Always do your own research and consider 
                            consulting with a financial advisor.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-24 px-6 py-12 border-t border-white/10 backdrop-blur-xl bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center">
                <FaHeart className="text-black text-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                MarketSense
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <FaShieldAlt className="text-yellow-400 text-sm" />
                <span className="text-sm text-gray-400">Secure & Reliable</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <FaLightbulb className="text-yellow-400 text-sm" />
                <span className="text-sm text-gray-400">AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <FaArrowUp className="text-green-400 text-sm" />
                <span className="text-sm text-gray-400">Real-time Analysis</span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
              Professional investment advisory powered by advanced AI analytics and real-time market data. 
              Make informed decisions with confidence.
            </p>
            
            <div className="pt-6 border-t border-white/10 w-full">
              <p className="text-gray-500 text-sm">
                © 2025 MarketSense. All rights reserved. Investment advice is for educational purposes only.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HoldStock;
