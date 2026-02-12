"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaRocket, FaBell, FaSearch, FaArrowRight, FaPlay, FaShieldAlt, FaLightbulb, FaTrophy, FaStar, FaChartLine } from "react-icons/fa";
import UserMenu from "./components/UserMenu";

const HomePage = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState("OPEN");
  const [isClient, setIsClient] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [animatedNumbers, setAnimatedNumbers] = useState({
    users: 0,
    predictions: 0,
    accuracy: 0
  });
  const [showModal, setShowModal] = useState<{ type: string, open: boolean }>({ type: "", open: false });

  useEffect(() => {
    setIsClient(true);
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setUser(userObj);
        // Optionally: set userId for downstream pages
        // localStorage.setItem('userId', userObj.id || userObj._id || userObj.userId || '');
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
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
    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        callback(current);
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    };

    setTimeout(() => {
      animateValue(0, 50000, 2000, (value) => setAnimatedNumbers(prev => ({ ...prev, users: value })));
      animateValue(0, 1200000, 2500, (value) => setAnimatedNumbers(prev => ({ ...prev, predictions: value })));
      animateValue(0, 94, 3000, (value) => setAnimatedNumbers(prev => ({ ...prev, accuracy: value })));
    }, 1000);
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

    for (let i = 0; i < 100; i++) {
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

  const navGridRef = useRef<HTMLDivElement>(null);
  const handleGetStarted = () => {
    navGridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const navigationItems = [
    { label: "Stock Search", icon: FaSearch, action: () => router.push("/StockSearchs"), color: "from-yellow-400 to-amber-500", description: "Advanced AI-powered stock analysis with predictive insights" },
    { label: "Watchlist", icon: FaStar, action: () => router.push("/Watchlist"), color: "from-yellow-400 to-amber-600", description: "Track your favorite stocks and get instant updates" },
    { label: "Price Alerts", icon: FaBell, action: () => router.push("/Notifier"), color: "from-amber-500 to-orange-600", description: "Smart price alerts with customizable notifications" },
    { label: "Active Stocks", icon: FaRocket, action: () => router.push("/ActiveStocks"), color: "from-orange-500 to-amber-600", description: "Real-time market data and live stock tracking" },
    { label: "Portfolio", icon: FaShieldAlt, action: () => router.push("/Portfolio"), color: "from-yellow-500 to-orange-600", description: "Manage your investment portfolio securely" },
    { label: "Trading", icon: FaChartLine, action: () => router.push("/Trading"), color: "from-amber-500 to-yellow-600", description: "Execute trades with AI-powered recommendations" },
    { label: "Hold Stock Advisor", icon: FaLightbulb, action: () => router.push("/HoldStock"), color: "from-yellow-600 to-amber-700", description: "Get expert advice on holding or selling stocks" },
    { label: "Best AI Platform 2024", icon: FaTrophy, action: () => router.push("/BestAIPlatform"), color: "from-yellow-400 to-orange-500", description: "Award-winning AI platform for traders" }
  ];

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
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <FaRocket className="text-black text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                MarketSense
              </h1>
              <p className="text-xs text-gray-400">Next-Gen Market Intelligence</p>
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
            {user ? (
              <UserMenu user={user} />
            ) : (
              <button
                onClick={() => router.push("/Login")}
                className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-20 relative">
            <div className="absolute inset-0 pointer-events-none z-0">
              {/* Subtle animated gradient overlay */}
              <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 animate-pulse-slow"></div>
            </div>
            <div className="relative z-10">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 backdrop-blur-sm mb-6">
                  <FaLightbulb className="text-yellow-400 mr-2 animate-pulse" />
                  <span className="text-sm font-medium">Powered by Advanced AI & Machine Learning</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-6">
                  <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent animate-pulse">
                    The Future
                  </span>
                  <br />
                  <span className="text-white">of Trading</span>
                  <br />
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                    is Here
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  Experience the most advanced stock market analysis platform powered by AI. 
                  Get real-time insights, predictive analytics, and intelligent recommendations 
                  that give you the edge in today&apos;s dynamic markets.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
                  <button
                    onClick={handleGetStarted}
                    className="group px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-yellow-500/25 transition-all duration-500 transform hover:scale-105 relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      <FaPlay className="mr-3" />
                      Get Started
                      <FaArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  <button
                    onClick={() => router.push("/ActiveStocks")}
                    className="px-8 py-4 border-2 border-white/20 rounded-2xl font-bold text-lg hover:bg-white/5 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
                  >
                    View Live Markets
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                <div
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                  aria-label="Active Traders"
                  onClick={() => setShowModal({ type: "users", open: true })}
                  title="Click to see more about active traders"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">
                    {(animatedNumbers.users || 0).toLocaleString()}+
                  </div>
                  <div className="text-gray-400 font-medium">Active Traders</div>
                  <div className="w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mt-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
                <div
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                  aria-label="AI Predictions Made"
                  onClick={() => setShowModal({ type: "predictions", open: true })}
                  title="Click to see more about AI predictions"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">
                    {(animatedNumbers.predictions || 0).toLocaleString()}+
                  </div>
                  <div className="text-gray-400 font-medium">AI Predictions Made</div>
                  <div className="w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mt-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
                <div
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                  aria-label="Prediction Accuracy"
                  onClick={() => setShowModal({ type: "accuracy", open: true })}
                  title="Click to see more about prediction accuracy"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent mb-2">
                    {animatedNumbers.accuracy || 0}%
                  </div>
                  <div className="text-gray-400 font-medium">Prediction Accuracy</div>
                  <div className="w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full mt-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>
            </div>
          </section>
          {/* Navigation Grid */}
          <div ref={navGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {navigationItems.map((item, index) => (
              <div
                key={index}
                onClick={item.action}
                aria-label={item.label}
                className="group relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-2"
                title={item.label}
              >
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="text-2xl text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-amber-500 group-hover:bg-clip-text transition-all duration-300">
                    {item.label}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center mt-4 text-sm font-medium text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Explore <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              </div>
            ))}
          </div>
          
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Why Choose MarketSense?
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Experience the future of trading with our cutting-edge features
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <FaChartLine className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Analysis</h3>
                <p className="text-gray-400 leading-relaxed">
                  Leverage advanced machine learning algorithms for accurate market predictions and insights
                </p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                  <FaBell className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Real-Time Alerts</h3>
                <p className="text-gray-400 leading-relaxed">
                  Never miss a trading opportunity with instant notifications on price movements
                </p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-amber-700 rounded-xl flex items-center justify-center mb-6">
                  <FaShieldAlt className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Secure Trading</h3>
                <p className="text-gray-400 leading-relaxed">
                  Enterprise-grade security to protect your investments and personal data
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 backdrop-blur-sm mb-8">
              <FaTrophy className="text-yellow-400 mr-3 animate-bounce" />
              <span className="font-semibold">Award-Winning Platform</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-2xl font-bold text-yellow-400 mb-2">Best AI Platform 2024</div>
                <div className="text-sm text-gray-400">FinTech Innovation Awards</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-2xl font-bold text-amber-400 mb-2">Top Trading Tool</div>
                <div className="text-sm text-gray-400">Global Finance Magazine</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-2xl font-bold text-yellow-400 mb-2">Innovation Leader</div>
                <div className="text-sm text-gray-400">Tech Excellence Awards</div>
              </div>
            </div>
          </div>

          {/* Testimonial Section */}
          {user == null && (
            <div className="max-w-3xl mx-auto my-16">
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-400/20 rounded-2xl p-8 shadow-xl text-center">
                <div className="flex items-center justify-center mb-4">
                  <FaStar className="text-yellow-400 text-2xl" />
                  <FaStar className="text-yellow-400 text-2xl" />
                  <FaStar className="text-yellow-400 text-2xl" />
                  <FaStar className="text-yellow-400 text-2xl" />
                  <FaStar className="text-yellow-400 text-2xl" />
                </div>
                <blockquote className="text-xl font-semibold text-white mb-2">
                  “MarketSense has completely transformed my trading experience. The AI-powered insights are spot on and the platform is incredibly easy to use. Highly recommended for anyone serious about investing!”
                </blockquote>
                <div className="text-amber-400 font-bold">— HMM., Chennai</div>
                <div className="text-gray-400 text-sm mt-2">Active Trader & Investor</div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 mt-20 px-6 py-8 border-t border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FaShieldAlt className="text-green-400" />
            <span className="text-sm text-gray-400">Enterprise-grade security & 24/7 monitoring</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 MarketSense. All rights reserved. | Terms of Service | Privacy Policy
          </p>
        </div>
      </footer>

      {/* Simple modal for demo purposes */}
      {showModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white text-black rounded-xl p-8 shadow-xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-4">
              {showModal.type === "users" && "Active Traders"}
              {showModal.type === "predictions" && "AI Predictions Made"}
              {showModal.type === "accuracy" && "Prediction Accuracy"}
            </h2>
            <p>
              {showModal.type === "users" && "Over 50,000 traders use MarketSense daily!"}
              {showModal.type === "predictions" && "Our AI has made over 1,200,000 predictions!"}
              {showModal.type === "accuracy" && "Our prediction accuracy is 94% based on backtests."}
            </p>
            <button
              className="mt-6 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-full"
              onClick={() => setShowModal({ type: "", open: false })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;