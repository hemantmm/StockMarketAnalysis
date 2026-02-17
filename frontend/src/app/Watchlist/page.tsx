/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaHome, FaSearch, FaChartPie, FaStar, FaSyncAlt, FaTrash, FaInfoCircle, FaDownload, FaUpload, FaChartLine, FaFilter, FaSortAmountDown, FaSortAmountUp, FaCircle } from "react-icons/fa";
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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "change">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Market status check
  const getMarketStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const day = now.getDay();
    
    // Weekend check (0 = Sunday, 6 = Saturday)
    if (day === 0 || day === 6) {
      return { status: "closed", text: "Market Closed (Weekend)" };
    }
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const currentTime = hours * 60 + minutes;
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    if (currentTime >= marketOpen && currentTime <= marketClose) {
      return { status: "open", text: "Market Open" };
    } else if (currentTime < marketOpen) {
      return { status: "pre", text: "Pre-Market" };
    } else {
      return { status: "closed", text: "Market Closed" };
    }
  };

  const marketStatus = getMarketStatus();

  // Filter and sort watchlist
  const filteredAndSortedItems = React.useMemo(() => {
    const filtered = watchlistItems.filter(item => 
      item.stock_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      const aData = watchlistData[a.stock_symbol];
      const bData = watchlistData[b.stock_symbol];

      switch (sortBy) {
        case "name":
          comparison = a.stock_name.localeCompare(b.stock_name);
          break;
        case "price":
          const aPrice = parseFloat(aData?.currentPrice?.NSE || "0");
          const bPrice = parseFloat(bData?.currentPrice?.NSE || "0");
          comparison = aPrice - bPrice;
          break;
        case "change":
          const aChange = parseFloat(aData?.percentChange || "0");
          const bChange = parseFloat(bData?.percentChange || "0");
          comparison = aChange - bChange;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [watchlistItems, watchlistData, searchTerm, sortBy, sortOrder]);

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
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Your Watchlist
                  </span>
                </h1>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                  marketStatus.status === "open" 
                    ? "bg-green-500/20 text-green-400 border border-green-400/30" 
                    : "bg-red-500/20 text-red-400 border border-red-400/30"
                }`}>
                  <FaCircle className={`text-xs ${marketStatus.status === "open" ? "animate-pulse" : ""}`} />
                  {marketStatus.text}
                </div>
              </div>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Keep track of your favorite stocks and monitor their performance in real-time
              </p>
            </div>

            {/* Search and Filter Bar */}
            {watchlistItems.length > 0 && userId && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search stocks by name or symbol..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/50 transition-colors"
                      />
                      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "name" | "price" | "change")}
                        className="appearance-none px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400/50 transition-colors cursor-pointer"
                      >
                        <option value="name" className="bg-gray-900">Name</option>
                        <option value="price" className="bg-gray-900">Price</option>
                        <option value="change" className="bg-gray-900">Change %</option>
                      </select>
                      <FaFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                      title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
                    >
                      {sortOrder === "asc" ? <FaSortAmountUp className="text-gray-400" /> : <FaSortAmountDown className="text-gray-400" />}
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                {searchTerm && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                      Found <span className="text-yellow-400 font-semibold">{filteredAndSortedItems.length}</span> of {watchlistItems.length} stocks
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportWatchlist}
                    disabled={!userId || watchlistItems.length === 0}
                    className={`px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                      !userId || watchlistItems.length === 0
                        ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                    }`}
                  >
                    <FaDownload className="text-sm" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  
                  <label className={`px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                    !userId
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
                  }`}>
                    <FaUpload className="text-sm" />
                    <span className="hidden sm:inline">Import</span>
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
                      className="px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaTrash className="text-sm" />
                      <span className="hidden sm:inline">{removingAll ? "Clearing..." : "Clear All"}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={fetchWatchlist}
                  disabled={refreshing || !userId}
                  className={`px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                    refreshing || !userId
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                  }`}
                >
                  <FaSyncAlt className={`text-sm ${refreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {watchlistItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    Tracking <span className="text-yellow-400 font-semibold">{watchlistItems.length}</span> stock{watchlistItems.length !== 1 ? 's' : ''}
                  </p>
                  {filteredAndSortedItems.length > 0 && (
                    <div className="text-sm text-gray-400">
                      Total Value: <span className="text-green-400 font-semibold">
                        ₹{filteredAndSortedItems.reduce((sum, item) => {
                          const price = parseFloat(watchlistData[item.stock_symbol]?.currentPrice?.NSE || "0");
                          return sum + price;
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                  )}
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
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-yellow-400/20 rounded-full"></div>
                    <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                  </div>
                  <p className="mt-6 text-gray-400 text-lg">Loading your watchlist...</p>
                </div>
                {/* Skeleton Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="h-6 bg-white/10 rounded-full w-20 mb-2"></div>
                          <div className="h-4 bg-white/10 rounded w-32"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
                          <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/10 space-y-3">
                        <div className="h-8 bg-white/10 rounded w-full"></div>
                        <div className="h-6 bg-white/10 rounded w-3/4"></div>
                      </div>
                      <div className="h-10 bg-white/10 rounded-xl mt-4"></div>
                    </div>
                  ))}
                </div>
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
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-full animate-pulse"></div>
                  <div className="relative w-full h-full rounded-full bg-gradient-to-r from-yellow-400/30 to-amber-500/30 flex items-center justify-center">
                    <FaStar className="text-yellow-400 text-4xl" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Your Watchlist is Empty</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">
                  Start building your personalized watchlist by adding stocks from the search page
                </p>
                <button
                  onClick={() => router.push("/StockSearchs")}
                  className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3 text-lg"
                >
                  <FaSearch className="text-xl" />
                  <span>Discover Stocks</span>
                </button>
              </div>
            ) : filteredAndSortedItems.length === 0 ? (
              /* No Search Results */
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <FaSearch className="text-gray-500 text-5xl mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2 text-white">No stocks found</h2>
                <p className="text-gray-400 mb-4">
                  Try a different search term or clear your filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("name");
                    setSortOrder("asc");
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Watchlist Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredAndSortedItems.map((item, index) => {
                  const stockData = watchlistData[item.stock_symbol];
                  const priceChange = stockData?.percentChange || 0;
                  const isPositive = priceChange >= 0;
                  
                  return (
                    <div
                      key={item.stock_symbol}
                      className="group backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl overflow-hidden hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-500 hover:scale-[1.02] animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-amber-500/0 to-orange-500/0 group-hover:from-yellow-400/5 group-hover:via-amber-500/5 group-hover:to-orange-500/5 transition-all duration-500 pointer-events-none"></div>
                      
                      <div className="relative p-5 sm:p-6">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 text-yellow-400 border border-yellow-400/40 shadow-lg shadow-yellow-500/10">
                                {item.stock_symbol}
                              </span>
                              {stockData && (
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                }`}>
                                  {isPositive ? "↑" : "↓"} {Math.abs(priceChange).toFixed(2)}%
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors line-clamp-2 pr-2">
                              {item.stock_name}
                            </h3>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => goToStockDetails(item.stock_symbol)}
                              className="p-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 transition-all transform hover:scale-110"
                              title="View Details"
                            >
                              <FaChartLine size={16} />
                            </button>
                            <button
                              onClick={() => handleRemoveFromWatchlist(item.stock_symbol, item.stock_name)}
                              className="p-2.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all transform hover:scale-110"
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
                                <span className="text-gray-400 text-sm font-medium">Current Price</span>
                                <span className="font-bold text-2xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                  ₹{parseFloat(stockData.currentPrice?.NSE || '0').toFixed(2)}
                                </span>
                              </div>
                              {stockData.percentChange !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 text-sm font-medium">Day Change</span>
                                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg ${
                                    isPositive 
                                      ? "bg-green-500/20 text-green-400 shadow-green-500/20" 
                                      : "bg-red-500/20 text-red-400 shadow-red-500/20"
                                  }`}>
                                    {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
                                  </div>
                                </div>
                              )}
                              {/* Additional Stock Info */}
                              <div className="pt-3 mt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                                <div className="flex flex-col">
                                  <span className="text-gray-500">High</span>
                                  <span className="text-green-400 font-semibold">
                                    ₹{stockData.dayHigh || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-gray-500">Low</span>
                                  <span className="text-red-400 font-semibold">
                                    ₹{stockData.dayLow || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-6">
                              <div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                              <span className="ml-3 text-gray-500 text-sm">Loading data...</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Action */}
                        <button
                          onClick={() => goToStockDetails(item.stock_symbol)}
                          className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-400/20 text-yellow-400 font-bold hover:from-yellow-400/20 hover:to-amber-500/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                          <FaInfoCircle size={14} className="group-hover:rotate-12 transition-transform" />
                          <span>View Full Analysis</span>
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

      {/* Add fadeIn animation in style tag */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WatchlistPage;