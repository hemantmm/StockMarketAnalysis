'use client'
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaBell, FaHome, FaSearch, FaRocket, FaEnvelope, FaChartLine, FaSpinner, FaPaperPlane, FaShieldAlt, FaChartPie } from "react-icons/fa";
import axios from "axios";

const NotifierPage = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [stock, setStock] = useState("");
  const [target, setTarget] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState("OPEN");

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
        color: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef', '#c084fc', '#f472b6'][Math.floor(Math.random() * 6)],
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

  const handleSubmit = async () => {
    if (!stock.trim() || !target.trim() || !email.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
        await axios.post("https://stockmarketanalysis-1.onrender.com/set-alert", {
        stock: stock.toUpperCase(),
        target_price: parseFloat(target),
        email,
      });
      alert("🎉 Alert created successfully! You'll be notified when " + stock.toUpperCase() + " reaches ₹" + target);
      setStock(""); 
      setTarget(""); 
      setEmail("");
    } catch (error) {
      alert("❌ Error creating alert. Please try again.");
      console.error("There was an error saving the alert!", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Header */}
      <header className="relative z-50 px-6 py-4 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative cursor-pointer" onClick={() => router.push("/")}>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <FaRocket className="text-black text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                MarketSense
              </h1>
              <p className="text-xs text-gray-400">Smart Price Alerts</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className={`w-2 h-2 rounded-full ${marketStatus === 'OPEN' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium">{marketStatus}</span>
            </div>
            <div className="text-sm text-gray-400">
              {isClient ? currentTime.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }) : '--:--:--'}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Breadcrumbs */}
      <div className="relative z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 text-sm">
            <button 
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 border border-white/10 hover:border-white/20"
            >
              <FaHome className="text-purple-400" />
              <span>Home</span>
            </button>
            <span className="text-gray-500">/</span>
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <FaBell className="text-purple-400" />
              <span className="text-purple-300 font-medium">Price Alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6">
              <FaBell className="text-purple-400 text-xl animate-pulse" />
              <span className="text-purple-300 font-semibold">Smart Price Alerts</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Never Miss a
              <br />
              <span className="inline-block mt-2">Market Move</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Set intelligent price alerts and get instant notifications when your target stocks reach your desired price points.
            </p>
          </div>

          {/* Alert Form */}
          <div className="max-w-2xl mx-auto">
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Create Price Alert
                </h2>
                <p className="text-gray-400">Set up personalized alerts for your favorite stocks</p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-purple-300 mb-2">Stock Symbol</label>
                  <div className="relative">
                    <FaChartLine className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" />
                    <input
                      type="text"
                      placeholder="e.g., RELIANCE, TCS, INFY"
                      value={stock}
                      onChange={(e) => setStock(e.target.value.toUpperCase())}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:bg-white/10"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-purple-300 mb-2">Target Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:bg-white/10"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-purple-300 mb-2">Email Address</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" />
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:bg-white/10"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Creating Alert...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      <span>Create Alert</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 text-center hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FaBell className="text-white text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Instant Notifications</h3>
                <p className="text-gray-400 text-sm">Get real-time email alerts when your target price is reached</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 text-center hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FaShieldAlt className="text-white text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Secure & Reliable</h3>
                <p className="text-gray-400 text-sm">Your data is protected with enterprise-grade security</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 text-center hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FaChartLine className="text-white text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Smart Analytics</h3>
                <p className="text-gray-400 text-sm">Advanced algorithms for accurate market monitoring</p>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div 
              onClick={() => router.push("/StockSearchs")}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FaSearch className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-cyan-300">Stock Search</h3>
                  <p className="text-gray-400 text-sm">Search and analyze stock performance</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/ActiveStocks")}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FaRocket className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-300">Active Stocks</h3>
                  <p className="text-gray-400 text-sm">Monitor trending and active stocks</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/Portfolio")}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FaChartPie className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-300">Portfolio</h3>
                  <p className="text-gray-400 text-sm">Manage your investment portfolio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotifierPage;
