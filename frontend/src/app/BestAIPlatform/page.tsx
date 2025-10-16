"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { FaTrophy, FaArrowLeft, FaRocket } from "react-icons/fa";

const BestAIPlatformPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white flex flex-col items-center justify-center relative">
      <div className="absolute top-6 left-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg text-white"
        >
          <FaArrowLeft />
          Home
        </button>
      </div>
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-purple-500/30 p-10 text-center">
        <div className="flex flex-col items-center mb-6">
          <FaTrophy className="text-yellow-400 text-6xl mb-4 animate-bounce" />
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Best AI Platform 2024
          </h1>
          <span className="text-lg text-purple-300 font-semibold mb-2">
            FinTech Innovation Awards
          </span>
        </div>
        <p className="text-lg text-gray-200 mb-6">
          MarketSense has been recognized as the <span className="font-bold text-yellow-300">Best AI-Powered Stock Market Analysis Platform</span> of 2024 at the FinTech Innovation Awards.
        </p>
        <p className="text-md text-gray-400 mb-6">
          This award celebrates our commitment to delivering cutting-edge AI and machine learning solutions for traders and investors. Thank you for your trust and support!
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/StockSearchs")}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-purple-500 rounded-xl font-bold text-white shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            <FaRocket />
            Explore Platform
          </button>
        </div>
      </div>
    </div>
  );
};

export default BestAIPlatformPage;
