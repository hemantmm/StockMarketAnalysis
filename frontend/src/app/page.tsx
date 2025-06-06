"use client";
import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useRouter } from "next/navigation";
import ActiveStocks from "./ActiveStocks/page";

ChartJS.register(
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Tooltip,
  Legend
);

const StockSearch = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/Login");
  };

  const handleStockAlert = () => {
    router.push("/Notifier");
  };
  
  const handleStockSearch = () => {
    router.push("/StockSearchs");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white/10 backdrop-blur-md border-b border-white/20 p-4 sm:p-6 shadow-md">
        <h1 className="text-2xl font-bold text-white mb-2 sm:mb-0">
          Stock Market Analysis
        </h1>
        <div className="space-x-3">
          <button
            onClick={handleStockSearch}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 transition"
          >
            Search
          </button>

          <button
            onClick={handleStockAlert}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 transition"
          >
            Stock Alert
          </button>
          <button
            onClick={handleLogin}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-gray-200"
          >
            Login
          </button>
        </div>
      </div>

      <ActiveStocks />

    </div>
  );
};

export default StockSearch;
