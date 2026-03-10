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
        <header className="relative z-50 px-4 sm:px-6 py-5 backdrop-blur-2xl bg-gradient-to-r from-black/40 via-black/30 to-black/40 border-b border-white/20 shadow-2xl shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-all duration-500 shadow-xl">
                  <FaStar className="text-black text-lg sm:text-xl animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
                  My Watchlist
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block font-medium">
                  Track Your Favorite Stocks
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={() => router.push("/")}
                className="group flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 rounded-full font-bold hover:shadow-2xl hover:shadow-gray-500/40 transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 flex items-center justify-center space-x-2 text-sm sm:text-base border border-gray-500/30"
              >
                <FaHome className="text-xs sm:text-sm group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => router.push("/StockSearchs")}
                className="group flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 bg-gradient-to-br from-cyan-600 via-purple-600 to-purple-700 rounded-full font-bold hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 flex items-center justify-center space-x-2 text-sm sm:text-base border border-cyan-400/30"
              >
                <FaSearch className="text-xs sm:text-sm group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                onClick={() => router.push("/Portfolio")}
                className="group flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 bg-gradient-to-br from-emerald-600 via-green-600 to-green-700 rounded-full font-bold hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 flex items-center justify-center space-x-2 text-sm sm:text-base border border-emerald-400/30"
              >
                <FaChartPie className="text-xs sm:text-sm group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Portfolio</span>
              </button>
              {user ? (
                <UserMenu user={user} />
              ) : (
                <button 
                  onClick={() => router.push('/Login')}
                  className="px-4 sm:px-6 py-2.5 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-full font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 text-sm sm:text-base border border-blue-400/30"
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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
                    Your Watchlist
                  </span>
                </h1>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-xl backdrop-blur-md ${
                  marketStatus.status === "open" 
                    ? "bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border-2 border-green-400/50 shadow-green-500/30" 
                    : "bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border-2 border-red-400/50 shadow-red-500/30"
                }`}>
                  <FaCircle className={`text-xs ${marketStatus.status === "open" ? "animate-pulse" : ""}`} />
                  {marketStatus.text}
                </div>
              </div>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto font-medium">
                Keep track of your favorite stocks and monitor their performance in real-time
              </p>
            </div>

            {/* Search and Filter Bar */}
            {watchlistItems.length > 0 && userId && (
              <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border-2 border-white/20 rounded-3xl p-5 sm:p-7 mb-6 shadow-2xl hover:border-yellow-400/30 transition-all duration-300">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1">
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Search stocks by name or symbol..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-5 py-3.5 pl-12 bg-black/40 border-2 border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400/70 focus:shadow-lg focus:shadow-yellow-400/20 transition-all duration-300 font-medium backdrop-blur-md group-hover:border-white/30"
                      />
                      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-yellow-400 transition-colors text-lg" />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors font-bold text-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex gap-2 sm:gap-3">
                    <div className="relative group">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "name" | "price" | "change")}
                        className="appearance-none px-5 py-3.5 pr-11 bg-black/40 border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-yellow-400/70 focus:shadow-lg focus:shadow-yellow-400/20 transition-all duration-300 cursor-pointer font-semibold backdrop-blur-md group-hover:border-white/30"
                      >
                        <option value="name" className="bg-gray-900">Name</option>
                        <option value="price" className="bg-gray-900">Price</option>
                        <option value="change" className="bg-gray-900">Change %</option>
                      </select>
                      <FaFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-yellow-400 transition-colors" />
                    </div>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-4 py-3.5 bg-black/40 border-2 border-white/20 rounded-2xl hover:bg-white/10 hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-110 shadow-lg"
                      title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
                    >
                      {sortOrder === "asc" ? <FaSortAmountUp className="text-gray-300" /> : <FaSortAmountDown className="text-gray-300" />}
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                {searchTerm && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-sm text-gray-300 font-medium">
                      Found <span className="text-yellow-400 font-bold text-lg">{filteredAndSortedItems.length}</span> of {watchlistItems.length} stocks
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border-2 border-white/20 rounded-3xl p-5 sm:p-7 mb-6 sm:mb-8 shadow-2xl hover:border-yellow-400/30 transition-all duration-300">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportWatchlist}
                    disabled={!userId || watchlistItems.length === 0}
                    className={`group px-5 py-3 rounded-2xl font-bold flex items-center gap-2.5 transition-all duration-300 shadow-lg ${
                      !userId || watchlistItems.length === 0
                        ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border-2 border-gray-600/30"
                        : "bg-gradient-to-br from-blue-600 via-cyan-600 to-cyan-700 hover:shadow-2xl hover:shadow-blue-500/40 transform hover:scale-110 hover:-translate-y-1 border-2 border-blue-400/30"
                    }`}
                  >
                    <FaDownload className="text-base group-hover:animate-bounce" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  
                  <label className={`group px-5 py-3 rounded-2xl font-bold flex items-center gap-2.5 transition-all duration-300 shadow-lg ${
                    !userId
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border-2 border-gray-600/30"
                      : "bg-gradient-to-br from-purple-600 via-pink-600 to-pink-700 hover:shadow-2xl hover:shadow-purple-500/40 cursor-pointer transform hover:scale-110 hover:-translate-y-1 border-2 border-purple-400/30"
                  }`}>
                    <FaUpload className="text-base group-hover:animate-bounce" />
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
                      className="group px-5 py-3 rounded-2xl font-bold flex items-center gap-2.5 bg-gradient-to-br from-red-600 via-rose-600 to-rose-700 hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-400/30 shadow-lg"
                    >
                      <FaTrash className="text-base group-hover:animate-bounce" />
                      <span className="hidden sm:inline">{removingAll ? "Clearing..." : "Clear All"}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={fetchWatchlist}
                  disabled={refreshing || !userId}
                  className={`group px-5 py-3 rounded-2xl font-bold flex items-center gap-2.5 transition-all duration-300 shadow-lg ${
                    refreshing || !userId
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border-2 border-gray-600/30"
                      : "bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-700 hover:shadow-2xl hover:shadow-green-500/40 transform hover:scale-110 hover:-translate-y-1 border-2 border-green-400/30"
                  }`}
                >
                  <FaSyncAlt className={`text-base ${refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {watchlistItems.length > 0 && (
                <div className="mt-5 pt-5 border-t-2 border-white/20 flex flex-wrap gap-4 justify-between items-center">
                  <p className="text-gray-300 text-sm font-semibold">
                    Tracking <span className="text-yellow-400 font-extrabold text-lg">{watchlistItems.length}</span> stock{watchlistItems.length !== 1 ? 's' : ''}
                  </p>
                  {filteredAndSortedItems.length > 0 && (
                    <div className="text-sm text-gray-300 font-semibold">
                      Total Value: <span className="text-green-400 font-extrabold text-lg">
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
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div className="backdrop-blur-2xl bg-gradient-to-br from-white/20 via-white/10 to-white/20 border-2 border-white/30 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl transform scale-100 hover:scale-105 transition-transform duration-300">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 bg-red-500/30 rounded-full animate-pulse blur-lg"></div>
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-red-500/40 to-rose-500/40 flex items-center justify-center border-4 border-red-400/50 shadow-2xl shadow-red-500/30">
                        <FaTrash className="text-red-300 text-3xl" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-black mb-3 text-white">Clear Watchlist?</h2>
                    <p className="text-gray-300 mb-8 font-medium">
                      This will remove all <span className="text-yellow-400 font-bold">{watchlistItems.length}</span> stocks from your watchlist. This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setShowRemoveAllConfirm(false)}
                        className="px-8 py-3 rounded-2xl bg-gray-700 hover:bg-gray-600 transition-all font-bold border-2 border-gray-600/50 hover:border-gray-500/50 transform hover:scale-110"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRemoveAll}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-rose-700 hover:shadow-2xl hover:shadow-red-500/50 transition-all font-bold border-2 border-red-400/30 transform hover:scale-110 hover:-translate-y-1"
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
              <div className="backdrop-blur-2xl bg-gradient-to-br from-red-500/30 via-red-500/20 to-rose-500/30 border-2 border-red-500/50 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl shadow-red-500/30">
                <p className="text-red-200 text-center font-bold text-lg">{error}</p>
                {!userId && (
                  <div className="text-center mt-6">
                    <button 
                      onClick={() => router.push('/Login')}
                      className="px-8 py-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl font-black hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-110 hover:-translate-y-1 border-2 border-blue-400/30"
                    >
                      Log In
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && !error ? (
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-yellow-400/20 rounded-full"></div>
                    <div className="w-24 h-24 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaStar className="text-yellow-400 text-2xl animate-pulse" />
                    </div>
                  </div>
                  <p className="text-gray-300 text-xl font-bold">Loading your watchlist...</p>
                  <p className="text-gray-400 text-sm mt-2">Please wait</p>
                </div>
                {/* Skeleton Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border-2 border-white/20 rounded-3xl p-7 animate-pulse shadow-xl">
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex-1">
                          <div className="h-7 bg-white/10 rounded-xl w-24 mb-3"></div>
                          <div className="h-5 bg-white/10 rounded-lg w-40"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
                          <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
                        </div>
                      </div>
                      <div className="pt-5 border-t-2 border-white/10 space-y-4">
                        <div className="h-10 bg-white/10 rounded-xl w-full"></div>
                        <div className="h-8 bg-white/10 rounded-lg w-3/4"></div>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                          <div className="h-16 bg-white/10 rounded-xl"></div>
                          <div className="h-16 bg-white/10 rounded-xl"></div>
                        </div>
                      </div>
                      <div className="h-12 bg-white/10 rounded-2xl mt-6"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !userId ? (
              /* Login Required State */
              <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border-2 border-white/20 rounded-3xl p-10 sm:p-16 text-center shadow-2xl">
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-yellow-400/40 via-amber-500/40 to-orange-500/40 flex items-center justify-center border-4 border-yellow-400/50 shadow-2xl shadow-yellow-500/30">
                  <FaStar className="text-yellow-300 text-4xl animate-pulse" />
                </div>
                <h2 className="text-3xl font-black mb-4 text-white">Login Required</h2>
                <p className="text-gray-300 mb-8 max-w-md mx-auto text-lg font-medium">
                  Sign in to create and manage your personal watchlist
                </p>
                <button
                  onClick={() => router.push("/Login")}
                  className="px-10 py-4 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-black rounded-2xl font-black hover:shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 text-lg"
                >
                  Sign In
                </button>
              </div>
            ) : watchlistItems.length === 0 ? (
              /* Empty Watchlist State */
              <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border-2 border-white/20 rounded-3xl p-10 sm:p-16 text-center shadow-2xl hover:border-yellow-400/40 transition-all duration-500">
                <div className="relative w-28 h-28 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-amber-500/30 rounded-full animate-pulse blur-xl"></div>
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-yellow-400/40 via-amber-500/40 to-orange-500/40 flex items-center justify-center border-4 border-yellow-400/50 shadow-2xl shadow-yellow-500/30">
                    <FaStar className="text-yellow-300 text-5xl animate-pulse" />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mb-4 text-white">Your Watchlist is Empty</h2>
                <p className="text-gray-300 mb-10 max-w-md mx-auto text-lg font-medium">
                  Start building your personalized watchlist by adding stocks from the search page
                </p>
                <button
                  onClick={() => router.push("/StockSearchs")}
                  className="px-12 py-5 bg-gradient-to-br from-cyan-600 via-purple-600 to-purple-700 rounded-2xl font-black hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 inline-flex items-center gap-3 text-lg border-2 border-cyan-400/30"
                >
                  <FaSearch className="text-2xl animate-bounce" />
                  <span>Discover Stocks</span>
                </button>
              </div>
            ) : filteredAndSortedItems.length === 0 ? (
              /* No Search Results */
              <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border-2 border-white/20 rounded-3xl p-10 text-center shadow-2xl">
                <FaSearch className="text-gray-400 text-6xl mx-auto mb-6 animate-bounce" />
                <h2 className="text-2xl font-black mb-3 text-white">No stocks found</h2>
                <p className="text-gray-300 mb-6 font-medium">
                  Try a different search term or clear your filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("name");
                    setSortOrder("asc");
                  }}
                  className="px-8 py-3 bg-gradient-to-br from-yellow-400 to-amber-500 text-black rounded-2xl font-black hover:shadow-2xl hover:shadow-yellow-500/50 transition-all transform hover:scale-110 hover:-translate-y-1"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Watchlist Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
                {filteredAndSortedItems.map((item, index) => {
                  const stockData = watchlistData[item.stock_symbol];
                  const priceChange = stockData?.percentChange || 0;
                  const isPositive = priceChange >= 0;
                  
                  return (
                    <div
                      key={item.stock_symbol}
                      className="group relative backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-black/20 border-2 border-white/20 rounded-3xl overflow-hidden hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Animated Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-amber-500/0 to-orange-500/0 group-hover:from-yellow-400/10 group-hover:via-amber-500/10 group-hover:to-orange-500/10 transition-all duration-500 pointer-events-none"></div>
                      
                      {/* Glowing Top Border */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                        isPositive 
                          ? "from-green-400 via-emerald-400 to-green-500" 
                          : "from-red-400 via-rose-400 to-red-500"
                      } shadow-lg ${isPositive ? "shadow-green-500/50" : "shadow-red-500/50"}`}></div>
                      
                      <div className="relative p-6 sm:p-7">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-3">
                              <span className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-yellow-400/30 to-amber-500/30 text-yellow-300 border-2 border-yellow-400/50 shadow-xl shadow-yellow-500/20 backdrop-blur-md">
                                {item.stock_symbol}
                              </span>
                              {stockData && (
                                <span className={`px-3 py-1 text-xs font-bold rounded-xl shadow-lg backdrop-blur-md ${
                                  isPositive 
                                    ? "bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border-2 border-green-400/50 shadow-green-500/30" 
                                    : "bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border-2 border-red-400/50 shadow-red-500/30"
                                }`}>
                                  {isPositive ? "↑" : "↓"} {Math.abs(priceChange).toFixed(2)}%
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-lg text-white group-hover:text-yellow-300 transition-colors line-clamp-2 pr-2 leading-tight">
                              {item.stock_name}
                            </h3>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => goToStockDetails(item.stock_symbol)}
                              className="p-3 rounded-xl bg-black/30 hover:bg-gradient-to-br hover:from-cyan-500/30 hover:to-purple-500/30 text-gray-300 hover:text-cyan-300 transition-all transform hover:scale-125 hover:-translate-y-1 shadow-lg border-2 border-white/10 hover:border-cyan-400/50 backdrop-blur-md"
                              title="View Details"
                            >
                              <FaChartLine size={18} />
                            </button>
                            <button
                              onClick={() => handleRemoveFromWatchlist(item.stock_symbol, item.stock_name)}
                              className="p-3 rounded-xl bg-black/30 hover:bg-gradient-to-br hover:from-red-500/30 hover:to-rose-500/30 text-gray-300 hover:text-red-300 transition-all transform hover:scale-125 hover:-translate-y-1 shadow-lg border-2 border-white/10 hover:border-red-400/50 backdrop-blur-md"
                              title="Remove from Watchlist"
                            >
                              <FaTrash size={18} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Price Section */}
                        <div className="pt-5 border-t-2 border-white/20">
                          {stockData ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-300 text-sm font-bold">Current Price</span>
                                <span className="font-black text-3xl bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent drop-shadow-lg">
                                  ₹{parseFloat(stockData.currentPrice?.NSE || '0').toFixed(2)}
                                </span>
                              </div>
                              {stockData.percentChange !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-300 text-sm font-bold">Day Change</span>
                                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold shadow-xl backdrop-blur-md border-2 ${
                                    isPositive 
                                      ? "bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border-green-400/50 shadow-green-500/30" 
                                      : "bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border-red-400/50 shadow-red-500/30"
                                  }`}>
                                    {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
                                  </div>
                                </div>
                              )}
                              {/* Additional Stock Info */}
                              <div className="pt-4 mt-4 border-t-2 border-white/10 grid grid-cols-2 gap-3 text-xs">
                                <div className="flex flex-col p-3 rounded-xl bg-black/30 border border-green-500/30 backdrop-blur-md">
                                  <span className="text-gray-400 font-bold mb-1">High</span>
                                  <span className="text-green-300 font-extrabold text-base">
                                    ₹{stockData.dayHigh || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex flex-col p-3 rounded-xl bg-black/30 border border-red-500/30 backdrop-blur-md">
                                  <span className="text-gray-400 font-bold mb-1">Low</span>
                                  <span className="text-red-300 font-extrabold text-base">
                                    ₹{stockData.dayLow || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-8">
                              <div className="relative">
                                <div className="w-8 h-8 border-3 border-yellow-400/30 rounded-full"></div>
                                <div className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                              </div>
                              <span className="ml-3 text-gray-400 text-sm font-semibold">Loading data...</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Action */}
                        <button
                          onClick={() => goToStockDetails(item.stock_symbol)}
                          className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-orange-500/20 border-2 border-yellow-400/30 text-yellow-300 font-extrabold hover:from-yellow-400/30 hover:via-amber-500/30 hover:to-orange-500/30 hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 flex items-center justify-center gap-2.5 group backdrop-blur-md transform hover:scale-105 hover:-translate-y-1"
                        >
                          <FaInfoCircle size={16} className="group-hover:rotate-12 transition-transform" />
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