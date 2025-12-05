"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { FaTrophy, FaArrowLeft, FaRocket, FaStar, FaChartLine, FaShieldAlt } from "react-icons/fa";

const BestAIPlatformPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-r from-yellow-400/10 via-purple-500/10 to-pink-500/10 animate-pulse-slow"></div>
      </div>
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg text-white shadow-lg transition-all duration-300"
        >
          <FaArrowLeft />
          Home
        </button>
      </div>
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-purple-500/30 p-10 text-center relative z-10">
        <div className="flex flex-col items-center mb-6">
          <FaTrophy className="text-yellow-400 text-6xl mb-4 animate-bounce-slow" />
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Best AI Platform 2024
          </h1>
          <span className="text-lg text-purple-300 font-semibold mb-2">
            FinTech Innovation Awards
          </span>
          <div className="text-sm text-gray-300 mt-2">
            Recognized for excellence in AI-driven stock market analysis.
          </div>
        </div>
        <p className="text-lg text-gray-200 mb-6">
          MarketSense has been recognized as the <span className="font-bold text-yellow-300">Best AI-Powered Stock Market Analysis Platform</span> of 2024 at the FinTech Innovation Awards.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center">
            <FaStar className="text-yellow-400 text-3xl mb-2" />
            <div className="text-lg font-bold text-white mb-1">Smart Watchlist</div>
            <div className="text-gray-400 text-sm">Track your favorite stocks with AI-powered alerts.</div>
          </div>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center">
            <FaChartLine className="text-cyan-400 text-3xl mb-2" />
            <div className="text-lg font-bold text-white mb-1">Live Market Analysis</div>
            <div className="text-gray-400 text-sm">Real-time insights and predictive analytics for smarter trading.</div>
          </div>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center">
            <FaShieldAlt className="text-green-400 text-3xl mb-2" />
            <div className="text-lg font-bold text-white mb-1">Enterprise Security</div>
            <div className="text-gray-400 text-sm">Your data is protected with enterprise-grade security.</div>
          </div>
        </div>
        <p className="text-md text-gray-400 mb-6">
          This award celebrates our commitment to delivering cutting-edge AI and machine learning solutions for traders and investors. Thank you for your trust and support!
        </p>
        <div className="flex justify-center mb-8">
          <button
            onClick={() => router.push("/StockSearchs")}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-purple-500 rounded-xl font-bold text-white shadow-lg hover:scale-105 hover:bg-purple-600 transition-transform duration-300 flex items-center gap-2"
          >
            <FaRocket />
            Explore Platform
          </button>
        </div>
        <div className="bg-gradient-to-r from-yellow-400/10 to-purple-500/10 border border-yellow-400/20 rounded-xl p-6 shadow text-center">
          <blockquote className="text-lg font-semibold text-white mb-2">
            “MarketSense is the most advanced and reliable AI trading platform I have ever used. The insights are actionable and the interface is intuitive. Highly recommended for serious investors!”
          </blockquote>
          <div className="text-yellow-400 font-bold">— R. Kumar, Mumbai</div>
          <div className="text-gray-400 text-sm mt-2">Professional Trader</div>
        </div>
      </div>
    </div>
  );
};

export default BestAIPlatformPage;
