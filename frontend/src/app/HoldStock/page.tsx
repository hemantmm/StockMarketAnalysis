"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import fetchStockData from "../stockDataAPI";
import fetchStockDetails from "../stockNameAPI";
import { FaChartLine, FaThLarge, FaClock, FaRupeeSign, FaHome, FaSearch, FaHeart, FaTrophy, FaSpinner, FaBullseye, FaArrowUp, FaArrowDown, FaChartPie } from "react-icons/fa";

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
        color: ['#a855f7', '#ec4899', '#f97316', '#10b981', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)],
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
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 * (1 - distance / 100)})`;
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
      
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.03)';
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
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
      gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.08)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
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
    try {
      const periodWise = getPeriodWiseFromDays(parseInt(form.period, 10));
      const historical = await fetchStockData(form.stock, periodWise);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prices = historical?.data?.map((item: any) => item.close) || [];
      
      const stockDetails = await fetchStockDetails(form.stock);
      const currentPrice = stockDetails?.currentPrice?.NSE || stockDetails?.currentPrice?.BSE || 0;
      
      const response = await fetch(`https://stockmarketanalysis-1.onrender.com/hold-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: form.stock,
          buy_price: parseFloat(form.price),
          current_price: currentPrice,
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
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <FaHeart className="text-white text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
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
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
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
              <FaSearch className="text-purple-400" />
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
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm mb-6">
              <FaHeart className="text-purple-400 mr-2 animate-pulse" />
              <span className="text-sm font-medium">Smart Investment Advisory</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Hold or Sell?
              </span>
              <br />
              <span className="text-white">Get Expert Advice</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Get recommendations on whether to hold, buy more, or sell your stock investments. 
              Make informed decisions with data-driven insights and target price projections.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <FaBullseye className="text-purple-400 text-2xl" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Investment Analysis
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-200">
                      <FaChartLine className="mr-2 text-purple-400" />
                      Stock Symbol
                    </label>
                    <input
                      type="text"
                      name="stock"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="e.g., RELIANCE, TCS, INFY"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-200">
                      <FaRupeeSign className="mr-2 text-green-400" />
                      Buy Price (₹)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="Your purchase price"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-200">
                      <FaClock className="mr-2 text-blue-400" />
                      Holding Period (Days)
                    </label>
                    <input
                      type="number"
                      name="period"
                      value={form.period}
                      onChange={handleChange}
                      placeholder="How long held?"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-105 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <FaSpinner className="mr-3 animate-spin" />
                        Analyzing Investment...
                      </>
                    ) : (
                      <>
                        <FaThLarge className="mr-3" />
                        Get Investment Advice
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>
            </div>

            {result && (
              <div className="space-y-6 animate-fadeIn">
                <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-3xl p-8 shadow-2xl">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-6">
                      <FaChartLine className="text-2xl text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Investment Recommendation</h3>
                    <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                      <span className="text-3xl font-bold text-white">{result.replace('Recommendation: ', '')}</span>
                    </div>
                  </div>
                </div>

                {recommendation === "Hold" && targetPrices && (
                  <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
                        <FaBullseye className="text-2xl text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Target Price Projections</h3>
                      <p className="text-gray-300 mt-2">Potential price targets based on market analysis</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {targetPrices.short_term && (
                        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <FaClock className="text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-blue-400 mb-2">Short Term</h4>
                            <p className="text-xs text-gray-400 mb-3">1-3 months</p>
                            <div className="text-3xl font-bold text-white mb-2">₹{targetPrices.short_term}</div>
                            <div className="flex items-center justify-center space-x-2">
                              {targetPrices.short_term > parseFloat(form.price) ? (
                                <FaArrowUp className="text-green-400" />
                              ) : (
                                <FaArrowDown className="text-red-400" />
                              )}
                              <span className={`text-sm font-semibold ${
                                targetPrices.short_term > parseFloat(form.price) ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {((targetPrices.short_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {targetPrices.medium_term && (
                        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <FaChartLine className="text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-yellow-400 mb-2">Medium Term</h4>
                            <p className="text-xs text-gray-400 mb-3">3-6 months</p>
                            <div className="text-3xl font-bold text-white mb-2">₹{targetPrices.medium_term}</div>
                            <div className="flex items-center justify-center space-x-2">
                              {targetPrices.medium_term > parseFloat(form.price) ? (
                                <FaArrowUp className="text-green-400" />
                              ) : (
                                <FaArrowDown className="text-red-400" />
                              )}
                              <span className={`text-sm font-semibold ${
                                targetPrices.medium_term > parseFloat(form.price) ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {((targetPrices.medium_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {targetPrices.long_term && (
                        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <FaTrophy className="text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-green-400 mb-2">Long Term</h4>
                            <p className="text-xs text-gray-400 mb-3">6+ months</p>
                            <div className="text-3xl font-bold text-white mb-2">₹{targetPrices.long_term}</div>
                            <div className="flex items-center justify-center space-x-2">
                              {targetPrices.long_term > parseFloat(form.price) ? (
                                <FaArrowUp className="text-green-400" />
                              ) : (
                                <FaArrowDown className="text-red-400" />
                              )}
                              <span className={`text-sm font-semibold ${
                                targetPrices.long_term > parseFloat(form.price) ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {((targetPrices.long_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-20 px-6 py-8 border-t border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FaHeart className="text-purple-400" />
            <span className="text-sm text-gray-400">Smart investment decisions with some insights</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 MarketSense. Professional investment advisory powered by advanced analytics.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HoldStock;
