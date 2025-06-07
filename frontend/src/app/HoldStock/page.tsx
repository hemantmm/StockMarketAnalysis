"use client";
import React, { useState } from "react";
import fetchStockData from "../stockDataAPI";
import fetchStockDetails from "../stockNameAPI";
import { FaChartLine, FaThLarge, FaClock, FaRupeeSign } from "react-icons/fa";

const HoldStock = () => {
  const [form, setForm] = useState({
    stock: "",
    price: "",
    period: ""
  });
  const [result, setResult] = useState<string | null>(null);
  const [targetPrices, setTargetPrices] = useState<{short_term?: number, medium_term?: number, long_term?: number} | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getPeriodWiseFromDays = (days: number) => {
    if (days <= 30) return "1m";
    if (days <= 180) return "6m";
    if (days <= 365) return "1yr";
    if (days <= 3 * 365) return "3yr";
    if (days <= 5 * 365) return "5yr";
    if (days <= 10 * 365) return "10yr";
    return "max";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setTargetPrices(null);
    setRecommendation(null);
    try {
      const periodWise = getPeriodWiseFromDays(parseInt(form.period, 10));
      const historical = await fetchStockData(form.stock, periodWise);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prices = historical?.data?.map((item: any) => item.close) || [];
      
      const stockDetails = await fetchStockDetails(form.stock);
      const currentPrice = stockDetails?.currentPrice?.NSE || stockDetails?.currentPrice?.BSE || 0;
      
      const response = await fetch("https://stockmarketanalysis-1.onrender.com/hold-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: form.stock,
          buy_price: parseFloat(form.price),
          current_price: currentPrice,
          holding_period: parseInt(form.period, 10),
          prices: prices
        })
      });
      const data = await response.json();
      setResult(data.advice || "No advice returned.");
      setTargetPrices(data.target_prices || null);
      setRecommendation(data.recommendation || null);
    } catch (error) {
      setResult("Error fetching recommendation."+error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
              <FaChartLine className="text-2xl text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Stock Holding Advisor
            </h1>
            <p className="text-gray-300 mt-2">Get recommendations for your investments</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-200">
                  <FaChartLine className="mr-2 text-purple-400" />
                  Stock Symbol
                </label>
                <input
                  type="text"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="e.g., RELIANCE, TCS, INFY"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-200">
                  <FaRupeeSign className="mr-2 text-green-400" />
                  Buy Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Enter your purchase price"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-200">
                  <FaClock className="mr-2 text-blue-400" />
                  Holding Period (Days)
                </label>
                <input
                  type="number"
                  name="period"
                  value={form.period}
                  onChange={handleChange}
                  placeholder="How long do you plan to hold?"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing Market Data...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FaThLarge className="mr-2" />
                    Get Recommendation
                  </div>
                )}
              </button>
            </form>
          </div>

          {result && (
            <div className="mt-8 space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
                    <FaChartLine className="text-xl text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-200">Recommendation</h3>
                  <p className="text-2xl font-bold text-white">{result.replace('Recommendation: ', '')}</p>
                </div>
              </div>

              {recommendation === "Hold" && targetPrices && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                      <FaThLarge className="text-xl text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200">Target Price Projections</h3>
                    
                    {targetPrices.short_term && (
                      <div className="mb-4 p-4 bg-white/10 rounded-xl">
                        <h4 className="text-sm font-semibold text-blue-400 mb-1">Short Term (1-3 months)</h4>
                        <p className="text-2xl font-bold text-white">₹ {targetPrices.short_term}</p>
                        <p className="text-xs text-gray-300">
                          Potential gain: 
                          <span className="text-green-400 font-semibold ml-1">
                            {((targetPrices.short_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    )}
                    
                    {targetPrices.medium_term && (
                      <div className="mb-4 p-4 bg-white/10 rounded-xl">
                        <h4 className="text-sm font-semibold text-yellow-400 mb-1">Medium Term (3-6 months)</h4>
                        <p className="text-2xl font-bold text-white">₹ {targetPrices.medium_term}</p>
                        <p className="text-xs text-gray-300">
                          Potential gain: 
                          <span className="text-green-400 font-semibold ml-1">
                            {((targetPrices.medium_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    )}
                    
                    {targetPrices.long_term && (
                      <div className="p-4 bg-white/10 rounded-xl">
                        <h4 className="text-sm font-semibold text-green-400 mb-1">Long Term (6+ months)</h4>
                        <p className="text-2xl font-bold text-white">₹ {targetPrices.long_term}</p>
                        <p className="text-xs text-gray-300">
                          Potential gain: 
                          <span className="text-green-400 font-semibold ml-1">
                            {((targetPrices.long_term - parseFloat(form.price)) / parseFloat(form.price) * 100).toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HoldStock;
