"use client";
import React, { useState } from "react";
import fetchStockDetails from "../stockNameAPI";
import { FaCircleInfo, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import fetchStockData from "../stockDataAPI";
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

const StockSearchs = () => {
  const [stockName, setStockName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [stockPriceData, setStockPriceData] = useState<Array<[string, string]>>([]);
  const [periodWise, setPeriodWise] = useState("1m");
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const [isPredicted, setIsPredicted] = useState(false);

  const predictPrice = async (pastPrices: number[]): Promise<number | null> => {
    try {
      const res = await fetch("https://stockmarketanalysis-1.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices: pastPrices }),
      });

      if (!res.ok) {
        console.error("Server error:", res.statusText);
        return null;
      }

      const data = await res.json();
      if (data.prediction_price && typeof data.prediction_price === "number") {
        return data.prediction_price;
      } else {
        console.error("Invalid prediction format:", data);
        return null;
      }
    } catch (error) {
      console.error("Prediction error:", error);
      return null;
    }
  };

  const toggleDetails = () => setShowDetails(!showDetails);

  const handleSearch = async () => {
    if (stockName) {
      setLoading(true);
      setError("");
      setPredictedPrice(null);
      setIsPredicted(false);
      try {
        const data = await fetchStockDetails(stockName);
        const historicalData = await fetchStockData(stockName, periodWise);
        setStockData(data);
        setStockPriceData(historicalData.datasets[0].values);
      } catch (err) {
        setError("Failed to fetch stock data: " + err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 text-white font-sans">
      <div className="max-w-3xl mx-auto p-4">
        {/* Search section */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-6">
          <input
            type="text"
            className="px-4 py-2 w-full bg-white/10 text-white border border-purple-400 rounded-xl placeholder-gray-300 focus:outline-none transition-all"
            placeholder="Enter stock name (e.g., bel)"
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
          />
          <select
            className="p-2 border border-purple-400 rounded-lg bg-white text-purple-900"
            value={periodWise}
            onChange={async (e) => {
              const newPeriod = e.target.value;
              setPeriodWise(newPeriod);
              if (stockName) {
                setLoading(true);
                setError("");
                setPredictedPrice(null);
                setIsPredicted(false);
                try {
                  const historicalData = await fetchStockData(stockName, newPeriod);
                  setStockPriceData(historicalData.datasets[0].values);
                } catch (err) {
                  setError("Failed to fetch stock data: " + err);
                } finally {
                  setLoading(false);
                }
              }
            }}
          >
            {periodWiseOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition cursor-pointer"
            onClick={handleSearch}
            disabled={loading}
          >
            Search
          </button>
        </div>

        {/* Feedback */}
        {loading && <p className="mt-6 text-center">Loading...</p>}
        {error && <p className="mt-6 text-center text-red-400">{error}</p>}

        {/* Stock Data Card */}
        {stockData && !loading && (
          <div className="bg-white text-purple-900 p-6 rounded-xl shadow-lg space-y-4 mt-12 sm:mt-8">
            {showDetails && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-[90%] md:max-w-lg relative text-purple-900">
                  <button
                    className="absolute top-2 right-2 text-purple-900"
                    onClick={toggleDetails}
                  >
                    <IoMdClose size={24} />
                  </button>
                  <h2 className="text-xl font-bold mb-2">{stockData.companyName}</h2>
                  <p className="mb-1"><strong>Industry:</strong> {stockData.industry}</p>
                  <p className="text-sm">{stockData.companyProfile.companyDescription}</p>
                </div>
              </div>
            )}

            <div className="bg-purple-100 p-6 rounded-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Current Price:</h3>
                <button onClick={toggleDetails} className="p-2 rounded-lg cursor-pointer">
                  <FaCircleInfo size={20} title="info" />
                </button>
              </div>
              <p className="text-2xl font-bold mt-2">
                NSE: {stockData.currentPrice.NSE}
                <span
                  className={`ml-4 inline-flex items-center ${
                    stockData.percentChange > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {stockData.percentChange > 0 ? (
                    <FaArrowTrendUp />
                  ) : (
                    <FaArrowTrendDown />
                  )}
                  &nbsp;{stockData.percentChange} %
                </span>
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-md font-medium">Stock Technical Data:</h3>
              <ul className="text-sm mt-2 space-y-1">
                {stockData.stockTechnicalData.map((item: StockData, index: number) => (
                  <li key={index}>
                    <span>{item.days} Days: </span>
                    <span>BSE: {item.bsePrice}</span> | <span>NSE: {item.nsePrice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Chart and Prediction */}
        {stockPriceData.length > 0 && !loading && (
          <div className="mt-10 bg-white text-purple-900 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4">Stock Price Data:</h3>
            <Line
              data={{
                labels: stockPriceData.map(([date]) => date),
                datasets: [
                  {
                    label: "Stock Price",
                    data: stockPriceData.map(([, price]) => parseFloat(price)),
                    tension: 0.1,
                    fill: false,
                    borderColor: "rgba(147, 51, 234, 1)", // purple-600
                    backgroundColor: "rgba(147, 51, 234, 0.2)",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: "Date",
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "Price",
                    },
                    beginAtZero: false,
                  },
                },
              }}
            />

            <div className="mt-6 text-center">
              <button
                disabled={isPredicted}
                onClick={async () => {
                  const priceArray = stockPriceData.map(([, price]) => parseFloat(price));
                  const prediction = await predictPrice(priceArray);

                  if (typeof prediction === "number" && !isNaN(prediction)) {
                    setPredictedPrice(prediction);
                    setIsPredicted(true);
                  } else {
                    console.error("Prediction failed or returned invalid value:", prediction);
                    setPredictedPrice(null);
                  }
                }}
                className={`p-2 ${
                  isPredicted ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"
                } text-white rounded-lg cursor-pointer`}
              >
                {isPredicted ? "Price Predicted" : "Predict Future Price"}
              </button>
            </div>

            {typeof predictedPrice === "number" && !isNaN(predictedPrice) && (
              <div className="mt-6 text-center text-xl font-semibold text-purple-700">
                <h3>Predicted Future Price:</h3>
                <p>₹ {predictedPrice.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockSearchs;
