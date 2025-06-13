"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FaPlus, FaTrash, FaEdit, FaHome, FaChartPie, FaArrowUp, FaArrowDown, 
  FaRocket, FaTrophy, FaSpinner, FaEye, FaCalculator, FaBalanceScale, FaCoins, FaPercentage, FaSave
} from "react-icons/fa";

interface PortfolioStock {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  buyDate: string;
  totalInvestment: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

const Portfolio = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState("OPEN");
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<PortfolioStock | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    quantity: "",
    buyPrice: "",
    buyDate: ""
  });

  useEffect(() => {
    setIsClient(true);
    loadPortfolio();
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
        color: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'][Math.floor(Math.random() * 6)],
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
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.1 * (1 - distance / 100)})`;
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
      
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.03)';
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
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
      gradient.addColorStop(0.5, 'rgba(5, 150, 105, 0.08)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
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

  const loadPortfolio = () => {
    const savedPortfolio = localStorage.getItem('stockPortfolio');
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio));
    }
  };

  const savePortfolio = (newPortfolio: PortfolioStock[]) => {
    localStorage.setItem('stockPortfolio', JSON.stringify(newPortfolio));
    setPortfolio(newPortfolio);
  };

  const fetchCurrentPrice = async (symbol: string, timeoutMs: number = 5000): Promise<number> => {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API timeout')), timeoutMs);
      });

      const fetchStockDetails = (await import('../stockNameAPI')).default;
      
      const stockDetails = await Promise.race([
        fetchStockDetails(symbol),
        timeoutPromise
      ]);
      
      const currentPrice = stockDetails?.currentPrice?.NSE || stockDetails?.currentPrice?.BSE;
      
      if (!currentPrice) {
        throw new Error(`Unable to fetch price for ${symbol}`);
      }
      
      return parseFloat(currentPrice);
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      throw new Error(`Unable to fetch current price for ${symbol}. Please check if the stock symbol is correct.`);
    }
  };

  const fetchCompanyName = async (symbol: string, timeoutMs: number = 3000): Promise<string> => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API timeout')), timeoutMs);
      });

      const fetchStockDetails = (await import('../stockNameAPI')).default;
      
      const stockDetails = await Promise.race([
        fetchStockDetails(symbol),
        timeoutPromise
      ]);
      
      return stockDetails?.companyName || symbol;
    } catch (error) {
      console.error(`Error fetching company name for ${symbol}:`, error);
      return symbol;
    }
  };

  const refreshPortfolioPrices = async () => {
    setRefreshing(true);
    try {
      const updatedPortfolio = await Promise.all(
        portfolio.map(async (stock) => {
          try {
            const currentPrice = await fetchCurrentPrice(stock.symbol);
            const currentValue = stock.quantity * currentPrice;
            const profitLoss = currentValue - stock.totalInvestment;
            const profitLossPercentage = (profitLoss / stock.totalInvestment) * 100;

            return {
              ...stock,
              currentPrice,
              currentValue,
              profitLoss,
              profitLossPercentage
            };
          } catch (error) {
            console.error(`Error updating ${stock.symbol}:`, error);
            return stock;
          }
        })
      );
      
      savePortfolio(updatedPortfolio);
    } catch (error) {
      console.error('Error refreshing prices:', error);
      alert('Error refreshing prices. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddStock = async () => {
    if (!formData.symbol || !formData.quantity || !formData.buyPrice) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let currentPrice: number;
      let companyName = formData.name || formData.symbol.toUpperCase();

      // Always try to fetch current price and company name
      try {
        currentPrice = await fetchCurrentPrice(formData.symbol, 5000);
        if (!formData.name) {
          companyName = await fetchCompanyName(formData.symbol, 3000);
        }
      } catch (error) {
        console.error('Failed to fetch current price:', error);
        alert(`❌ Could not fetch current price for ${formData.symbol}. Please check if the stock symbol is correct.`);
        setLoading(false);
        return;
      }

      const quantity = parseFloat(formData.quantity);
      const buyPrice = parseFloat(formData.buyPrice);
      const totalInvestment = quantity * buyPrice;
      const currentValue = quantity * currentPrice;
      const profitLoss = currentValue - totalInvestment;
      const profitLossPercentage = (profitLoss / totalInvestment) * 100;

      const newStock: PortfolioStock = {
        id: Date.now().toString(),
        symbol: formData.symbol.toUpperCase(),
        name: companyName,
        quantity,
        buyPrice,
        currentPrice,
        buyDate: formData.buyDate || new Date().toISOString().split('T')[0],
        totalInvestment,
        currentValue,
        profitLoss,
        profitLossPercentage
      };

      const updatedPortfolio = [...portfolio, newStock];
      savePortfolio(updatedPortfolio);
      
      setFormData({ symbol: "", name: "", quantity: "", buyPrice: "", buyDate: "" });
      setShowAddModal(false);
      
      alert(`✅ ${formData.symbol} added to portfolio successfully! Current price: ₹${currentPrice.toFixed(2)}`);
    } catch (error) {
      console.error('Error adding stock:', error);
      alert(`❌ ${error || 'Error adding stock to portfolio. Please check the stock symbol and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStock = (stock: PortfolioStock) => {
    setEditingStock(stock);
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity.toString(),
      buyPrice: stock.buyPrice.toString(),
      buyDate: stock.buyDate
    });
    setShowAddModal(true);
  };

  const handleUpdateStock = async () => {
    if (!editingStock || !formData.symbol || !formData.quantity || !formData.buyPrice) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let currentPrice: number;
      let companyName = formData.name || formData.symbol.toUpperCase();

      // Always try to fetch current price and company name
      try {
        currentPrice = await fetchCurrentPrice(formData.symbol, 5000);
        if (!formData.name) {
          companyName = await fetchCompanyName(formData.symbol, 3000);
        }
      } catch (error) {
        console.error('Failed to fetch current price:', error);
        alert(`❌ Could not fetch current price for ${formData.symbol}. Please check if the stock symbol is correct.`);
        setLoading(false);
        return;
      }

      const quantity = parseFloat(formData.quantity);
      const buyPrice = parseFloat(formData.buyPrice);
      const totalInvestment = quantity * buyPrice;
      const currentValue = quantity * currentPrice;
      const profitLoss = currentValue - totalInvestment;
      const profitLossPercentage = (profitLoss / totalInvestment) * 100;

      const updatedStock: PortfolioStock = {
        ...editingStock,
        symbol: formData.symbol.toUpperCase(),
        name: companyName,
        quantity,
        buyPrice,
        currentPrice,
        buyDate: formData.buyDate,
        totalInvestment,
        currentValue,
        profitLoss,
        profitLossPercentage
      };

      const updatedPortfolio = portfolio.map(stock => 
        stock.id === editingStock.id ? updatedStock : stock
      );
      savePortfolio(updatedPortfolio);
      
      setFormData({ symbol: "", name: "", quantity: "", buyPrice: "", buyDate: "" });
      setEditingStock(null);
      setShowAddModal(false);
      alert(`✅ ${formData.symbol} updated successfully!`);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert(`❌ ${error || 'Error updating stock. Please check the stock symbol and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStock = (stockId: string) => {
    if (confirm('Are you sure you want to remove this stock from your portfolio?')) {
      const updatedPortfolio = portfolio.filter(stock => stock.id !== stockId);
      savePortfolio(updatedPortfolio);
    }
  };

  const portfolioSummary = {
    totalInvestment: portfolio.reduce((sum, stock) => sum + stock.totalInvestment, 0),
    currentValue: portfolio.reduce((sum, stock) => sum + stock.currentValue, 0),
    totalProfitLoss: portfolio.reduce((sum, stock) => sum + stock.profitLoss, 0),
    totalProfitLossPercentage: 0
  };
  portfolioSummary.totalProfitLossPercentage = portfolioSummary.totalInvestment > 0 
    ? (portfolioSummary.totalProfitLoss / portfolioSummary.totalInvestment) * 100 
    : 0;

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
            <div className="relative cursor-pointer" onClick={() => router.push("/")}>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <FaChartPie className="text-black text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 bg-clip-text text-transparent">
                MarketSense
              </h1>
              <p className="text-xs text-gray-400">Portfolio Management</p>
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
          </div>
        </div>
      </header>

      <div className="relative z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 text-sm">
            <button 
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 border border-white/10 hover:border-white/20"
            >
              <FaHome className="text-emerald-400" />
              <span>Home</span>
            </button>
            <span className="text-gray-500">/</span>
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
              <FaChartPie className="text-emerald-400" />
              <span className="text-emerald-300 font-medium">Portfolio</span>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 mb-6">
              <FaBalanceScale className="text-emerald-400 text-xl animate-pulse" />
              <span className="text-emerald-300 font-semibold">Smart Portfolio Management</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 bg-clip-text text-transparent">
              Your Investment
              <br />
              <span className="inline-block mt-2">Portfolio</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Track, analyze, and optimize your stock investments with real-time performance insights and advanced portfolio analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FaCoins className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Total Investment</h3>
              <p className="text-2xl font-bold text-white">₹{portfolioSummary.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FaCalculator className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-300 mb-2">Current Value</h3>
              <p className="text-2xl font-bold text-white">₹{portfolioSummary.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
              <div className={`w-12 h-12 bg-gradient-to-r ${portfolioSummary.totalProfitLoss >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                {portfolioSummary.totalProfitLoss >= 0 ? <FaArrowUp className="text-white text-xl" /> : <FaArrowDown className="text-white text-xl" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Total P&L</h3>
              <p className={`text-2xl font-bold ${portfolioSummary.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{Math.abs(portfolioSummary.totalProfitLoss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
              <div className={`w-12 h-12 bg-gradient-to-r ${portfolioSummary.totalProfitLossPercentage >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <FaPercentage className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Return</h3>
              <p className={`text-2xl font-bold ${portfolioSummary.totalProfitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolioSummary.totalProfitLossPercentage >= 0 ? '+' : ''}{portfolioSummary.totalProfitLossPercentage.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <FaPlus />
              <span>Add Stock</span>
            </button>
            
            <button
              onClick={refreshPortfolioPrices}
              disabled={refreshing || portfolio.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? <FaSpinner className="animate-spin" /> : <FaRocket />}
              <span>{refreshing ? 'Refreshing...' : 'Refresh Prices'}</span>
            </button>
          </div>

          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                Your Holdings
              </h2>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <FaEye />
                <span>{portfolio.length} stocks</span>
              </div>
            </div>

            {portfolio.length === 0 ? (
              <div className="text-center py-12">
                <FaChartPie className="text-6xl text-gray-600 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No stocks in your portfolio</h3>
                <p className="text-gray-500 mb-6">Start building your investment portfolio by adding your first stock.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  Add Your First Stock
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-2 text-gray-300 font-semibold">Stock</th>
                      <th className="text-right py-4 px-2 text-gray-300 font-semibold">Qty</th>
                      <th className="text-right py-4 px-2 text-gray-300 font-semibold">Buy Price</th>
                      <th className="text-right py-4 px-2 text-gray-300 font-semibold">Current Price</th>
                      <th className="text-right py-4 px-2 text-gray-300 font-semibold">Investment</th>
                      <th className="text-right py-4 px-2 text-gray-300 font-semibold">Current Value</th>
                      <th className="text-right py-4 px-2 text-gray-300 font-semibold">P&L</th>
                      <th className="text-right py-4 px-2 text-gray-300 font-semibold">Return %</th>
                      <th className="text-center py-4 px-2 text-gray-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((stock) => (
                      <tr key={stock.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-2">
                          <div>
                            <div className="font-semibold text-white">{stock.symbol}</div>
                            <div className="text-sm text-gray-400">{stock.name}</div>
                          </div>
                        </td>
                        <td className="text-right py-4 px-2 text-white">{stock.quantity}</td>
                        <td className="text-right py-4 px-2 text-white">₹{stock.buyPrice.toFixed(2)}</td>
                        <td className="text-right py-4 px-2 text-white">₹{stock.currentPrice.toFixed(2)}</td>
                        <td className="text-right py-4 px-2 text-white">₹{stock.totalInvestment.toLocaleString('en-IN')}</td>
                        <td className="text-right py-4 px-2 text-white">₹{stock.currentValue.toLocaleString('en-IN')}</td>
                        <td className={`text-right py-4 px-2 font-semibold ${stock.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.profitLoss >= 0 ? '+' : ''}₹{Math.abs(stock.profitLoss).toLocaleString('en-IN')}
                        </td>
                        <td className={`text-right py-4 px-2 font-semibold ${stock.profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.profitLossPercentage >= 0 ? '+' : ''}{stock.profitLossPercentage.toFixed(2)}%
                        </td>
                        <td className="text-center py-4 px-2">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditStock(stock)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                            >
                              <FaEdit className="text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteStock(stock.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                            >
                              <FaTrash className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-2 text-white">
              {editingStock ? 'Edit Stock' : 'Add New Stock'}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              💡 Current market price will be fetched automatically when you add the stock
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stock Symbol *</label>
                <input
                  type="text"
                  placeholder="e.g., RELIANCE, TCS"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g., Reliance Industries"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantity *</label>
                <input
                  type="number"
                  placeholder="Number of shares"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Buy Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Purchase price per share"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyPrice: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Date</label>
                <input
                  type="date"
                  value={formData.buyDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStock(null);
                  setFormData({ symbol: "", name: "", quantity: "", buyPrice: "", buyDate: "" });
                }}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingStock ? handleUpdateStock : handleAddStock}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>{editingStock ? 'Fetching prices & updating...' : 'Fetching current price...'}</span>
                  </>
                ) : (
                  <>
                    <FaSave />
                    <span>{editingStock ? 'Update Stock' : 'Add Stock'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 mt-20 px-6 py-8 border-t border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FaTrophy className="text-emerald-400" />
            <span className="text-sm text-gray-400">Smart portfolio management with real-time insights</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 MarketSense Portfolio. Track, analyze, and optimize your investments.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
