/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaChartLine, FaHome, FaSearch, FaRocket, FaSyncAlt, FaFire, FaTrophy, FaChartPie, FaArrowUp, FaBolt, FaEye } from "react-icons/fa";
import activeTrendingStocks from "../ActiveStockAPI";
import UserMenu from "../components/UserMenu";

type ActiveStocks = {
  company: string;
  price?: number;
  currentPrice?: number;
};

const ActiveStocks = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [activeStocks, setActiveStocks] = useState<ActiveStocks[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState("OPEN");
  const [user, setUser] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const fetchActiveStocks = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const response = await activeTrendingStocks();
      setActiveStocks(response || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching active stocks:", error);
      setActiveStocks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveStocks();
  }, []);

  const handleRefresh = () => {
    fetchActiveStocks();
  };

  // Add useEffect to check login status
  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setUser(userObj);
        // Optionally: localStorage.setItem('userId', userObj.id || userObj._id || userObj.userId || '');
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

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

      <header className="relative z-50 px-4 sm:px-6 py-4 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <FaFire className="text-white text-lg sm:text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                Active Stocks
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Live Market Movers</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <div className="flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-full bg-white/5 border border-white/10">
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
            {user ? (
              <UserMenu user={user} />
            ) : (
              <button
                onClick={() => router.push('/Login')}
                aria-label="Login"
                className="px-4 lg:px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 text-sm"
              >
                Login
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              title={refreshing ? "Refreshing..." : "Refresh"}
              className="px-3 lg:px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center space-x-2 text-sm"
            >
              <FaSyncAlt className={`${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Refresh</span>
            </button>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              title={refreshing ? "Refreshing..." : "Refresh"}
              className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg"
            >
              <FaSyncAlt className={`${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <nav className="relative z-40 backdrop-blur-xl bg-black/10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => router.push("/")}
              aria-label="Home"
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 shrink-0"
            >
              <FaHome className="text-cyan-400" />
              <span className="hidden sm:inline text-sm">Home</span>
            </button>
            <button
              onClick={() => router.push("/StockSearchs")}
              aria-label="Stock Search"
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 shrink-0"
            >
              <FaSearch className="text-purple-400" />
              <span className="hidden sm:inline text-sm">Search</span>
            </button>
            <button
              onClick={() => router.push("/Portfolio")}
              aria-label="Portfolio"
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 shrink-0"
            >
              <FaChartPie className="text-emerald-400" />
              <span className="hidden sm:inline text-sm">Portfolio</span>
            </button>
            <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 shrink-0">
              <FaRocket className="text-orange-400" />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 backdrop-blur-sm mb-4 sm:mb-6">
              <FaFire className="text-orange-400 mr-2 animate-pulse" />
              <span className="text-sm font-medium">Live Market Data</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                Most Active
              </span>
              <br />
              <span className="text-white">Stocks Today</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
              Track the most actively traded stocks in real-time. Stay ahead of market trends 
              and discover high-volume trading opportunities.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
            <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <FaBolt className="text-white text-sm sm:text-lg" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Total Active</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{activeStocks.length}</p>
                </div>
              </div>
            </div>
            
            <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <FaArrowUp className="text-white text-sm sm:text-lg" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Market</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{marketStatus}</p>
                </div>
              </div>
            </div>
            
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <FaEye className="text-white text-sm sm:text-lg" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Exchange</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">NSE</p>
                </div>
              </div>
            </div>
            
            <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <FaSyncAlt className="text-white text-sm sm:text-lg" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Updated</p>
                  <p className="text-lg sm:text-xl font-bold text-white">
                    {lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  Trending Now
                </h2>
                <p className="text-gray-400 text-sm mt-1">High volume traded stocks</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Refresh Data"
                title={refreshing ? "Refreshing..." : "Refresh Data"}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <FaSyncAlt className={`${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-48 sm:h-64">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-orange-500/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
                    <FaFire className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-orange-400 text-xl sm:text-2xl" />
                  </div>
                  <span className="text-base sm:text-lg text-gray-400">Loading active stocks...</span>
                </div>
              </div>
            ) : activeStocks.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <FaChartLine className="text-3xl sm:text-4xl text-gray-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No Active Stocks Found</h3>
                <p className="text-gray-500 text-sm sm:text-base">Try refreshing the data or check your connection.</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 sm:mt-6 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {activeStocks.map((stock, index) => (
                  <div
                    key={stock.company || index}
                    className="group relative backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:bg-white/10 hover:border-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden"
                    title={`View details for ${stock.company || "Unknown"}`}
                    onClick={() => router.push(`/StockSearchs?stock=${encodeURIComponent(stock.company || "")}`)}
                  >
                    {/* Rank Badge */}
                    <div className={`absolute top-3 right-3 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r ${getRankBadgeColor(index)} rounded-full flex items-center justify-center shadow-lg`}>
                      {getRankIcon(index)}
                    </div>

                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-red-500/0 to-pink-500/0 group-hover:from-orange-500/5 group-hover:via-red-500/5 group-hover:to-pink-500/5 transition-all duration-500 rounded-xl sm:rounded-2xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex-1 pr-8">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-400 font-medium">LIVE</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                            {stock.company || <span className="text-gray-500">Unknown</span>}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Current Price</p>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            ₹{typeof stock.price === "number" && stock.price > 0
                              ? stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                              : typeof stock.currentPrice === "number" && stock.currentPrice > 0
                              ? stock.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Activity indicator bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>Activity Level</span>
                          <span className="text-orange-400">{Math.max(100 - index * 5, 50)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(100 - index * 5, 50)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/StockSearchs?stock=${encodeURIComponent(stock.company || "")}`);
                        }}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500 hover:to-red-500 border border-orange-500/30 hover:border-transparent rounded-xl text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 group-hover:shadow-lg group-hover:shadow-orange-500/20"
                        title={`Analyze ${stock.company || "Unknown"}`}
                      >
                        <FaChartLine className="text-orange-400 group-hover:text-white transition-colors" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-16 sm:mt-20 px-4 sm:px-6 py-6 sm:py-8 border-t border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <FaTrophy className="text-orange-400" />
            <span className="text-xs sm:text-sm text-gray-400">Real-time market data & advanced analytics</span>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm">
            © 2025 MarketSense Active Stocks. Data updated in real-time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ActiveStocks;

const getRankBadgeColor = (index: number) => {
  if (index === 0) return "from-yellow-400 to-amber-500";
  if (index === 1) return "from-gray-300 to-gray-400";
  if (index === 2) return "from-amber-600 to-amber-700";
  return "from-gray-600 to-gray-700";
};

const getRankIcon = (index: number) => {
  if (index < 3) return <FaTrophy className="text-white text-xs" />;
  return <span className="text-white text-xs font-bold">#{index + 1}</span>;
};
