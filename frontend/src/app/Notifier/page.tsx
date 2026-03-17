'use client'
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaBell, FaHome, FaSearch, FaRocket, FaEnvelope, FaChartLine, FaSpinner, FaPaperPlane, FaShieldAlt, FaChartPie, FaTrash, FaTimes, FaCheckCircle, FaExclamationCircle, FaBellSlash, FaClock, FaArrowUp } from "react-icons/fa";
import axios from "axios";

interface Alert {
  id: string;
  stock: string;
  target_price: number;
  email: string;
  created_at: string;
  status: 'active' | 'triggered';
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({ stock: false, target: false, email: false });

  useEffect(() => {
    setIsClient(true);
    // Simulate loading alerts (replace with actual API call)
    const mockAlerts: Alert[] = [
      { id: '1', stock: 'RELIANCE', target_price: 2500, email: 'user@example.com', created_at: new Date().toISOString(), status: 'active' },
      { id: '2', stock: 'TCS', target_price: 3800, email: 'user@example.com', created_at: new Date(Date.now() - 86400000).toISOString(), status: 'active' },
    ];
    setAlerts(mockAlerts);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      const hour = new Date().getHours();
      setMarketStatus(hour >= 9 && hour < 16 ? "OPEN" : "CLOSED");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    showToast('success', 'Alert removed successfully');
  };

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

  const handleSubmit = async () => {
    // Reset field errors
    setFieldErrors({ stock: false, target: false, email: false });

    // Validation
    const errors = {
      stock: !stock.trim(),
      target: !target.trim() || parseFloat(target) <= 0,
      email: !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    };

    setFieldErrors(errors);

    if (errors.stock || errors.target || errors.email) {
      showToast('error', 'Please fill in all fields correctly');
      return;
    }

    setLoading(true);
    try {
      await axios.post("https://stockmarketanalysis-1.onrender.com/set-alert", {
        stock: stock.toUpperCase(),
        target_price: parseFloat(target),
        email,
      });
      
      const newAlert: Alert = {
        id: Date.now().toString(),
        stock: stock.toUpperCase(),
        target_price: parseFloat(target),
        email,
        created_at: new Date().toISOString(),
        status: 'active'
      };
      setAlerts(prev => [newAlert, ...prev]);
      
      showToast('success', `Alert created for ${stock.toUpperCase()} at ₹${target}`);
      setStock(""); 
      setTarget(""); 
      setEmail("");
    } catch (error) {
      showToast('error', 'Failed to create alert. Please try again.');
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

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[100] space-y-3">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center space-x-3 px-6 py-4 rounded-xl backdrop-blur-xl border shadow-2xl transform transition-all duration-300 animate-slide-in-right ${
              toast.type === 'success' 
                ? 'bg-green-500/20 border-green-500/50' 
                : toast.type === 'error' 
                ? 'bg-red-500/20 border-red-500/50'
                : 'bg-blue-500/20 border-blue-500/50'
            }`}
          >
            {toast.type === 'success' && <FaCheckCircle className="text-green-400 text-xl" />}
            {toast.type === 'error' && <FaExclamationCircle className="text-red-400 text-xl" />}
            {toast.type === 'info' && <FaBell className="text-blue-400 text-xl" />}
            <span className="text-white font-medium">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-white/60 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-50 px-6 py-4 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative cursor-pointer group" onClick={() => router.push("/")}>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-all duration-500 group-hover:scale-110">
                <FaRocket className="text-black text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                MarketSense
              </h1>
              <p className="text-xs text-gray-400">Smart Price Alerts</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <div className={`w-2 h-2 rounded-full ${marketStatus === 'OPEN' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium">{marketStatus}</span>
            </div>
            <div className="text-sm text-gray-400 font-mono">
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
              <FaHome className="text-yellow-400" />
              <span>Home</span>
            </button>
            <span className="text-gray-500">/</span>
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
              <FaBell className="text-yellow-400" />
              <span className="text-yellow-300 font-medium">Price Alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 mb-6 hover:scale-105 transition-transform duration-300">
              <FaBell className="text-yellow-400 text-xl animate-pulse" />
              <span className="text-yellow-300 font-semibold">Smart Price Alerts</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent animate-gradient">
              Never Miss a
              <br />
              <span className="inline-block mt-2">Market Move</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Set intelligent price alerts and get instant notifications when your target stocks reach your desired price points.
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Alert Form */}
            <div className="lg:sticky lg:top-8 h-fit">
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/20 p-8 shadow-2xl hover:shadow-amber-500/20 transition-all duration-300">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Create Price Alert
                  </h2>
                  <p className="text-gray-400">Set up personalized alerts for your favorite stocks</p>
                </div>

                <div className="space-y-6">
                  <div className="relative group">
                    <label className="block text-sm font-medium text-yellow-300 mb-2">Stock Symbol</label>
                    <div className="relative">
                      <FaChartLine className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-400 z-10" />
                      <input
                        type="text"
                        placeholder="e.g., RELIANCE, TCS, INFY"
                        value={stock}
                        onChange={(e) => setStock(e.target.value.toUpperCase())}
                        className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${fieldErrors.stock ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:bg-white/10`}
                      />
                      {fieldErrors.stock && <p className="text-red-400 text-xs mt-1">Please enter a valid stock symbol</p>}
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-yellow-300 mb-2">Target Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-400 font-bold z-10">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${fieldErrors.target ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:bg-white/10`}
                      />
                      {fieldErrors.target && <p className="text-red-400 text-xs mt-1">Please enter a valid price</p>}
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-yellow-300 mb-2">Email Address</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-400 z-10" />
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${fieldErrors.email ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:bg-white/10`}
                      />
                      {fieldErrors.email && <p className="text-red-400 text-xs mt-1">Please enter a valid email</p>}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/50 flex items-center justify-center space-x-2 group"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Creating Alert...</span>
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="group-hover:translate-x-1 transition-transform" />
                        <span>Create Alert</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Alerts */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <FaArrowUp className="text-yellow-400" />
                  <span>Active Alerts</span>
                  <span className="text-sm font-normal text-gray-400">({alerts.length})</span>
                </h2>
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  {showAlerts ? <FaBellSlash /> : <FaBell />}
                </button>
              </div>

              {showAlerts && (
                <div className="space-y-4">
                  {alerts.length === 0 ? (
                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
                      <FaBellSlash className="text-gray-500 text-5xl mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">No active alerts</p>
                      <p className="text-gray-500 text-sm">Create your first price alert to get started</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                              <FaChartLine className="text-white text-xl" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{alert.stock}</h3>
                              <p className="text-gray-400 text-sm flex items-center space-x-1">
                                <FaClock className="text-xs" />
                                <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAlert(alert.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-300 transform hover:scale-110"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className="text-gray-400 text-xs mb-1">Target Price</p>
                            <p className="text-2xl font-bold text-green-400">₹{alert.target_price.toFixed(2)}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className="text-gray-400 text-xs mb-1">Status</p>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <p className="text-sm font-semibold text-green-400 uppercase">{alert.status}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-2xl border border-yellow-500/30 p-6 text-center hover:bg-yellow-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 group">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300">
                <FaBell className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-yellow-300 mb-2">Instant Notifications</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Get real-time email alerts when your target price is reached</p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/30 p-6 text-center hover:bg-green-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-green-300 mb-2">Secure & Reliable</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Your data is protected with enterprise-grade security</p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/30 p-6 text-center hover:bg-blue-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300">
                <FaChartLine className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-blue-300 mb-2">Smart Analytics</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Advanced algorithms for accurate market monitoring</p>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div 
              onClick={() => router.push("/StockSearchs")}
              className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl border border-cyan-500/30 p-6 cursor-pointer hover:bg-cyan-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:rotate-12">
                  <FaSearch className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-cyan-300 mb-1">Stock Search</h3>
                  <p className="text-gray-400 text-sm">Search and analyze stocks</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/ActiveStocks")}
              className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-2xl border border-orange-500/30 p-6 cursor-pointer hover:bg-orange-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:rotate-12">
                  <FaRocket className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-300 mb-1">Active Stocks</h3>
                  <p className="text-gray-400 text-sm">Monitor trending stocks</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/Portfolio")}
              className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-green-600/10 rounded-2xl border border-emerald-500/30 p-6 cursor-pointer hover:bg-emerald-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:rotate-12">
                  <FaChartPie className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-300 mb-1">Portfolio</h3>
                  <p className="text-gray-400 text-sm">Manage investments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Testimonial Section */}
      <div className="relative z-10 max-w-4xl mx-auto my-20 px-6">
        <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-400/30 rounded-3xl p-10 shadow-2xl text-center hover:shadow-amber-500/25 transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center justify-center mb-6">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-6 h-6 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
          </div>
          <blockquote className="text-2xl font-semibold text-white mb-4 leading-relaxed">
            &ldquo;The price alerts from MarketSense have helped me catch market moves I would have missed. The notifications are instant and reliable!&rdquo;
          </blockquote>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">SM</span>
            </div>
            <div className="text-left">
              <div className="text-yellow-300 font-bold">SMM.</div>
              <div className="text-gray-400 text-sm">Swing Trader, USA</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-20 px-6 py-10 border-t border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                  <FaRocket className="text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  MarketSense
                </h3>
              </div>
              <p className="text-gray-400 text-sm">
                Smart price alerts and market intelligence for modern investors.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <button onClick={() => router.push("/")} className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm">Home</button>
                <button onClick={() => router.push("/StockSearchs")} className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm">Stock Search</button>
                <button onClick={() => router.push("/Portfolio")} className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm">Portfolio</button>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Security</h4>
              <div className="flex items-center space-x-2 mb-3">
                <FaShieldAlt className="text-green-400" />
                <span className="text-sm text-gray-400">Enterprise-grade security</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaBell className="text-yellow-400" />
                <span className="text-sm text-gray-400">24/7 monitoring</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 MarketSense. All rights reserved. | Terms of Service | Privacy Policy
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotifierPage;
