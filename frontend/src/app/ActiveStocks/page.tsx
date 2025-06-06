"use client";
import React, { useEffect, useState } from "react";
import activeTrendingStocks from "../ActiveStockAPI";
import { CircleLoader } from "react-spinners";

type ActiveStocks = {
  company: string;
  price?: number;
  currentPrice?: number;
};

const ActiveStocks = () => {
  const [activeStocks, setActiveStocks] = useState<ActiveStocks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveStocks = async () => {
      if (activeStocks) {
        setLoading(true);
        try {
          const response = await activeTrendingStocks();
          setActiveStocks(response);
        } catch (error) {
          console.error("Error fetching active stocks:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchActiveStocks();
  }, []);

  return (
    <div className="p-8">
      <div className="mt-8 px-4 sm:px-8 lg:px-16 xl:px-32">
        <h2 className="text-xl font-bold mb-4 text-center">
          Most Active Stocks
        </h2>
        {loading && (
            <div className="flex justify-center items-center h-48">
              <CircleLoader color="#800080" size={100} />
            </div>
        )}
        <ul className="space-y-2 max-w-screen-xl mx-auto">
          {activeStocks.map((stock, index) => (
            <li
              key={index}
              className="bg-purple-500 p-3 rounded-lg shadow-md text-white"
            >
              <p className="text-lg font-semibold">{stock.company}</p>
              <p>Price: ₹{stock.price || stock.currentPrice || "N/A"}</p>
              {/* <p className={`${stock.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
            Change: {stock.change}%
          </p> */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
export default ActiveStocks;
