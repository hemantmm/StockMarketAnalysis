/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import fetchStockDetails from "../stockNameAPI";
import {
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaChartLine,
  FaHome,
  FaChartPie,
  FaStar,
  FaTrash,
} from "react-icons/fa";
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

const getStockSymbol = (stockData: any, fallback: string) =>
  String(
    stockData?.symbol ||
      stockData?.ticker ||
      stockData?.nseCode ||
      stockData?.bseCode ||
      fallback
  ).trim();

const getStockName = (stockData: any, fallback: string) =>
  String(stockData?.companyName || stockData?.name || fallback).trim();

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
  const [stockPriceData, setStockPriceData] = useState<Array<[string, string]>>(
    []
  );
  const [periodWise, setPeriodWise] = useState("1m");
  const [userId, setUserId] = useState<string>("");
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(false);
  const [watchlistErrorMsg, setWatchlistErrorMsg] = useState<string>("");
  const [, setUser] = useState<any>(null);
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
  const [showInputError, setShowInputError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
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
          color: [
            "#FFD700",
            "#FDB931",
            "#FFBF00",
            "#F59E0B",
            "#D97706",
            "#B45309",
          ][Math.floor(Math.random() * 6)],
          type: ["currency", "graph", "dot"][Math.floor(Math.random() * 3)] as
            | "currency"
            | "graph"
            | "dot",
        });
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

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
        color: [
          "#FFD700",
          "#FDB931",
          "#FFBF00",
          "#F59E0B",
          "#D97706",
          "#B45309",
        ][Math.floor(Math.random() * 6)],
        type: ["currency", "graph", "dot"][Math.floor(Math.random() * 3)] as
          | "currency"
          | "graph"
          | "dot",
      });
    }

    const drawParticle = (particle: (typeof particles)[0]) => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;

      if (particle.type === "currency") {
        ctx.font = `${particle.size * 3}px monospace`;
        const symbols = ["₹", "$", "€", "¥", "£", "₿"];
        ctx.fillText(
          symbols[Math.floor(Math.random() * symbols.length)],
          particle.x,
          particle.y
        );
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

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.strokeStyle = `rgba(255, 215, 0, ${
              0.1 * (1 - distance / 100)
            })`;
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

      ctx.strokeStyle = "rgba(255, 215, 0, 0.03)";
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
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        150
      );
      gradient.addColorStop(0, "rgba(255, 215, 0, 0.2)");
      gradient.addColorStop(0.5, "rgba(218, 165, 32, 0.08)");
      gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
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

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
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

  const fetchStockRecommendation = async (
    symbol: string,
    prices: number[],
    period: string
  ) => {
    if (!prices.length) return;

    setRecommendationLoading(true);
    try {
      console.log(
        `Sending recommendation request for ${symbol} with ${prices.length} price points, period: ${period}`
      );

      const res = await fetch("/api/stock-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, prices, period }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Failed to get recommendation: ${res.status} ${res.statusText} - ${errorText}`
        );
      }

      const data = await res.json();
      console.log("Received recommendation:", data);

      const lastPrice = prices[prices.length - 1];
      let targetPrice;

      if (!data.targetPrice) {
        if (data.recommendation === "Buy") {
          targetPrice = Math.round(lastPrice * 1.05 * 100) / 100;
        } else if (data.recommendation === "Sell") {
          targetPrice = Math.round(lastPrice * 0.95 * 100) / 100;
        } else {
          targetPrice = Math.round(lastPrice * 100) / 100;
        }
      } else {
        targetPrice = data.targetPrice;
      }

      // Enhanced reasoning if not provided
      let enhancedReason = data.reason || "";
      if (data.recommendation === "Buy" && !enhancedReason) {
        enhancedReason = `Technical indicators suggest an upward trend. Consider buying with a target price of ₹${targetPrice}.`;
      } else if (data.recommendation === "Sell" && !enhancedReason) {
        enhancedReason = `Technical indicators suggest a downward trend. Consider selling with a target price of ₹${targetPrice}.`;
      } else if (data.recommendation === "Hold" && !enhancedReason) {
        enhancedReason = `The stock is currently in a neutral trend. Hold with a price target around ₹${targetPrice}.`;
      }

      setStockRecommendation({
        recommendation: data.recommendation,
        confidence: data.confidence,
        reason: enhancedReason,
        period: data.period,
        targetPrice: targetPrice,
      });
    } catch (error) {
      console.warn("Using local recommendation fallback:", error);

      const lastPrice = prices[prices.length - 1];
      const recentPrices = prices.slice(-20);

      const avgFirst = recentPrices.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const avgLast = recentPrices.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const pctChange = ((avgLast - avgFirst) / avgFirst) * 100;

      let recommendation, reason, targetPrice;

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const supportLevel =
        Math.round((lastPrice - (lastPrice - minPrice) * 0.3) * 100) / 100;
      const resistanceLevel =
        Math.round((lastPrice + (maxPrice - lastPrice) * 0.3) * 100) / 100;

      const priceChanges = prices
        .slice(1)
        .map((price, i) => Math.abs((price - prices[i]) / prices[i]) * 100);
      const avgVolatility =
        priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
      const riskRating =
        avgVolatility < 1 ? "Low" : avgVolatility < 2.5 ? "Medium" : "High";

      if (pctChange > 3) {
        recommendation = "Buy";
        targetPrice = Math.round(lastPrice * 1.05 * 100) / 100;
        reason = `The stock shows a positive trend of ${pctChange.toFixed(
          2
        )}% recently. Technical analysis indicates potential upside momentum. Consider buying with a target price of ₹${targetPrice}. Support level: ₹${supportLevel}. Current volatility: ${riskRating} risk.`;
      } else if (pctChange < -3) {
        recommendation = "Sell";
        targetPrice = Math.round(lastPrice * 0.95 * 100) / 100;
        reason = `The stock shows a negative trend of ${pctChange.toFixed(
          2
        )}% recently. Technical indicators suggest continued downward pressure. Consider selling with a target price of ₹${targetPrice}. Resistance level: ₹${resistanceLevel}. Current volatility: ${riskRating} risk.`;
      } else {
        recommendation = "Hold";
        targetPrice = Math.round(lastPrice * 100) / 100;
        reason = `The stock is showing a neutral trend with ${Math.abs(
          pctChange
        ).toFixed(
          2
        )}% change recently. Price movement appears to be consolidating. Hold with a price target around ₹${targetPrice}. Support: ₹${supportLevel}, Resistance: ₹${resistanceLevel}. Current volatility: ${riskRating} risk.`;
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
        trendStrength: Math.abs(pctChange).toFixed(1),
      });
    } finally {
      setRecommendationLoading(false);
    }
  };

  const handleSearch = useCallback(
    async (searchTerm?: string, period?: string) => {
      const searchStock = searchTerm || stockName;
      const searchPeriod = period || periodWise;

      console.log("Search initiated with:", { searchStock, searchPeriod });

      if (searchStock) {
        setLoading(true);
        setError("");
        try {
          console.log("Fetching stock details...");
          const data = await fetchStockDetails(searchStock);
          if (data?.error === "Rate limit exceeded. Please try again later.") {
            setError(data.error);
            setLoading(false);
            return;
          }
          console.log("Stock details received:", data);

          console.log("Fetching historical data...");
          const historicalData = await fetchStockData(
            searchStock,
            searchPeriod
          );
          console.log("Historical data received:", historicalData);

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
          console.error("Error in handleSearch:", err);
          setError("Failed to fetch stock data: " + err);
        } finally {
          setLoading(false);
        }
      } else {
        setError("Please enter a stock symbol");
      }
    },
    [stockName, periodWise]
  );

  const handleSearchClick = () => {
    if (!stockName.trim()) {
      setShowInputError(true);
      setError("Please enter a stock symbol");
      return;
    }
    setShowInputError(false);
    handleSearch();
  };

  const handleClearInput = () => {
    setStockName("");
    setError("");
    setShowInputError(false);
    setStockData(null);
    setStockPriceData([]);
    setStockRecommendation(null);
  };


  useEffect(() => {
    if (stockName && stockData && !loading && !initialLoadRef.current) {
      console.log(
        "Period changed, refetching data for:",
        stockName,
        periodWise
      );
      const fetchNewData = async () => {
        setLoading(true);
        setError("");
        try {
          console.log("Fetching stock details...");
          const data = await fetchStockDetails(stockName);
          console.log("Stock details received:", data);

          console.log("Fetching historical data...");
          const historicalData = await fetchStockData(stockName, periodWise);
          console.log("Historical data received:", historicalData);

          setStockData(data);
          setStockPriceData(historicalData.datasets[0].values);

          // Also update the recommendation when period changes
          const prices = historicalData.datasets[0].values.map(
            (item: [string, string]) => parseFloat(item[1])
          );
          await fetchStockRecommendation(stockName, prices, periodWise);
        } catch (err) {
          console.error("Error in period change fetch:", err);
          setError("Failed to fetch stock data: " + err);
        } finally {
          setLoading(false);
        }
      };
      fetchNewData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodWise]);

  // Add this new useEffect to get the logged-in user info
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        // Set userId from user data - use the appropriate field from your user object
        setUserId(userData.id || userData._id || userData.userId || "");
        console.log("User authenticated:", userData);
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    } else {
      console.log("No user logged in");
      setUserId("");
    }
  }, []);

  const checkWatchlistStatus = useCallback(
    async (symbol: string) => {
      if (!symbol || !userId) {
        setIsInWatchlist(false);
        return;
      }

      setWatchlistLoading(true);
      try {
        const isWatchlisted = await checkInWatchlist(userId, symbol);
        setIsInWatchlist(isWatchlisted);
        console.log(`Stock ${symbol} in watchlist: ${isWatchlisted}`);
      } catch (error) {
        console.error("Error checking watchlist status:", error);
      } finally {
        setWatchlistLoading(false);
      }
    },
    [userId]
  );

  const handleWatchlistToggle = async () => {
    if (!stockData) return;

    // Check if user is logged in
    if (!userId) {
      setWatchlistErrorMsg("Please log in to add stocks to your watchlist");
      alert("Please log in to add stocks to your watchlist");
      return;
    }

    setWatchlistLoading(true);
    setWatchlistErrorMsg("");

    try {
      const stockSymbol = getStockSymbol(stockData, stockName);
      const stockDisplayName = getStockName(stockData, stockName || stockSymbol);

      console.log("Watchlist toggle for:", {
        userId,
        symbol: stockSymbol,
        name: stockDisplayName,
      });

      if (isInWatchlist) {
      } else {
        const response = await addToWatchlist(
          userId,
          stockSymbol,
          stockDisplayName
        );
        if (response.success) {
          setIsInWatchlist(true);
          setWatchlistErrorMsg("");
          alert(`${stockDisplayName} added to watchlist successfully!`);
        } else {
          setWatchlistErrorMsg(response.message || "Failed to add to watchlist");
          alert(response.message || "Failed to add to watchlist");
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setWatchlistErrorMsg(
        "Failed to connect to watchlist service. Make sure the backend is running."
      );
      alert(
        "Failed to connect to watchlist service. Make sure the backend is running."
      );
    } finally {
      setWatchlistLoading(false);
    }
  };

  useEffect(() => {
    const stockSymbol = getStockSymbol(stockData, stockName);
    if (stockSymbol && userId) {
      checkWatchlistStatus(stockSymbol);
    }
  }, [stockData, stockName, userId, checkWatchlistStatus]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none opacity-10 mix-blend-multiply"
        style={{ zIndex: 1 }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-amber-300 shadow-lg shadow-slate-300/60">
                  <FaSearch className="text-lg sm:text-xl" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-950">
                  MarketSense
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Smart Stock Analysis
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => router.push("/")}
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 shadow-sm transition hover:border-slate-300 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <FaHome className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => router.push("/portfolio")}
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <FaChartPie className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Portfolio</span>
              </button>
              <button
                onClick={() => router.push("/HoldStock")}
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-lg border border-amber-200 bg-amber-50 font-bold text-amber-800 shadow-sm transition hover:bg-amber-100 text-sm sm:text-base"
              >
                <span className="sm:hidden">Hold</span>
                <span className="hidden sm:inline">Hold Stock</span>
              </button>
              <button
                onClick={() => router.push("/watchlist")}
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-lg bg-slate-950 font-bold text-white shadow-sm transition hover:bg-slate-800 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <FaStar className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Watchlist</span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 grid gap-6 rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef7f6_52%,#fff7e6_100%)] p-6 shadow-xl shadow-slate-200/70 sm:mb-10 sm:p-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase text-emerald-700">
                  <FaChartLine />
                  Search, chart, decide
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-slate-950">
                  Stock analysis built for fast decisions.
              </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  Enter a symbol, choose the horizon, then review price action,
                  technical averages, watchlist status, and AI recommendation in one view.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["1m", "1yr", "max"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPeriodWise(item)}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-center text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    {item}
                    <span className="mt-1 block text-[10px] font-bold uppercase text-slate-400">
                      range
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <FaChartLine className="text-emerald-600 text-xl sm:text-2xl" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                  Stock Search & Analysis
                </h2>
                <button
                  onClick={handleClearInput}
                  className="ml-auto px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 flex items-center justify-center"
                  type="button"
                  title="Clear"
                  style={{ height: "44px", width: "44px", minWidth: "44px" }}
                >
                  <FaTrash size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
                <input
                  type="text"
                  placeholder="Enter stock symbol (e.g., TCS, RELIANCE)"
                  value={stockName}
                  onChange={(e) => {
                    setStockName(e.target.value);
                    setShowInputError(false);
                    setError("");
                  }}
                  className={`lg:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 sm:px-5 ${showInputError ? "border-red-500" : ""}`}
                />
                <select
                  value={periodWise}
                  onChange={(e) => setPeriodWise(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 sm:px-5"
                >
                  {periodWiseOptions.map((option) => (
                    <option
                      key={option}
                      value={option}
                      className="bg-white text-slate-900"
                    >
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              {showInputError && (
                <div className="mt-2 text-sm font-semibold text-red-600">Please enter a stock symbol to search.</div>
              )}
              <button
                onClick={handleSearchClick}
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg bg-slate-950 px-6 py-3.5 text-base font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <FaSearch className="mr-2 sm:mr-3" />
                  {loading ? "Analyzing..." : "Analyze Stock"}
                </span>
              </button>

              {loading && (
                <div className="flex items-center justify-center mt-4 sm:mt-6 space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-emerald-500"></div>
                  <p className="text-emerald-700 text-sm sm:text-base font-semibold">
                    Analyzing stock data...
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 sm:mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-center text-sm sm:text-base font-semibold">
                    {error}
                  </p>
                </div>
              )}
            </div>

            {stockData && !loading && (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 mb-6 sm:mb-8">
                {showDetails && (
                  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
                      <button
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors"
                        onClick={toggleDetails}
                      >
                        <IoMdClose size={24} />
                      </button>
                      <h2 className="text-xl sm:text-2xl font-black mb-4 text-slate-950 pr-8">
                        {stockData.companyName}
                      </h2>
                      <div className="space-y-3 text-slate-600">
                        <p className="text-sm sm:text-base">
                          <strong className="text-slate-950">Industry:</strong>{" "}
                          {stockData.industry}
                        </p>
                        <p className="text-sm sm:text-base leading-relaxed">
                          {stockData.companyProfile.companyDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold uppercase text-emerald-700 mb-2">
                        Current Price
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <p className="text-3xl sm:text-4xl font-black text-slate-950">
                          ₹{stockData.currentPrice.NSE}
                        </p>
                        <div
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium w-fit ${
                            stockData.percentChange > 0
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
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
                        disabled={watchlistLoading || !userId}
                        aria-label={isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                        title={!userId ? "Login required" : isInWatchlist ? "Already in Watchlist" : "Add to Watchlist"}
                        className={`p-3 rounded-xl ${
                          isInWatchlist
                            ? "bg-amber-100 hover:bg-amber-200 border-amber-200"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        } 
                        transition-colors border self-start flex items-center justify-center`}
                      >
                        <FaStar
                          size={18}
                          className={`${
                            isInWatchlist ? "text-amber-500" : "text-slate-400"
                          } sm:text-xl`}
                        />
                        {watchlistLoading && (
                          <div className="ml-1 animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        )}
                      </button>
                      <button
                        onClick={toggleDetails}
                        aria-label="Show Stock Details"
                        className="p-3 rounded-xl bg-white hover:bg-slate-50 transition-colors border border-slate-200 self-start"
                      >
                        <FaInfoCircle
                          size={18}
                          className="text-emerald-600 sm:text-xl"
                        />
                      </button>
                    </div>
                    {watchlistErrorMsg && (
                      <div className="mt-2 text-red-600 text-sm font-semibold">{watchlistErrorMsg}</div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-black mb-4 text-slate-950">
                    Technical Analysis
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {stockData.stockTechnicalData.map(
                      (item: StockData, index: number) => (
                        <div
                          key={index}
                          className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4"
                        >
                          <div className="text-xs sm:text-sm font-bold uppercase text-slate-400 mb-1">
                            {item.days} Days Avg
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm sm:text-base">
                              <span className="text-slate-500">BSE:</span>
                              <span className="text-slate-950 font-bold">
                                ₹{item.bsePrice}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm sm:text-base">
                              <span className="text-slate-500">NSE:</span>
                              <span className="text-slate-950 font-bold">
                                ₹{item.nsePrice}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {stockPriceData.length > 0 && !loading && (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 text-slate-950">
                  Price Chart
                </h3>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-5 mb-4 sm:mb-6">
                  <div className="h-64 sm:h-80 lg:h-96">
                    <Line
                      data={{
                        labels: stockPriceData.map(([date]) => date),
                        datasets: [
                          {
                            label: "Stock Price",
                            data: stockPriceData.map(([, price]) =>
                              parseFloat(price)
                            ),
                            tension: 0.4,
                            fill: true,
                            borderColor: "rgba(5, 150, 105, 1)",
                            backgroundColor: "rgba(5, 150, 105, 0.1)",
                            borderWidth: 3,
                            pointBackgroundColor: "rgba(5, 150, 105, 1)",
                            pointBorderColor: "rgba(255, 255, 255, 0.9)",
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
                          mode: "index",
                          intersect: false,
                        },
                        plugins: {
                          legend: {
                            display: true,
                            position: "top",
                            labels: {
                              color: "rgba(15, 23, 42, 0.85)",
                              font: { size: 14, weight: "bold" },
                            },
                          },
                          tooltip: {
                            backgroundColor: "rgba(15, 23, 42, 0.92)",
                            titleFont: { size: 16, weight: "bold" },
                            bodyFont: { size: 14 },
                            padding: 12,
                            cornerRadius: 6,
                            displayColors: false,
                            callbacks: {
                              label: function (context) {
                                let label = context.dataset.label || "";
                                if (label) {
                                  label += ": ";
                                }
                                if (context.parsed.y !== null) {
                                  label += "₹" + context.parsed.y.toFixed(2);
                                }
                                return label;
                              },
                              afterLabel: function (context) {
                                const dataIndex = context.dataIndex;
                                const datasetIndex = context.datasetIndex;
                                const data =
                                  context.chart.data.datasets[datasetIndex]
                                    .data;

                                if (dataIndex > 0) {
                                  // Ensure we're working with numbers
                                  const currentValue = Number(data[dataIndex]);
                                  const previousValue = Number(
                                    data[dataIndex - 1]
                                  );

                                  // Only proceed if both values are valid numbers
                                  if (
                                    !isNaN(currentValue) &&
                                    !isNaN(previousValue) &&
                                    previousValue !== 0
                                  ) {
                                    const change = currentValue - previousValue;
                                    const pctChange = (
                                      (change / previousValue) *
                                      100
                                    ).toFixed(2);
                                    const sign = change >= 0 ? "+" : "";
                                    return `${sign}${change.toFixed(
                                      2
                                    )} (${sign}${pctChange}% from previous)`;
                                  }
                                }
                                return "";
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: "Date",
                              color: "rgba(71, 85, 105, 0.95)",
                              font: { size: 14 },
                            },
                            ticks: {
                              color: "rgba(71, 85, 105, 0.9)",
                              font: { size: 12 },
                              maxTicksLimit: 8,
                            },
                            grid: { color: "rgba(148, 163, 184, 0.22)" },
                          },
                          y: {
                            title: {
                              display: true,
                              text: "Price (₹)",
                              color: "rgba(71, 85, 105, 0.95)",
                              font: { size: 14 },
                            },
                            ticks: {
                              color: "rgba(71, 85, 105, 0.9)",
                              font: { size: 12 },
                            },
                            grid: { color: "rgba(148, 163, 184, 0.22)" },
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
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 text-slate-950">
                  AI-Powered Recommendation
                </h3>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6">
                  {recommendationLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                      <p className="ml-3 text-emerald-700 font-semibold">
                        Analyzing stock trends...
                      </p>
                    </div>
                  ) : stockRecommendation ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div
                          className={`px-4 py-2 rounded-lg text-lg font-bold ${
                            stockRecommendation.recommendation === "Buy"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : stockRecommendation.recommendation === "Sell"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          Recommendation: {stockRecommendation.recommendation}
                        </div>
                        <div className="text-slate-500 text-sm font-medium">
                          Confidence:{" "}
                          <span className="text-slate-950 font-bold">
                            {stockRecommendation.confidence}
                          </span>
                          {stockRecommendation.period && (
                            <span className="ml-2">
                              ({stockRecommendation.period} period)
                            </span>
                          )}
                        </div>
                        {stockRecommendation.targetPrice && (
                          <div className="text-slate-700 text-sm bg-white border border-slate-200 px-3 py-1 rounded-lg font-semibold">
                            Target price: ₹{stockRecommendation.targetPrice}
                          </div>
                        )}
                      </div>

                      {stockRecommendation.supportLevel &&
                        stockRecommendation.resistanceLevel && (
                          <div className="my-4 px-2">
                            <div className="text-sm text-slate-700 font-bold mb-2">
                              Price Range Analysis:
                            </div>
                            <div className="relative h-10 rounded-lg bg-white border border-slate-200">
                              {/* Resistance Level */}
                              <div
                                className="absolute top-0 h-full border-r-2 border-red-400"
                                style={{ left: "100%" }}
                              >
                                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-6 text-xs font-semibold text-red-600">
                                  Resistance: ₹
                                  {Number(
                                    stockRecommendation.resistanceLevel
                                  ).toFixed(2)}
                                </div>
                              </div>

                              {/* Current Price */}
                              {stockData?.currentPrice?.NSE && (
                                <div
                                  className="absolute top-0 h-full border-r-2 border-white"
                                  style={{
                                    left: `${(() => {
                                      const currentPrice = Number(
                                        stockData.currentPrice.NSE
                                      );
                                      const support = Number(
                                        stockRecommendation.supportLevel || 0
                                      );
                                      const resistance = Number(
                                        stockRecommendation.resistanceLevel ||
                                          support + 1
                                      );
                                      const range = resistance - support;
                                      const position =
                                        ((currentPrice - support) / range) *
                                        100;
                                      return Math.min(
                                        100,
                                        Math.max(0, position)
                                      );
                                    })()}%`,
                                  }}
                                >
                                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-1 text-xs font-semibold text-slate-700">
                                    Current: ₹
                                    {Number(stockData.currentPrice.NSE).toFixed(
                                      2
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Support Level */}
                              <div
                                className="absolute top-0 h-full border-r-2 border-green-400"
                                style={{ left: "0%" }}
                              >
                                  <div className="absolute top-0 left-0 transform -translate-x-2 -translate-y-6 text-xs font-semibold text-green-600">
                                  Support: ₹
                                  {Number(
                                    stockRecommendation.supportLevel
                                  ).toFixed(2)}
                                </div>
                              </div>

                              {/* Target Price */}
                              {stockRecommendation?.targetPrice && (
                                <div
                                  className="absolute top-0 h-full border-r-2 border-yellow-400"
                                  style={{
                                    left: `${(() => {
                                      const targetPrice = Number(
                                        stockRecommendation.targetPrice
                                      );
                                      const support = Number(
                                        stockRecommendation.supportLevel || 0
                                      );
                                      const resistance = Number(
                                        stockRecommendation.resistanceLevel ||
                                          support + 1
                                      );
                                      const range = resistance - support;
                                      const position =
                                        ((targetPrice - support) / range) * 100;
                                      return Math.min(
                                        100,
                                        Math.max(0, position)
                                      );
                                    })()}%`,
                                  }}
                                >
                                  <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-6 text-xs font-semibold text-amber-600">
                                    Target: ₹
                                    {Number(
                                      stockRecommendation.targetPrice
                                    ).toFixed(2)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {stockRecommendation.riskRating && (
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="text-sm text-slate-700 font-bold mb-2">
                            Risk Assessment:
                          </div>
                          <div className="flex items-center">
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  stockRecommendation.riskRating === "Low"
                                    ? "bg-green-500 w-1/3"
                                    : stockRecommendation.riskRating ===
                                      "Medium"
                                    ? "bg-yellow-500 w-2/3"
                                    : "bg-red-500 w-full"
                                }`}
                              ></div>
                            </div>
                            <span
                              className={`ml-2 text-sm font-medium ${
                                stockRecommendation.riskRating === "Low"
                                  ? "text-green-400"
                                  : stockRecommendation.riskRating === "Medium"
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {stockRecommendation.riskRating}
                            </span>
                          </div>
                        </div>
                      )}

                      {stockRecommendation.trendStrength && (
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="text-sm text-slate-700 font-bold mb-2">
                            Trend Strength:
                          </div>
                          <div className="flex items-center">
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  parseFloat(
                                    stockRecommendation.trendStrength
                                  ) < 3
                                    ? "bg-gray-500"
                                    : stockRecommendation.recommendation ===
                                      "Buy"
                                    ? "bg-green-500"
                                    : stockRecommendation.recommendation ===
                                      "Sell"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    parseFloat(
                                      stockRecommendation.trendStrength
                                    ) * 10
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-bold text-slate-700">
                              {stockRecommendation.trendStrength}%
                            </span>
                          </div>
                        </div>
                      )}

                      <p className="text-slate-700 mt-4 leading-7">
                        {stockRecommendation.reason}
                      </p>
                      <div className="text-sm text-slate-500 mt-2">
                        This recommendation is based on technical analysis of
                        recent price movements and trends.
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500">
                      No recommendation available for this stock.
                    </p>
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
