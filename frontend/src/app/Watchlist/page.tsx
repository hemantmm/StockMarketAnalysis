/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaHome, FaSearch, FaChartPie, FaStar, FaSyncAlt, FaTrash, FaInfoCircle, FaDownload, FaUpload, FaChartLine } from "react-icons/fa";
import { getUserWatchlist, WatchlistItem, removeFromWatchlist } from "../watchlistAPI";
import fetchStockDetails from "../stockNameAPI";
import UserMenu from "../components/UserMenu";

const WatchlistPage = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [watchlistData, setWatchlistData] = useState<Record<string, any>>({});
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [showRemoveAllConfirm, setShowRemoveAllConfirm] = useState(false);

  // Animated background effect
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
      type: "currency" | "graph" | "dot";
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
          type: ["currency", "graph", "dot"][Math.floor(Math.random() * 3)] as "currency" | "graph" | "dot",
        });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    const drawParticle = (particle: (typeof particles)[0]) => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;

      if (particle.type === "currency") {
        ctx.font = `${particle.size * 3}px monospace`;
        const symbols = ["₹", "$", "€", "¥", "£", "₿"];
        ctx.fillText(symbols[Math.floor(Math.random() * symbols.length)], particle.x, particle.y);
      } else if (particle.type === "graph") {
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
      
      // Draw grid
      ctx.strokeStyle = "rgba(0, 255, 255, 0.03)";
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

      // Mouse glow effect
      const gradient = ctx.createRadialGradient(
        mouseRef.current.x, mouseRef.current.y, 0,
        mouseRef.current.x, mouseRef.current.y, 150
      );
      gradient.addColorStop(0, "rgba(255, 215, 0, 0.15)");
      gradient.addColorStop(0.5, "rgba(255, 165, 0, 0.05)");
      gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        drawParticle(p);
        
        // Connect nearby particles
        for (let i = index + 1; i < particles.length; i++) {
          const p2 = particles[i];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 215, 0, ${(1 - distance / 100) * 0.15})`;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        const id = userData.id || userData._id || userData.userId;
        if (id) {
          setUserId(id);
        } else {
          setError("User authentication issue. Please log in again.");
        }
      } catch (e) {
        console.error('Error parsing user data', e);
        setError("Authentication error. Please log in again.");
      }
    } else {
      setError("Please log in to view your watchlist");
    }
  }, []);

  const fetchWatchlist = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setRefreshing(true);
    try {
      const items = await getUserWatchlist(userId);
      setWatchlistItems(items);
      
      if (items.length > 0) {
        const stockData: Record<string, any> = {};
        for (const item of items) {
          try {
            const data = await fetchStockDetails(item.stock_symbol);
            stockData[item.stock_symbol] = data;
          } catch (error) {
            console.error(`Error fetching details for ${item.stock_symbol}:`, error);
            stockData[item.stock_symbol] = {
              symbol: item.stock_symbol,
              companyName: item.stock_name,
              currentPrice: { NSE: 'N/A' }
            };
          }
        }
        setWatchlistData(stockData);
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      setError("Could not connect to watchlist service.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchWatchlist();
    }
  }, [userId]);

  const handleRemoveFromWatchlist = async (symbol: string, name: string) => {
    try {
      await removeFromWatchlist(userId, symbol, name);
      fetchWatchlist();
    } catch (error) {
      setError("Error removing from watchlist.");
      console.error("Error removing from watchlist:", error);
    }
  };

  const handleRemoveAll = async () => {
    setShowRemoveAllConfirm(false);
    setRemovingAll(true);
    try {
      for (const item of watchlistItems) {
        await removeFromWatchlist(userId, item.stock_symbol, item.stock_name);
      }
      fetchWatchlist();
    } catch {
      setError("Error removing all items from watchlist.");
    } finally {
      setRemovingAll(false);
    }
  };

  const goToStockDetails = (symbol: string) => {
    router.push(`/StockSearchs?stock=${symbol}`);
  };

  const handleExportWatchlist = async () => {
    if (!userId) return;
    const res = await fetch(`/api/export/watchlist/${userId}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist_${userId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportWatchlist = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    await fetch(`/api/import/watchlist/${userId}`, {
      method: 'POST',
      body: formData
    });
    fetchWatchlist();
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="relative z-50 px-4 sm:px-6 py-4 backdrop-blur-xl bg-black/20 border-b border-white/10 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                  <FaStar className="text-black text-lg sm:text-xl" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                  My Watchlist
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  Track Your Favorite Stocks
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => router.push("/")}
                className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full font-semibold hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <FaHome className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => router.push("/StockSearchs")}
                className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <FaSearch className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                onClick={() => router.push("/Portfolio")}
                className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <FaChartPie className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Portfolio</span>
              </button>
              {user ? (
                <UserMenu user={user} />
              ) : (
                <button 
                  onClick={() => router.push('/Login')}
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 flex-1">
          <div className="max-w-7xl mx-auto">
            {/* Title Section */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4">
                <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Your Watchlist
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Keep track of your favorite stocks and monitor their performance
              </p>
            </div>

            {/* Action Bar */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportWatchlist}
                    disabled={!userId || watchlistItems.length === 0}
                    className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                      !userId || watchlistItems.length === 0
                        ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                    }`}
                  >
                    <FaDownload className="text-sm" />
                    <span>Export CSV</span>
                  </button>
                  
                  <label className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                    !userId
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
                  }`}>
                    <FaUpload className="text-sm" />
                    <span>Import CSV</span>
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={handleImportWatchlist} 
                      disabled={!userId} 
                    />
                  </label>

                  {watchlistItems.length > 0 && userId && (
                    <button
                      onClick={() => setShowRemoveAllConfirm(true)}
                      disabled={removingAll}
                      className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105"
                    >
                      <FaTrash className="text-sm" />
                      <span>{removingAll ? "Removing..." : "Clear All"}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={fetchWatchlist}
                  disabled={refreshing || !userId}
                  className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                    refreshing || !userId
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                  }`}
                >
                  <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>

              {watchlistItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm">
                    Tracking <span className="text-yellow-400 font-semibold">{watchlistItems.length}</span> stock{watchlistItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Remove All Confirmation Dialog */}
            {showRemoveAllConfirm && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <FaTrash className="text-red-400 text-2xl" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-white">Clear Watchlist?</h2>
                    <p className="text-gray-400 mb-6">
                      This will remove all {watchlistItems.length} stocks from your watchlist. This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setShowRemoveAllConfirm(false)}
                        className="px-6 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRemoveAll}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/25 transition-all font-semibold"
                      >
                        Yes, Clear All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-2xl p-4 sm:p-6 mb-6">
                <p className="text-red-300 text-center">{error}</p>
                {!userId && (
                  <div className="text-center mt-4">
                    <button 
                      onClick={() => router.push('/Login')}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                    >
                      Log In
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && !error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-yellow-400/30 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <p className="mt-4 text-gray-400">Loading your watchlist...</p>
              </div>
            ) : !userId ? (
              /* Login Required State */
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 flex items-center justify-center">
                  <FaStar className="text-yellow-400 text-3xl" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Login Required</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Sign in to create and manage your personal watchlist
                </p>
                <button
                  onClick={() => router.push("/Login")}
                  className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  Sign In
                </button>
              </div>
            ) : watchlistItems.length === 0 ? (
              /* Empty Watchlist State */
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 flex items-center justify-center">
                  <FaStar className="text-yellow-400 text-3xl" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Your Watchlist is Empty</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Start tracking stocks by adding them from the search page
                </p>
                <button
                  onClick={() => router.push("/StockSearchs")}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
                >
                  <FaSearch />
                  <span>Search Stocks</span>
                </button>
              </div>
            ) : (
              /* Watchlist Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {watchlistItems.map((item) => {
                  const stockData = watchlistData[item.stock_symbol];
                  const priceChange = stockData?.percentChange || 0;
                  const isPositive = priceChange >= 0;
                  
                  return (
                    <div
                      key={item.stock_symbol}
                      className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300"
                    >
                      <div className="p-5 sm:p-6">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 text-yellow-400 border border-yellow-400/30">
                                {item.stock_symbol}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors line-clamp-1">
                              {item.stock_name}
                            </h3>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => goToStockDetails(item.stock_symbol)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 transition-all"
                              title="View Details"
                            >
                              <FaChartLine size={16} />
                            </button>
                            <button
                              onClick={() => handleRemoveFromWatchlist(item.stock_symbol, item.stock_name)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                              title="Remove from Watchlist"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Price Section */}
                        <div className="pt-4 border-t border-white/10">
                          {stockData ? (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Current Price</span>
                                <span className="font-bold text-xl text-white">
                                  ₹{stockData.currentPrice?.NSE || 'N/A'}
                                </span>
                              </div>
                              {stockData.percentChange !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 text-sm">Change</span>
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${
                                    isPositive 
                                      ? "bg-green-500/20 text-green-400" 
                                      : "bg-red-500/20 text-red-400"
                                  }`}>
                                    {isPositive ? "+" : ""}{priceChange}%
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-4">
                              <div className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                              <span className="ml-2 text-gray-500 text-sm">Loading...</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Action */}
                        <button
                          onClick={() => goToStockDetails(item.stock_symbol)}
                          className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-400/20 text-yellow-400 font-semibold hover:from-yellow-400/20 hover:to-amber-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <FaInfoCircle size={14} />
                          <span>View Analysis</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default WatchlistPage;