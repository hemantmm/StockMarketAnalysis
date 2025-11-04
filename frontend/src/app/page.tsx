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

  const navigationItems = [
    { label: "Stock Search", icon: FaSearch, action: () => router.push("/StockSearchs"), color: "from-cyan-500 to-blue-600" },
    { label: "Watchlist", icon: FaStar, action: () => router.push("/Watchlist"), color: "from-yellow-400 to-amber-600" },
    { label: "Price Alerts", icon: FaBell, action: () => router.push("/Notifier"), color: "from-purple-500 to-pink-600" },
    { label: "Active Stocks", icon: FaRocket, action: () => router.push("/ActiveStocks"), color: "from-orange-500 to-red-600" },
    { label: "Portfolio", icon: FaShieldAlt, action: () => router.push("/Portfolio"), color: "from-emerald-500 to-green-600" },
    { label: "Trading", icon: FaChartLine, action: () => router.push("/Trading"), color: "from-pink-500 to-yellow-500" },
    { label: "Best AI Platform 2024", icon: FaTrophy, action: () => router.push("/BestAIPlatform"), color: "from-yellow-400 to-purple-500" }
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
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <FaRocket className="text-black text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
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
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 backdrop-blur-sm mb-6">
                <FaLightbulb className="text-yellow-400 mr-2 animate-pulse" />
                <span className="text-sm font-medium">Powered by Advanced AI & Machine Learning</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                  The Future
                </span>
                <br />
                <span className="text-white">of Trading</span>
                <br />
                <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  is Here
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Experience the most advanced stock market analysis platform powered by AI. 
                Get real-time insights, predictive analytics, and intelligent recommendations 
                that give you the edge in today&apos;s dynamic markets.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <button
                onClick={() => router.push("/StockSearchs")}
                className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:scale-105 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  <FaPlay className="mr-3" />
                  Start Analysis
                  <FaArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button
                onClick={() => router.push("/ActiveStocks")}
                className="px-8 py-4 border-2 border-white/20 rounded-2xl font-bold text-lg hover:bg-white/5 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
              >
                View Live Markets
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                  {(animatedNumbers.users || 0).toLocaleString()}+
                </div>
                <div className="text-gray-400 font-medium">Active Traders</div>
                <div className="w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mt-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
              
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                  {(animatedNumbers.predictions || 0).toLocaleString()}+
                </div>
                <div className="text-gray-400 font-medium">AI Predictions Made</div>
                <div className="w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mt-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
              
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
                  {animatedNumbers.accuracy || 0}%
                </div>
                <div className="text-gray-400 font-medium">Prediction Accuracy</div>
                <div className="w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {navigationItems.map((item, index) => (
              <div
                key={index}
                onClick={item.action}
                aria-label={item.label}
                className="group relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-2"
              >
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="text-2xl text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-500 group-hover:bg-clip-text transition-all duration-300">
                    {item.label}
                  </h3>
                  
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {index === 0 && "Advanced AI-powered stock analysis with predictive insights"}
                    {index === 1 && "Smart price alerts with customizable notifications"}
                    {index === 2 && "Real-time market data and live stock tracking"}
                  </p>
                  
                  <div className="flex items-center mt-4 text-sm font-medium text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Explore <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              </div>
            ))}
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
                <div className="text-2xl font-bold text-cyan-400 mb-2">Top Trading Tool</div>
                <div className="text-sm text-gray-400">Global Finance Magazine</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-2xl font-bold text-purple-400 mb-2">Innovation Leader</div>
                <div className="text-sm text-gray-400">Tech Excellence Awards</div>
              </div>
            </div>
          </div>

          {/* Testimonial Section */}
          {user == null && (
            <div className="max-w-3xl mx-auto my-16">
              <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/20 rounded-2xl p-8 shadow-xl text-center">
                <div className="flex items-center justify-center mb-4">
                </div>
                <blockquote className="text-xl font-semibold text-white mb-2">
                  “MarketSense has completely transformed my trading experience. The AI-powered insights are spot on and the platform is incredibly easy to use. Highly recommended for anyone serious about investing!”
                </blockquote>
                <div className="text-cyan-400 font-bold">— HMM., Chennai</div>
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
    </div>
  );
};

export default HomePage;