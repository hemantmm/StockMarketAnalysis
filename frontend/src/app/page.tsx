'use client';
import React from 'react';
import { useState } from 'react';
import fetchStockDetails from './stockNameAPI';
import { FaCircleInfo } from "react-icons/fa6";
import {IoMdClose} from "react-icons/io";
import { FaArrowTrendUp } from "react-icons/fa6";
import { FaArrowTrendDown } from "react-icons/fa6";
import fetchStockData from './stockDataAPI';
import {Chart as ChartJS, LineElement, LinearScale, CategoryScale, PointElement, Tooltip,Legend} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, LinearScale, CategoryScale, PointElement, Tooltip, Legend);


interface StockData {
  days: number;
  bsePrice: number;
  nsePrice: number;
}

const periodWiseOptions = ['1m', '6m', '1yr', '3yr', '5yr', '10yr', 'max'];

const StockSearch = () => {
  const [stockName, setStockName] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [stockPriceData, setStockPriceData] = useState<Array<[string,string]>>([]);
  const [periodWise, setPeriodWise] = useState('1m');
  
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleSearch = async () => {
    if (stockName) {
      setLoading(true);
      setError('');
      try {
        const data = await fetchStockDetails(stockName);
        const historicalData= await fetchStockData(stockName, periodWise);
        setStockData(data);
        setStockPriceData(historicalData.datasets[0].values);
      } catch (err) {
        setError('Failed to fetch stock data: ' + err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-3xl font-semibold text-center">Stock Market Search</h1>
      <div className="mt-4 flex space-x-4">
        <input
          type="text"
          className="p-2 border border-gray-300 rounded-lg w-full"
          placeholder="Enter stock name (e.g., bel)"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
        />
        <select
          className="p-2 border border-gray-300 rounded-lg"
          value={periodWise}
          onChange={(e) => setPeriodWise(e.target.value)}
        >
          {periodWiseOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          className="p-2 bg-blue-500 text-white rounded-lg cursor-pointer"
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

              {
                showDetails && (<div className='fixed inset-0 flex flex-col items-center rounded-lg bg-cyan-400 bg-opacity-10 backdrop-blur-md'>
                  <button onClick={toggleDetails} className='absolute top-4 right-4 p-2 rounded-lg cursor-pointer bg-white text-black'>
                    <IoMdClose size={20} title='close' />
                  </button>
                  <div className='text-center rounded-lg bg-white text-black p-4 shadow-md max-w-md w-full mt-20'>
                    <h2 className="text-xl font-semibold">{stockData.companyName}</h2>
                    <p><strong>Industry:</strong> {stockData.industry}</p>
                    <p>{stockData.companyProfile.companyDescription}</p> 
                  </div>
                </div>)
              }

          <div className="mt-4">
            <div className='flex justify-between items-center'>
              <h3 className="text-lg font-medium">Current Price:</h3>
              <button onClick={toggleDetails} className='p-2 rounded-lg cursor-pointer'>{!showDetails ? <FaCircleInfo size={20} title='info' /> : '' }</button>
            </div>

              <p className='text-lg font-semibold flex'>
                NSE: {stockData.currentPrice.NSE} 
                <span className={`ml-4 flex items-center ${stockData.percentChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stockData.percentChange > 0 ? <FaArrowTrendUp /> : <FaArrowTrendDown size={20} />} &nbsp;{stockData.percentChange} %
                </span>
              </p>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium">Stock Technical Data:</h3>
            <ul>
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

      {
        stockPriceData.length > 0 && !loading && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Stock Price Data:</h3>
            <Line
              data={{
                labels: stockPriceData.map(([date]) => date),
                datasets: [
                  {
                    label: 'Stock Price',
                    data: stockPriceData.map(([, price]) => parseFloat(price)),
                    tension: 0.1,
                    fill: false,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Date',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Price',
                    },
                    beginAtZero: false,
                  },
                },
              }}
            />
          </div>
        )
      }

    </div>
  );
};

export default StockSearch;
