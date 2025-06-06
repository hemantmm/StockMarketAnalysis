"use client";
import React from "react";
import { useState } from "react";
import fetchStockDetails from "../stockNameAPI";
import { FaCircleInfo } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { FaArrowTrendUp } from "react-icons/fa6";
import { FaArrowTrendDown } from "react-icons/fa6";
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
  const [stockPriceData, setStockPriceData] = useState<Array<[string, string]>>(
    []
  );
  const [periodWise, setPeriodWise] = useState("1m");
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const [isPredicted, setIsPredicted] = useState(false);

  const predictPrice = async (pastPrices: number[]): Promise<number | null> => {
    try {
      // const res = await fetch("http://localhost:8000/predict", {
      const res = await fetch(
        "https://stockmarketanalysis-1.onrender.com/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prices: pastPrices }),
        }
      );

      if (!res.ok) {
        console.error("Server error:", res.statusText);
        return null;
      }

      const data = await res.json();
      console.log("Full Response from Backend:", data);

      if (
        data.prediction_price !== undefined &&
        typeof data.prediction_price === "number"
      ) {
        return data.prediction_price;
      } else {
        console.error("Invalid prediction response format:", data);
        return null;
      }
    } catch (error) {
      console.error("Prediction error:", error);
      return null;
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white font-sans">

      {/* <ActiveStocks /> */}

      <div className="max-w-3xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-6">
          <input
            type="text"
            className="px-4 py-2 w-full bg-white/10 text-white border border-white/20 rounded-xl placeholder-gray-400 focus:outline-none"
            placeholder="Enter stock name (e.g., bel)"
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
          />
          <select
            className="p-2 border border-gray-300 rounded-lg"
            value={periodWise}
            // onChange={(e) => setPeriodWise(e.target.value)}
            onChange={async (e) => {
              const newPeriod = e.target.value;
              setPeriodWise(newPeriod);
              if (stockName) {
                setLoading(true);
                setError("");
                setPredictedPrice(null);
                setIsPredicted(false);
                try {
                  const historicalData = await fetchStockData(
                    stockName,
                    newPeriod
                  );
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
            className="px-4 py-2 bg-blue-600 rounded-xl hover:bg-blue-700 transition cursor-pointer"
            onClick={handleSearch}
            disabled={loading}
          >
            Search
          </button>
        </div>

        {loading && <p className="mt-4 text-center">Loading...</p>}
        {error && <p className="mt-4 text-center text-red-500">{error}</p>}

        {stockData && !loading && (
          <div className="mt-8">
            {showDetails && (
              <div className="fixed inset-0 flex flex-col items-center rounded-lg bg-cyan-400 bg-opacity-10 backdrop-blur-md">
                <button
                  onClick={toggleDetails}
                  className="absolute top-4 right-4 p-2 rounded-lg cursor-pointer bg-white text-black"
                >
                  <IoMdClose size={20} title="close" />
                </button>
                <div className="text-center rounded-lg bg-white text-black p-4 shadow-md max-w-md w-full mt-20">
                  <h2 className="text-xl font-semibold">
                    {stockData.companyName}
                  </h2>
                  <p>
                    <strong>Industry:</strong> {stockData.industry}
                  </p>
                  <p>{stockData.companyProfile.companyDescription}</p>
                </div>
              </div>
            )}

            <div className="mt-8 bg-white/5 p-6 rounded-xl shadow-lg backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibol">Current Price:</h3>
                <button
                  onClick={toggleDetails}
                  className="p-2 rounded-lg cursor-pointer"
                >
                  {!showDetails ? <FaCircleInfo size={20} title="info" /> : ""}
                </button>
              </div>

              <p className="text-2xl font-bold mt-2">
                NSE: {stockData.currentPrice.NSE}
                <span
                  className={`ml-4 flex items-center ${
                    stockData.percentChange > 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {stockData.percentChange > 0 ? (
                    <FaArrowTrendUp />
                  ) : (
                    <FaArrowTrendDown size={20} />
                  )}{" "}
                  &nbsp;{stockData.percentChange} %
                </span>
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-md font-medium">Stock Technical Data:</h3>
              <ul className="text-sm mt-2 space-y-1">
                {stockData.stockTechnicalData.map(
                  (item: StockData, index: number) => (
                    <li key={index}>
                      <span>{item.days} Days: </span>
                      <span>BSE: {item.bsePrice}</span> |{" "}
                      <span>NSE: {item.nsePrice}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        )}

        {stockPriceData.length > 0 && !loading && (
          <div className="mt-6 bg-white/5 p-6 rounded-xl shadow-md">
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
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
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
                  const priceArray = stockPriceData.map(([, price]) =>
                    parseFloat(price)
                  );
                  const prediction = await predictPrice(priceArray);

                  if (typeof prediction === "number" && !isNaN(prediction)) {
                    setPredictedPrice(prediction);
                    setIsPredicted(true);
                  } else {
                    console.error(
                      "Prediction failed or returned invalid value:",
                      prediction
                    );
                    setPredictedPrice(null);
                  }
                }}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
              >
                {isPredicted ? "Price Predicted" : "Predict Future Price"}
              </button>
            </div>

            {typeof predictedPrice === "number" && !isNaN(predictedPrice) && (
              <div className="mt-6 text-center text-xl font-semibold text-blue-300">
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
