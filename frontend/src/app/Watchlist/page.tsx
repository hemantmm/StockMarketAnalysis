/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaHome, FaSearch, FaRocket, FaChartPie, FaStar, FaSyncAlt, FaTrash, FaInfoCircle } from "react-icons/fa";
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState("OPEN");
  const [user, setUser] = useState<any>(null);

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
          color: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)]
        });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
          p.vx += dx / distance * 0.01;
          p.vy += dy / distance * 0.01;
        }
        
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1) {
          p.vx = (p.vx / speed) * 1;
          p.vy = (p.vy / speed) * 1;
        }
        
        for (let i = index + 1; i < particles.length; i++) {
          const p2 = particles[i];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 100, 255, ${(1 - distance / 100) * 0.2})`;
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
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      const hour = new Date().getHours();
      setMarketStatus(hour >= 9 && hour < 16 ? "OPEN" : "CLOSED");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Update this useEffect to handle authentication properly
  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        // Set userId from user data - use the appropriate field from your user object
        const id = userData.id || userData._id || userData.userId;
        if (id) {
          setUserId(id);
          console.log("User authenticated, ID:", id);
        } else {
          console.error("User object missing ID field:", userData);
          setError("User authentication issue. Please log in again.");
        }
      } catch (e) {
        console.error('Error parsing user data', e);
        setError("Authentication error. Please log in again.");
      }
    } else {
      console.log("No user logged in");
      setError("Please log in to view your watchlist");
      // Optionally redirect to login page
      // router.push('/Login');
    }
  }, []);

  const fetchWatchlist = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setRefreshing(true);
    try {
      console.log('Fetching watchlist for user:', userId);
      const items = await getUserWatchlist(userId);
      console.log('Received watchlist items:', items);
      setWatchlistItems(items);
      
      if (items.length > 0) {
        const stockData: Record<string, any> = {};
        for (const item of items) {
          try {
            console.log(`Fetching details for ${item.stock_symbol}`);
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
        
        console.log('Stock data fetched:', stockData);
        setWatchlistData(stockData);
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      setError("Could not connect to watchlist service. Please make sure the backend server is running.");
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
      console.error("Error removing from watchlist:", error);
    }
  };

  const goToStockDetails = (symbol: string) => {
    router.push(`/StockSearchs?stock=${symbol}`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          <button
            className="mr-4 text-blue-400 hover:text-blue-300 transition-colors"
            onClick={() => router.push("/")}
          >
            <FaHome size={24} />
          </button>
          <button
            className="mr-4 text-purple-400 hover:text-purple-300 transition-colors"
            onClick={() => router.push("/ActiveStocks")}
          >
            <FaRocket size={24} />
          </button>
          <button
            className="mr-4 text-green-400 hover:text-green-300 transition-colors"
            onClick={() => router.push("/StockSearchs")}
          >
            <FaSearch size={24} />
          </button>
          <button
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
            onClick={() => router.push("/Portfolio")}
          >
            <FaChartPie size={24} />
          </button>
        </div>
        <div>
          <div className="text-sm text-gray-400">
            {formatDate(currentTime)} | {formatTime(currentTime)}
          </div>
          <div className="flex items-center justify-end">
            <div
              className={`text-xs font-bold ${
                marketStatus === "OPEN" ? "text-green-400" : "text-red-400"
              } mr-3`}
            >
              Market {marketStatus}
            </div>
            {user ? (
              <UserMenu user={user} />
            ) : (
              <button 
                onClick={() => router.push('/Login')}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto pt-24 pb-10 px-4 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">
            My Watchlist
          </h1>
          <button
            onClick={fetchWatchlist}
            disabled={refreshing || !userId}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              refreshing || !userId
                ? "bg-blue-700/50 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {refreshing ? <FaSyncAlt className="animate-spin" /> : <FaSyncAlt />}
            <span>Refresh</span>
          </button>
        </div>

        {/* Display error message if there's an error or user is not logged in */}
        {error && (
          <div className="bg-red-500/30 text-white p-4 rounded-lg mb-6">
            <p>{error}</p>
            {!userId && (
              <button 
                onClick={() => router.push('/Login')}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Log In
              </button>
            )}
          </div>
        )}

        {loading && !error ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : !userId ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 text-center">
            <FaStar className="mx-auto text-4xl text-yellow-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-400 mb-4">
              Please log in to view and manage your watchlist
            </p>
            <button
              onClick={() => router.push("/Login")}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Log In
            </button>
          </div>
        ) : watchlistItems.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 text-center">
            <FaStar className="mx-auto text-4xl text-yellow-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-gray-400 mb-4">
              Add stocks from the search page to keep track of them here
            </p>
            <button
              onClick={() => router.push("/StockSearchs")}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors inline-flex items-center gap-2"
            >
              <FaSearch />
              <span>Search Stocks</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlistItems.map((item) => {
              const stockData = watchlistData[item.stock_symbol];
              return (
                <div
                  key={item.stock_symbol}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 border border-gray-700"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xl text-white">
                          {item.stock_name}
                        </h3>
                        <p className="text-sm text-gray-400">{item.stock_symbol}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => goToStockDetails(item.stock_symbol)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <FaInfoCircle />
                        </button>
                        <button
                          onClick={() => handleRemoveFromWatchlist(item.stock_symbol, item.stock_name)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          title="Remove from Watchlist"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      {stockData ? (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400">Current Price</span>
                            <span className="font-semibold">
                              ₹{stockData.currentPrice?.NSE || 'N/A'}
                            </span>
                          </div>
                          {stockData.percentChange !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Change</span>
                              <span
                                className={`font-semibold ${
                                  stockData.percentChange >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {stockData.percentChange >= 0 ? "+" : ""}
                                {stockData.percentChange}%
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-gray-500">
                          Loading data...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;